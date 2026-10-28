package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Optional<Order> findByExternalPaymentId(String externalPaymentId);
    List<Order> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(UUID tenantId, UUID customerId);
    List<Order> findByTenantIdAndCustomerEmailIgnoreCaseOrderByCreatedAtDesc(UUID tenantId, String customerEmail);
    long countByTenantId(UUID tenantId);
    long countByTenantIdAndCustomerId(UUID tenantId, UUID customerId);
}
