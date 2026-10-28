package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.CreateOrderRequest;
import com.example.saasecommerce.dto.OrderResponse;
import com.example.saasecommerce.model.*;
import com.example.saasecommerce.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private final OrderRepository orderRepository;
    private final TenantRepository tenantRepository;
    private final VariationRepository variationRepository;
    private final StockLineRepository stockLineRepository;
    private final PaymentGatewayConfigRepository gatewayConfigRepository;
    private final MercadoPagoPaymentService mercadoPagoPaymentService;
    private final CustomerRepository customerRepository;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        Tenant tenant = tenantRepository.findBySlug(request.getTenantSlug())
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada"));

        Variation variation = variationRepository.findById(request.getVariationId())
                .orElseThrow(() -> new IllegalArgumentException("Variação do produto não encontrada"));

        Product product = variation.getProduct();
        if (product == null || !product.getTenantId().equals(tenant.getId())) {
            throw new IllegalArgumentException("O produto selecionado não pertence a esta loja");
        }

        // Validação estrita de estoque antes de permitir a compra
        boolean hasStock = false;
        if (variation.isHasUnlimitedStock()) {
            hasStock = true;
        } else if (variation.getDeliveryType() == DeliveryType.AUTOMATIC_LINES) {
            long availableLines = stockLineRepository.countByVariationIdAndIsDeliveredFalse(variation.getId());
            hasStock = availableLines > 0;
        } else {
            hasStock = variation.getStockQuantity() != null && variation.getStockQuantity() > 0;
        }

        if (!hasStock) {
            throw new IllegalStateException("Este produto está sem estoque no momento.");
        }

        BigDecimal amount = variation.getPrice();
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Produto com preço inválido. Entre em contato com o vendedor.");
        }

        // Busca configuração do gateway PIX do tenant (Mercado Pago ou o configurado como PIX)
        Optional<PaymentGatewayConfig> pixGatewayOpt = gatewayConfigRepository
                .findByTenantIdAndIsPixProviderTrue(tenant.getId());

        if (pixGatewayOpt.isEmpty()) {
            pixGatewayOpt = gatewayConfigRepository
                    .findByTenantIdAndProvider(tenant.getId(), PaymentProvider.MERCADO_PAGO);
        }

        PaymentGatewayConfig gatewayConfig = pixGatewayOpt.orElse(null);
        boolean hasRealGateway = gatewayConfig != null 
                && gatewayConfig.isEnabled() 
                && gatewayConfig.getClientSecret() != null 
                && !gatewayConfig.getClientSecret().isBlank();

        String qrCode = null;
        String qrCodeBase64 = null;
        String ticketUrl = null;
        String externalPaymentId = null;
        PaymentProvider provider = null;
        boolean simulated = false;
        String message = "Aguardando pagamento via PIX";

        if (hasRealGateway && gatewayConfig.getProvider() == PaymentProvider.MERCADO_PAGO) {
            try {
                provider = PaymentProvider.MERCADO_PAGO;
                String desc = product.getName() + " - " + variation.getName();
                
                MercadoPagoPaymentService.PixPaymentResult mpResult = mercadoPagoPaymentService.createPixPayment(
                        gatewayConfig.getClientSecret(),
                        amount,
                        desc,
                        request.getCustomerEmail(),
                        request.getCustomerName(),
                        request.getCustomerCpf()
                );

                qrCode = mpResult.getQrCode();
                qrCodeBase64 = mpResult.getQrCodeBase64();
                ticketUrl = mpResult.getTicketUrl();
                externalPaymentId = mpResult.getPaymentId();
                message = "PIX oficial gerado via Mercado Pago. Escaneie ou copie o código.";

            } catch (Exception e) {
                log.warn("Falha ao gerar PIX real no Mercado Pago: {}. Ativando modo de teste.", e.getMessage());
                simulated = true;
                message = "Modo de Teste: Não foi possível conectar ao gateway de pagamento. Verifique suas credenciais em Configurações.";
            }
        } else {
            simulated = true;
            message = "Modo de Teste: Configure seu Access Token do Mercado Pago em Configurações > Gateways para gerar cobranças reais na sua conta.";
        }

        // Se for simulado ou se o gateway não retornou QR Code
        if (qrCode == null || qrCode.isBlank()) {
            String fakePixId = UUID.randomUUID().toString().replace("-", "").substring(0, 20);
            qrCode = "00020126580014br.gov.bcb.pix0136" + fakePixId + "520400005303986540" + amount.toPlainString() + "5802BR5915" + tenant.getName() + "6009SAO PAULO62070503***6304ABCD";
        }

        // Busca ou vincula o cliente se existir na loja
        UUID customerId = request.getCustomerId();
        if (customerId == null && request.getCustomerEmail() != null) {
            Optional<Customer> existingCustomer = customerRepository.findByTenantIdAndEmail(
                    tenant.getId(),
                    request.getCustomerEmail().trim().toLowerCase()
            );
            if (existingCustomer.isPresent()) {
                customerId = existingCustomer.get().getId();
            }
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

        return OrderResponse.builder()
                .orderId(saved.getId())
                .status(saved.getStatus())
                .amount(saved.getAmount())
                .productName(saved.getProductName())
                .variationName(saved.getVariationName())
                .qrCode(saved.getQrCode())
                .qrCodeBase64(saved.getQrCodeBase64())
                .ticketUrl(saved.getTicketUrl())
                .simulated(simulated)
                .message(message)
                .customerId(saved.getCustomerId())
                .customerName(saved.getCustomerName())
                .customerEmail(saved.getCustomerEmail())
                .customerCpf(saved.getCustomerCpf())
                .createdAt(saved.getCreatedAt())
                .paidAt(saved.getPaidAt())
                .build();
    }

    @Transactional
    public OrderResponse getOrderStatus(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));

        // Se estiver pendente e possuir externalPaymentId no Mercado Pago, verifica na API do MP
        if (order.getStatus() == OrderStatus.PENDING 
                && order.getExternalPaymentId() != null 
                && order.getPaymentProvider() == PaymentProvider.MERCADO_PAGO) {

            Optional<PaymentGatewayConfig> gwOpt = gatewayConfigRepository
                    .findByTenantIdAndProvider(order.getTenantId(), PaymentProvider.MERCADO_PAGO);

            if (gwOpt.isPresent() && gwOpt.get().getClientSecret() != null) {
                String mpStatus = mercadoPagoPaymentService.checkPaymentStatus(
                        gwOpt.get().getClientSecret(),
                        order.getExternalPaymentId()
                );

                if ("approved".equalsIgnoreCase(mpStatus)) {
                    processOrderApproval(order);
                }
            }
        }

        return toOrderResponse(order);
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

    @Transactional
    public OrderResponse simulateApproval(UUID orderId, UUID tenantId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Pedido não encontrado"));

        if (!order.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Acesso negado: este pedido não pertence à sua loja.");
        }

        if (order.getStatus() != OrderStatus.PAID) {
            processOrderApproval(order);
        }

        return getOrderStatus(orderId);
    }

    @Transactional
    public boolean processPaymentWebhook(String externalPaymentId) {
        if (externalPaymentId == null || externalPaymentId.isBlank()) {
            return false;
        }

        Optional<Order> orderOpt = orderRepository.findByExternalPaymentId(externalPaymentId);
        if (orderOpt.isEmpty()) {
            log.warn("Webhook recebido para pagamento {} mas nenhum pedido foi encontrado.", externalPaymentId);
            return false;
        }

        Order order = orderOpt.get();
        if (order.getStatus() == OrderStatus.PAID) {
            log.info("Pedido {} já estava pago.", order.getId());
            return true;
        }

        if (order.getPaymentProvider() == PaymentProvider.MERCADO_PAGO) {
            Optional<PaymentGatewayConfig> gwOpt = gatewayConfigRepository
                    .findByTenantIdAndProvider(order.getTenantId(), PaymentProvider.MERCADO_PAGO);

            if (gwOpt.isPresent() && gwOpt.get().getClientSecret() != null) {
                String mpStatus = mercadoPagoPaymentService.checkPaymentStatus(
                        gwOpt.get().getClientSecret(),
                        externalPaymentId
                );

                if ("approved".equalsIgnoreCase(mpStatus)) {
                    processOrderApproval(order);
                    log.info("Pedido {} aprovado automaticamente via Webhook!", order.getId());
                    return true;
                }
            }
        }

        return false;
    }

    private void processOrderApproval(Order order) {
        order.setStatus(OrderStatus.PAID);
        order.setPaidAt(LocalDateTime.now());

        Variation variation = variationRepository.findById(order.getVariationId()).orElse(null);
        if (variation != null) {
            if (variation.getDeliveryType() == DeliveryType.AUTOMATIC_LINES) {
                Optional<StockLine> lineOpt = stockLineRepository
                        .findFirstByVariationIdAndIsDeliveredFalseOrderByCreatedAtAsc(variation.getId());

                if (lineOpt.isPresent()) {
                    StockLine line = lineOpt.get();
                    line.setDelivered(true);
                    line.setOrderId(order.getId());
                    line.setDeliveredAt(LocalDateTime.now());
                    stockLineRepository.save(line);
                    order.setDeliveredContent(line.getContent());
                } else {
                    order.setDeliveredContent("Licença temporária / Estoque em reabastecimento. O suporte enviará a chave por e-mail.");
                }
            } else {
                String chatMsg = variation.getChatInitialMessage();
                if (chatMsg == null || chatMsg.isBlank()) {
                    chatMsg = "Olá " + order.getCustomerName() + "! Seu pagamento foi confirmado. Entraremos em contato pelo e-mail " + order.getCustomerEmail() + " para concluir a entrega.";
                }
                order.setDeliveredContent(chatMsg);
            }
        }

        orderRepository.save(order);
        log.info("Pedido {} aprovado com sucesso! Conteúdo entregue: {}", order.getId(), order.getDeliveredContent());
    }
}
