package com.example.saasecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_lines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StockLine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private boolean isDelivered;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variation_id", nullable = false)
    @JsonIgnore
    private Variation variation;

    @Column(name = "order_id")
    private UUID orderId;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
