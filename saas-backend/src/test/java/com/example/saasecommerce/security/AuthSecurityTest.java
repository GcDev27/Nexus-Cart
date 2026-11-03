package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

@DisplayName("Autenticação e controle de acesso")
class AuthSecurityTest extends IntegrationTest {

    @Value("${api.security.token.secret}")
    String jwtSecret;

    private SecretKey realKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    @Test
    @DisplayName("rotas do admin exigem login")
    void adminSemToken() throws Exception {
        assertThat(apiGet("/api/admin/produtos", null).status()).isIn(401, 403);
        assertThat(apiGet("/api/admin/orders", null).status()).isIn(401, 403);
        assertThat(apiGet("/api/admin/chats", null).status()).isIn(401, 403);
        assertThat(apiPut("/api/v1/tenants/me", null, Map.of("name", "Invasor")).status()).isIn(401, 403);
    }

    @Test
    @DisplayName("token de comprador não entra no admin e token de lojista não entra na área do comprador")
    void papeisSeparados() throws Exception {
        Merchant m = newMerchant();
        Customer c = newCustomer(m);

        assertThat(apiGet("/api/admin/produtos", c.token()).status()).isEqualTo(403);
        assertThat(apiGet("/api/admin/orders", c.token()).status()).isEqualTo(403);
        assertThat(apiGet("/api/admin/chats", c.token()).status()).isEqualTo(403);

        assertThat(apiGet("/api/storefront/customer/chats", m.token()).status()).isEqualTo(403);
        assertThat(apiGet("/api/storefront/customer/orders", m.token()).status()).isEqualTo(403);
    }

