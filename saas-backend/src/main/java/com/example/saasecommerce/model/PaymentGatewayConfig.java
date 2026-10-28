package com.example.saasecommerce.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "payment_gateway_configs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"tenant_id", "provider"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentGatewayConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentProvider provider;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(name = "is_pix_provider", nullable = false)
    @Builder.Default
    private boolean isPixProvider = false;

    @Column(name = "client_id")
    private String clientId;

    @Column(name = "client_secret", columnDefinition = "TEXT")
    private String clientSecret;

    @Column(name = "public_key", columnDefinition = "TEXT")
    private String publicKey;

    @Column(name = "fee_percentage")
    private BigDecimal feePercentage;

    @Column(name = "fee_fixed")
    private BigDecimal feeFixed;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
