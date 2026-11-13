package com.example.saasecommerce.model;

import java.math.BigDecimal;

/** Planos mensais do NexusCart. Preços e recursos iguais aos da landing. */
public enum Plan {
    STARTER("Starter", new BigDecimal("20.00"), false, false),
    SUPER("Super", new BigDecimal("40.00"), true, true),
    RICH("Rich", new BigDecimal("70.00"), true, true);

    private final String label;
    private final BigDecimal monthlyPrice;
    private final boolean customDesign;
    private final boolean salesDashboard;

    Plan(String label, BigDecimal monthlyPrice, boolean customDesign, boolean salesDashboard) {
        this.label = label;
        this.monthlyPrice = monthlyPrice;
        this.customDesign = customDesign;
        this.salesDashboard = salesDashboard;
    }

    public String label() { return label; }
    public BigDecimal monthlyPrice() { return monthlyPrice; }
    /** Tema, cores, fontes, cantos, logo e banner da loja. */
    public boolean customDesign() { return customDesign; }
    /** Painel de vendas com gráficos. */
    public boolean salesDashboard() { return salesDashboard; }

    public static Plan parse(String value) {
        if (value == null || value.isBlank()) return SUPER;
        try {
            return Plan.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Plano inválido. Escolha Starter, Super ou Rich.");
        }
    }
}
