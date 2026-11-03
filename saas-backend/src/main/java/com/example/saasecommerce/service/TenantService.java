package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.TenantSettingsRequest;
import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.repository.TenantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class TenantService {

    private final TenantRepository tenantRepository;

    // Regra de Negócio 1: Criar uma loja nova
    public Tenant createTenant(String name, String slug) {
        // Verifica se a URL já está sendo usada por outra loja
        if (tenantRepository.findBySlug(slug).isPresent()) {
            throw new IllegalArgumentException("Esta URL já está em uso por outra loja!");
        }

        Tenant newTenant = Tenant.builder()
                .name(name)
                .slug(slug)
                .build();

        return tenantRepository.save(newTenant); // Salva no Postgres!
    }

    // Regra de Negócio 2: Buscar uma loja pelo slug
    public Tenant getTenantBySlug(String slug) {
        return tenantRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada!"));
    }

    // Regra de Negócio: Buscar uma loja pelo ID
    public Tenant getTenantById(java.util.UUID id) {
        return tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada!"));
    }

    private static final Set<String> THEMES = Set.of("theme-glass", "theme-light", "theme-gamer", "theme-list");
    private static final Set<String> CORNER_STYLES = Set.of("rounded", "soft", "sharp");
    private static final Set<String> FONTS = Set.of(
            "Inter", "Roboto", "Playfair Display", "Poppins", "Nunito", "Raleway", "Montserrat", "Space Grotesk");
    private static final Pattern HEX_COLOR = Pattern.compile("^#[0-9a-fA-F]{6}$");

    // Regra de Negócio 3: Atualizar configurações da loja
    public Tenant updateTenantSettings(java.util.UUID id, TenantSettingsRequest req) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada!"));

        if (req.name() != null) {
            String name = req.name().trim();
            if (name.length() < 2 || name.length() > 60) {
                throw new IllegalArgumentException("O nome da loja deve ter entre 2 e 60 caracteres.");
            }
            tenant.setName(name);
        }
        if (req.theme() != null) tenant.setTheme(requireOneOf(req.theme(), THEMES, "Template inválido."));
        if (req.cornerStyle() != null) tenant.setCornerStyle(requireOneOf(req.cornerStyle(), CORNER_STYLES, "Estilo de cantos inválido."));
        if (req.font() != null) tenant.setFont(requireOneOf(req.font(), FONTS, "Fonte não suportada."));
        if (req.primaryColor() != null) {
            if (!HEX_COLOR.matcher(req.primaryColor()).matches()) {
                throw new IllegalArgumentException("Cor inválida. Use o formato #RRGGBB.");
            }
            tenant.setPrimaryColor(req.primaryColor().toLowerCase());
        }

        if (req.heroTitle() != null) tenant.setHeroTitle(limitText(req.heroTitle(), 80, "Título"));
        if (req.heroDescription() != null) tenant.setHeroDescription(limitText(req.heroDescription(), 200, "Descrição"));
        if (req.announcementText() != null) tenant.setAnnouncementText(blankToNull(limitText(req.announcementText(), 120, "Aviso")));
        if (req.footerText() != null) tenant.setFooterText(blankToNull(limitText(req.footerText(), 300, "Texto do rodapé")));

        if (req.logoUrl() != null) tenant.setLogoUrl(InputValidator.image(req.logoUrl(), "Logo"));
        if (req.bannerUrl() != null) tenant.setBannerUrl(InputValidator.image(req.bannerUrl(), "Banner"));

        if (req.discordUrl() != null) tenant.setDiscordUrl(validLink(req.discordUrl(), "Discord"));
        if (req.whatsappUrl() != null) tenant.setWhatsappUrl(validLink(req.whatsappUrl(), "WhatsApp"));
        if (req.instagramUrl() != null) tenant.setInstagramUrl(validLink(req.instagramUrl(), "Instagram"));

        return tenantRepository.save(tenant);
    }

    private static String requireOneOf(String value, Set<String> allowed, String error) {
        if (!allowed.contains(value)) throw new IllegalArgumentException(error);
        return value;
    }

    private static String limitText(String value, int max, String field) {
        String trimmed = value.trim();
        if (trimmed.length() > max) {
            throw new IllegalArgumentException(field + " pode ter no máximo " + max + " caracteres.");
        }
        return trimmed;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    // Links públicos: só https, para não permitir "javascript:" ou outros esquemas na vitrine
    private static String validLink(String value, String field) {
        String v = value.trim();
        if (v.isEmpty()) return null;
        if (v.length() > 300 || !v.startsWith("https://")) {
            throw new IllegalArgumentException("Link do " + field + " inválido. Use um endereço começando com https://");
        }
        return v;
    }
}