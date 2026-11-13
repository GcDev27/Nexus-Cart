package com.example.saasecommerce.service;

import com.example.saasecommerce.model.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${api.security.token.secret}")
    private String secretKey;

    @Value("${api.security.token.expiration}")
    private long jwtExpiration;

    // Segredo antigo que ficou público no repositório: quem o conhece consegue forjar tokens
    private static final String LEAKED_SECRET = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @PostConstruct
    void validateSecret() {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("JWT_SECRET não configurado.");
        }
        if (LEAKED_SECRET.equalsIgnoreCase(secretKey.trim())) {
            throw new IllegalStateException("JWT_SECRET usa o valor público antigo do repositório. Gere um novo com: openssl rand -base64 48");
        }
        // Falha na inicialização (e não no primeiro login) se o segredo for inválido ou menor que 256 bits
        getSignInKey();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTenantId(String token) {
        return extractClaim(token, claims -> claims.get("tenantId", String.class));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String extractCustomerId(String token) {
        return extractClaim(token, claims -> claims.get("customerId", String.class));
    }

    public java.util.Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    public String extractRole(String token) {
        return extractClaim(token, claims -> claims.get("role", String.class));
    }

    public String generateToken(User user) {
        Map<String, Object> extraClaims = new HashMap<>();

        // CORREÇÃO: Extrai o tenantId diretamente, pois a entidade User agora guarda apenas o UUID
        extraClaims.put("tenantId", user.getTenantId().toString());

        // CORREÇÃO: Define a role padrão, uma vez que simplificámos a entidade User
        extraClaims.put("role", "ROLE_USER");

        return generateToken(extraClaims, user);
    }

    public String generateCustomerToken(com.example.saasecommerce.model.Customer customer) {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("customerId", customer.getId().toString());
        extraClaims.put("tenantId", customer.getTenantId().toString());
        extraClaims.put("role", "ROLE_CUSTOMER");

        return generateToken(extraClaims, customer);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}