    @Test
    @DisplayName("token com o conteúdo alterado é recusado")
    void tokenAdulterado() throws Exception {
        Merchant m = newMerchant();
        String[] parts = m.token().split("\\.");
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8)
                .replace(m.tenantId().toString(), "00000000-0000-0000-0000-000000000000");
        String forged = parts[0] + "." + Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8)) + "." + parts[2];

        assertThat(apiGet("/api/admin/produtos", forged).status()).isIn(401, 403);
    }

    @Test
    @DisplayName("token assinado com outro segredo é recusado")
    void tokenOutroSegredo() throws Exception {
        Merchant m = newMerchant();
        SecretKey otherKey = Keys.hmacShaKeyFor(new byte[48]);
        String forged = Jwts.builder().subject(m.email())
                .claims(Map.of("tenantId", m.tenantId().toString(), "role", "ROLE_USER"))
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(otherKey).compact();

        assertThat(apiGet("/api/admin/produtos", forged).status()).isIn(401, 403);
    }

    @Test
    @DisplayName("token sem assinatura (alg: none) é recusado")
    void tokenSemAssinatura() throws Exception {
        Merchant m = newMerchant();
        String header = Base64.getUrlEncoder().withoutPadding().encodeToString("{\"alg\":\"none\"}".getBytes());
        String body = Base64.getUrlEncoder().withoutPadding().encodeToString(
                ("{\"sub\":\"" + m.email() + "\",\"role\":\"ROLE_USER\",\"exp\":" + (System.currentTimeMillis() / 1000 + 600) + "}").getBytes());
        String unsigned = header + "." + body + ".";

        assertThat(apiGet("/api/admin/produtos", unsigned).status()).isIn(401, 403);
    }

    @Test
    @DisplayName("token expirado é recusado")
    void tokenExpirado() throws Exception {
        Merchant m = newMerchant();
        String expired = Jwts.builder().subject(m.email())
                .claims(Map.of("tenantId", m.tenantId().toString(), "role", "ROLE_USER"))
                .issuedAt(new Date(System.currentTimeMillis() - 7_200_000))
                .expiration(new Date(System.currentTimeMillis() - 3_600_000))
                .signWith(realKey()).compact();

        assertThat(apiGet("/api/admin/produtos", expired).status()).isIn(401, 403);
    }

    @Test
    @DisplayName("lixo no cabeçalho Authorization não derruba o servidor")
    void tokenInvalido() throws Exception {
        for (String garbage : new String[]{"null", "undefined", "a.b.c", "%%%", "x".repeat(5000)}) {
            assertThat(apiGet("/api/admin/produtos", garbage).status()).isIn(401, 403);
        }
    }

    @Test
    @DisplayName("senha errada repetida bloqueia o login daquele e-mail (429)")
    void limiteDeLogin() throws Exception {
        Merchant m = newMerchant();
        for (int i = 0; i < 8; i++) {
            Res r = apiPost("/api/auth/login", null, Map.of("email", m.email(), "password", "errada-" + i));
            assertThat(r.status()).isEqualTo(400);
        }
        // Nem a senha certa passa enquanto o bloqueio está ativo
        Res blocked = apiPost("/api/auth/login", null, Map.of("email", m.email(), "password", m.password()));
        assertThat(blocked.status()).isEqualTo(429);
    }

    @Test
    @DisplayName("login não revela se o e-mail existe")
    void loginSemEnumeracao() throws Exception {
        Merchant m = newMerchant();
        Res wrongPassword = apiPost("/api/auth/login", null, Map.of("email", m.email(), "password", "errada-123"));
        Res unknownEmail = apiPost("/api/auth/login", null, Map.of("email", unique("ninguem") + "@teste.local", "password", "errada-123"));
        assertThat(wrongPassword.status()).isEqualTo(unknownEmail.status());
        assertThat(wrongPassword.body().get("error").asText()).isEqualTo(unknownEmail.body().get("error").asText());
    }

    @Test
    @DisplayName("senha curta é recusada no cadastro de lojista e de comprador")
    void senhaFraca() throws Exception {
        Res merchant = apiPost("/api/auth/register", null, Map.of(
                "name", "X", "email", unique("x") + "@teste.local", "password", "1234567", "storeName", unique("Loja")));
        assertThat(merchant.status()).isEqualTo(400);

        Merchant m = newMerchant();
        Res customer = send(MockMvcRequestBuilders.post("/api/storefront/customer/register?storeSlug=" + m.slug()), null,
                Map.of("name", "X", "email", unique("x") + "@teste.local", "password", "curta"), nextIp());
        assertThat(customer.status()).isEqualTo(400);
    }

    @Test
    @DisplayName("e-mail repetido no cadastro dá erro claro, sem 500")
    void emailRepetido() throws Exception {
        Merchant m = newMerchant();
        Res again = apiPost("/api/auth/register", null, Map.of(
                "name", "X", "email", m.email(), "password", "Senha-forte-123", "storeName", unique("Loja")));
        assertThat(again.status()).isEqualTo(400);
        assertThat(again.body().get("error").asText()).contains("e-mail");
    }

    @Test
    @DisplayName("nome de loja repetido gera outro endereço em vez de falhar")
    void nomeDeLojaRepetido() throws Exception {
        String storeName = unique("Mesma Loja");
        Res a = apiPost("/api/auth/register", null, Map.of("name", "A", "email", unique("a") + "@teste.local", "password", "Senha-forte-123", "storeName", storeName));
        Res b = apiPost("/api/auth/register", null, Map.of("name", "B", "email", unique("b") + "@teste.local", "password", "Senha-forte-123", "storeName", storeName));
        assertThat(a.status()).isEqualTo(200);
        assertThat(b.status()).isEqualTo(200);
        String slugA = apiGet("/api/v1/tenants/me", a.body().get("token").asText()).body().get("slug").asText();
        String slugB = apiGet("/api/v1/tenants/me", b.body().get("token").asText()).body().get("slug").asText();
        assertThat(slugB).isNotEqualTo(slugA).startsWith(slugA);
    }

    @Test
    @DisplayName("muitos logins do mesmo IP recebem 429")
    void limiteDeLoginPorIp() throws Exception {
        // O limite por IP de teste está alto; aqui conferimos o limite por e-mail do comprador
        Merchant m = newMerchant();
        Customer c = newCustomer(m);
        String ip = nextIp();
        int last = 0;
        for (int i = 0; i < 9; i++) {
            last = send(MockMvcRequestBuilders.post("/api/storefront/customer/login?storeSlug=" + m.slug()), null,
                    Map.of("email", c.email(), "password", "errada-" + i), ip).status();
        }
        assertThat(last).isEqualTo(429);
    }
}
