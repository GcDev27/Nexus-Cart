package com.example.saasecommerce.controller;

import com.example.saasecommerce.service.SubscriptionService;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Notificações das mensalidades no Asaas. O token configurado no painel do Asaas
 * chega no cabeçalho asaas-access-token; sem ele correto, nada é processado.
 */
@RestController
@RequestMapping("/api/webhooks/asaas")
@RequiredArgsConstructor
@Slf4j
public class AsaasWebhookController {

    private final SubscriptionService subscriptionService;

    @PostMapping
    public ResponseEntity<Void> handle(
            @RequestHeader(value = "asaas-access-token", required = false) String token,
            @RequestBody(required = false) JsonNode event) {
        if (!subscriptionService.isValidWebhookToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (event == null) return ResponseEntity.ok().build();
        try {
            subscriptionService.handleWebhook(event);
        } catch (Exception e) {
            // 500 faz o Asaas reenviar depois; mais de 15 falhas seguidas pausam a fila, então só para erro nosso
            log.error("Erro ao processar webhook do Asaas {}: {}", event.path("id").asText(), e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
        return ResponseEntity.ok().build();
    }
}
