package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Vazamento de dados")
class DataLeakTest extends IntegrationTest {

    private Res storefront(String slug, String path) throws Exception {
        return send(MockMvcRequestBuilders.get("/api/storefront/produtos" + path).header("X-Tenant-Slug", slug), null, null, nextIp());
    }

    @Test
    @DisplayName("vitrine pública não devolve o conteúdo das chaves, só a quantidade")
    void vitrineSemChaves() throws Exception {
        Merchant m = newMerchant();
        JsonNode product = newProduct(m, "AUTOMATIC_LINES", false, null);
        addKeys(m, variationId(product), "CHAVE-SECRETA-0001", "CHAVE-SECRETA-0002");

        Res list = storefront(m.slug(), "");
        Res detail = storefront(m.slug(), "/" + product.get("slug").asText());

        for (Res r : new Res[]{list, detail}) {
            assertThat(r.status()).isEqualTo(200);
            assertThat(r.raw()).doesNotContain("CHAVE-SECRETA").doesNotContain("stockLines");
        }
        assertThat(detail.body().at("/variations/0/availableStockCount").asInt()).isEqualTo(2);
    }

    @Test
    @DisplayName("produto oculto não aparece na vitrine nem pelo link direto")
    void produtoOculto() throws Exception {
        Merchant m = newMerchant();
        String slug = unique("oculto");
        apiPost("/api/admin/produtos", m.token(), Map.of("name", "Oculto", "slug", slug, "visibility", "HIDDEN"));

        assertThat(storefront(m.slug(), "").raw()).doesNotContain(slug);
        assertThat(storefront(m.slug(), "/" + slug).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("checkout e consulta pública do pedido não expõem nome, e-mail ou CPF")
    void pedidoPublicoSemDadosPessoais() throws Exception {
        Merchant m = newMerchant();
        JsonNode product = newProduct(m, "AUTOMATIC_LINES", true, null);
        Res created = send(MockMvcRequestBuilders.post("/api/checkout/orders"), null, Map.of(
                "tenantSlug", m.slug(), "variationId", variationId(product),
                "customerName", "Fulano Sigiloso", "customerEmail", "sigilo@teste.local", "customerCpf", "123.456.789-09"), nextIp());
        String orderId = created.body().get("orderId").asText();
        Res status = apiGet("/api/checkout/orders/" + orderId + "/status", null);

        for (Res r : new Res[]{created, status}) {
            assertThat(r.raw()).doesNotContain("Fulano Sigiloso").doesNotContain("sigilo@teste.local").doesNotContain("123.456.789-09");
        }
        // O lojista continua vendo os dados do comprador
        assertThat(apiGet("/api/admin/orders/" + orderId, m.token()).raw()).contains("sigilo@teste.local");
    }

    @Test
    @DisplayName("Access Token do gateway fica criptografado no banco e mascarado na API")
    void tokenDoGatewayProtegido() throws Exception {
        Merchant m = newMerchant();
        String secret = "APP_USR-1234567890-token-muito-secreto";
        assertThat(apiPut("/api/admin/gateways/MERCADO_PAGO", m.token(), Map.of(
                "enabled", false, "clientSecret", secret, "webhookSecret", "assinatura-webhook-secreta")).status()).isEqualTo(200);

        String stored = jdbc.queryForObject(
                "select client_secret from payment_gateway_configs where tenant_id = ? and provider = 'MERCADO_PAGO'", String.class, m.tenantId());
        String storedWebhook = jdbc.queryForObject(
                "select webhook_secret from payment_gateway_configs where tenant_id = ? and provider = 'MERCADO_PAGO'", String.class, m.tenantId());
        assertThat(stored).startsWith("enc:v1:").doesNotContain("token-muito-secreto");
        assertThat(storedWebhook).startsWith("enc:v1:").doesNotContain("assinatura");

        Res api = apiGet("/api/admin/gateways", m.token());
        assertThat(api.raw()).doesNotContain("token-muito-secreto").doesNotContain("assinatura-webhook-secreta");
        assertThat(api.raw()).contains("\"hasWebhookSecret\":true");
    }

    @Test
    @DisplayName("nenhuma resposta devolve hash de senha")
    void semHashDeSenha() throws Exception {
        Merchant m = newMerchant();
        Customer c = newCustomer(m);
        String hash = jdbc.queryForObject("select password from customers where id = ?", String.class, c.id());

        String[] responses = {
                apiGet("/api/admin/customers", m.token()).raw(),
                apiGet("/api/admin/customers/" + c.id(), m.token()).raw(),
                apiGet("/api/storefront/customer/me", c.token()).raw(),
                apiGet("/api/v1/tenants/me", m.token()).raw(),
        };
        for (String body : responses) {
            assertThat(body).doesNotContain(hash).doesNotContain("\"password\"");
        }
    }

    @Test
    @DisplayName("erros não expõem stack trace nem detalhes internos")
    void errosSemDetalhesInternos() throws Exception {
        Merchant m = newMerchant();
        Res malformed = send(MockMvcRequestBuilders.post("/api/admin/produtos"), m.token(), "{ isto não é json", nextIp());
        Res badUuid = apiGet("/api/admin/produtos/nao-e-um-uuid", m.token());

        for (Res r : new Res[]{malformed, badUuid}) {
            assertThat(r.status()).isBetween(400, 499);
            assertThat(r.raw()).doesNotContain("Exception").doesNotContain("at com.").doesNotContain("org.springframework").doesNotContain("trace");
        }
    }

    @Test
    @DisplayName("dados públicos da loja não incluem token do gateway nem dados do dono")
    void dadosPublicosDaLoja() throws Exception {
        Merchant m = newMerchant();
        apiPut("/api/admin/gateways/MERCADO_PAGO", m.token(), Map.of("enabled", false, "clientSecret", "APP_USR-segredo-publico"));
        Res pub = apiGet("/api/v1/tenants/" + m.slug(), null);
        assertThat(pub.status()).isEqualTo(200);
        assertThat(pub.raw()).doesNotContain("APP_USR").doesNotContain(m.email());
    }
}
