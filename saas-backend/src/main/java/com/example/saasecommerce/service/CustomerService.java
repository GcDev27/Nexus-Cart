package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.*;
import com.example.saasecommerce.model.Customer;
import com.example.saasecommerce.model.Order;
import com.example.saasecommerce.model.OrderStatus;
import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.repository.CustomerRepository;
import com.example.saasecommerce.repository.OrderRepository;
import com.example.saasecommerce.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public CustomerAuthResponse register(String tenantSlug, CustomerRegisterRequest request) {
        Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada: " + tenantSlug));

        String email = request.getEmail().trim().toLowerCase();

        if (customerRepository.existsByTenantIdAndEmail(tenant.getId(), email)) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este e-mail nesta loja.");
        }

        Customer customer = Customer.builder()
                .tenantId(tenant.getId())
                .name(request.getName().trim())
                .email(email)
                .cpf(request.getCpf() != null ? request.getCpf().trim() : null)
                .password(passwordEncoder.encode(request.getPassword()))
                .build();

        Customer saved = customerRepository.save(customer);

        // Retroatividade: Vincula pedidos anteriores feitos com este mesmo e-mail nesta loja
        List<Order> previousOrders = orderRepository.findByTenantIdAndCustomerEmailIgnoreCaseOrderByCreatedAtDesc(tenant.getId(), email);
        for (Order ord : previousOrders) {
            if (ord.getCustomerId() == null) {
                ord.setCustomerId(saved.getId());
                orderRepository.save(ord);
            }
        }

        String token = jwtService.generateCustomerToken(saved);
        CustomerDTO dto = toDTO(saved);

        log.info("Novo cliente cadastrado na loja {}: {} ({})", tenantSlug, saved.getName(), saved.getEmail());

        return CustomerAuthResponse.builder()
                .token(token)
                .customer(dto)
                .build();
    }

    public CustomerAuthResponse login(String tenantSlug, CustomerLoginRequest request) {
        Tenant tenant = tenantRepository.findBySlug(tenantSlug)
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada: " + tenantSlug));

        String email = request.getEmail().trim().toLowerCase();

        Customer customer = customerRepository.findByTenantIdAndEmail(tenant.getId(), email)
                .orElseThrow(() -> new IllegalArgumentException("E-mail ou senha inválidos."));

        if (!passwordEncoder.matches(request.getPassword(), customer.getPassword())) {
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }

        String token = jwtService.generateCustomerToken(customer);
        CustomerDTO dto = toDTO(customer);

        return CustomerAuthResponse.builder()
                .token(token)
                .customer(dto)
                .build();
    }

    public CustomerDTO getProfile(Customer customer) {
        return toDTO(customer);
    }

    public List<OrderResponse> getCustomerOrders(Customer customer) {
        List<Order> orders = orderRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
                customer.getTenantId(),
                customer.getId()
        );

        // Se por algum motivo houver pedidos antigos com o e-mail mas sem customerId, inclui também
        if (orders.isEmpty()) {
            orders = orderRepository.findByTenantIdAndCustomerEmailIgnoreCaseOrderByCreatedAtDesc(
                    customer.getTenantId(),
                    customer.getEmail()
            );
        }

        return orders.stream()
                .map(this::toOrderResponse)
                .collect(Collectors.toList());
    }

    public CustomerDTO toDTO(Customer customer) {
        List<Order> orders = orderRepository.findByTenantIdAndCustomerIdOrderByCreatedAtDesc(
                customer.getTenantId(),
                customer.getId()
        );

        long totalOrders = orders.size();
        BigDecimal totalSpent = orders.stream()
                .filter(o -> o.getStatus() == OrderStatus.PAID)
                .map(Order::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime lastOrderAt = orders.isEmpty() ? null : orders.get(0).getCreatedAt();

        return CustomerDTO.builder()
                .id(customer.getId())
                .tenantId(customer.getTenantId())
                .name(customer.getName())
                .email(customer.getEmail())
                .cpf(customer.getCpf())
                .createdAt(customer.getCreatedAt())
                .totalOrders(totalOrders)
                .totalSpent(totalSpent)
                .lastOrderAt(lastOrderAt)
                .build();
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
}
