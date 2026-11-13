package com.example.saasecommerce.controller;

import com.example.saasecommerce.model.Plan;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.service.SubscriptionService;
import com.example.saasecommerce.service.TenantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Plano e mensalidade da loja do lojista logado. */
@RestController
@RequestMapping("/api/admin/assinatura")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final TenantService tenantService;

    public record SubscribeRequest(String plan, String cpfCnpj) {}

    @GetMapping
    public ResponseEntity<SubscriptionService.SubscriptionView> get(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.view(tenantService.getTenantById(user.getTenantId()), true));
    }

    @PostMapping
    public ResponseEntity<SubscriptionService.SubscriptionView> subscribe(
            @AuthenticationPrincipal User user, @RequestBody SubscribeRequest request) {
        return ResponseEntity.ok(subscriptionService.subscribe(user, Plan.parse(request.plan()), request.cpfCnpj()));
    }

    @PostMapping("/cancelar")
    public ResponseEntity<SubscriptionService.SubscriptionView> cancel(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.cancel(user));
    }
}
