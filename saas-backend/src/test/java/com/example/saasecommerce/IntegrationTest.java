package com.example.saasecommerce;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.testcontainers.containers.PostgreSQLContainer;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

/**
 * Base dos testes de integração: sobe a aplicação inteira contra um Postgres real (Docker),
 * com as migrations do Flyway. Um único container é compartilhado por todas as classes.
 *
 * Cada requisição sai de um IP próprio do teste (nextIp), para os limites por IP de um teste
 * não interferirem em outro.
 */
@SpringBootTest(properties = {
        "app.ratelimit.global-per-minute=100000",
        "app.ratelimit.register-per-hour=100000",
        "app.ratelimit.login-per-10min=100000",
        "spring.jpa.show-sql=false"
})
@AutoConfigureMockMvc
public abstract class IntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    private static final AtomicInteger IP_COUNTER = new AtomicInteger(1);

    @Autowired protected MockMvc mvc;
    @Autowired protected ObjectMapper json;
    @Autowired protected JdbcTemplate jdbc;

    /** IP novo para isolar os contadores de limite de requisições. */
    protected static String nextIp() {
        int n = IP_COUNTER.getAndIncrement();
        return "10.%d.%d.%d".formatted((n >> 16) & 255, (n >> 8) & 255, n & 255);
    }

    protected static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ─── Requisições ──────────────────────────────────────────────

    protected record Res(int status, JsonNode body, String raw) {}

    protected Res send(MockHttpServletRequestBuilder request, String token, Object body, String ip) throws Exception {
        request.contentType(MediaType.APPLICATION_JSON).with(r -> {
            r.setRemoteAddr(ip);
            return r;
        });
        if (token != null) request.header("Authorization", "Bearer " + token);
        if (body != null) request.content(body instanceof String s ? s : json.writeValueAsString(body));
        MvcResult result = mvc.perform(request).andReturn();
        String raw = result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        JsonNode node = raw.isBlank() ? json.nullNode() : safeParse(raw);
        return new Res(result.getResponse().getStatus(), node, raw);
    }

    private JsonNode safeParse(String raw) {
        try {
            return json.readTree(raw);
        } catch (Exception e) {
            return json.nullNode();
        }
    }

    protected Res apiGet(String url, String token) throws Exception {
        return send(MockMvcRequestBuilders.get(url), token, null, nextIp());
    }

    protected Res apiPost(String url, String token, Object body) throws Exception {
        return send(MockMvcRequestBuilders.post(url), token, body, nextIp());
    }

    protected Res apiPut(String url, String token, Object body) throws Exception {
        return send(MockMvcRequestBuilders.put(url), token, body, nextIp());
    }

    protected Res apiDelete(String url, String token) throws Exception {
        return send(MockMvcRequestBuilders.delete(url), token, null, nextIp());
    }

    // ─── Cenários ─────────────────────────────────────────────────

    protected record Merchant(String token, String slug, UUID tenantId, String email, String password) {}

    protected record Customer(String token, UUID id, String email) {}

    protected Merchant newMerchant() throws Exception {
        String email = unique("lojista") + "@teste.local";
        String password = "Senha-forte-123";
        Res reg = apiPost("/api/auth/register", null, Map.of(
                "name", "Lojista", "email", email, "password", password, "storeName", unique("Loja")));
        if (reg.status() != 200) throw new IllegalStateException("cadastro do lojista falhou: " + reg.raw());
        String token = reg.body().get("token").asText();
        JsonNode me = apiGet("/api/v1/tenants/me", token).body();
        return new Merchant(token, me.get("slug").asText(), UUID.fromString(me.get("id").asText()), email, password);
    }

    protected Customer newCustomer(Merchant store) throws Exception {
        String email = unique("comprador") + "@teste.local";
        Res reg = send(MockMvcRequestBuilders.post("/api/storefront/customer/register?storeSlug=" + store.slug()), null,
                Map.of("name", "Comprador", "email", email, "password", "Senha-forte-123"), nextIp());
        if (reg.status() != 201) throw new IllegalStateException("cadastro do comprador falhou: " + reg.raw());
        return new Customer(reg.body().get("token").asText(), UUID.fromString(reg.body().at("/customer/id").asText()), email);
    }

    /** Produto com uma opção; devolve o JSON do produto criado. */
    protected JsonNode newProduct(Merchant m, String deliveryType, boolean unlimited, Integer stockQuantity) throws Exception {
        Map<String, Object> variation = new java.util.HashMap<>();
        variation.put("name", "Padrão");
        variation.put("price", 19.9);
        variation.put("deliveryType", deliveryType);
        variation.put("hasUnlimitedStock", unlimited);
        variation.put("stockQuantity", stockQuantity);
        variation.put("chatInitialMessage", "Combine a entrega pelo chat.");
        Res res = apiPost("/api/admin/produtos", m.token(), Map.of(
                "name", "Produto teste", "slug", unique("produto"), "visibility", "VISIBLE",
                "variations", List.of(variation)));
        if (res.status() != 201) throw new IllegalStateException("produto falhou: " + res.raw());
        return res.body();
    }

    protected String variationId(JsonNode product) {
        return product.at("/variations/0/id").asText();
    }

    protected void addKeys(Merchant m, String variationId, String... keys) throws Exception {
        Res res = apiPost("/api/admin/variacoes/" + variationId + "/estoque", m.token(), Map.of("lines", List.of(keys)));
        if (res.status() != 201) throw new IllegalStateException("estoque falhou: " + res.raw());
    }

    protected Res order(Merchant store, String variationId, String email, String customerToken, String ip) throws Exception {
        return send(MockMvcRequestBuilders.post("/api/checkout/orders"), customerToken, Map.of(
                "tenantSlug", store.slug(), "variationId", variationId,
                "customerName", "Comprador", "customerEmail", email), ip);
    }

    protected Res approve(Merchant m, String orderId) throws Exception {
        return apiPost("/api/admin/orders/" + orderId + "/simulate-approval", m.token(), null);
    }
}
