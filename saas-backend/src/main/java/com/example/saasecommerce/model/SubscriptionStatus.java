package com.example.saasecommerce.model;

public enum SubscriptionStatus {
    /** Nos 7 dias de teste grátis. */
    TRIALING,
    /** Mensalidade em dia. */
    ACTIVE,
    /** Mensalidade vencida: a loja ainda fica aberta durante a tolerância. */
    PAST_DUE,
    /** Assinatura cancelada: a loja fica aberta até o fim do período já pago. */
    CANCELED
}
