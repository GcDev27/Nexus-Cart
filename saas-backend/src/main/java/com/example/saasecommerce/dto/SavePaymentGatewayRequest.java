package com.example.saasecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavePaymentGatewayRequest {
    private boolean enabled;
    private String clientId;
    private String clientSecret;
    private String publicKey;
    private BigDecimal feePercentage;
    private BigDecimal feeFixed;
}
