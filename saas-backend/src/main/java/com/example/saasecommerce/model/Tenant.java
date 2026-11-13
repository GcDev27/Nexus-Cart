package com.example.saasecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "tenants")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name; // Nome da loja (ex: Loja do João)

    @Column(nullable = false, unique = true)
    private String slug; // URL da loja (ex: loja-do-joao)

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // --- Sistema de Temas (Customização da Loja) ---
    @Column(name = "theme", nullable = false)
    @Builder.Default
    private String theme = "theme-glass"; // Padrão: Dark Mode Premium

    @Column(name = "primary_color", nullable = false)
    @Builder.Default
    private String primaryColor = "#8b5cf6"; // Padrão: Roxo (violet-500)
    
    @Column(name = "font_family", nullable = false)
    @Builder.Default
    private String font = "Inter"; // Fonte moderna

    @Column(name = "hero_title", columnDefinition = "TEXT")
    @Builder.Default
    private String heroTitle = "Produtos digitais com entrega na hora";

    @Column(name = "hero_description", columnDefinition = "TEXT")
    @Builder.Default
    private String heroDescription = "Pague com Pix e receba sua compra na mesma tela, a qualquer hora.";

    @Column(name = "logo_url", columnDefinition = "TEXT")
    private String logoUrl;

    // Imagem de capa exibida no topo da vitrine
    @Column(name = "banner_url", columnDefinition = "TEXT")
    private String bannerUrl;

    // Cantos dos cards e botões: rounded, soft ou sharp
    @Column(name = "corner_style")
    private String cornerStyle;

    // Faixa de aviso no topo da loja (ex.: "Cupom de 10% no Pix")
    @Column(name = "announcement_text")
    private String announcementText;

    @Column(name = "footer_text", columnDefinition = "TEXT")
    private String footerText;

    // Canais de contato exibidos no rodapé e na página do produto
    @Column(name = "discord_url")
    private String discordUrl;

    @Column(name = "whatsapp_url")
    private String whatsappUrl;

    @Column(name = "instagram_url")
    private String instagramUrl;
    // ---------------------------------------------

    // --- Plano e assinatura do NexusCart ---
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Plan plan = Plan.SUPER;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_status", nullable = false, length = 20)
    @Builder.Default
    private SubscriptionStatus subscriptionStatus = SubscriptionStatus.TRIALING;

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt;

    // Até quando a mensalidade está paga
    @Column(name = "paid_until")
    private LocalDateTime paidUntil;

    @Column(name = "asaas_customer_id", length = 64)
    private String asaasCustomerId;

    @Column(name = "asaas_subscription_id", length = 64)
    private String asaasSubscriptionId;

    // Esse método roda automaticamente antes de salvar no banco para preencher a data
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}