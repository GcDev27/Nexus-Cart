package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.ChatThread;
import com.example.saasecommerce.model.ChatThreadType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatThreadRepository extends JpaRepository<ChatThread, UUID> {

    List<ChatThread> findByTenantIdOrderByLastMessageAtDesc(UUID tenantId);

    List<ChatThread> findByTenantIdAndCustomerIdOrderByLastMessageAtDesc(UUID tenantId, UUID customerId);

    Optional<ChatThread> findByOrderId(UUID orderId);

    Optional<ChatThread> findFirstByTenantIdAndCustomerIdAndTypeAndClosedFalse(UUID tenantId, UUID customerId, ChatThreadType type);

    @Query("select coalesce(sum(t.unreadForMerchant), 0) from ChatThread t where t.tenantId = :tenantId")
    long sumUnreadForMerchant(@Param("tenantId") UUID tenantId);

    @Query("select coalesce(sum(t.unreadForCustomer), 0) from ChatThread t where t.tenantId = :tenantId and t.customerId = :customerId")
    long sumUnreadForCustomer(@Param("tenantId") UUID tenantId, @Param("customerId") UUID customerId);
}
