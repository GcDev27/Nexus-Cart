package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import com.example.saasecommerce.service.MercadoPagoWebhookVerifier;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Webhook do Mercado Pago")
class WebhookSecurityTest extends IntegrationTest {

    private static final String SECRET = "assinatura-do-painel-mp";
    private static final Clock NOW = Clock.fixed(Instant.ofEpochSecond(1_800_000_000L), ZoneOffset.UTC);

    @Test
    @DisplayName("verificador aceita assinatura correta e recusa adulterada, de outro segredo ou antiga")
    void verificador() throws Exception {
        String ts = String.valueOf(NOW.instant().getEpochSecond());
        String good = MercadoPagoWebhookVerifier.sign(SECRET, "123456", "req-1", ts);

        assertThat(MercadoPagoWebhookVerifier.isValid(SECRET, good, "req-1", "123456", NOW)).isTrue();
        assertThat(MercadoPagoWebhookVerifier.isValid(SECRET, good, "req-1", "999999", NOW)).isFalse();
        assertThat(MercadoPagoWebhookVerifier.isValid(SECRET, good, "req-2", "123456", NOW)).isFalse();
        assertThat(MercadoPagoWebhookVerifier.isValid("outro-segredo", good, "req-1", "123456", NOW)).isFalse();
        assertThat(MercadoPagoWebhookVerifier.isValid(SECRET, null, "req-1", "123456", NOW)).isFalse();
        assertThat(MercadoPagoWebhookVerifier.isValid(SECRET, "lixo", "req-1", "123456", NOW)).isFalse();

        // Reenvio de uma notificação capturada há mais de 10 minutos
        String old = MercadoPagoWebhookVerifier.sign(SECRET, "123456", "req-1", String.valueOf(NOW.instant().getEpochSecond() - 3600));
        assertThat(MercadoPagoWebhookVerifier.isValid(SECRET, old, "req-1", "123456", NOW)).isFalse();
    }

    private Res webhook(String paymentId, String signature, String requestId) throws Exception {
        var req = MockMvcRequestBuilders.post("/api/webhooks/mercadopago?type=payment&data.id=" + paymentId);
        if (signature != null) req.header("x-signature", signature);
        if (requestId != null) req.header("x-request-id", requestId);
        return send(req, null, Map.of("action", "payment.updated", "data", Map.of("id", paymentId), "status", "approved"), nextIp());
    }

    @Test
    @DisplayName("IDs que não são de pagamento são ignorados sem erro")
    void idsInvalidos() throws Exception {
        assertThat(webhook("1;drop table orders", null, null).status()).isEqualTo(200);
        assertThat(webhook("abc", null, null).status()).isEqualTo(200);
        assertThat(webhook("99999999999", null, null).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("com segredo cadastrado, notificação sem assinatura válida recebe 401 e não aprova nada")
    void assinaturaObrigatoria() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        addKeys(m, variation, "CHAVE-WEBHOOK");
        String orderId = order(m, variation, unique("w") + "@teste.local", null, nextIp()).body().get("orderId").asText();
        String paymentId = String.valueOf(System.nanoTime());
        jdbc.update("update orders set external_payment_id = ?, payment_provider = 'MERCADO_PAGO' where id = cast(? as uuid)", paymentId, orderId);
        assertThat(apiPut("/api/admin/gateways/MERCADO_PAGO", m.token(), Map.of("enabled", false, "webhookSecret", SECRET)).status()).isEqualTo(200);

        assertThat(webhook(paymentId, null, null).status()).isEqualTo(401);
        assertThat(webhook(paymentId, MercadoPagoWebhookVerifier.sign("chute", paymentId, "r", String.valueOf(Instant.now().getEpochSecond())), "r").status())
                .isEqualTo(401);

        // Assinatura válida passa, mas o status "approved" do corpo não é aceito sem confirmar na API do Mercado Pago
        String ts = String.valueOf(Instant.now().getEpochSecond());
        assertThat(webhook(paymentId, MercadoPagoWebhookVerifier.sign(SECRET, paymentId, "r", ts), "r").status()).isEqualTo(200);
        assertThat(jdbc.queryForObject("select status from orders where id = cast(? as uuid)", String.class, orderId)).isEqualTo("PENDING");
        assertThat(jdbc.queryForObject("select count(*) from stock_lines where variation_id = cast(? as uuid) and is_delivered",
                Integer.class, variation)).isZero();
    }
}
