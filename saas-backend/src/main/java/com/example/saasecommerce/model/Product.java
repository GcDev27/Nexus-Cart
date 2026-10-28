package com.example.saasecommerce.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "products", uniqueConstraints = {
    @UniqueConstraint(name = "uk_product_tenant_slug", columnNames = {"tenant_id", "slug"})
})
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "category_name")
    private String categoryName;
    
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false)
    private String visibility;

    // Coluna legada: Mantida apenas para evitar erro de NOT NULL no banco de dados antigo.
    // O Spring não apaga colunas sozinho. Você pode dropar essa coluna no banco depois.
    @Column(name = "delivery_type")
    @Builder.Default
    private String oldDeliveryType = "AUTOMATIC_LINES";

    // Variações deste produto (preço, entrega, estoque ficam aqui)
    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Variation> variations = new ArrayList<>();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}