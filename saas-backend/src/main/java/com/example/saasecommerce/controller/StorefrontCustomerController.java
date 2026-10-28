package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.*;
import com.example.saasecommerce.model.Customer;
import com.example.saasecommerce.service.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/storefront/customer")
@RequiredArgsConstructor
public class StorefrontCustomerController {

    private final CustomerService customerService;

    @PostMapping("/register")
    public ResponseEntity<CustomerAuthResponse> register(
            @RequestHeader(value = "X-Tenant-Slug", required = false) String headerSlug,
            @RequestParam(value = "storeSlug", required = false) String paramSlug,
            @Valid @RequestBody CustomerRegisterRequest request) {

        String tenantSlug = headerSlug != null && !headerSlug.isBlank() ? headerSlug : paramSlug;
        if (tenantSlug == null || tenantSlug.isBlank()) {
            throw new IllegalArgumentException("Identificador da loja (X-Tenant-Slug) não informado.");
        }

        CustomerAuthResponse response = customerService.register(tenantSlug, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<CustomerAuthResponse> login(
            @RequestHeader(value = "X-Tenant-Slug", required = false) String headerSlug,
            @RequestParam(value = "storeSlug", required = false) String paramSlug,
            @Valid @RequestBody CustomerLoginRequest request) {

        String tenantSlug = headerSlug != null && !headerSlug.isBlank() ? headerSlug : paramSlug;
        if (tenantSlug == null || tenantSlug.isBlank()) {
            throw new IllegalArgumentException("Identificador da loja (X-Tenant-Slug) não informado.");
        }

        CustomerAuthResponse response = customerService.login(tenantSlug, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<CustomerDTO> getMe(@AuthenticationPrincipal Customer currentCustomer) {
        if (currentCustomer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(customerService.getProfile(currentCustomer));
    }

    @GetMapping("/orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(@AuthenticationPrincipal Customer currentCustomer) {
        if (currentCustomer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(customerService.getCustomerOrders(currentCustomer));
    }
}
