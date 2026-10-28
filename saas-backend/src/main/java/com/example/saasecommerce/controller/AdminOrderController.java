package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.OrderResponse;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.service.OrderCheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Endpoint protegido para simular aprovações de pagamento.
 * Apenas acessível por lojistas autenticados, com verificação de tenant.
 */
@RestController
@RequestMapping("/api/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {

    private final OrderCheckoutService checkoutService;

    @GetMapping
    public ResponseEntity<java.util.List<OrderResponse>> listOrders(
            @AuthenticationPrincipal User currentUser) {
        java.util.List<OrderResponse> orders = checkoutService.getOrdersForTenant(currentUser.getTenantId());
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrderDetails(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse response = checkoutService.getOrderByIdAndTenant(orderId, currentUser.getTenantId());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{orderId}/simulate-approval")
    public ResponseEntity<OrderResponse> simulateApproval(
            @PathVariable UUID orderId,
            @AuthenticationPrincipal User currentUser) {
        OrderResponse response = checkoutService.simulateApproval(orderId, currentUser.getTenantId());
        return ResponseEntity.ok(response);
    }
}
