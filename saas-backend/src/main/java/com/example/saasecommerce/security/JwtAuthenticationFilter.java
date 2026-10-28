package com.example.saasecommerce.security;

import com.example.saasecommerce.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final com.example.saasecommerce.repository.CustomerRepository customerRepository;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // 1. Extrair o cabeçalho de autorização
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Se não houver cabeçalho ou não começar por "Bearer ", passa à frente (para rotas públicas)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Extrair o token JWT (removendo os primeiros 7 caracteres: "Bearer ")
        jwt = authHeader.substring(7);

        try {
            // 3. Extrair o email (username) do token
            userEmail = jwtService.extractUsername(jwt);
            String role = jwtService.extractRole(jwt);

            // 4. Se temos um email válido e o utilizador ainda não está autenticado no contexto atual
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = null;

                if ("ROLE_CUSTOMER".equals(role)) {
                    String customerIdStr = jwtService.extractCustomerId(jwt);
                    if (customerIdStr != null) {
                        try {
                            java.util.UUID cId = java.util.UUID.fromString(customerIdStr);
                            userDetails = customerRepository.findById(cId).orElse(null);
                        } catch (Exception ignored) {}
                    }
                } else {
                    // Lojista / Admin
                    userDetails = this.userDetailsService.loadUserByUsername(userEmail);
                }

                // 5. Valida se o token pertence a este utilizador e se não expirou
                if (userDetails != null && jwtService.isTokenValid(jwt, userDetails)) {

                    // Cria o "Crachá de Acesso" do Spring Security
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    // 6. Coloca o crachá no Contexto de Segurança. A partir de agora, o Spring sabe quem ele é!
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (Exception e) {
            // O token é inválido, expirou ou está malformado (ex: "null", "undefined").
            // Não estouramos erro 500, simplesmente não autenticamos. O Spring Security cuidará de bloquear o acesso se a rota exigir auth.
            System.err.println("Falha ao processar token JWT: " + e.getMessage());
        }

        // Continua o fluxo normal da requisição
        filterChain.doFilter(request, response);
    }
}