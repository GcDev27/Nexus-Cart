package com.example.saasecommerce.repository;

import com.example.saasecommerce.model.Variation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VariationRepository extends JpaRepository<Variation, UUID> {

    // Lista todas as variações de um produto específico
    // Ordem de criação: a primeira opção cadastrada aparece primeiro no painel e na vitrine
    List<Variation> findAllByProductIdOrderByCreatedAtAsc(UUID productId);

    // Busca uma variação pelo ID, garantindo que pertence ao produto certo
    Optional<Variation> findByIdAndProductId(UUID id, UUID productId);
}
