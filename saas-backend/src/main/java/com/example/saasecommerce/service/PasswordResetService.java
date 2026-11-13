package com.example.saasecommerce.service;

import com.example.saasecommerce.model.Customer;
import com.example.saasecommerce.model.PasswordResetToken;
import com.example.saasecommerce.model.PasswordResetToken.AccountType;
import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.repository.CustomerRepository;
import com.example.saasecommerce.repository.PasswordResetTokenRepository;
import com.example.saasecommerce.repository.TenantRepository;
import com.example.saasecommerce.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;

/**
 * "Esqueci minha senha" de lojistas e compradores.
 * A resposta é sempre a mesma, exista o e-mail ou não. O link vale 30 minutos e uma vez só,
 * e trocar a senha derruba as sessões abertas.
 */
@Service
public class PasswordResetService {

    private static final int VALID_MINUTES = 30;
    private static final int MAX_REQUESTS_PER_HOUR = 3;
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String INVALID_LINK = "Este link expirou ou já foi usado. Peça um novo.";

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final RateLimiter rateLimiter;
    private final String publicUrl;

    public PasswordResetService(PasswordResetTokenRepository tokenRepository, UserRepository userRepository,
                                CustomerRepository customerRepository, TenantRepository tenantRepository,
                                PasswordEncoder passwordEncoder, MailService mailService, RateLimiter rateLimiter,
                                @Value("${app.public-url}") String publicUrl) {
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.customerRepository = customerRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
        this.rateLimiter = rateLimiter;
        this.publicUrl = publicUrl.replaceAll("/+$", "");
    }

    @Transactional
    public void requestForMerchant(String rawEmail) {
        String email = normalize(rawEmail);
        if (!allowRequest("merchant:" + email)) return;
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = createToken(AccountType.MERCHANT, user.getId());
            mailService.send(user.getEmail(), "Redefinir sua senha do NexusCart", message(
                    user.getName(), "do painel da sua loja no NexusCart", publicUrl + "/redefinir-senha?token=" + token));
        });
    }

    @Transactional
    public void requestForCustomer(String storeSlug, String rawEmail) {
        String email = normalize(rawEmail);
        Tenant tenant = tenantRepository.findBySlug(storeSlug == null ? "" : storeSlug).orElse(null);
        if (tenant == null || !allowRequest("customer:" + tenant.getId() + ":" + email)) return;
        customerRepository.findByTenantIdAndEmail(tenant.getId(), email).ifPresent(customer -> {
            String token = createToken(AccountType.CUSTOMER, customer.getId());
            mailService.send(customer.getEmail(), "Redefinir sua senha na " + tenant.getName(), message(
                    customer.getName(), "da sua conta na loja " + tenant.getName(),
                    publicUrl + "/loja/" + tenant.getSlug() + "/redefinir-senha?token=" + token));
        });
    }

    /** Troca a senha. Devolve o tipo da conta para o frontend saber para qual login mandar. */
    @Transactional
    public AccountType reset(String rawToken, String newPassword) {
        if (newPassword == null || newPassword.length() < 8 || newPassword.length() > 128) {
            throw new IllegalArgumentException("A senha deve ter entre 8 e 128 caracteres.");
        }
        LocalDateTime now = LocalDateTime.now();
        PasswordResetToken token = rawToken == null || rawToken.length() > 100
                ? null : tokenRepository.findByTokenHash(hash(rawToken)).orElse(null);
        if (token == null || token.getUsedAt() != null || token.getExpiresAt().isBefore(now)) {
            throw new IllegalArgumentException(INVALID_LINK);
        }

        String encoded = passwordEncoder.encode(newPassword);
        if (token.getAccountType() == AccountType.MERCHANT) {
            User user = userRepository.findById(token.getAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(INVALID_LINK));
            user.setPassword(encoded);
            user.setPasswordChangedAt(now);
            userRepository.save(user);
            rateLimiter.reset("login:merchant:" + user.getEmail());
        } else {
            Customer customer = customerRepository.findById(token.getAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(INVALID_LINK));
            customer.setPassword(encoded);
            customer.setPasswordChangedAt(now);
            customerRepository.save(customer);
            rateLimiter.reset("login:customer:" + customer.getTenantId() + ":" + customer.getEmail());
        }
        tokenRepository.invalidateAll(token.getAccountType(), token.getAccountId(), now);
        return token.getAccountType();
    }

    /** No máximo 3 links por hora para o mesmo e-mail; acima disso, ignora em silêncio. */
    private boolean allowRequest(String key) {
        String limitKey = "reset:" + key;
        try {
            rateLimiter.check(limitKey, MAX_REQUESTS_PER_HOUR, 60 * 60_000, "limite");
        } catch (RuntimeException e) {
            return false;
        }
        rateLimiter.record(limitKey);
        return true;
    }

    private String createToken(AccountType type, UUID accountId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime now = LocalDateTime.now();
        tokenRepository.save(PasswordResetToken.builder()
                .tokenHash(hash(raw)).accountType(type).accountId(accountId)
                .createdAt(now).expiresAt(now.plusMinutes(VALID_MINUTES)).build());
        return raw;
    }

    private static String message(String name, String what, String link) {
        return "Olá, " + name + "!\n\n"
                + "Recebemos um pedido para redefinir a senha " + what + ".\n"
                + "Para escolher uma nova senha, abra o link abaixo (vale por " + VALID_MINUTES + " minutos):\n\n"
                + link + "\n\n"
                + "Se não foi você, ignore este e-mail: sua senha continua a mesma.";
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    static String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
