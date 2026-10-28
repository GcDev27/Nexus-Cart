package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.CustomerDTO;
import com.example.saasecommerce.dto.OrderResponse;
import com.example.saasecommerce.model.Customer;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.repository.CustomerRepository;
import com.example.saasecommerce.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/customers")
@RequiredArgsConstructor
public class AdminCustomerController {

    private final CustomerRepository customerRepository;
    private final CustomerService customerService;

    @GetMapping
    public ResponseEntity<List<CustomerDTO>> listCustomers(@AuthenticationPrincipal User currentUser) {
        List<Customer> customers = customerRepository.findByTenantIdOrderByCreatedAtDesc(currentUser.getTenantId());
        List<CustomerDTO> dtos = customers.stream()
                .map(customerService::toDTO)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{customerId}")
    public ResponseEntity<Map<String, Object>> getCustomerDetails(
            @PathVariable UUID customerId,
            @AuthenticationPrincipal User currentUser) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado"));

        if (!customer.getTenantId().equals(currentUser.getTenantId())) {
            throw new IllegalArgumentException("Acesso negado: este cliente não pertence à sua loja.");
        }

        CustomerDTO dto = customerService.toDTO(customer);
        List<OrderResponse> orders = customerService.getCustomerOrders(customer);

        Map<String, Object> response = new HashMap<>();
        response.put("customer", dto);
        response.put("orders", orders);

        return ResponseEntity.ok(response);
    }
}
