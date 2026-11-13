package com.example.saasecommerce.billing;

import com.example.saasecommerce.IntegrationTest;
import com.example.saasecommerce.service.AsaasClient;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@TestPropertySource(properties = "app.asaas.webhook-token=token-do-webhook-de-teste")
@DisplayName("Planos, teste grátis e mensalidade (Asaas)")
class SubscriptionTest extends IntegrationTest {

    private static final String WEBHOOK_TOKEN = "token-do-webhook-de-teste";

    @MockitoBean AsaasClient asaas;

    @BeforeEach
    void asaasConfigurado() {
        when(asaas.isConfigured()).thenReturn(true);
        when(asaas.createCustomer(anyString(), anyString(), anyString(), anyString())).thenReturn("cus_teste");
        when(asaas.createSubscription(anyString(), any(), any(), anyString(), anyString()))
                .thenAnswer(inv -> "sub_" + UUID.randomUUID().toString().substring(0, 12));
        when(asaas.openInvoiceUrl(anyString())).thenReturn("https://sandbox.asaas.com/i/fatura-teste");
    }

    private JsonNode subscription(Merchant m) throws Exception {
        return apiGet("/api/admin/assinatura", m.token()).body();
    }

    private void expireTrial(Merchant m) {
        jdbc.update("update tenants set trial_ends_at = now() - interval '1 day' where id = ?", m.tenantId());
    }

    private Res storefront(Merchant m) throws Exception {
        return send(MockMvcRequestBuilders.get("/api/storefront/produtos").header("X-Tenant-Slug", m.slug()), null, null, nextIp());
    }

    private String subscribe(Merchant m, String plan) throws Exception {
        Res r = apiPost("/api/admin/assinatura", m.token(), Map.of("plan", plan, "cpfCnpj", "529.982.247-25"));
        assertThat(r.status()).as(r.raw()).isEqualTo(200);
        return jdbc.queryForObject("select asaas_subscription_id from tenants where id = ?", String.class, m.tenantId());
    }

    private Res webhook(String token, String event, String paymentId) throws Exception {
        var req = MockMvcRequestBuilders.post("/api/webhooks/asaas");
        if (token != null) req.header("asaas-access-token", token);
        return send(req, null, Map.of("id", "evt_" + UUID.randomUUID(), "event", event,
                "payment", Map.of("id", paymentId, "status", "RECEIVED")), nextIp());
    }

    @Test
    @DisplayName("cadastro começa no teste grátis de 7 dias do plano escolhido")
    void cadastroComTeste() throws Exception {
        JsonNode starter = subscription(newMerchant("STARTER"));
        assertThat(starter.get("plan").asText()).isEqualTo("STARTER");
        assertThat(starter.get("status").asText()).isEqualTo("TRIALING");
        assertThat(starter.get("storeOpen").asBoolean()).isTrue();
        assertThat(starter.get("customDesign").asBoolean()).isFalse();
        LocalDateTime trialEnd = LocalDateTime.parse(starter.get("trialEndsAt").asText());
        assertThat(trialEnd).isBetween(LocalDateTime.now().plusDays(6), LocalDateTime.now().plusDays(8));

        assertThat(subscription(newMerchant("RICH")).get("monthlyPrice").decimalValue()).isEqualByComparingTo("70");
    }

    @Test
    @DisplayName("cadastro sem aceitar os termos ou com plano inexistente é recusado")
    void cadastroInvalido() throws Exception {
        String email = unique("x") + "@teste.local";
        assertThat(apiPost("/api/auth/register", null, Map.of("name", "X", "email", email,
                "password", "Senha-forte-123", "storeName", unique("Loja"))).status()).isEqualTo(400);
        assertThat(apiPost("/api/auth/register", null, Map.of("name", "X", "email", email,
                "password", "Senha-forte-123", "storeName", unique("Loja"), "plan", "GOLD", "acceptedTerms", true)).status())
                .isEqualTo(400);
        assertThat(jdbc.queryForObject("select count(*) from users where email = ?", Integer.class, email)).isZero();
    }

