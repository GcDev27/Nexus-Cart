package com.example.saasecommerce.controller;

import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tenants")
@RequiredArgsConstructor // Injeta o Service automaticamente graças ao Lombok
public class TenantController {

    private final TenantService tenantService;

    // DTOs para organizar a entrada e a saída
    public record TenantRequestDTO(String name, String slug) {}
    public record TenantUpdateDTO(String theme, String primaryColor, String font, String heroTitle, String heroDescription, String logoUrl) {}
    public record TenantResponseDTO(UUID id, String name, String slug, String theme, String primaryColor, String font, String heroTitle, String heroDescription, String logoUrl) {}

    // Rota POST: Cria a loja (O Next.js vai chamar isso ao cadastrar um cliente)
    @PostMapping
    public ResponseEntity<TenantResponseDTO> createTenant(@RequestBody TenantRequestDTO request) {
        Tenant tenant = tenantService.createTenant(request.name(), request.slug());
        return ResponseEntity.status(HttpStatus.CREATED).body(mapToDto(tenant));
    }

    // Rota GET: Busca a loja pelo slug (O Next.js vai chamar isso para carregar a vitrine)
    @GetMapping("/{slug}")
    public ResponseEntity<TenantResponseDTO> getTenantBySlug(@PathVariable String slug) {
        Tenant tenant = tenantService.getTenantBySlug(slug);
        return ResponseEntity.ok(mapToDto(tenant));
    }

    // Rota GET: Busca a loja pelo ID (O Next.js vai chamar isso no painel admin)
    @GetMapping("/id/{id}")
    public ResponseEntity<TenantResponseDTO> getTenantById(@PathVariable UUID id) {
        Tenant tenant = tenantService.getTenantById(id);
        return ResponseEntity.ok(mapToDto(tenant));
    }

    // Rota GET: Busca a loja do usuário autenticado
    @GetMapping("/me")
    public ResponseEntity<TenantResponseDTO> getMyTenant(org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof com.example.saasecommerce.model.User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Tenant tenant = tenantService.getTenantById(user.getTenantId());
        return ResponseEntity.ok(mapToDto(tenant));
    }

    // Rota PUT: Atualiza as configurações da loja do usuário autenticado
    @PutMapping("/me")
    public ResponseEntity<TenantResponseDTO> updateMyTenant(@RequestBody TenantUpdateDTO request, org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof com.example.saasecommerce.model.User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Tenant updatedTenant = tenantService.updateTenantSettings(
            user.getTenantId(), request.theme(), request.primaryColor(), request.font(), 
            request.heroTitle(), request.heroDescription(), request.logoUrl()
        );
        return ResponseEntity.ok(mapToDto(updatedTenant));
    }

    private TenantResponseDTO mapToDto(Tenant t) {
        return new TenantResponseDTO(t.getId(), t.getName(), t.getSlug(), t.getTheme(), t.getPrimaryColor(), t.getFont(), t.getHeroTitle(), t.getHeroDescription(), t.getLogoUrl());
    }
}