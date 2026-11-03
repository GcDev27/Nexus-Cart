package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.CreateVariationRequest;
import com.example.saasecommerce.dto.VariationResponse;
import com.example.saasecommerce.model.DeliveryType;
import com.example.saasecommerce.model.Product;
import com.example.saasecommerce.model.StockLine;
import com.example.saasecommerce.model.Variation;
import com.example.saasecommerce.repository.ProductRepository;
import com.example.saasecommerce.repository.StockLineRepository;
import com.example.saasecommerce.repository.VariationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VariationService {

    private final VariationRepository variationRepository;
    private final ProductRepository productRepository;
    private final StockLineRepository stockLineRepository;

    // ─── CREATE ─────────────────────────────────────────────────────
    @Transactional
    public VariationResponse createVariation(UUID productId, UUID tenantId, CreateVariationRequest request) {
        Product product = productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado ou não pertence a esta loja"));

        if (variationRepository.findAllByProductIdOrderByCreatedAtAsc(productId).size() >= 50) {
            throw new IllegalArgumentException("Um produto pode ter no máximo 50 opções.");
        }

        Variation variation = Variation.builder().product(product).build();
        apply(variation, request);

        Variation saved = variationRepository.save(variation);
        return toResponse(saved);
    }

    // ─── READ (list by product) ─────────────────────────────────────
    public List<VariationResponse> getVariationsByProduct(UUID productId, UUID tenantId) {
        // Verifica se o produto pertence ao tenant
        productRepository.findByIdAndTenantId(productId, tenantId)
                .orElseThrow(() -> new IllegalArgumentException("Produto não encontrado ou não pertence a esta loja"));

        return variationRepository.findAllByProductIdOrderByCreatedAtAsc(productId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── READ (single) ──────────────────────────────────────────────
    public VariationResponse getVariation(UUID variationId, UUID tenantId) {
        Variation variation = findVariationWithTenantCheck(variationId, tenantId);
        return toResponse(variation);
    }

    // ─── UPDATE ─────────────────────────────────────────────────────
    @Transactional
    public VariationResponse updateVariation(UUID variationId, UUID tenantId, CreateVariationRequest request) {
        Variation variation = findVariationWithTenantCheck(variationId, tenantId);

        apply(variation, request);

        Variation saved = variationRepository.save(variation);
        return toResponse(saved);
    }

    // Copia só os campos editáveis, já validados
    private static void apply(Variation variation, CreateVariationRequest request) {
        variation.setName(InputValidator.text(request.getName(), 1, 80, "Nome da opção"));
        variation.setPrice(InputValidator.price(request.getPrice(), "Preço"));
        variation.setCompareAtPrice(request.getCompareAtPrice() == null ? null : InputValidator.price(request.getCompareAtPrice(), "Preço \"de\""));
        variation.setDeliveryType(request.getDeliveryType());
        variation.setChatInitialMessage(InputValidator.optionalText(request.getChatInitialMessage(), 1000, "Mensagem após o pagamento"));
        variation.setHasUnlimitedStock(request.isHasUnlimitedStock());
        variation.setStockQuantity(stockQuantity(request.getStockQuantity()));
    }

    static Integer stockQuantity(Integer value) {
        if (value == null) return null;
        if (value < 0 || value > 1_000_000) throw new IllegalArgumentException("Estoque precisa estar entre 0 e 1.000.000.");
        return value;
    }

    // ─── DELETE ──────────────────────────────────────────────────────
    @Transactional
    public void deleteVariation(UUID variationId, UUID tenantId) {
        Variation variation = findVariationWithTenantCheck(variationId, tenantId);
        variationRepository.delete(variation);
    }

    // ─── STOCK LINES: ADD ───────────────────────────────────────────
    @Transactional
    public List<StockLine> addStockLines(UUID variationId, UUID tenantId, List<String> lines) {
        Variation variation = findVariationWithTenantCheck(variationId, tenantId);

        if (variation.getDeliveryType() != DeliveryType.AUTOMATIC_LINES) {
            throw new IllegalArgumentException("Linhas de estoque só podem ser adicionadas a variações com entrega automática");
        }

        if (lines.size() > 1000) {
            throw new IllegalArgumentException("Envie no máximo 1.000 chaves por vez.");
        }
        if (lines.stream().anyMatch(line -> line != null && line.trim().length() > 500)) {
            throw new IllegalArgumentException("Cada chave pode ter no máximo 500 caracteres.");
        }

        List<StockLine> stockLines = lines.stream()
                .filter(line -> line != null && !line.isBlank()) // Ignora linhas vazias
                .map(line -> StockLine.builder()
                        .content(line.trim())
                        .isDelivered(false)
                        .variation(variation)
                        .build())
                .collect(Collectors.toList());

        return stockLineRepository.saveAll(stockLines);
    }

    // ─── STOCK LINES: LIST ──────────────────────────────────────────
    public List<StockLine> getStockLines(UUID variationId, UUID tenantId) {
        findVariationWithTenantCheck(variationId, tenantId);
        return stockLineRepository.findAllByVariationId(variationId);
    }

    // ─── STOCK LINES: DELETE ────────────────────────────────────────
    @Transactional
    public void deleteStockLine(UUID stockLineId, UUID tenantId) {
        StockLine stockLine = stockLineRepository.findById(stockLineId)
                .orElseThrow(() -> new IllegalArgumentException("Linha de estoque não encontrada"));

        // Verifica tenant via variação → produto
        Variation variation = stockLine.getVariation();
        Product product = variation.getProduct();
        if (!product.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Linha de estoque não pertence a esta loja");
        }

        stockLineRepository.delete(stockLine);
    }

    // ─── HELPERS ────────────────────────────────────────────────────

    /**
     * Busca uma variação e verifica se o produto pai pertence ao tenant logado.
     */
    private Variation findVariationWithTenantCheck(UUID variationId, UUID tenantId) {
        Variation variation = variationRepository.findById(variationId)
                .orElseThrow(() -> new IllegalArgumentException("Variação não encontrada"));

        Product product = variation.getProduct();
        if (product == null || !product.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Variação não pertence a esta loja");
        }

        return variation;
    }

    /**
     * Converte a entidade Variation para o DTO de resposta,
     * calculando o estoque disponível a partir das StockLines.
     */
    private VariationResponse toResponse(Variation variation) {
        long availableStock = stockLineRepository.countAvailable(variation.getId(), java.time.LocalDateTime.now());

        return VariationResponse.builder()
                .id(variation.getId())
                .name(variation.getName())
                .price(variation.getPrice())
                .compareAtPrice(variation.getCompareAtPrice())
                .deliveryType(variation.getDeliveryType())
                .chatInitialMessage(variation.getChatInitialMessage())
                .hasUnlimitedStock(variation.isHasUnlimitedStock())
                .stockQuantity(variation.getStockQuantity())
                .availableStockCount(availableStock)
                .createdAt(variation.getCreatedAt())
                .build();
    }
}
