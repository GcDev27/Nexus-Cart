package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.PaymentGatewayConfig;
import com.example.saasecommerce.model.PaymentProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentGatewayConfigRepository extends JpaRepository<PaymentGatewayConfig, UUID> {

    List<PaymentGatewayConfig> findByTenantId(UUID tenantId);

    Optional<PaymentGatewayConfig> findByTenantIdAndProvider(UUID tenantId, PaymentProvider provider);

    Optional<PaymentGatewayConfig> findByTenantIdAndIsPixProviderTrue(UUID tenantId);
}
