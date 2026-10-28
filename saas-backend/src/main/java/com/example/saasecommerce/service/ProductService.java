package com.example.saasecommerce.service;

import com.example.saasecommerce.model.Product;
import com.example.saasecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;

    // Criar (CREATE)
    public Product createProduct(UUID tenantId, Product product) {
        product.setTenantId(tenantId);
        
        if (product.getVariations() == null || product.getVariations().isEmpty()) {
            com.example.saasecommerce.model.Variation defaultVariation = com.example.saasecommerce.model.Variation.builder()
                    .name("Opção Padrão")
                    .price(java.math.BigDecimal.ZERO)
                    .deliveryType(com.example.saasecommerce.model.DeliveryType.AUTOMATIC_LINES)
                    .hasUnlimitedStock(false)
                    .stockQuantity(0)
                    .product(product)
                    .build();
            product.setVariations(new java.util.ArrayList<>(java.util.List.of(defaultVariation)));
        } else {
            for (com.example.saasecommerce.model.Variation v : product.getVariations()) {
                v.setProduct(product);
            }
        }
        
        return productRepository.save(product);
    }

    // Ler / Listar (READ)
    public List<Product> getProductsByTenant(UUID tenantId) {
        return productRepository.findAllByTenantId(tenantId);
    }

    // Listar somente os visíveis (para a vitrine pública)
    public List<Product> getProductsByTenantAndVisibility(UUID tenantId, String visibility) {
        return productRepository.findAllByTenantIdAndVisibility(tenantId, visibility);
    }

    // Buscar por slug (para página de detalhe do produto)
    public Product getProductBySlugAndTenant(String slug, UUID tenantId) {
        return productRepository.findBySlugAndTenantId(slug, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado"));
    }

    // Ler um único produto por ID
    public Product getProductById(UUID id, UUID tenantId) {
        return productRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado ou não pertence a esta loja"));
    }

    // Atualizar (UPDATE)
    public Product updateProduct(UUID id, UUID tenantId, Product detalhes) {
        Product produto = getProductById(id, tenantId);

        produto.setName(detalhes.getName());
        produto.setDescription(detalhes.getDescription());
        produto.setSlug(detalhes.getSlug());
        produto.setVisibility(detalhes.getVisibility());

        produto.setCategoryName(detalhes.getCategoryName());
        produto.setImageUrl(detalhes.getImageUrl());

        return productRepository.save(produto);
    }

    // Apagar (DELETE)
    public void deleteProduct(UUID id, UUID tenantId) {
        Product produto = getProductById(id, tenantId);
        productRepository.delete(produto);
    }
}