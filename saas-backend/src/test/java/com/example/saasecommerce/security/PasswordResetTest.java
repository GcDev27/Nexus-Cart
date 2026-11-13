package com.example.saasecommerce.security;

import com.example.saasecommerce.IntegrationTest;
import com.example.saasecommerce.service.MailService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@DisplayName("Esqueci minha senha")
class PasswordResetTest extends IntegrationTest {

    @MockitoBean MailService mail;

    private static final Pattern LINK = Pattern.compile("(http\\S+redefinir-senha\\?token=)([A-Za-z0-9_-]+)");

    private Matcher sentLink(String to) {
        ArgumentCaptor<String> text = ArgumentCaptor.forClass(String.class);
        verify(mail).send(eq(to), anyString(), text.capture());
        Matcher m = LINK.matcher(text.getValue());
        assertThat(m.find()).as(text.getValue()).isTrue();
        return m;
    }

    private Res reset(String token, String password) throws Exception {
        return apiPost("/api/auth/reset-password", null, Map.of("token", token, "password", password));
    }

    @Test
    @DisplayName("resposta é igual para e-mail cadastrado ou não, e só o cadastrado recebe e-mail")
    void semEnumeracao() throws Exception {
        Merchant m = newMerchant();
        Res known = apiPost("/api/auth/forgot-password", null, Map.of("email", m.email()));
        Res unknown = apiPost("/api/auth/forgot-password", null, Map.of("email", unique("ninguem") + "@teste.local"));
        assertThat(known.status()).isEqualTo(200).isEqualTo(unknown.status());
        assertThat(known.raw()).isEqualTo(unknown.raw());
        verify(mail, times(1)).send(anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("link troca a senha uma vez só, e a sessão antiga deixa de valer")
    void redefinirSenha() throws Exception {
        Merchant m = newMerchant();
        apiPost("/api/auth/forgot-password", null, Map.of("email", m.email().toUpperCase()));
        Matcher link = sentLink(m.email());
        assertThat(link.group(1)).startsWith("http://localhost:3000/redefinir-senha");
        String token = link.group(2);

        // O iat do JWT tem precisão de segundos
        Thread.sleep(1100);
        assertThat(reset(token, "curta").status()).isEqualTo(400);
        Res ok = reset(token, "Nova-senha-456");
        assertThat(ok.status()).isEqualTo(200);
        assertThat(ok.body().get("accountType").asText()).isEqualTo("MERCHANT");

        assertThat(reset(token, "Outra-senha-789").status()).isEqualTo(400);
        assertThat(apiGet("/api/admin/produtos", m.token()).status()).isIn(401, 403);
        assertThat(apiPost("/api/auth/login", null, Map.of("email", m.email(), "password", m.password())).status()).isEqualTo(400);
        Res login = apiPost("/api/auth/login", null, Map.of("email", m.email(), "password", "Nova-senha-456"));
        assertThat(login.status()).isEqualTo(200);
        assertThat(apiGet("/api/admin/produtos", login.body().get("token").asText()).status()).isEqualTo(200);
    }

    @Test
    @DisplayName("link vencido, inventado ou de um pedido anterior não funciona")
    void linksInvalidos() throws Exception {
        Merchant m = newMerchant();
        apiPost("/api/auth/forgot-password", null, Map.of("email", m.email()));
        String first = sentLink(m.email()).group(2);
        clearInvocations(mail);
        apiPost("/api/auth/forgot-password", null, Map.of("email", m.email()));
        String second = sentLink(m.email()).group(2);

        assertThat(reset("token-inventado", "Nova-senha-456").status()).isEqualTo(400);
        assertThat(reset("x".repeat(5000), "Nova-senha-456").status()).isEqualTo(400);

        jdbc.update("update password_reset_tokens set expires_at = now() - interval '1 minute' where account_id = "
                + "(select id from users where email = ?) and used_at is null and created_at = "
                + "(select min(created_at) from password_reset_tokens t2 where t2.account_id = password_reset_tokens.account_id)", m.email());
        assertThat(reset(first, "Nova-senha-456").status()).isEqualTo(400);

        // Usar o segundo invalida qualquer outro aberto
        assertThat(reset(second, "Nova-senha-456").status()).isEqualTo(200);
        Integer open = jdbc.queryForObject("select count(*) from password_reset_tokens where used_at is null and account_id = "
                + "(select id from users where email = ?)", Integer.class, m.email());
        assertThat(open).isZero();
    }

    @Test
    @DisplayName("no máximo 3 e-mails de redefinição por hora para o mesmo endereço")
    void limitePorEmail() throws Exception {
        Merchant m = newMerchant();
        for (int i = 0; i < 6; i++) {
            assertThat(apiPost("/api/auth/forgot-password", null, Map.of("email", m.email())).status()).isEqualTo(200);
        }
        verify(mail, times(3)).send(eq(m.email()), anyString(), anyString());
    }

    @Test
    @DisplayName("token fica só como hash no banco")
    void tokenComoHash() throws Exception {
        Merchant m = newMerchant();
        apiPost("/api/auth/forgot-password", null, Map.of("email", m.email()));
        String token = sentLink(m.email()).group(2);
        Integer plain = jdbc.queryForObject("select count(*) from password_reset_tokens where token_hash = ?", Integer.class, token);
        assertThat(plain).isZero();
    }

    @Test
    @DisplayName("comprador redefine a senha na própria loja, sem afetar outras lojas")
    void comprador() throws Exception {
        Merchant a = newMerchant();
        Merchant b = newMerchant();
        Customer c = newCustomer(a);

        send(MockMvcRequestBuilders.post("/api/storefront/customer/forgot-password?storeSlug=" + b.slug()), null,
                Map.of("email", c.email()), nextIp());
        verify(mail, never()).send(anyString(), anyString(), anyString());

        send(MockMvcRequestBuilders.post("/api/storefront/customer/forgot-password?storeSlug=" + a.slug()), null,
                Map.of("email", c.email()), nextIp());
        Matcher link = sentLink(c.email());
        assertThat(link.group(1)).contains("/loja/" + a.slug() + "/redefinir-senha");

        Res ok = apiPost("/api/storefront/customer/reset-password", null, Map.of("token", link.group(2), "password", "Nova-senha-456"));
        assertThat(ok.body().get("accountType").asText()).isEqualTo("CUSTOMER");
        Res login = send(MockMvcRequestBuilders.post("/api/storefront/customer/login?storeSlug=" + a.slug()), null,
                Map.of("email", c.email(), "password", "Nova-senha-456"), nextIp());
        assertThat(login.status()).isEqualTo(200);
    }
}
