package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Validação de entradas (XSS, injeção, abuso de tamanho)")
class InputValidationTest extends IntegrationTest {

    @ParameterizedTest
    @ValueSource(strings = {
            "javascript:alert(1)",
            "http://discord.gg/x",
            "data:text/html,<script>alert(1)</script>",
            "//evil.example.com",
            "vbscript:msgbox(1)"
    })
    @DisplayName("links de contato só aceitam https")
    void linksSoHttps(String link) throws Exception {
        Merchant m = newMerchant();
        Res r = apiPut("/api/v1/tenants/me", m.token(), Map.of("discordUrl", link));
        assertThat(r.status()).isEqualTo(400);
        assertThat(apiGet("/api/v1/tenants/" + m.slug(), null).raw()).doesNotContain(link);
    }

    @ParameterizedTest
    @ValueSource(strings = {"red", "#fff", "#12345g", "#000000; background:url(x)", "expression(alert(1))"})
    @DisplayName("cor da loja só aceita #RRGGBB (evita injeção de CSS)")
    void corSoHex(String color) throws Exception {
        Merchant m = newMerchant();
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("primaryColor", color)).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("tema e fonte só aceitam os valores conhecidos")
    void temaEFonte() throws Exception {
        Merchant m = newMerchant();
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("theme", "theme-glass\" onload=\"x")).status()).isEqualTo(400);
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("font", "Comic Sans'; drop table")).status()).isEqualTo(400);
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("theme", "theme-list", "font", "Poppins")).status()).isEqualTo(200);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+",
            "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
            "javascript:alert(1)",
            "http://inseguro.example.com/a.png",
            "file:///etc/passwd"
    })
    @DisplayName("imagens só aceitam PNG/JPG/WEBP/GIF em base64 ou https")
    void imagensSeguras(String image) throws Exception {
        Merchant m = newMerchant();
        assertThat(apiPut("/api/v1/tenants/me", m.token(), Map.of("logoUrl", image)).status()).isEqualTo(400);
        assertThat(apiPost("/api/admin/produtos", m.token(), Map.of(
                "name", "X", "slug", unique("img"), "visibility", "VISIBLE", "imageUrl", image)).status()).isEqualTo(400);
    }

    @ParameterizedTest
    @ValueSource(strings = {"../../admin", "Com Espaço", "maiúscula", "a/b", "<script>", ""})
    @DisplayName("endereço (slug) do produto só aceita letras minúsculas, números e hífen")
    void slugSeguro(String slug) throws Exception {
        Merchant m = newMerchant();
        assertThat(apiPost("/api/admin/produtos", m.token(), Map.of(
                "name", "X", "slug", slug, "visibility", "VISIBLE")).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("preço negativo, absurdo ou nome gigante são recusados")
    void limitesDeProdutoEOpcao() throws Exception {
        Merchant m = newMerchant();
        JsonNode product = newProduct(m, "AUTOMATIC_LINES", false, null);
        String url = "/api/admin/produtos/" + product.get("id").asText() + "/variacoes";

        assertThat(apiPost(url, m.token(), Map.of("name", "x", "price", -1, "deliveryType", "AUTOMATIC_LINES")).status()).isEqualTo(400);
        assertThat(apiPost(url, m.token(), Map.of("name", "x", "price", 999999999, "deliveryType", "AUTOMATIC_LINES")).status()).isEqualTo(400);
        assertThat(apiPost(url, m.token(), Map.of("name", "x".repeat(81), "price", 10, "deliveryType", "AUTOMATIC_LINES")).status()).isEqualTo(400);
        assertThat(apiPost("/api/admin/produtos", m.token(), Map.of(
                "name", "x".repeat(121), "slug", unique("p"), "visibility", "VISIBLE")).status()).isEqualTo(400);
        assertThat(apiPost("/api/admin/produtos", m.token(), Map.of(
                "name", "X", "slug", unique("p"), "visibility", "PUBLICO_PRA_TODOS")).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("lote de chaves tem limite de quantidade e de tamanho")
    void limitesDeChaves() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        List<String> many = new ArrayList<>();
        for (int i = 0; i < 1001; i++) many.add("K-" + i);

        assertThat(apiPost("/api/admin/variacoes/" + variation + "/estoque", m.token(), Map.of("lines", many)).status()).isEqualTo(400);
        assertThat(apiPost("/api/admin/variacoes/" + variation + "/estoque", m.token(),
                Map.of("lines", List.of("x".repeat(501)))).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("mensagens de chat vazias ou grandes demais são recusadas")
    void limitesDoChat() throws Exception {
        Merchant m = newMerchant();
        Customer c = newCustomer(m);
        assertThat(apiPost("/api/storefront/customer/chats/support", c.token(), Map.of("content", "   ")).status()).isEqualTo(400);
        assertThat(apiPost("/api/storefront/customer/chats/support", c.token(), Map.of("content", "x".repeat(2001))).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("texto com HTML é guardado como texto, sem ser interpretado pela API")
    void htmlNoChatViraTexto() throws Exception {
        Merchant m = newMerchant();
        Customer c = newCustomer(m);
        String payload = "<img src=x onerror=alert(1)>";
        Res r = apiPost("/api/storefront/customer/chats/support", c.token(), Map.of("content", payload));
        assertThat(r.status()).isEqualTo(201);
        // A API devolve como JSON (texto); quem exibe é o React, que escapa o conteúdo
        assertThat(r.body().at("/messages/0/content").asText()).isEqualTo(payload);
        assertThat(r.raw()).doesNotContain("<script");
    }

    @Test
    @DisplayName("SQL no campo de busca/slug não quebra nem vaza dados")
    void injecaoDeSql() throws Exception {
        Merchant m = newMerchant();
        Res r = send(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/storefront/produtos/x' OR '1'='1")
                .header("X-Tenant-Slug", m.slug() + "' OR '1'='1"), null, null, nextIp());
        assertThat(r.status()).isBetween(400, 499);
        Integer tenants = jdbc.queryForObject("select count(*) from tenants", Integer.class);
        assertThat(tenants).isPositive();
    }
}
