package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Uma loja nunca pode ler ou alterar dados de outra, e um comprador nunca vê dados de outro.
 * Para "não é seu" a API responde igual a "não existe", sem confirmar que o recurso existe.
 */
@DisplayName("Isolamento entre lojas e entre compradores")
class TenantIsolationTest extends IntegrationTest {

    @Test
    @DisplayName("lojista B não lê, altera nem apaga produto da loja A")
    void produtoDeOutraLoja() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        JsonNode product = newProduct(a, "AUTOMATIC_LINES", false, null);
        String id = product.get("id").asText();

        assertThat(apiGet("/api/admin/produtos/" + id, b.token()).status()).isEqualTo(400);
        assertThat(apiPut("/api/admin/produtos/" + id, b.token(), Map.of(
                "name", "Hackeado", "slug", "hackeado", "visibility", "VISIBLE")).status()).isEqualTo(400);
        assertThat(apiDelete("/api/admin/produtos/" + id, b.token()).status()).isEqualTo(400);

        JsonNode still = apiGet("/api/admin/produtos/" + id, a.token()).body();
        assertThat(still.get("name").asText()).isEqualTo("Produto teste");
        assertThat(apiGet("/api/admin/produtos", b.token()).body().toString()).doesNotContain(id);
    }

    @Test
    @DisplayName("lojista B não mexe nas opções nem nas chaves da loja A")
    void opcoesEChavesDeOutraLoja() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        JsonNode product = newProduct(a, "AUTOMATIC_LINES", false, null);
        String variation = variationId(product);
        addKeys(a, variation, "SEGREDO-DA-LOJA-A");

        Res list = apiGet("/api/admin/variacoes/" + variation + "/estoque", b.token());
        assertThat(list.status()).isEqualTo(400);
        assertThat(list.raw()).doesNotContain("SEGREDO-DA-LOJA-A");

        assertThat(apiPost("/api/admin/variacoes/" + variation + "/estoque", b.token(),
                Map.of("lines", List.of("chave-intrusa"))).status()).isEqualTo(400);
        assertThat(apiPut("/api/admin/variacoes/" + variation, b.token(), Map.of(
                "name", "x", "price", 0.01, "deliveryType", "AUTOMATIC_LINES")).status()).isEqualTo(400);
        assertThat(apiDelete("/api/admin/variacoes/" + variation, b.token()).status()).isEqualTo(400);
        assertThat(apiPost("/api/admin/produtos/" + product.get("id").asText() + "/variacoes", b.token(), Map.of(
                "name", "x", "price", 1, "deliveryType", "AUTOMATIC_LINES")).status()).isEqualTo(400);

        String lineId = apiGet("/api/admin/variacoes/" + variation + "/estoque", a.token()).body().get(0).get("id").asText();
        assertThat(apiDelete("/api/admin/estoque/" + lineId, b.token()).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("lojista B não vê nem aprova pedidos da loja A")
    void pedidosDeOutraLoja() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        JsonNode product = newProduct(a, "AUTOMATIC_LINES", true, null);
        String orderId = order(a, variationId(product), "x@teste.local", null, nextIp()).body().get("orderId").asText();

        assertThat(apiGet("/api/admin/orders/" + orderId, b.token()).status()).isEqualTo(400);
        assertThat(approve(b, orderId).status()).isEqualTo(400);
        assertThat(apiGet("/api/admin/orders", b.token()).raw()).doesNotContain(orderId);
        assertThat(apiGet("/api/admin/orders/" + orderId, a.token()).body().get("status").asText()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("lojista B não vê clientes nem conversas da loja A")
    void clientesEConversasDeOutraLoja() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        Customer c = newCustomer(a);
        String thread = apiPost("/api/storefront/customer/chats/support", c.token(),
                Map.of("content", "mensagem privada")).body().at("/thread/id").asText();

        assertThat(apiGet("/api/admin/customers/" + c.id(), b.token()).status()).isEqualTo(400);
        assertThat(apiGet("/api/admin/customers", b.token()).raw()).doesNotContain(c.email());
        assertThat(apiGet("/api/admin/chats/" + thread, b.token()).status()).isEqualTo(400);
        assertThat(apiPost("/api/admin/chats/" + thread + "/messages", b.token(), Map.of("content", "oi")).status()).isEqualTo(400);
        assertThat(apiGet("/api/admin/chats", b.token()).raw()).doesNotContain(thread);
    }

    @Test
    @DisplayName("comprador não lê nem escreve na conversa de outro comprador")
    void conversaDeOutroComprador() throws Exception {
        Merchant m = newMerchant();
        Customer dono = newCustomer(m);
        Customer intruso = newCustomer(m);
        String thread = apiPost("/api/storefront/customer/chats/support", dono.token(),
                Map.of("content", "meu CPF é 123")).body().at("/thread/id").asText();

        Res read = apiGet("/api/storefront/customer/chats/" + thread, intruso.token());
        assertThat(read.status()).isEqualTo(400);
        assertThat(read.raw()).doesNotContain("meu CPF");
        assertThat(apiPost("/api/storefront/customer/chats/" + thread + "/messages", intruso.token(),
                Map.of("content", "oi")).status()).isEqualTo(400);
        assertThat(apiGet("/api/storefront/customer/chats", intruso.token()).raw()).doesNotContain(thread);
    }

    @Test
    @DisplayName("comprador não vê os pedidos de outro comprador")
    void pedidosDeOutroComprador() throws Exception {
        Merchant m = newMerchant();
        Customer dono = newCustomer(m);
        Customer outro = newCustomer(m);
        JsonNode product = newProduct(m, "AUTOMATIC_LINES", true, null);
        String orderId = order(m, variationId(product), dono.email(), dono.token(), nextIp()).body().get("orderId").asText();

        assertThat(apiGet("/api/storefront/customer/orders", outro.token()).raw()).doesNotContain(orderId);
        assertThat(apiGet("/api/storefront/customer/orders", dono.token()).raw()).contains(orderId);
    }

    @Test
    @DisplayName("criar produto mandando id e tenantId de outra loja não sobrescreve nada")
    void atribuicaoEmMassa() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        JsonNode victim = newProduct(a, "AUTOMATIC_LINES", false, null);

        Res attack = apiPost("/api/admin/produtos", b.token(), Map.of(
                "id", victim.get("id").asText(),
                "tenantId", a.tenantId().toString(),
                "name", "Produto roubado", "slug", unique("roubado"), "visibility", "VISIBLE"));

        assertThat(attack.status()).isEqualTo(201);
        assertThat(attack.body().get("id").asText()).isNotEqualTo(victim.get("id").asText());
        assertThat(attack.body().get("tenantId").asText()).isEqualTo(b.tenantId().toString());

        JsonNode untouched = apiGet("/api/admin/produtos/" + victim.get("id").asText(), a.token()).body();
        assertThat(untouched.get("name").asText()).isEqualTo("Produto teste");
        assertThat(untouched.get("tenantId").asText()).isEqualTo(a.tenantId().toString());
    }

    @Test
    @DisplayName("sessão de comprador da loja A não vale na loja B")
    void compradorDeOutraLojaNoCheckout() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        Customer daLojaA = newCustomer(a);
        JsonNode product = newProduct(b, "AUTOMATIC_LINES", true, null);

        Res r = order(b, variationId(product), daLojaA.email(), daLojaA.token(), nextIp());
        assertThat(r.status()).isEqualTo(201);
        String customerId = jdbc.queryForObject(
                "select cast(customer_id as text) from orders where id = cast(? as uuid)", String.class, r.body().get("orderId").asText());
        assertThat(customerId).isNull();
    }

    @Test
    @DisplayName("não dá para comprar a opção de uma loja pelo endereço de outra")
    void opcaoDeOutraLoja() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        JsonNode product = newProduct(a, "AUTOMATIC_LINES", true, null);

        Res r = order(b, variationId(product), "x@teste.local", null, nextIp());
        assertThat(r.status()).isEqualTo(400);
    }
}
