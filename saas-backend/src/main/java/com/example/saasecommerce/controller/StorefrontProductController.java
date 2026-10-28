package com.example.saasecommerce.controller;

import com.example.saasecommerce.model.Product;
import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.service.ProductService;
import com.example.saasecommerce.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/storefront/produtos")
@RequiredArgsConstructor
public class StorefrontProductController {

    private final ProductService productService;
    private final TenantService tenantService;

    // Lista todos os produtos visíveis da loja
    @GetMapping
    public ResponseEntity<List<Product>> listarProdutosDaVitrine(
            @RequestHeader("X-Tenant-Slug") String tenantSlug) {

        Tenant tenant = tenantService.getTenantBySlug(tenantSlug);
        List<Product> produtos = productService.getProductsByTenantAndVisibility(tenant.getId(), "VISIBLE");
        return ResponseEntity.ok(produtos);
    }

    // Busca um único produto pelo slug (para a página de detalhe)
    @GetMapping("/{productSlug}")
    public ResponseEntity<Product> obterProdutoPorSlug(
            @RequestHeader("X-Tenant-Slug") String tenantSlug,
            @PathVariable String productSlug) {

        Tenant tenant = tenantService.getTenantBySlug(tenantSlug);
        Product produto = productService.getProductBySlugAndTenant(productSlug, tenant.getId());
        return ResponseEntity.ok(produto);
    }
}