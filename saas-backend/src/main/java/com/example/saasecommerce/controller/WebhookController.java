package com.example.saasecommerce.controller;

import com.example.saasecommerce.service.OrderCheckoutService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final OrderCheckoutService checkoutService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Notificações de pagamento do Mercado Pago (POST) e validação da URL no painel (GET).
     * O status nunca é lido do corpo: o pagamento é sempre confirmado direto na API do Mercado Pago.
     * Se a loja cadastrou a assinatura secreta, notificações sem assinatura válida recebem 401.
     */
    @RequestMapping(value = "/mercadopago", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity<Void> handleMercadoPagoWebhook(
            @RequestParam(value = "id", required = false) String paramId,
            @RequestParam(value = "data.id", required = false) String dataIdParam,
            @RequestHeader(value = "x-signature", required = false) String signature,
            @RequestHeader(value = "x-request-id", required = false) String requestId,
            @RequestBody(required = false) String rawBody
    ) {
        String paymentId = dataIdParam != null && !dataIdParam.isBlank() ? dataIdParam : paramId;

        if ((paymentId == null || paymentId.isBlank()) && rawBody != null && !rawBody.isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(rawBody);
                paymentId = root.path("data").has("id") ? root.path("data").path("id").asText() : root.path("id").asText(null);
            } catch (Exception e) {
                log.debug("Corpo do webhook do Mercado Pago não é JSON: {}", e.getMessage());
            }
        }

        // IDs de pagamento do Mercado Pago são numéricos; o resto é ignorado sem tocar no banco
        if (paymentId == null || !paymentId.matches("\\d{1,30}")) {
            return ResponseEntity.ok().build();
        }

        try {
            checkoutService.processPaymentWebhook(paymentId, signature, requestId);
        } catch (OrderCheckoutService.InvalidWebhookSignatureException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            // Responde 200 para o Mercado Pago não reenviar em loop por um erro nosso
            log.error("Erro ao processar webhook do Mercado Pago {}: {}", paymentId, e.getMessage());
        }
        return ResponseEntity.ok().build();
    }
}
