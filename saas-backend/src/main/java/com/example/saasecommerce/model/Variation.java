package com.example.saasecommerce.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "variations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Variation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name; // Ex: "FAKE 240 CROWNS - NÍVEL 6"

    private BigDecimal price;
    
    @Column(name = "compare_at_price")
    private BigDecimal compareAtPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_type", nullable = false)
    private DeliveryType deliveryType;

    // Se a entrega for CHAT
    @Column(name = "chat_initial_message", columnDefinition = "TEXT")
    private String chatInitialMessage;

    // Opções de estoque geral
    @Column(name = "has_unlimited_stock")
    private boolean hasUnlimitedStock;

    @Column(name = "stock_quantity")
    private Integer stockQuantity; // Usado se deliveryType for CHAT e não houver linhas

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    @JsonIgnore
    private Product product;

    // Nunca serializar: o conteúdo das linhas são as chaves/seriais do lojista.
    // O lojista acessa via /api/admin/variacoes/{id}/estoque; a vitrine só recebe a contagem.
    @OneToMany(mappedBy = "variation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @JsonIgnore
    private List<StockLine> stockLines = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Estoque disponível exposto na vitrine (apenas a quantidade, sem o conteúdo)
    @JsonProperty(value = "availableStockCount", access = JsonProperty.Access.READ_ONLY)
    public long getAvailableStockCount() {
        if (stockLines == null) return 0;
        return stockLines.stream().filter(line -> !line.isDelivered()).count();
    }
}
