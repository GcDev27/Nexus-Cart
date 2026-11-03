package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("CORS, cabeçalhos e tamanho das requisições")
class HttpHardeningTest extends IntegrationTest {

    private MockHttpServletResponse preflight(String origin) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.options("/api/admin/produtos")
                .header("Origin", origin)
                .header("Access-Control-Request-Method", "GET")
                .with(r -> { r.setRemoteAddr(nextIp()); return r; })).andReturn().getResponse();
    }

    @Test
    @DisplayName("site de outra origem não pode chamar a API pelo navegador")
    void corsBloqueiaOutraOrigem() throws Exception {
        MockHttpServletResponse evil = preflight("https://site-malicioso.example.com");
        assertThat(evil.getStatus()).isEqualTo(403);
        assertThat(evil.getHeader("Access-Control-Allow-Origin")).isNull();

        MockHttpServletResponse ours = preflight("http://localhost:3000");
        assertThat(ours.getStatus()).isEqualTo(200);
        assertThat(ours.getHeader("Access-Control-Allow-Origin")).isEqualTo("http://localhost:3000");
    }

    @Test
    @DisplayName("respostas trazem cabeçalhos contra sniffing, clickjacking e cache de dados")
    void cabecalhosDeSeguranca() throws Exception {
        MockHttpServletResponse r = mvc.perform(MockMvcRequestBuilders.get("/api/v1/tenants/nao-existe")
                .with(req -> { req.setRemoteAddr(nextIp()); return req; })).andReturn().getResponse();
        assertThat(r.getHeader("X-Content-Type-Options")).isEqualTo("nosniff");
        assertThat(r.getHeader("X-Frame-Options")).isEqualTo("DENY");
        assertThat(r.getHeader("Cache-Control")).contains("no-store");
    }

    @Test
    @DisplayName("corpo maior que 5 MB é recusado com 413 antes de chegar à aplicação")
    void corpoGrandeDemais() throws Exception {
        Merchant m = newMerchant();
        String huge = "{\"logoUrl\":\"data:image/png;base64," + "A".repeat(6 * 1024 * 1024) + "\"}";
        Res r = send(MockMvcRequestBuilders.put("/api/v1/tenants/me"), m.token(), huge, nextIp());
        assertThat(r.status()).isEqualTo(413);
    }

    @Test
    @DisplayName("imagem acima do limite (mesmo abaixo de 5 MB) é recusada")
    void imagemGrandeDemais() throws Exception {
        Merchant m = newMerchant();
        String big = "{\"logoUrl\":\"data:image/png;base64," + "A".repeat(3_100_000) + "\"}";
        assertThat(send(MockMvcRequestBuilders.put("/api/v1/tenants/me"), m.token(), big, nextIp()).status()).isEqualTo(400);
    }

    @Test
    @DisplayName("excesso de requisições de um IP no webhook recebe 429")
    void limiteNoWebhook() throws Exception {
        String ip = nextIp();
        int last = 0;
        for (int i = 0; i < 125; i++) {
            last = send(MockMvcRequestBuilders.post("/api/webhooks/mercadopago?data.id=abc"), null, null, ip).status();
        }
        assertThat(last).isEqualTo(429);
    }
}
