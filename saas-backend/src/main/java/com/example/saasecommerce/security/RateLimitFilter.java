package com.example.saasecommerce.security;

import com.example.saasecommerce.exception.TooManyRequestsException;
import com.example.saasecommerce.service.RateLimiter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Limite de requisições por IP, antes de qualquer outra coisa da API.
 * Protege contra excesso de requisições (scraping, força bruta, criação de pedidos em massa
 * para travar o estoque com reservas). Os limites por conta/e-mail ficam nos serviços.
 *
 * O IP vem de request.getRemoteAddr(). Atrás de proxy, server.forward-headers-strategy=native
 * faz o Tomcat usar o X-Forwarded-For só quando a conexão vem de um proxy da rede interna,
 * então o cabeçalho não pode ser forjado por quem acessa direto.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class RateLimitFilter extends OncePerRequestFilter {

    private record Rule(String name, String method, String pathPrefix, String pathSuffix, int max, long windowMs) {
        boolean matches(HttpServletRequest request) {
            String path = request.getRequestURI();
            return (method == null || method.equalsIgnoreCase(request.getMethod()))
                    && path.startsWith(pathPrefix)
                    && (pathSuffix == null || path.endsWith(pathSuffix));
        }
    }

    private static final long MINUTE = 60_000;

    private final RateLimiter rateLimiter;
    private final List<Rule> rules;
    private final Rule globalRule;

    public RateLimitFilter(
            RateLimiter rateLimiter,
            @Value("${app.ratelimit.global-per-minute:300}") int globalPerMinute,
            @Value("${app.ratelimit.checkout-per-10min:10}") int checkoutPer10Min,
            @Value("${app.ratelimit.login-per-10min:30}") int loginPer10Min,
            @Value("${app.ratelimit.register-per-hour:10}") int registerPerHour,
            @Value("${app.ratelimit.webhook-per-minute:120}") int webhookPerMinute) {
        this.rateLimiter = rateLimiter;
        this.globalRule = new Rule("global", null, "/api/", null, globalPerMinute, MINUTE);
        this.rules = List.of(
                new Rule("checkout", "POST", "/api/checkout/orders", null, checkoutPer10Min, 10 * MINUTE),
                new Rule("login", "POST", "/api/auth/login", null, loginPer10Min, 10 * MINUTE),
                new Rule("login", "POST", "/api/storefront/customer/login", null, loginPer10Min, 10 * MINUTE),
                new Rule("register", "POST", "/api/auth/register", null, registerPerHour, 60 * MINUTE),
                new Rule("register", "POST", "/api/storefront/customer/register", null, registerPerHour, 60 * MINUTE),
                new Rule("password", "POST", "/api/auth/forgot-password", null, registerPerHour, 60 * MINUTE),
                new Rule("password", "POST", "/api/auth/reset-password", null, loginPer10Min, 10 * MINUTE),
                new Rule("password", "POST", "/api/storefront/customer/forgot-password", null, registerPerHour, 60 * MINUTE),
                new Rule("password", "POST", "/api/storefront/customer/reset-password", null, loginPer10Min, 10 * MINUTE),
                new Rule("webhook", null, "/api/webhooks/", null, webhookPerMinute, MINUTE)
        );
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        // Preflight do CORS não conta
        return "OPTIONS".equalsIgnoreCase(request.getMethod()) || !request.getRequestURI().startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        try {
            for (Rule rule : rules) {
                if (rule.matches(request)) {
                    rateLimiter.hit("ip:" + rule.name() + ":" + ip, rule.max(), rule.windowMs(),
                            "Muitas tentativas a partir da sua rede. Aguarde alguns minutos e tente de novo.");
                }
            }
            rateLimiter.hit("ip:global:" + ip, globalRule.max(), globalRule.windowMs(),
                    "Muitas requisições em pouco tempo. Aguarde um momento.");
        } catch (TooManyRequestsException e) {
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"status\":429,\"error\":\"" + e.getMessage() + "\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
