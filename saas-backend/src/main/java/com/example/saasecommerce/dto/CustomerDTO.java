package com.example.saasecommerce.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDTO {
    private UUID id;
    private UUID tenantId;
    private String name;
    private String email;
    private String cpf;
    private LocalDateTime createdAt;
    private long totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderAt;
}
