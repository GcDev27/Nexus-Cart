package com.example.saasecommerce.security;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Grava a coluna criptografada e devolve o texto original para o código. */
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return SecretCrypto.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return SecretCrypto.decrypt(dbData);
    }
}
