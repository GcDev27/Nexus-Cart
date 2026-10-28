package com.example.saasecommerce.dto;

import com.example.saasecommerce.model.PaymentProvider;
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
public class PaymentGatewayDTO {
    private UUID id;
    private PaymentProvider provider;
    private boolean enabled;
    private boolean isPixProvider;
    private String clientId;
    private String clientSecret; // Retornado mascarado para segurança
    private String publicKey;
    private BigDecimal feePercentage;
    private BigDecimal feeFixed;
}
