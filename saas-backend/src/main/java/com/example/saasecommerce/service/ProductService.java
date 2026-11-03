package com.example.saasecommerce.service;

import com.example.saasecommerce.model.DeliveryType;
import com.example.saasecommerce.model.Product;
import com.example.saasecommerce.model.Variation;
import com.example.saasecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private static final Set<String> VISIBILITIES = Set.of("VISIBLE", "HIDDEN");

    private final ProductRepository productRepository;

    // Criar (CREATE)
    public Product createProduct(UUID tenantId, Product request) {
        // Monta um produto novo só com os campos permitidos. Salvar o objeto vindo do JSON deixaria
        // o cliente escolher o id e sobrescrever um produto de outra loja.
        Product product = Product.builder()
                .tenantId(tenantId)
                .name(InputValidator.text(request.getName(), 1, 120, "Nome do produto"))
                .slug(InputValidator.slug(request.getSlug()))
                .description(InputValidator.optionalText(request.getDescription(), 20_000, "Descrição"))
                .categoryName(InputValidator.optionalText(request.getCategoryName(), 60, "Categoria"))
                .imageUrl(InputValidator.image(request.getImageUrl(), "Imagem do produto"))
                .visibility(visibility(request.getVisibility()))
                .build();

        List<Variation> variations = new ArrayList<>();
        if (request.getVariations() != null) {
            if (request.getVariations().size() > 50) throw new IllegalArgumentException("Um produto pode ter no máximo 50 opções.");
            for (Variation v : request.getVariations()) {
                variations.add(Variation.builder()
                        .name(InputValidator.text(v.getName(), 1, 80, "Nome da opção"))
                        .price(InputValidator.price(v.getPrice(), "Preço"))
                        .compareAtPrice(v.getCompareAtPrice() == null ? null : InputValidator.price(v.getCompareAtPrice(), "Preço \"de\""))
                        .deliveryType(v.getDeliveryType() == null ? DeliveryType.AUTOMATIC_LINES : v.getDeliveryType())
                        .chatInitialMessage(InputValidator.optionalText(v.getChatInitialMessage(), 1000, "Mensagem após o pagamento"))
                        .hasUnlimitedStock(v.isHasUnlimitedStock())
                        .stockQuantity(VariationService.stockQuantity(v.getStockQuantity()))
                        .product(product)
                        .build());
            }
        }
        if (variations.isEmpty()) {
            variations.add(Variation.builder()
                    .name("Padrão")
                    .price(BigDecimal.ZERO)
                    .deliveryType(DeliveryType.AUTOMATIC_LINES)
                    .hasUnlimitedStock(false)
                    .stockQuantity(0)
                    .product(product)
                    .build());
        }
        product.setVariations(variations);

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

    // Página pública do produto: produto oculto não aparece nem para quem tem o link
    public Product getVisibleProductBySlug(String slug, UUID tenantId) {
        return productRepository.findBySlugAndTenantId(slug, tenantId)
                .filter(p -> "VISIBLE".equals(p.getVisibility()))
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

        produto.setName(InputValidator.text(detalhes.getName(), 1, 120, "Nome do produto"));
        produto.setDescription(InputValidator.optionalText(detalhes.getDescription(), 20_000, "Descrição"));
        produto.setSlug(InputValidator.slug(detalhes.getSlug()));
        produto.setVisibility(visibility(detalhes.getVisibility()));
        produto.setCategoryName(InputValidator.optionalText(detalhes.getCategoryName(), 60, "Categoria"));
        produto.setImageUrl(InputValidator.image(detalhes.getImageUrl(), "Imagem do produto"));

        return productRepository.save(produto);
    }

    // Apagar (DELETE)
    public void deleteProduct(UUID id, UUID tenantId) {
        Product produto = getProductById(id, tenantId);
        productRepository.delete(produto);
    }

    private static String visibility(String value) {
        if (value == null || value.isBlank()) return "VISIBLE";
        if (!VISIBILITIES.contains(value)) throw new IllegalArgumentException("Visibilidade inválida.");
        return value;
    }
}
