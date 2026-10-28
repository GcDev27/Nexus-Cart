package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, UUID> {
    Optional<Customer> findByTenantIdAndEmail(UUID tenantId, String email);
    List<Customer> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);
    boolean existsByTenantIdAndEmail(UUID tenantId, String email);
    long countByTenantId(UUID tenantId);
}
