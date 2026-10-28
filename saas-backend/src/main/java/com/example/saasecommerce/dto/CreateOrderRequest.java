package com.example.saasecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotBlank(message = "Slug da loja é obrigatório")
    private String tenantSlug;

    @NotNull(message = "ID da variação é obrigatório")
    private UUID variationId;

    @NotBlank(message = "Nome do comprador é obrigatório")
    private String customerName;

    @NotBlank(message = "E-mail do comprador é obrigatório")
    @Email(message = "E-mail inválido")
    private String customerEmail;

    private String customerCpf;

    private UUID customerId;
}
