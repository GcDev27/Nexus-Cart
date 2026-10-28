package com.example.saasecommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Builder;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class MercadoPagoPaymentService {

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Data
    @Builder
    public static class PixPaymentResult {
        private String paymentId;
        private String qrCode;
        private String qrCodeBase64;
        private String ticketUrl;
        private String status;
    }

    public PixPaymentResult createPixPayment(
            String accessToken,
            BigDecimal amount,
            String description,
            String customerEmail,
            String customerName,
            String customerCpf
    ) {
        try {
            String url = "https://api.mercadopago.com/v1/payments";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);
            headers.set("X-Idempotency-Key", UUID.randomUUID().toString());

            Map<String, Object> body = new HashMap<>();
            body.put("transaction_amount", amount);
            body.put("description", description);
            body.put("payment_method_id", "pix");

            Map<String, Object> payer = new HashMap<>();
            payer.put("email", (customerEmail != null && customerEmail.contains("@")) ? customerEmail : "cliente@exemplo.com");
            
            String firstName = customerName != null && !customerName.isBlank() ? customerName : "Cliente";
            payer.put("first_name", firstName);

            if (customerCpf != null && !customerCpf.isBlank()) {
                String cleanCpf = customerCpf.replaceAll("\\D", "");
                if (cleanCpf.length() == 11) {
                    Map<String, String> identification = new HashMap<>();
                    identification.put("type", "CPF");
                    identification.put("number", cleanCpf);
                    payer.put("identification", identification);
                }
            }

            body.put("payer", payer);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String paymentId = root.path("id").asText();
                String status = root.path("status").asText();

                JsonNode txData = root.path("point_of_interaction").path("transaction_data");
                String qrCode = txData.path("qr_code").asText("");
                String qrCodeBase64 = txData.path("qr_code_base64").asText("");
                String ticketUrl = txData.path("ticket_url").asText("");

                return PixPaymentResult.builder()
                        .paymentId(paymentId)
                        .qrCode(qrCode)
                        .qrCodeBase64(qrCodeBase64)
                        .ticketUrl(ticketUrl)
                        .status(status)
                        .build();
            } else {
                throw new RuntimeException("Mercado Pago retornou erro: " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("Erro ao chamar API do Mercado Pago: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao gerar cobrança PIX no Mercado Pago: " + e.getMessage(), e);
        }
    }

    public String checkPaymentStatus(String accessToken, String paymentId) {
        try {
            // Valida formato do paymentId para prevenir path traversal / SSRF
            if (paymentId == null || !paymentId.matches("^[0-9]+$")) {
                log.warn("paymentId inválido recebido: {}", paymentId);
                return "pending";
            }

            String url = "https://api.mercadopago.com/v1/payments/" + paymentId;
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);

            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, request, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.path("status").asText(); // "approved", "pending", etc.
            }
        } catch (Exception e) {
            log.error("Erro ao verificar status do pagamento {} no Mercado Pago: {}", paymentId, e.getMessage());
        }
        return "pending";
    }
}
