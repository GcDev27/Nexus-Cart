package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

/** Como em produção: sem o Pix de teste ligado. */
@TestPropertySource(properties = "app.payments.allow-simulated=false")
@DisplayName("Produção: sem pagamento simulado")
class RealPaymentsOnlyTest extends IntegrationTest {

    @Test
    @DisplayName("loja sem Mercado Pago configurado não aceita pedidos")
    void semGatewayNaoVende() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", true, null));
        Res r = order(m, variation, unique("x") + "@teste.local", null, nextIp());
        assertThat(r.status()).isEqualTo(400);
        assertThat(r.raw()).contains("ainda não está recebendo pagamentos");
    }

    @Test
    @DisplayName("lojista não consegue aprovar pedido 'na mão' para receber a chave de graça")
    void aprovacaoDeTesteDesligada() throws Exception {
        Merchant m = newMerchant();
        String variation = variationId(newProduct(m, "AUTOMATIC_LINES", false, null));
        addKeys(m, variation, "CHAVE");
        jdbc.update("""
                insert into orders (id, amount, created_at, customer_email, customer_name, product_id, product_name, status, tenant_id, variation_id, variation_name)
                select gen_random_uuid(), 19.90, now(), 'x@teste.local', 'X', p.id, p.name, 'PENDING', p.tenant_id, v.id, v.name
                from variations v join products p on p.id = v.product_id where v.id = cast(? as uuid)""", variation);
        String id = jdbc.queryForObject("select cast(id as text) from orders where variation_id = cast(? as uuid)", String.class, variation);

        assertThat(approve(m, id).status()).isEqualTo(400);
        assertThat(jdbc.queryForObject("select status from orders where id = cast(? as uuid)", String.class, id)).isEqualTo("PENDING");
    }
}
