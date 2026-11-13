package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.Tenant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TenantRepository extends JpaRepository<Tenant, UUID> {


    Optional<Tenant> findBySlug(String slug);
    boolean existsBySlug(String slug);
    Optional<Tenant> findByAsaasSubscriptionId(String asaasSubscriptionId);
}