package com.example.saasecommerce.model;

public enum OrderStatus {
    PENDING,
    PAID,
    CANCELLED,
    EXPIRED,   // Pix não pago dentro do prazo; a chave reservada volta para o estoque
    REFUNDED
}
