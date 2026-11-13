package com.example.saasecommerce.service;

import com.example.saasecommerce.model.Plan;
import com.example.saasecommerce.model.SubscriptionStatus;
import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.repository.TenantRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;

/**
 * Plano, teste grátis e mensalidade das lojas.
 * A loja fica aberta no teste de 7 dias e, depois, enquanto a mensalidade estiver paga
 * (com 3 dias de tolerância após o vencimento).
 */
@Service
@Slf4j
public class SubscriptionService {

    public static final int TRIAL_DAYS = 7;
    public static final int GRACE_DAYS = 3;

    private static final Set<String> PAID_STATUSES = Set.of("RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH");

    private final TenantRepository tenantRepository;
    private final AsaasClient asaas;
    private final String webhookToken;

    public SubscriptionService(TenantRepository tenantRepository, AsaasClient asaas,
                               @Value("${app.asaas.webhook-token:}") String webhookToken) {
        this.tenantRepository = tenantRepository;
        this.asaas = asaas;
        this.webhookToken = webhookToken;
    }

    /** Recurso fora do plano atual. Vira HTTP 403. */
    public static class PlanFeatureException extends RuntimeException {
        public PlanFeatureException(String message) {
            super(message);
        }
    }

    /** Loja pausada por teste vencido ou mensalidade em atraso. Vira HTTP 423. */
    public static class StorePausedException extends RuntimeException {
        public StorePausedException() {
            super("Esta loja está temporariamente indisponível.");
        }
    }

    public record SubscriptionView(
            String plan, String planLabel, BigDecimal monthlyPrice, String status,
            LocalDateTime trialEndsAt, LocalDateTime paidUntil, boolean storeOpen, boolean hasSubscription,
            boolean customDesign, boolean salesDashboard, boolean billingAvailable, String invoiceUrl) {}

    public void startTrial(Tenant tenant, Plan plan) {
        tenant.setPlan(plan);
        tenant.setSubscriptionStatus(SubscriptionStatus.TRIALING);
        tenant.setTrialEndsAt(LocalDateTime.now().plusDays(TRIAL_DAYS));
    }

    public boolean isStoreOpen(Tenant t) {
        LocalDateTime now = LocalDateTime.now();
        // Pagou antes de o teste acabar: o período pago passa a contar
        if (t.getPaidUntil() != null) {
            int grace = t.getSubscriptionStatus() == SubscriptionStatus.CANCELED ? 0 : GRACE_DAYS;
            if (t.getPaidUntil().plusDays(grace).isAfter(now)) return true;
        }
        return t.getTrialEndsAt() != null && t.getTrialEndsAt().isAfter(now);
    }

    public void requireOpen(Tenant t) {
        if (!isStoreOpen(t)) throw new StorePausedException();
    }

    public void requireCustomDesign(Tenant t) {
        if (!t.getPlan().customDesign()) {
            throw new PlanFeatureException("Tema, cores, fontes, logo e capa estão disponíveis a partir do plano Super.");
        }
    }

    public SubscriptionView view(Tenant t, boolean withInvoice) {
        String invoiceUrl = null;
        if (withInvoice && t.getAsaasSubscriptionId() != null && asaas.isConfigured()) {
            try {
                invoiceUrl = asaas.openInvoiceUrl(t.getAsaasSubscriptionId());
            } catch (IllegalStateException e) {
                log.warn("Não foi possível buscar a cobrança em aberto da loja {}: {}", t.getId(), e.getMessage());
            }
        }
        Plan p = t.getPlan();
        return new SubscriptionView(
                p.name(), p.label(), p.monthlyPrice(), t.getSubscriptionStatus().name(),
                t.getTrialEndsAt(), t.getPaidUntil(), isStoreOpen(t), t.getAsaasSubscriptionId() != null,
                p.customDesign(), p.salesDashboard(), asaas.isConfigured(), invoiceUrl);
    }

