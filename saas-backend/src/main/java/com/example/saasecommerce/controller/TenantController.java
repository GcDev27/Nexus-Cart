package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.TenantSettingsRequest;
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
    private final com.example.saasecommerce.service.SubscriptionService subscriptionService;

    // DTOs para organizar a entrada e a saída
    public record TenantResponseDTO(
            UUID id, String name, String slug,
            String theme, String primaryColor, String font, String cornerStyle,
            String heroTitle, String heroDescription, String announcementText, String footerText,
            String logoUrl, String bannerUrl,
            String discordUrl, String whatsappUrl, String instagramUrl,
            boolean storeOpen) {}

    // Rota GET: Busca a loja pelo slug (O Next.js vai chamar isso para carregar a vitrine)
    @GetMapping("/{slug}")
    public ResponseEntity<TenantResponseDTO> getTenantBySlug(@PathVariable String slug) {
        Tenant tenant = tenantService.getTenantBySlug(slug);
        return ResponseEntity.ok(publicDto(tenant));
    }

    // Rota GET: Busca a loja pelo ID (O Next.js vai chamar isso no painel admin)
    @GetMapping("/id/{id}")
    public ResponseEntity<TenantResponseDTO> getTenantById(@PathVariable UUID id) {
        Tenant tenant = tenantService.getTenantById(id);
        return ResponseEntity.ok(publicDto(tenant));
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
    public ResponseEntity<TenantResponseDTO> updateMyTenant(@RequestBody TenantSettingsRequest request, org.springframework.security.core.Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof com.example.saasecommerce.model.User user)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Tenant updatedTenant = tenantService.updateTenantSettings(user.getTenantId(), request);
        return ResponseEntity.ok(mapToDto(updatedTenant));
    }

    /** Vitrine: no Starter a loja usa o visual padrão, mesmo que algo tenha sido salvo antes num plano maior. */
    private TenantResponseDTO publicDto(Tenant t) {
        TenantResponseDTO d = mapToDto(t);
        if (t.getPlan().customDesign()) return d;
        return new TenantResponseDTO(
                d.id(), d.name(), d.slug(), "theme-glass", "#8b5cf6", "Inter", "rounded",
                d.heroTitle(), d.heroDescription(), d.announcementText(), d.footerText(), null, null,
                d.discordUrl(), d.whatsappUrl(), d.instagramUrl(), d.storeOpen());
    }

    private TenantResponseDTO mapToDto(Tenant t) {
        return new TenantResponseDTO(
                t.getId(), t.getName(), t.getSlug(),
                t.getTheme(), t.getPrimaryColor(), t.getFont(),
                t.getCornerStyle() != null ? t.getCornerStyle() : "rounded",
                t.getHeroTitle(), t.getHeroDescription(), t.getAnnouncementText(), t.getFooterText(),
                t.getLogoUrl(), t.getBannerUrl(),
                t.getDiscordUrl(), t.getWhatsappUrl(), t.getInstagramUrl(),
                subscriptionService.isStoreOpen(t));
    }
}