    @Test
    @DisplayName("Starter não personaliza o visual, mas edita textos; a vitrine usa o visual padrão")
    void starterSemPersonalizacao() throws Exception {
        Merchant m = newMerchant("STARTER");
        Res theme = apiPut("/api/v1/tenants/me", m.token(), Map.of("theme", "theme-gamer"));
        assertThat(theme.status()).isEqualTo(403);
        assertThat(theme.raw()).contains("plano Super");
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("primaryColor", "#ff0000")).status()).isEqualTo(403);
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("logoUrl", "https://cdn.example.com/logo.png")).status()).isEqualTo(403);

        // O formulário reenvia os valores atuais junto com o texto
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of(
                "theme", "theme-glass", "primaryColor", "#8b5cf6", "cornerStyle", "rounded", "heroTitle", "Minha loja")).status())
                .isEqualTo(200);

        // Visual salvo num plano maior não aparece mais depois de mudar para o Starter
        jdbc.update("update tenants set logo_url = 'https://cdn.example.com/antigo.png', theme = 'theme-gamer' where id = ?", m.tenantId());
        JsonNode pub = apiGet("/api/v1/tenants/" + m.slug(), null).body();
        assertThat(pub.get("logoUrl").isNull()).isTrue();
        assertThat(pub.get("theme").asText()).isEqualTo("theme-glass");
        assertThat(pub.get("heroTitle").asText()).isEqualTo("Minha loja");
    }

    @Test
    @DisplayName("Super personaliza o visual")
    void superPersonaliza() throws Exception {
        Merchant m = newMerchant("SUPER");
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("theme", "theme-gamer", "primaryColor", "#ff0000")).status())
                .isEqualTo(200);
        assertThat(apiGet("/api/v1/tenants/" + m.slug(), null).body().get("theme").asText()).isEqualTo("theme-gamer");
    }

    @Test
    @DisplayName("teste vencido sem pagamento pausa a vitrine e o checkout, mas o painel continua acessível")
    void testeVencidoPausaLoja() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", true, null));
        expireTrial(m);

        assertThat(storefront(m).status()).isEqualTo(423);
        assertThat(apiGet("/api/v1/tenants/" + m.slug(), null).body().get("storeOpen").asBoolean()).isFalse();
        Res order = order(m, variation, unique("x") + "@teste.local", null, nextIp());
        assertThat(order.status()).isEqualTo(400);
        assertThat(order.raw()).contains("sem receber pedidos");

        assertThat(apiGet("/api/admin/produtos", m.token()).status()).isEqualTo(200);
        assertThat(subscription(m).get("storeOpen").asBoolean()).isFalse();
    }

    @Test
    @DisplayName("assinar cria cliente e assinatura no Asaas, com a 1ª cobrança no fim do teste")
    void assinar() throws Exception {
        Merchant m = newMerchant("SUPER");
        Res bad = apiPost("/api/admin/assinatura", m.token(), Map.of("plan", "SUPER", "cpfCnpj", "123"));
        assertThat(bad.status()).isEqualTo(400);
        assertThat(bad.raw()).contains("CPF ou CNPJ");

        Res r = apiPost("/api/admin/assinatura", m.token(), Map.of("plan", "SUPER", "cpfCnpj", "529.982.247-25"));
        assertThat(r.status()).isEqualTo(200);
        assertThat(r.body().get("invoiceUrl").asText()).isEqualTo("https://sandbox.asaas.com/i/fatura-teste");
        assertThat(r.body().get("hasSubscription").asBoolean()).isTrue();

        LocalDate trialEnd = jdbc.queryForObject("select trial_ends_at from tenants where id = ?", Timestamp.class, m.tenantId())
                .toLocalDateTime().toLocalDate();
        verify(asaas).createCustomer(eq("Lojista"), eq("52998224725"), eq(m.email()), eq(m.tenantId().toString()));
        verify(asaas).createSubscription(eq("cus_teste"), eq(new BigDecimal("40.00")), eq(trialEnd), anyString(), eq(m.tenantId().toString()));

        // Trocar de plano atualiza o valor da assinatura existente
        assertThat(apiPost("/api/admin/assinatura", m.token(), Map.of("plan", "RICH")).status()).isEqualTo(200);
        String sub = jdbc.queryForObject("select asaas_subscription_id from tenants where id = ?", String.class, m.tenantId());
        verify(asaas).updateSubscriptionValue(eq(sub), eq(new BigDecimal("70.00")), anyString());
        assertThat(subscription(m).get("plan").asText()).isEqualTo("RICH");
    }

    @Test
    @DisplayName("sem a chave do Asaas configurada, assinar dá um erro claro")
    void asaasNaoConfigurado() throws Exception {
        when(asaas.isConfigured()).thenReturn(false);
        Merchant m = newMerchant();
        Res r = apiPost("/api/admin/assinatura", m.token(), Map.of("plan", "SUPER", "cpfCnpj", "52998224725"));
        assertThat(r.status()).isEqualTo(400);
        assertThat(r.raw()).contains("ainda não foi configurada");
        verify(asaas, never()).createCustomer(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("webhook sem o token do painel do Asaas recebe 401 e não muda nada")
    void webhookSemToken() throws Exception {
        assertThat(webhook(null, "PAYMENT_RECEIVED", "pay_1").status()).isEqualTo(401);
        assertThat(webhook("token-errado", "PAYMENT_RECEIVED", "pay_1").status()).isEqualTo(401);
        verify(asaas, never()).getPayment(anyString());
    }

    @Test
    @DisplayName("pagamento confirmado na API do Asaas reabre a loja por um mês")
    void pagamentoReabreLoja() throws Exception {
        Merchant m = newMerchant();
        String sub = subscribe(m, "SUPER");
        expireTrial(m);
        assertThat(storefront(m).status()).isEqualTo(423);

        when(asaas.getPayment("pay_ok")).thenReturn(new AsaasClient.Payment("pay_ok", sub, "RECEIVED", LocalDate.now(), null));
        assertThat(webhook(WEBHOOK_TOKEN, "PAYMENT_RECEIVED", "pay_ok").status()).isEqualTo(200);
        // Reenvio do mesmo evento não estende o prazo de novo
        assertThat(webhook(WEBHOOK_TOKEN, "PAYMENT_RECEIVED", "pay_ok").status()).isEqualTo(200);

        JsonNode s = subscription(m);
        assertThat(s.get("status").asText()).isEqualTo("ACTIVE");
        assertThat(LocalDateTime.parse(s.get("paidUntil").asText()).toLocalDate()).isEqualTo(LocalDate.now().plusMonths(1));
        assertThat(storefront(m).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("o status do corpo do webhook não é aceito sem confirmar na API do Asaas")
    void webhookNaoConfiaNoCorpo() throws Exception {
        Merchant m = newMerchant();
        String sub = subscribe(m, "SUPER");
        expireTrial(m);
        when(asaas.getPayment("pay_falso")).thenReturn(new AsaasClient.Payment("pay_falso", sub, "PENDING", LocalDate.now(), null));

        assertThat(webhook(WEBHOOK_TOKEN, "PAYMENT_RECEIVED", "pay_falso").status()).isEqualTo(200);
        assertThat(storefront(m).status()).isEqualTo(423);
    }

    @Test
    @DisplayName("pagamento de outra assinatura não reabre a loja")
    void pagamentoDeOutraAssinatura() throws Exception {
        Merchant m = newMerchant();
        subscribe(m, "SUPER");
        expireTrial(m);
        when(asaas.getPayment("pay_alheio")).thenReturn(new AsaasClient.Payment("pay_alheio", "sub_de_outra_conta", "RECEIVED", LocalDate.now(), null));
        assertThat(webhook(WEBHOOK_TOKEN, "PAYMENT_RECEIVED", "pay_alheio").status()).isEqualTo(200);
        assertThat(storefront(m).status()).isEqualTo(423);
    }

    @Test
    @DisplayName("mensalidade vencida: 3 dias de tolerância, depois a loja pausa; estorno tira o mês pago")
    void atrasoEEstorno() throws Exception {
        Merchant m = newMerchant();
        String sub = subscribe(m, "SUPER");
        expireTrial(m);
        LocalDate due = LocalDate.now().minusMonths(1).minusDays(1);
        when(asaas.getPayment("pay_mes1")).thenReturn(new AsaasClient.Payment("pay_mes1", sub, "CONFIRMED", due, null));
        webhook(WEBHOOK_TOKEN, "PAYMENT_CONFIRMED", "pay_mes1");

        // Pago até ontem: ainda dentro da tolerância
        when(asaas.getPayment("pay_mes2")).thenReturn(new AsaasClient.Payment("pay_mes2", sub, "OVERDUE", LocalDate.now().minusDays(1), null));
        webhook(WEBHOOK_TOKEN, "PAYMENT_OVERDUE", "pay_mes2");
        assertThat(subscription(m).get("status").asText()).isEqualTo("PAST_DUE");
        assertThat(storefront(m).status()).isEqualTo(200);

        jdbc.update("update tenants set paid_until = now() - interval '4 days' where id = ?", m.tenantId());
        assertThat(storefront(m).status()).isEqualTo(423);

        // Estorno do mês corrente fecha a loja na hora
        Merchant n = newMerchant();
        String sub2 = subscribe(n, "SUPER");
        expireTrial(n);
        when(asaas.getPayment("pay_n")).thenReturn(new AsaasClient.Payment("pay_n", sub2, "RECEIVED", LocalDate.now(), null));
        webhook(WEBHOOK_TOKEN, "PAYMENT_RECEIVED", "pay_n");
        assertThat(storefront(n).status()).isEqualTo(200);
        when(asaas.getPayment("pay_n")).thenReturn(new AsaasClient.Payment("pay_n", sub2, "REFUNDED", LocalDate.now(), null));
        webhook(WEBHOOK_TOKEN, "PAYMENT_REFUNDED", "pay_n");
        jdbc.update("update tenants set paid_until = paid_until - interval '4 days' where id = ?", n.tenantId());
        assertThat(storefront(n).status()).isEqualTo(423);
    }

    @Test
    @DisplayName("cancelar encerra as cobranças e mantém a loja aberta até o fim do período pago")
    void cancelar() throws Exception {
        Merchant m = newMerchant();
        String sub = subscribe(m, "SUPER");
        when(asaas.getPayment("pay_c")).thenReturn(new AsaasClient.Payment("pay_c", sub, "RECEIVED", LocalDate.now(), null));
        webhook(WEBHOOK_TOKEN, "PAYMENT_RECEIVED", "pay_c");
        expireTrial(m);

        Res r = apiPost("/api/admin/assinatura/cancelar", m.token(), null);
        assertThat(r.status()).isEqualTo(200);
        verify(asaas).deleteSubscription(sub);
        assertThat(r.body().get("status").asText()).isEqualTo("CANCELED");
        assertThat(storefront(m).status()).isEqualTo(200);

        jdbc.update("update tenants set paid_until = now() - interval '1 minute' where id = ?", m.tenantId());
        assertThat(storefront(m).status()).isEqualTo(423);
    }

    @Test
    @DisplayName("comprador não acessa a assinatura da loja")
    void compradorSemAcesso() throws Exception {
        Merchant m = newMerchant();
        Customer c = newCustomer(m);
        assertThat(apiGet("/api/admin/assinatura", c.token()).status()).isEqualTo(403);
        assertThat(apiPost("/api/admin/assinatura/cancelar", c.token(), null).status()).isEqualTo(403);
        assertThat(apiGet("/api/admin/assinatura", null).status()).isIn(401, 403);
    }
}
