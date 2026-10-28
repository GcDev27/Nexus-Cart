package com.example.saasecommerce.controller;

import com.example.saasecommerce.service.OrderCheckoutService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final OrderCheckoutService checkoutService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Endpoint para receber notificações instantâneas de pagamento (IPN / Webhook) do Mercado Pago.
     * Suporta POST (notificação de evento) e GET (validação de webhook do painel do MP).
     */
    @RequestMapping(value = "/mercadopago", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity<Void> handleMercadoPagoWebhook(
            @RequestParam(value = "id", required = false) String paramId,
            @RequestParam(value = "data.id", required = false) String dataIdParam,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "type", required = false) String type,
            @RequestBody(required = false) String rawBody
    ) {
        try {
            String paymentId = null;

            // 1. Tenta extrair paymentId de query params
            if (dataIdParam != null && !dataIdParam.isBlank()) {
                paymentId = dataIdParam;
            } else if (paramId != null && !paramId.isBlank()) {
                paymentId = paramId;
            }

            // 2. Se não veio em query param, tenta extrair do corpo JSON
            if (paymentId == null && rawBody != null && !rawBody.isBlank()) {
                try {
                    JsonNode root = objectMapper.readTree(rawBody);
                    if (root.has("data") && root.path("data").has("id")) {
                        paymentId = root.path("data").path("id").asText();
                    } else if (root.has("id")) {
                        paymentId = root.path("id").asText();
                    }
                } catch (Exception parseEx) {
                    log.warn("Erro ao fazer parse do corpo do webhook MP: {}", parseEx.getMessage());
                }
            }

            if (paymentId != null && !paymentId.isBlank()) {
                log.info("Recebido webhook Mercado Pago para paymentId: {}", paymentId);
                boolean approved = checkoutService.processPaymentWebhook(paymentId);
                if (approved) {
                    log.info("Webhook: Pedido aprovado e chave entregue com sucesso para paymentId: {}", paymentId);
                }
            } else {
                log.debug("Webhook Mercado Pago recebido sem ID de pagamento (possível handshake de verificação).");
            }

            // Sempre responder 200 OK para o Mercado Pago não reenviar em loop
            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Erro ao processar webhook Mercado Pago: {}", e.getMessage(), e);
            // Retorna 200 OK para evitar retries desnecessários em caso de exceção de payload
            return ResponseEntity.ok().build();
        }
    }
}
