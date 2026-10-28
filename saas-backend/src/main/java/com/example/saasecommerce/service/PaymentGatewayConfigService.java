package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.PaymentGatewayDTO;
import com.example.saasecommerce.dto.SavePaymentGatewayRequest;
import com.example.saasecommerce.model.PaymentGatewayConfig;
import com.example.saasecommerce.model.PaymentProvider;
import com.example.saasecommerce.repository.PaymentGatewayConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentGatewayConfigService {

    private final PaymentGatewayConfigRepository repository;

    @Transactional(readOnly = true)
    public List<PaymentGatewayDTO> getConfigsForTenant(UUID tenantId) {
        List<PaymentGatewayConfig> existingConfigs = repository.findByTenantId(tenantId);
        Map<PaymentProvider, PaymentGatewayConfig> configMap = existingConfigs.stream()
                .collect(Collectors.toMap(PaymentGatewayConfig::getProvider, Function.identity()));

        List<PaymentGatewayDTO> dtos = new ArrayList<>();
        for (PaymentProvider provider : PaymentProvider.values()) {
            PaymentGatewayConfig config = configMap.get(provider);
            if (config != null) {
                dtos.add(mapToDto(config));
            } else {
                dtos.add(PaymentGatewayDTO.builder()
                        .provider(provider)
                        .enabled(false)
                        .isPixProvider(false)
                        .clientId("")
                        .clientSecret("")
                        .publicKey("")
                        .build());
            }
        }
        return dtos;
    }

    @Transactional
    public PaymentGatewayDTO saveOrUpdateConfig(UUID tenantId, PaymentProvider provider, SavePaymentGatewayRequest request) {
        PaymentGatewayConfig config = repository.findByTenantIdAndProvider(tenantId, provider)
                .orElseGet(() -> PaymentGatewayConfig.builder()
                        .tenantId(tenantId)
                        .provider(provider)
                        .build());

        config.setEnabled(request.isEnabled());
        
        // Atualiza apenas se uma chave nova for fornecida ou mantiver existente
        if (request.getClientId() != null) {
            config.setClientId(request.getClientId());
        }
        if (request.getClientSecret() != null && !request.getClientSecret().isBlank() && !request.getClientSecret().startsWith("****")) {
            config.setClientSecret(request.getClientSecret());
        }
        if (request.getPublicKey() != null) {
            config.setPublicKey(request.getPublicKey());
        }
        config.setFeePercentage(request.getFeePercentage());
        config.setFeeFixed(request.getFeeFixed());

        PaymentGatewayConfig saved = repository.save(config);
        return mapToDto(saved);
    }

    @Transactional
    public PaymentGatewayDTO setPixProvider(UUID tenantId, PaymentProvider provider) {
        List<PaymentGatewayConfig> configs = repository.findByTenantId(tenantId);
        for (PaymentGatewayConfig c : configs) {
            if (c.getProvider() == provider) {
                c.setPixProvider(true);
                c.setEnabled(true);
            } else {
                c.setPixProvider(false);
            }
        }
        repository.saveAll(configs);

        PaymentGatewayConfig activePix = repository.findByTenantIdAndProvider(tenantId, provider)
                .orElseGet(() -> repository.save(PaymentGatewayConfig.builder()
                        .tenantId(tenantId)
                        .provider(provider)
                        .enabled(true)
                        .isPixProvider(true)
                        .build()));

        return mapToDto(activePix);
    }

    private PaymentGatewayDTO mapToDto(PaymentGatewayConfig config) {
        String maskedSecret = "";
        if (config.getClientSecret() != null && !config.getClientSecret().isBlank()) {
            int len = config.getClientSecret().length();
            maskedSecret = len > 8 
                ? config.getClientSecret().substring(0, 4) + "••••••••" + config.getClientSecret().substring(len - 4)
                : "••••••••";
        }

        return PaymentGatewayDTO.builder()
                .id(config.getId())
                .provider(config.getProvider())
                .enabled(config.isEnabled())
                .isPixProvider(config.isPixProvider())
                .clientId(config.getClientId() != null ? config.getClientId() : "")
                .clientSecret(maskedSecret)
                .publicKey(config.getPublicKey() != null ? config.getPublicKey() : "")
                .feePercentage(config.getFeePercentage())
                .feeFixed(config.getFeeFixed())
                .build();
    }
}
