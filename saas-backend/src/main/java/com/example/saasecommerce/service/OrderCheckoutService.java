package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.CreateOrderRequest;
import com.example.saasecommerce.dto.OrderResponse;
import com.example.saasecommerce.model.*;
import com.example.saasecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderCheckoutService {

    // O Pix vence em 30 min (Mercado Pago e cronômetro da tela); a chave fica reservada pelo mesmo tempo
    private static final int PIX_MINUTES = 30;
    // Depois disso (com folga para um pagamento de última hora) o pedido expira e libera a chave
    private static final int EXPIRE_AFTER_MINUTES = 35;
    // Pix em aberto por e-mail na mesma loja
    private static final int MAX_PENDING_PER_EMAIL = 3;

    private final OrderRepository orderRepository;
    private final TenantRepository tenantRepository;
    private final VariationRepository variationRepository;
    private final StockLineRepository stockLineRepository;
    private final PaymentGatewayConfigRepository gatewayConfigRepository;
    private final MercadoPagoPaymentService mercadoPagoPaymentService;
    private final ChatService chatService;

    /**
     * Pix "de mentira" e aprovação manual de pedidos só existem em desenvolvimento.
     * Em produção, sem Mercado Pago configurado o checkout recusa o pedido em vez de mostrar um QR falso.
     */
    @Value("${app.payments.allow-simulated:false}")
    private boolean allowSimulated;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, Customer currentCustomer) {
        Tenant tenant = tenantRepository.findBySlug(request.getTenantSlug())
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada"));

        Variation variation = variationRepository.findById(request.getVariationId())
                .orElseThrow(() -> new IllegalArgumentException("Variação do produto não encontrada"));

        Product product = variation.getProduct();
        if (product == null || !product.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("O produto selecionado não pertence a esta loja");
        }

        BigDecimal amount = variation.getPrice();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Produto com preço inválido. Entre em contato com o vendedor.");
        }

        // Vincula o pedido apenas ao comprador autenticado (token) desta mesma loja.
        // Não vincular por e-mail nem por ID enviado pelo cliente: ambos podem ser forjados.
        UUID customerId = null;
        if (currentCustomer != null && currentCustomer.getTenantId().equals(tenant.getId())) {
            customerId = currentCustomer.getId();
        }

        // Um comprador não pode acumular Pix em aberto para segurar o estoque de outros
        long pendingForEmail = orderRepository.countByTenantIdAndCustomerEmailIgnoreCaseAndStatusAndCreatedAtAfter(
                tenant.getId(), request.getCustomerEmail().trim(), OrderStatus.PENDING,
                LocalDateTime.now().minusMinutes(EXPIRE_AFTER_MINUTES));
        if (pendingForEmail >= MAX_PENDING_PER_EMAIL) {
            throw new IllegalStateException("Você já tem pedidos aguardando pagamento. Pague um deles ou espere o Pix vencer (30 minutos).");
        }

        // Entrega manual acontece pelo chat do pedido, que exige uma conta na loja
        if (variation.getDeliveryType() == DeliveryType.MANUAL_CHAT && customerId == null) {
            throw new IllegalArgumentException("Para este produto, entre na sua conta antes de comprar: a entrega é combinada pelo chat do pedido.");
        }

        // Estoque: na entrega automática, separa uma chave para este pedido agora
        StockLine reservedLine = null;
        if (!variation.isHasUnlimitedStock()) {
            if (variation.getDeliveryType() == DeliveryType.AUTOMATIC_LINES) {
                reservedLine = stockLineRepository
                        .findAvailableForUpdate(variation.getId(), LocalDateTime.now(), PageRequest.of(0, 1))
                        .stream().findFirst()
                        .orElseThrow(() -> new IllegalStateException("Este produto está sem estoque no momento."));
            } else if (variation.getStockQuantity() == null || variation.getStockQuantity() <= 0) {
                throw new IllegalStateException("Este produto está sem estoque no momento.");
            }
        }

        // Só o Mercado Pago está integrado; outros gateways salvos no painel são ignorados
        PaymentGatewayConfig gatewayConfig = gatewayConfigRepository
                .findByTenantIdAndProvider(tenant.getId(), PaymentProvider.MERCADO_PAGO)
                .filter(PaymentGatewayConfig::isEnabled)
                .filter(c -> c.getClientSecret() != null && !c.getClientSecret().isBlank())
                .orElse(null);

        String qrCode = null;
        String qrCodeBase64 = null;
        String ticketUrl = null;
        String externalPaymentId = null;
        PaymentProvider provider = null;
        boolean simulated = false;
        String message;

        if (gatewayConfig != null) {
            try {
                MercadoPagoPaymentService.PixPaymentResult mpResult = mercadoPagoPaymentService.createPixPayment(
                        gatewayConfig.getClientSecret(),
                        amount,
                        product.getName() + " - " + variation.getName(),
                        request.getCustomerEmail(),
                        request.getCustomerName(),
                        request.getCustomerCpf(),
                        PIX_MINUTES
                );
                provider = PaymentProvider.MERCADO_PAGO;
                qrCode = mpResult.getQrCode();
                qrCodeBase64 = mpResult.getQrCodeBase64();
                ticketUrl = mpResult.getTicketUrl();
                externalPaymentId = mpResult.getPaymentId();
                message = "Pix gerado. Escaneie o QR Code ou copie o código.";
            } catch (Exception e) {
                log.warn("Falha ao gerar Pix no Mercado Pago para a loja {}: {}", tenant.getSlug(), e.getMessage());
                if (!allowSimulated) {
                    throw new IllegalStateException("Não foi possível gerar o Pix agora. Tente novamente em alguns minutos.");
                }
                simulated = true;
                message = "Modo de teste: falha ao conectar no Mercado Pago. Confira o Access Token em Configurações.";
            }
        } else {
            if (!allowSimulated) {
                throw new IllegalStateException("Esta loja ainda não está recebendo pagamentos. Avise o vendedor.");
            }
            simulated = true;
            message = "Modo de teste: configure o Access Token do Mercado Pago em Configurações > Gateways.";
        }

        if (qrCode == null || qrCode.isBlank()) {
            String fakePixId = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
            qrCode = "00020126580014br.gov.bcb.pix0136" + fakePixId + "520400005303986540" + amount.toPlainString() + "5802BR5915" + tenant.getName() + "6009SAO PAULO62070503***6304ABCD";
        }

        Order order = Order.builder()
                .tenantId(tenant.getId())
                .customerId(customerId)
                .productId(product.getId())
                .variationId(variation.getId())
                .productName(product.getName())
                .variationName(variation.getName())
                .amount(amount)
                .customerName(request.getCustomerName())
                .customerEmail(request.getCustomerEmail())
                .customerCpf(request.getCustomerCpf())
                .status(OrderStatus.PENDING)
                .paymentProvider(provider)
                .externalPaymentId(externalPaymentId)
                .qrCode(qrCode)
                .qrCodeBase64(qrCodeBase64)
                .ticketUrl(ticketUrl)
                .build();

        Order saved = orderRepository.save(order);

        if (reservedLine != null) {
            reservedLine.setReservedOrderId(saved.getId());
            reservedLine.setReservedUntil(LocalDateTime.now().plusMinutes(PIX_MINUTES));
            stockLineRepository.save(reservedLine);
        }

        OrderResponse response = toPublicResponse(saved);
        response.setSimulated(simulated);
        response.setMessage(message);
        return response;
    }

    @Transactional
    public OrderResponse getOrderStatus(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));

        // Pendente com cobrança no Mercado Pago: consulta a API para não depender só do webhook
        if (order.getStatus() == OrderStatus.PENDING && isApprovedOnMercadoPago(order)) {
            approveOrder(order.getId());
            order = orderRepository.findById(orderId).orElseThrow();
        }

        return toPublicResponse(order);
    }

    public List<OrderResponse> getOrdersForTenant(UUID tenantId) {
        return orderRepository.findByTenantIdOrderByCreatedAtDesc(tenantId).stream()
                .map(this::toOrderResponse)
                .collect(java.util.stream.Collectors.toList());
    }

    public OrderResponse getOrderByIdAndTenant(UUID orderId, UUID tenantId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));
        if (!order.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acesso negado: este pedido não pertence à sua loja.");
        }
        return toOrderResponse(order);
    }

    // Visão do lojista: inclui os dados de contato do comprador
    public OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .orderId(order.getId())
                .status(order.getStatus())
                .amount(order.getAmount())
                .productName(order.getProductName())
                .variationName(order.getVariationName())
                .qrCode(order.getQrCode())
                .qrCodeBase64(order.getQrCodeBase64())
                .ticketUrl(order.getTicketUrl())
                .deliveredContent(order.getDeliveredContent())
                .simulated(order.getExternalPaymentId() == null)
                .message(order.getStatus() == OrderStatus.PAID ? "Pagamento Aprovado!" : "Aguardando pagamento...")
                .customerId(order.getCustomerId())
                .customerName(order.getCustomerName())
                .customerEmail(order.getCustomerEmail())
                .customerCpf(order.getCustomerCpf())
                .createdAt(order.getCreatedAt())
                .paidAt(order.getPaidAt())
                .build();
    }

    /**
     * Visão pública (checkout e consulta de status por ID): sem nome, e-mail, CPF ou ID do comprador.
     * Quem tem o ID do pedido vê o próprio Pix e a chave entregue, mas não os dados pessoais.
     */
    public OrderResponse toPublicResponse(Order order) {
        OrderResponse response = toOrderResponse(order);
        response.setCustomerId(null);
        response.setCustomerName(null);
        response.setCustomerEmail(null);
        response.setCustomerCpf(null);
        return response;
    }

    @Transactional
    public OrderResponse simulateApproval(UUID orderId, UUID tenantId) {
        if (!allowSimulated) {
            throw new IllegalStateException("A aprovação manual de teste está desativada neste ambiente.");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));

        if (!order.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acesso negado: este pedido não pertence à sua loja.");
        }

        approveOrder(orderId);
        return toOrderResponse(orderRepository.findById(orderId).orElseThrow());
    }

    /** Assinatura do webhook inválida para a loja do pedido. Vira HTTP 401. */
    public static class InvalidWebhookSignatureException extends RuntimeException {
        public InvalidWebhookSignatureException() {
            super("Assinatura do webhook inválida");
        }
    }

    @Transactional
    public boolean processPaymentWebhook(String externalPaymentId, String signature, String requestId) {
        if (externalPaymentId == null || externalPaymentId.isBlank()) {
            return false;
        }

        Optional<Order> orderOpt = orderRepository.findByExternalPaymentId(externalPaymentId);
        if (orderOpt.isEmpty()) {
            log.warn("Webhook recebido para pagamento {} mas nenhum pedido foi encontrado.", externalPaymentId);
            return false;
        }

        Order order = orderOpt.get();

        // Se a loja cadastrou a assinatura secreta do webhook, só aceita notificações assinadas por ela
        String secret = gatewayConfigRepository
                .findByTenantIdAndProvider(order.getTenantId(), PaymentProvider.MERCADO_PAGO)
                .map(PaymentGatewayConfig::getWebhookSecret)
                .orElse(null);
        if (secret != null && !secret.isBlank()
                && !MercadoPagoWebhookVerifier.isValid(secret, signature, requestId, externalPaymentId, java.time.Clock.systemUTC())) {
            log.warn("Webhook com assinatura inválida para o pedido {}", order.getId());
            throw new InvalidWebhookSignatureException();
        }

        if (order.getStatus() == OrderStatus.PAID) {
            return true;
        }

        // Nunca confia no corpo do webhook: confirma o status direto na API do Mercado Pago
        if (isApprovedOnMercadoPago(order)) {
            approveOrder(order.getId());
            log.info("Pedido {} aprovado via webhook.", order.getId());
            return true;
        }
        return false;
    }

    /**
     * Expira pedidos com Pix vencido e devolve a chave reservada ao estoque. Antes, confere no
     * Mercado Pago se o pagamento não caiu no último instante (aí aprova em vez de expirar).
     */
    @Scheduled(fixedDelay = 60_000, initialDelay = 30_000)
    @Transactional
    public void expireStalePendingOrders() {
        List<Order> stale = orderRepository.findTop100ByStatusAndCreatedAtBefore(
                OrderStatus.PENDING, LocalDateTime.now().minusMinutes(EXPIRE_AFTER_MINUTES));
        for (Order order : stale) {
            if (isApprovedOnMercadoPago(order)) {
                approveOrder(order.getId());
                continue;
            }
            Order locked = orderRepository.findByIdForUpdate(order.getId()).orElse(null);
            if (locked == null || locked.getStatus() != OrderStatus.PENDING) continue;
            locked.setStatus(OrderStatus.EXPIRED);
            orderRepository.save(locked);
            stockLineRepository.releaseReservation(locked.getId());
        }
        if (!stale.isEmpty()) log.info("{} pedido(s) pendente(s) verificados para expiração", stale.size());
    }

    private boolean isApprovedOnMercadoPago(Order order) {
        if (order.getPaymentProvider() != PaymentProvider.MERCADO_PAGO || order.getExternalPaymentId() == null) {
            return false;
        }
        return gatewayConfigRepository
                .findByTenantIdAndProvider(order.getTenantId(), PaymentProvider.MERCADO_PAGO)
                .filter(gw -> gw.getClientSecret() != null)
                .map(gw -> "approved".equalsIgnoreCase(
                        mercadoPagoPaymentService.checkPaymentStatus(gw.getClientSecret(), order.getExternalPaymentId())))
                .orElse(false);
    }

    /**
     * Aprova o pedido uma única vez. Webhook, consulta de status e aprovação de teste podem chegar
     * ao mesmo tempo; o lock na linha do pedido garante que só o primeiro entrega a chave.
     */
    private void approveOrder(UUID orderId) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));
        if (order.getStatus() != OrderStatus.PENDING) {
            return;
        }

        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());

        Variation variation = variationRepository.findById(order.getVariationId()).orElse(null);
        if (variation != null) {
            if (variation.getDeliveryType() == DeliveryType.AUTOMATIC_LINES) {
                // Usa a chave reservada no checkout; se a reserva expirou e ela foi para outro pedido,
                // pega a próxima livre
                Optional<StockLine> lineOpt = stockLineRepository.findFirstByReservedOrderIdAndIsDeliveredFalse(order.getId());
                if (lineOpt.isEmpty()) {
                    lineOpt = stockLineRepository
                            .findAvailableForUpdate(variation.getId(), LocalDateTime.now(), PageRequest.of(0, 1))
                            .stream().findFirst();
                }

                if (lineOpt.isPresent()) {
                    StockLine line = lineOpt.get();
                    line.setDelivered(true);
                    line.setOrderId(order.getId());
                    line.setDeliveredAt(LocalDateTime.now());
                    line.setReservedUntil(null);
                    stockLineRepository.save(line);
                    order.setDeliveredContent(line.getContent());
                } else {
                    order.setDeliveredContent("Pagamento confirmado, mas o estoque acabou antes da entrega. A loja vai enviar sua chave pelo suporte.");
                    log.warn("Pedido {} pago sem chave disponível na variação {}", order.getId(), variation.getId());
                }
            } else {
                // Entrega manual com estoque por quantidade: cada venda aprovada consome uma unidade
                if (!variation.isHasUnlimitedStock() && variation.getStockQuantity() != null && variation.getStockQuantity() > 0) {
                    variation.setStockQuantity(variation.getStockQuantity() - 1);
                    variationRepository.save(variation);
                }

                String chatMsg = variation.getChatInitialMessage();
                if (chatMsg == null || chatMsg.isBlank()) {
                    chatMsg = "Pagamento confirmado! Use o chat deste pedido para combinar a entrega com a loja.";
                }
                order.setDeliveredContent(chatMsg);
            }
        }

        orderRepository.save(order);

        // Entrega manual: abre a conversa do pedido com a mensagem da loja como primeira mensagem
        if (variation != null && variation.getDeliveryType() == DeliveryType.MANUAL_CHAT) {
            chatService.openOrderThread(order, order.getDeliveredContent());
        }

        log.info("Pedido {} aprovado.", order.getId());
    }
}