    /**
     * Assina (ou troca de plano). Cria o cliente e a assinatura no Asaas na primeira vez.
     * A primeira cobrança vence no fim do teste grátis, ou hoje se o teste já acabou.
     */
    @Transactional
    public SubscriptionView subscribe(User owner, Plan plan, String cpfCnpj) {
        Tenant t = tenantRepository.findById(owner.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada"));
        if (!asaas.isConfigured()) {
            throw new IllegalStateException("A cobrança das assinaturas ainda não foi configurada. Fale com o suporte.");
        }
        String description = "NexusCart - plano " + plan.label() + " - " + t.getName();

        if (t.getAsaasSubscriptionId() != null) {
            if (t.getPlan() != plan) {
                asaas.updateSubscriptionValue(t.getAsaasSubscriptionId(), plan.monthlyPrice(), description);
                t.setPlan(plan);
            }
        } else {
            if (t.getAsaasCustomerId() == null) {
                String doc = cpfCnpj == null ? "" : cpfCnpj.replaceAll("\\D", "");
                if (doc.length() != 11 && doc.length() != 14) {
                    throw new IllegalArgumentException("Informe um CPF ou CNPJ válido para emitir a cobrança.");
                }
                t.setAsaasCustomerId(asaas.createCustomer(owner.getName(), doc, owner.getEmail(), t.getId().toString()));
            }
            LocalDate firstDue = LocalDate.now();
            if (t.getPaidUntil() != null && t.getPaidUntil().toLocalDate().isAfter(firstDue)) {
                firstDue = t.getPaidUntil().toLocalDate();
            } else if (t.getTrialEndsAt() != null && t.getTrialEndsAt().toLocalDate().isAfter(firstDue)) {
                firstDue = t.getTrialEndsAt().toLocalDate();
            }
            t.setAsaasSubscriptionId(asaas.createSubscription(
                    t.getAsaasCustomerId(), plan.monthlyPrice(), firstDue, description, t.getId().toString()));
            t.setPlan(plan);
            if (t.getSubscriptionStatus() == SubscriptionStatus.CANCELED) {
                t.setSubscriptionStatus(t.getPaidUntil() != null ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PAST_DUE);
            }
        }
        tenantRepository.save(t);
        return view(t, true);
    }

    /** Cancela as próximas cobranças. A loja segue aberta até o fim do que já foi pago (ou do teste). */
    @Transactional
    public SubscriptionView cancel(User owner) {
        Tenant t = tenantRepository.findById(owner.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada"));
        if (t.getAsaasSubscriptionId() == null) {
            throw new IllegalArgumentException("Sua loja não tem assinatura ativa.");
        }
        asaas.deleteSubscription(t.getAsaasSubscriptionId());
        t.setAsaasSubscriptionId(null);
        t.setSubscriptionStatus(SubscriptionStatus.CANCELED);
        tenantRepository.save(t);
        return view(t, false);
    }

    public boolean isValidWebhookToken(String received) {
        if (webhookToken == null || webhookToken.isBlank() || received == null) return false;
        return MessageDigest.isEqual(webhookToken.getBytes(StandardCharsets.UTF_8), received.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Processa uma notificação do Asaas. O status do pagamento nunca é lido do corpo:
     * ele é confirmado direto na API do Asaas.
     */
    @Transactional
    public void handleWebhook(JsonNode event) {
        String type = event.path("event").asText();
        if (type.equals("SUBSCRIPTION_DELETED") || type.equals("SUBSCRIPTION_INACTIVATED")) {
            String subId = event.path("subscription").path("id").asText(null);
            if (subId == null) return;
            tenantRepository.findByAsaasSubscriptionId(subId).ifPresent(t -> {
                t.setAsaasSubscriptionId(null);
                t.setSubscriptionStatus(SubscriptionStatus.CANCELED);
                tenantRepository.save(t);
            });
            return;
        }
        if (!type.startsWith("PAYMENT_")) return;

        String paymentId = event.path("payment").path("id").asText(null);
        if (paymentId == null || !paymentId.matches("[A-Za-z0-9_]{1,64}")) return;

        AsaasClient.Payment payment = asaas.getPayment(paymentId);
        if (payment.subscription() == null || payment.dueDate() == null) return;
        Tenant t = tenantRepository.findByAsaasSubscriptionId(payment.subscription()).orElse(null);
        if (t == null) {
            log.warn("Pagamento {} do Asaas sem loja correspondente", paymentId);
            return;
        }

        // Cada mensalidade paga cobre um mês a partir do vencimento dela
        LocalDateTime coveredUntil = payment.dueDate().plusMonths(1).atTime(23, 59, 59);
        if (PAID_STATUSES.contains(payment.status())) {
            if (t.getPaidUntil() == null || coveredUntil.isAfter(t.getPaidUntil())) t.setPaidUntil(coveredUntil);
            t.setSubscriptionStatus(SubscriptionStatus.ACTIVE);
        } else if (payment.status().equals("OVERDUE")) {
            if (t.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) t.setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
        } else if (payment.status().startsWith("REFUND") || payment.status().startsWith("CHARGEBACK")) {
            // Estorno: o mês daquela cobrança deixa de contar como pago
            LocalDateTime paidThroughBefore = payment.dueDate().atStartOfDay();
            if (t.getPaidUntil() != null && t.getPaidUntil().isAfter(paidThroughBefore)) t.setPaidUntil(paidThroughBefore);
            if (t.getSubscriptionStatus() == SubscriptionStatus.ACTIVE) t.setSubscriptionStatus(SubscriptionStatus.PAST_DUE);
        }
        tenantRepository.save(t);
    }
}
