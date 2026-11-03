package com.example.saasecommerce.service;

import java.math.BigDecimal;
import java.util.regex.Pattern;

/** Regras de entrada compartilhadas. Toda violação vira IllegalArgumentException (HTTP 400). */
public final class InputValidator {

    // Imagens enviadas pelo painel (base64) ficam abaixo de ~2,2 MB de arquivo
    public static final int MAX_IMAGE_LENGTH = 3_000_000;
    // SVG fica de fora: pode carregar script quando aberto direto no navegador
    private static final Pattern DATA_IMAGE = Pattern.compile("^data:image/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\\s]+$");
    private static final Pattern SLUG = Pattern.compile("^[a-z0-9]+(-[a-z0-9]+)*$");
    private static final BigDecimal MAX_PRICE = new BigDecimal("100000");

    private InputValidator() {}

    public static String text(String value, int min, int max, String field) {
        String v = value == null ? "" : value.trim();
        if (v.length() < min) {
            throw new IllegalArgumentException(min <= 1 ? field + " é obrigatório." : field + " precisa ter pelo menos " + min + " caracteres.");
        }
        if (v.length() > max) throw new IllegalArgumentException(field + " pode ter no máximo " + max + " caracteres.");
        return v;
    }

    public static String optionalText(String value, int max, String field) {
        if (value == null || value.isBlank()) return null;
        return text(value, 0, max, field);
    }

    /** Imagem do painel (data:image/... em base64) ou link https. Vazio = sem imagem. */
    public static String image(String value, String field) {
        if (value == null || value.isBlank()) return null;
        String v = value.trim();
        if (v.length() > MAX_IMAGE_LENGTH) throw new IllegalArgumentException(field + " muito grande. Envie uma imagem menor.");
        boolean ok = v.startsWith("https://") ? v.length() <= 2000 && !v.contains(" ") : DATA_IMAGE.matcher(v).matches();
        if (!ok) throw new IllegalArgumentException(field + " inválida. Use PNG, JPG, WEBP ou GIF.");
        return v;
    }

    public static String slug(String value) {
        String v = text(value, 1, 80, "Endereço (slug)").toLowerCase();
        if (!SLUG.matcher(v).matches()) {
            throw new IllegalArgumentException("Endereço (slug) só pode ter letras minúsculas, números e hífen.");
        }
        return v;
    }

    public static BigDecimal price(BigDecimal value, String field) {
        if (value == null) throw new IllegalArgumentException(field + " é obrigatório.");
        if (value.signum() < 0 || value.compareTo(MAX_PRICE) > 0) {
            throw new IllegalArgumentException(field + " precisa estar entre R$ 0 e R$ 100.000.");
        }
        return value;
    }
}
