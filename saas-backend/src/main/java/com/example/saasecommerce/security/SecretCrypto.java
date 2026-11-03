package com.example.saasecommerce.security;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Criptografia AES-256-GCM para segredos guardados no banco (ex.: Access Token do Mercado Pago).
 * A chave vem de ENCRYPTION_KEY (32 bytes em base64). Valores antigos em texto puro continuam
 * legíveis e passam a ser criptografados na próxima vez que forem salvos.
 */
@Component
public class SecretCrypto {

    private static final String PREFIX = "enc:v1:";
    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;
    private static final SecureRandom RANDOM = new SecureRandom();

    // O conversor JPA é instanciado pelo Hibernate, fora do Spring; por isso a chave fica estática
    private static volatile SecretKeySpec key;

    @Value("${app.security.encryption-key}")
    private String encodedKey;

    @PostConstruct
    void init() {
        byte[] raw;
        try {
            raw = Base64.getDecoder().decode(encodedKey.trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalStateException("ENCRYPTION_KEY precisa estar em base64. Gere com: openssl rand -base64 32");
        }
        if (raw.length != 32) {
            throw new IllegalStateException("ENCRYPTION_KEY precisa ter 32 bytes. Gere com: openssl rand -base64 32");
        }
        key = new SecretKeySpec(raw, "AES");
    }

    public static String encrypt(String plain) {
        if (plain == null || plain.isEmpty() || plain.startsWith(PREFIX)) return plain;
        try {
            byte[] iv = new byte[IV_LENGTH];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, requireKey(), new GCMParameterSpec(TAG_BITS, iv));
            byte[] encrypted = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            ByteBuffer out = ByteBuffer.allocate(iv.length + encrypted.length).put(iv).put(encrypted);
            return PREFIX + Base64.getEncoder().encodeToString(out.array());
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao criptografar segredo", e);
        }
    }

    public static String decrypt(String stored) {
        if (stored == null || !stored.startsWith(PREFIX)) return stored; // legado em texto puro
        try {
            byte[] data = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, requireKey(), new GCMParameterSpec(TAG_BITS, data, 0, IV_LENGTH));
            byte[] plain = cipher.doFinal(data, IV_LENGTH, data.length - IV_LENGTH);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao descriptografar segredo. A ENCRYPTION_KEY mudou?", e);
        }
    }

    private static SecretKeySpec requireKey() {
        if (key == null) throw new IllegalStateException("SecretCrypto ainda não foi inicializado");
        return key;
    }
}
