package com.example.saasecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // expiração de pedidos e limpeza do limitador de requisições
public class SaasEcommerceApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaasEcommerceApplication.class, args);
    }

}
