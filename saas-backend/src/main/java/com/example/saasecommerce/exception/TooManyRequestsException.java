package com.example.saasecommerce.exception;

/** Muitas tentativas em pouco tempo (login errado repetido, mensagens em excesso). Vira HTTP 429. */
public class TooManyRequestsException extends RuntimeException {
    public TooManyRequestsException(String message) {
        super(message);
    }
}
