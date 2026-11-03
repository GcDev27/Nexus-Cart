package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.AuthenticationRequest;
import com.example.saasecommerce.dto.AuthenticationResponse;
import com.example.saasecommerce.dto.RegisterRequest;
import com.example.saasecommerce.model.Tenant;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.repository.TenantRepository;
import com.example.saasecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final TenantRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RateLimiter rateLimiter;

    // Limite de senhas erradas por e-mail: 8 tentativas a cada 10 minutos
    private static final int MAX_LOGIN_FAILURES = 8;
    private static final long LOGIN_WINDOW_MS = 10 * 60_000;

    @Transactional // Impede que o utilizador seja criado se a loja falhar (e vice-versa)
    public AuthenticationResponse register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta com este e-mail. Faça login ou use outro e-mail.");
        }

        // 1. Gera um slug automático (URL amigável) para a loja
        String baseSlug = Normalizer.normalize(request.getStoreName().toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)+", "");
        if (baseSlug.isBlank()) baseSlug = "loja";

        // Nome de loja repetido não pode derrubar o cadastro: usa loja-2, loja-3...
        String storeSlug = baseSlug;
        for (int i = 2; tenantRepository.findBySlug(storeSlug).isPresent(); i++) {
            storeSlug = baseSlug + "-" + i;
        }

        // 2. Instancia e salva a Loja (Tenant)
        Tenant tenant = new Tenant();
        tenant.setName(request.getStoreName());
        tenant.setSlug(storeSlug);
        var savedTenant = tenantRepository.save(tenant);

        // 3. Instancia e salva o Utilizador Lojista, atrelando o ID da nova loja a ele
        User user = new User();
        user.setName(request.getName());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setTenantId(savedTenant.getId());

        // Caso o seu modelo User exija um Role obrigatório, descomente e ajuste a linha abaixo:
        // user.setRole(Role.ADMIN);

        var savedUser = userRepository.save(user);

        // 4. Gera o Token JWT incluindo o slug da loja
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        extraClaims.put("tenantId", savedUser.getTenantId().toString());
        extraClaims.put("tenantSlug", savedTenant.getSlug());
        extraClaims.put("role", "ROLE_USER");
        
        var jwtToken = jwtService.generateToken(extraClaims, savedUser);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String limitKey = "login:merchant:" + email;
        rateLimiter.check(limitKey, MAX_LOGIN_FAILURES, LOGIN_WINDOW_MS,
                "Muitas tentativas de login. Aguarde alguns minutos e tente de novo.");

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (AuthenticationException e) {
            rateLimiter.record(limitKey);
            // Mesma mensagem para e-mail inexistente e senha errada
            throw new IllegalArgumentException("E-mail ou senha inválidos.");
        }
        rateLimiter.reset(limitKey);

        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Utilizador não encontrado"));
                
        var tenant = tenantRepository.findById(user.getTenantId())
                .orElseThrow(() -> new IllegalArgumentException("Loja não encontrada"));

        // Gera um novo Token JWT incluindo o slug da loja
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        extraClaims.put("tenantId", user.getTenantId().toString());
        extraClaims.put("tenantSlug", tenant.getSlug());
        extraClaims.put("role", "ROLE_USER");
        
        var jwtToken = jwtService.generateToken(extraClaims, user);

        return AuthenticationResponse.builder()
                .token(jwtToken)
                .build();
    }
}