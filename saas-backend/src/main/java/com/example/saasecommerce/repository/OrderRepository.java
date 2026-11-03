package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.Order;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    List<Order> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    Optional<Order> findByExternalPaymentId(String externalPaymentId);

    // Trava a linha do pedido durante a aprovação (evita entregar duas chaves para o mesmo pedido)
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") UUID id);
    List<Order> findByTenantIdAndCustomerIdOrderByCreatedAtDesc(UUID tenantId, UUID customerId);
    List<Order> findByTenantIdAndCustomerEmailIgnoreCaseOrderByCreatedAtDesc(UUID tenantId, String customerEmail);
    long countByTenantId(UUID tenantId);
    long countByTenantIdAndCustomerId(UUID tenantId, UUID customerId);
}
