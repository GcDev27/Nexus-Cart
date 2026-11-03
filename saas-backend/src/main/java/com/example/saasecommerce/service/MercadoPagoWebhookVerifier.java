package com.example.saasecommerce.service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.util.HexFormat;

/**
 * Valida o cabeçalho x-signature dos webhooks do Mercado Pago.
 *
 * Formato: "ts=1704908010,v1=<hmac hex>". O HMAC-SHA256 é calculado com a assinatura secreta
 * do painel sobre o texto "id:{data.id};request-id:{x-request-id};ts:{ts};".
 * Notificações com mais de 10 minutos são recusadas (evita reenvio de uma notificação capturada).
 */
public final class MercadoPagoWebhookVerifier {

    private static final long MAX_AGE_SECONDS = 600;

    private MercadoPagoWebhookVerifier() {}

    public static boolean isValid(String secret, String signatureHeader, String requestId, String dataId, Clock clock) {
        if (secret == null || secret.isBlank() || signatureHeader == null || dataId == null) return false;

        String ts = null;
        String v1 = null;
        for (String part : signatureHeader.split(",")) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length != 2) continue;
            if (kv[0].equals("ts")) ts = kv[1];
            if (kv[0].equals("v1")) v1 = kv[1];
        }
        if (ts == null || v1 == null) return false;

        try {
            long age = clock.instant().getEpochSecond() - Long.parseLong(ts);
            // O Mercado Pago pode mandar ts em milissegundos
            if (ts.length() > 11) age = clock.instant().getEpochSecond() - Long.parseLong(ts) / 1000;
            if (Math.abs(age) > MAX_AGE_SECONDS) return false;
        } catch (NumberFormatException e) {
            return false;
        }

        // IDs alfanuméricos são comparados em minúsculas, como o Mercado Pago faz
        String id = dataId.matches("[A-Za-z0-9]+") ? dataId.toLowerCase() : dataId;
        StringBuilder manifest = new StringBuilder("id:").append(id).append(';');
        if (requestId != null && !requestId.isBlank()) manifest.append("request-id:").append(requestId).append(';');
        manifest.append("ts:").append(ts).append(';');

        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(manifest.toString().getBytes(StandardCharsets.UTF_8)));
            // Comparação em tempo constante
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), v1.toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    /** Para os testes montarem uma assinatura válida. */
    public static String sign(String secret, String dataId, String requestId, String ts) throws Exception {
        String manifest = "id:" + dataId.toLowerCase() + ";request-id:" + requestId + ";ts:" + ts + ";";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "ts=" + ts + ",v1=" + HexFormat.of().formatHex(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)));
    }
}
