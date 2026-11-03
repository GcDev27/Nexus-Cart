package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.StockLine;
import jakarta.persistence.LockModeType;
import jakarta.persistence.QueryHint;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.QueryHints;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StockLineRepository extends JpaRepository<StockLine, UUID> {

    // Lista todas as linhas de estoque de uma variação
    List<StockLine> findAllByVariationId(UUID variationId);

    // Conta quantas linhas ainda não foram entregues (inclui as reservadas)
    long countByVariationIdAndIsDeliveredFalse(UUID variationId);

    // Linhas livres para venda: não entregues e sem reserva válida
    @Query("select count(s) from StockLine s where s.variation.id = :variationId and s.isDelivered = false " +
           "and (s.reservedUntil is null or s.reservedUntil < :now)")
    long countAvailable(@Param("variationId") UUID variationId, @Param("now") LocalDateTime now);

    /**
     * Próxima linha livre, travada para escrita. O timeout -2 vira "SKIP LOCKED" no Postgres:
     * dois checkouts ao mesmo tempo pegam chaves diferentes em vez de esperar um pelo outro.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "-2"))
    @Query("select s from StockLine s where s.variation.id = :variationId and s.isDelivered = false " +
           "and (s.reservedUntil is null or s.reservedUntil < :now) order by s.createdAt asc")
    List<StockLine> findAvailableForUpdate(@Param("variationId") UUID variationId,
                                           @Param("now") LocalDateTime now,
                                           Pageable pageable);

    // Libera reservas de um pedido que expirou ou foi cancelado
    @org.springframework.data.jpa.repository.Modifying
    @Query("update StockLine s set s.reservedOrderId = null, s.reservedUntil = null " +
           "where s.reservedOrderId = :orderId and s.isDelivered = false")
    int releaseReservation(@Param("orderId") UUID orderId);

    // Linha reservada para um pedido específico
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<StockLine> findFirstByReservedOrderIdAndIsDeliveredFalse(UUID orderId);
}
