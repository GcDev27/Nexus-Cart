package com.example.saasecommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * Cliente da API v3 do Asaas, usado só para cobrar a mensalidade dos lojistas.
 * Docs: https://docs.asaas.com/reference
 */
@Component
public class AsaasClient {

    private final String apiUrl;
    private final String apiKey;
    private final RestTemplate restTemplate;

    public AsaasClient(
            @Value("${app.asaas.api-url}") String apiUrl,
            @Value("${app.asaas.api-key:}") String apiKey) {
        this.apiUrl = apiUrl.replaceAll("/+$", "");
        this.apiKey = apiKey;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5_000);
        factory.setReadTimeout(15_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public record Payment(String id, String subscription, String status, LocalDate dueDate, String invoiceUrl) {}

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String createCustomer(String name, String cpfCnpj, String email, String externalReference) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("cpfCnpj", cpfCnpj);
        body.put("email", email);
        body.put("externalReference", externalReference);
        return call(HttpMethod.POST, "/customers", body).path("id").asText();
    }

    public String createSubscription(String customerId, BigDecimal value, LocalDate nextDueDate,
                                     String description, String externalReference) {
        Map<String, Object> body = new HashMap<>();
        body.put("customer", customerId);
        // O lojista escolhe Pix, boleto ou cartão na página de pagamento do Asaas
        body.put("billingType", "UNDEFINED");
        body.put("value", value);
        body.put("nextDueDate", nextDueDate.toString());
        body.put("cycle", "MONTHLY");
        body.put("description", description);
        body.put("externalReference", externalReference);
        return call(HttpMethod.POST, "/subscriptions", body).path("id").asText();
    }

    public void updateSubscriptionValue(String subscriptionId, BigDecimal value, String description) {
        Map<String, Object> body = new HashMap<>();
        body.put("value", value);
        body.put("description", description);
        body.put("updatePendingPayments", true);
        call(HttpMethod.PUT, "/subscriptions/" + subscriptionId, body);
    }

    public void deleteSubscription(String subscriptionId) {
        call(HttpMethod.DELETE, "/subscriptions/" + subscriptionId, null);
    }

    /** Link da cobrança em aberto mais antiga da assinatura, se houver. */
    public String openInvoiceUrl(String subscriptionId) {
        JsonNode list = call(HttpMethod.GET, "/subscriptions/" + subscriptionId + "/payments", null).path("data");
        String url = null;
        LocalDate oldest = null;
        for (JsonNode p : list) {
            String status = p.path("status").asText();
            if (!status.equals("PENDING") && !status.equals("OVERDUE")) continue;
            LocalDate due = LocalDate.parse(p.path("dueDate").asText());
            if (oldest == null || due.isBefore(oldest)) {
                oldest = due;
                url = p.path("invoiceUrl").asText(null);
            }
        }
        return url;
    }

    public Payment getPayment(String paymentId) {
        JsonNode p = call(HttpMethod.GET, "/payments/" + paymentId, null);
        return new Payment(
                p.path("id").asText(),
                p.path("subscription").asText(null),
                p.path("status").asText(),
                p.hasNonNull("dueDate") ? LocalDate.parse(p.path("dueDate").asText()) : null,
                p.path("invoiceUrl").asText(null));
    }

    private JsonNode call(HttpMethod method, String path, Object body) {
        if (!isConfigured()) {
            throw new IllegalStateException("A cobrança das assinaturas ainda não foi configurada.");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.set("access_token", apiKey);
        // Obrigatório para contas Asaas criadas a partir de 13/06/2024
        headers.set(HttpHeaders.USER_AGENT, "NexusCart");
        headers.setContentType(MediaType.APPLICATION_JSON);
        try {
            JsonNode res = restTemplate.exchange(apiUrl + path, method, new HttpEntity<>(body, headers), JsonNode.class).getBody();
            return res != null ? res : com.fasterxml.jackson.databind.node.NullNode.getInstance();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            // Erros de validação do Asaas (ex.: CPF/CNPJ inválido) voltam para o lojista
            String message = "Não foi possível falar com o Asaas agora. Tente de novo em alguns minutos.";
            try {
                JsonNode errors = new com.fasterxml.jackson.databind.ObjectMapper().readTree(e.getResponseBodyAsString()).path("errors");
                if (errors.isArray() && !errors.isEmpty()) message = errors.get(0).path("description").asText(message);
            } catch (Exception ignored) {
                // corpo não é JSON
            }
            throw new IllegalStateException(message);
        } catch (org.springframework.web.client.RestClientException e) {
            throw new IllegalStateException("Não foi possível falar com o Asaas agora. Tente de novo em alguns minutos.");
        }
    }
}
