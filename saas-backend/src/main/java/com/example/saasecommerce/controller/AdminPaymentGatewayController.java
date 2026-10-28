package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.PaymentGatewayDTO;
import com.example.saasecommerce.dto.SavePaymentGatewayRequest;
import com.example.saasecommerce.model.PaymentProvider;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.service.PaymentGatewayConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/gateways")
@RequiredArgsConstructor
public class AdminPaymentGatewayController {

    private final PaymentGatewayConfigService gatewayConfigService;

    @GetMapping
    public ResponseEntity<List<PaymentGatewayDTO>> getConfigs(
            @AuthenticationPrincipal User currentUser) {
        List<PaymentGatewayDTO> configs = gatewayConfigService.getConfigsForTenant(currentUser.getTenantId());
        return ResponseEntity.ok(configs);
    }

    @PutMapping("/{provider}")
    public ResponseEntity<PaymentGatewayDTO> updateConfig(
            @AuthenticationPrincipal User currentUser,
            @PathVariable PaymentProvider provider,
            @RequestBody SavePaymentGatewayRequest request) {
        PaymentGatewayDTO updated = gatewayConfigService.saveOrUpdateConfig(currentUser.getTenantId(), provider, request);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/pix-provider/{provider}")
    public ResponseEntity<PaymentGatewayDTO> setPixProvider(
            @AuthenticationPrincipal User currentUser,
            @PathVariable PaymentProvider provider) {
        PaymentGatewayDTO updated = gatewayConfigService.setPixProvider(currentUser.getTenantId(), provider);
        return ResponseEntity.ok(updated);
    }
}
