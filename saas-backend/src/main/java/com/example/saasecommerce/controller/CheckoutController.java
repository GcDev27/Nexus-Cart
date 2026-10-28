package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.CreateOrderRequest;
import com.example.saasecommerce.dto.OrderResponse;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.service.OrderCheckoutService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/checkout")
@RequiredArgsConstructor
public class CheckoutController {

    private final OrderCheckoutService checkoutService;

    @PostMapping("/orders")
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        OrderResponse response = checkoutService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/orders/{orderId}/status")
    public ResponseEntity<OrderResponse> getOrderStatus(@PathVariable UUID orderId) {
        OrderResponse response = checkoutService.getOrderStatus(orderId);
        return ResponseEntity.ok(response);
    }
}
