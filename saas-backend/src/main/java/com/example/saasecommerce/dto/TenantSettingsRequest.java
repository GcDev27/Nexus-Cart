package com.example.saasecommerce.dto;

/**
 * Configurações da vitrine enviadas pelo painel do lojista.
 * Campo null = não alterar; texto vazio = limpar (nos campos opcionais).
 */
public record TenantSettingsRequest(
        String name,
        String theme,
        String primaryColor,
        String font,
        String cornerStyle,
        String heroTitle,
        String heroDescription,
        String announcementText,
        String footerText,
        String logoUrl,
        String bannerUrl,
        String discordUrl,
        String whatsappUrl,
        String instagramUrl
) {}
