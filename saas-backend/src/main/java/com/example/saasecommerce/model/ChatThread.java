package com.example.saasecommerce.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_threads", indexes = {
        @Index(name = "idx_chat_thread_tenant", columnList = "tenant_id, last_message_at"),
        @Index(name = "idx_chat_thread_customer", columnList = "customer_id, last_message_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatThread {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "customer_id", nullable = false)
    private UUID customerId;

    // Preenchido só nas conversas de pedido
    @Column(name = "order_id", unique = true)
    private UUID orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ChatThreadType type;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    @Builder.Default
    private boolean closed = false;

    @Column(name = "last_message_preview")
    private String lastMessagePreview;

    @Column(name = "last_message_at", nullable = false)
    private LocalDateTime lastMessageAt;

    @Column(name = "unread_for_merchant", nullable = false)
    @Builder.Default
    private int unreadForMerchant = 0;

    @Column(name = "unread_for_customer", nullable = false)
    @Builder.Default
    private int unreadForCustomer = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (lastMessageAt == null) lastMessageAt = createdAt;
    }
}
