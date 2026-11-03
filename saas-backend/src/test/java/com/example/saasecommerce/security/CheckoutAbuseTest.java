package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import com.example.saasecommerce.service.OrderCheckoutService;
import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Abuso no checkout (estoque, excesso de pedidos, entrega dupla)")
class CheckoutAbuseTest extends IntegrationTest {

    @Autowired OrderCheckoutService checkoutService;

    private String orderId(Res r) {
        return r.body().get("orderId").asText();
    }

    @Test
    @DisplayName("com 1 chave, o segundo comprador recebe 'sem estoque' (chave reservada)")
    void reservaImpedeVendaDupla() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        addKeys(m, variation, "UNICA-CHAVE");

        assertThat(order(m, variation, unique("a") + "@teste.local", null, nextIp()).status()).isEqualTo(201);
        Res second = order(m, variation, unique("b") + "@teste.local", null, nextIp());
        assertThat(second.status()).isEqualTo(400);
        assertThat(second.raw()).contains("sem estoque");
    }

    @Test
    @DisplayName("pedidos simultâneos nunca reservam mais chaves do que existem")
    void concorrenciaNaoVendeDemais() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        addKeys(m, variation, "K1", "K2", "K3");

        ExecutorService pool = Executors.newFixedThreadPool(10);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            results.add(pool.submit(() -> order(m, variation, unique("c") + "@teste.local", null, nextIp()).status()));
        }
        int ok = 0;
        for (Future<Integer> f : results) if (f.get() == 201) ok++;
        pool.shutdown();

        assertThat(ok).isEqualTo(3);
        Integer reserved = jdbc.queryForObject(
                "select count(distinct reserved_order_id) from stock_lines where variation_id = cast(? as uuid)", Integer.class, variation);
        assertThat(reserved).isEqualTo(3);
    }

    @Test
    @DisplayName("o mesmo e-mail não acumula mais de 3 Pix em aberto")
    void limiteDePendentesPorEmail() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", true, null));
        String email = unique("acumulador") + "@teste.local";

        for (int i = 0; i < 3; i++) {
            assertThat(order(m, variation, email, null, nextIp()).status()).isEqualTo(201);
        }
        Res fourth = order(m, variation, email.toUpperCase(), null, nextIp());
        assertThat(fourth.status()).isEqualTo(400);
        assertThat(fourth.raw()).contains("aguardando pagamento");
    }

    @Test
    @DisplayName("muitos pedidos do mesmo IP recebem 429")
    void limiteDeCheckoutPorIp() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", true, null));
        String ip = nextIp();

        for (int i = 0; i < 10; i++) {
            assertThat(order(m, variation, unique("ip") + "@teste.local", null, ip).status()).isEqualTo(201);
        }
        Res blocked = order(m, variation, unique("ip") + "@teste.local", null, ip);
        assertThat(blocked.status()).isEqualTo(429);
        // Outro IP continua comprando normalmente
        assertThat(order(m, variation, unique("ip") + "@teste.local", null, nextIp()).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("aprovar o mesmo pedido duas vezes entrega uma chave só")
    void aprovacaoDuplaEntregaUmaVez() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        addKeys(m, variation, "CHAVE-1", "CHAVE-2");
        String id = orderId(order(m, variation, unique("d") + "@teste.local", null, nextIp()));

        assertThat(approve(m, id).status()).isEqualTo(200);
        assertThat(approve(m, id).status()).isEqualTo(200);

        Integer delivered = jdbc.queryForObject(
                "select count(*) from stock_lines where variation_id = cast(? as uuid) and is_delivered", Integer.class, variation);
        assertThat(delivered).isEqualTo(1);
        assertThat(apiGet("/api/checkout/orders/" + id + "/status", null).body().get("status").asText()).isEqualTo("PAID");
    }

    @Test
    @DisplayName("Pix vencido expira o pedido e devolve a chave ao estoque")
    void pedidoVencidoExpira() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        addKeys(m, variation, "CHAVE-EXPIRA");
        String id = orderId(order(m, variation, unique("e") + "@teste.local", null, nextIp()));
        assertThat(order(m, variation, unique("f") + "@teste.local", null, nextIp()).status()).isEqualTo(400);

        jdbc.update("update orders set created_at = now() - interval '2 hours' where id = cast(? as uuid)", id);
        jdbc.update("update stock_lines set reserved_until = now() - interval '1 hour' where reserved_order_id = cast(? as uuid)", id);
        checkoutService.expireStalePendingOrders();

        assertThat(jdbc.queryForObject("select status from orders where id = cast(? as uuid)", String.class, id)).isEqualTo("EXPIRED");
        assertThat(jdbc.queryForObject("select count(*) from stock_lines where reserved_order_id = cast(? as uuid)",
                Integer.class, id)).isZero();
        // Pedido expirado não pode mais ser aprovado
        approve(m, id);
        assertThat(jdbc.queryForObject("select status from orders where id = cast(? as uuid)", String.class, id)).isEqualTo("EXPIRED");
        // E a chave volta a ser vendável
        assertThat(order(m, variation, unique("g") + "@teste.local", null, nextIp()).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("entrega manual pelo chat exige conta na loja")
    void entregaManualExigeLogin() throws Exception {
        Merchant m = newMerchant();
        JsonNode product = newProduct(m, "MANUAL_CHAT", false, 5);
        Res anonymous = order(m, variationId(product), unique("h") + "@teste.local", null, nextIp());
        assertThat(anonymous.status()).isEqualTo(400);

        Customer c = newCustomer(m);
        assertThat(order(m, variationId(product), c.email(), c.token(), nextIp()).status()).isEqualTo(201);
    }

    @Test
    @DisplayName("opção ou loja inexistente dá erro claro, sem 500")
    void idsInexistentes() throws Exception {
        Merchant m = newMerchant();
        assertThat(order(m, UUID.randomUUID().toString(), "x@teste.local", null, nextIp()).status()).isEqualTo(400);
        Res noStore = send(MockMvcRequestBuilders.post("/api/checkout/orders"), null, java.util.Map.of(
                "tenantSlug", "loja-que-nao-existe-" + UUID.randomUUID(), "variationId", UUID.randomUUID().toString(),
                "customerName", "X", "customerEmail", "x@teste.local"), nextIp());
        assertThat(noStore.status()).isEqualTo(400);
        assertThat(order(m, "nao-e-uuid", "x@teste.local", null, nextIp()).status()).isEqualTo(400);
    }
}
