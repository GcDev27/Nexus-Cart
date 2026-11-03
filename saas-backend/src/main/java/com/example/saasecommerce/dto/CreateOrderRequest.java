package com.example.saasecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
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
    @Size(max = 80, message = "Loja inválida")
    private String tenantSlug;

    @NotNull(message = "ID da variação é obrigatório")
    private UUID variationId;

    @NotBlank(message = "Nome do comprador é obrigatório")
    @Size(max = 100, message = "O nome pode ter no máximo 100 caracteres")
    private String customerName;

    @NotBlank(message = "E-mail do comprador é obrigatório")
    @Email(message = "E-mail inválido")
    @Size(max = 254, message = "E-mail longo demais")
    private String customerEmail;

    @Size(max = 14, message = "CPF inválido")

    private String customerCpf;
}
