package com.example.saasecommerce.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest {

        @NotBlank(message = "O nome é obrigatório")
        @Size(max = 100, message = "O nome pode ter no máximo 100 caracteres")
        private String name;

        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        @Size(max = 254, message = "E-mail longo demais")
        private String email;

        @NotBlank(message = "A senha é obrigatória")
        @Size(min = 8, max = 128, message = "A senha deve ter entre 8 e 128 caracteres")
        private String password;

        // NOVO CAMPO: O nome da loja que será criada automaticamente
        @NotBlank(message = "O nome da loja é obrigatório")
        @Size(max = 60, message = "O nome da loja pode ter no máximo 60 caracteres")
        private String storeName;

        // Plano escolhido para o teste grátis (STARTER, SUPER ou RICH). Vazio = Super.
        @Size(max = 20)
        private String plan;

        @jakarta.validation.constraints.AssertTrue(message = "Aceite os Termos de uso e a Política de privacidade para continuar")
        private boolean acceptedTerms;
}