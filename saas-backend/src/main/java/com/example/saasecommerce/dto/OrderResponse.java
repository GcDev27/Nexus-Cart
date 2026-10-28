package com.example.saasecommerce.dto;

import com.example.saasecommerce.model.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private UUID orderId;
    private OrderStatus status;
    private BigDecimal amount;
    private String productName;
    private String variationName;
    private String qrCode;
    private String qrCodeBase64;
    private String ticketUrl;
    private String deliveredContent;
    private boolean simulated;
    private String message;
    private UUID customerId;
    private String customerName;
    private String customerEmail;
    private String customerCpf;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime paidAt;
}
