package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    Optional<PasswordResetToken> findByTokenHash(String tokenHash);

    /** Ao trocar a senha, os outros links ainda abertos da mesma conta deixam de valer. */
    @Modifying
    @Query("update PasswordResetToken t set t.usedAt = :now where t.accountType = :type and t.accountId = :id and t.usedAt is null")
    void invalidateAll(PasswordResetToken.AccountType type, UUID id, LocalDateTime now);
}
