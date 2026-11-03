package com.example.saasecommerce.dto;

import com.example.saasecommerce.model.ChatSender;
import com.example.saasecommerce.model.ChatThreadType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public final class ChatDtos {

    private ChatDtos() {}

    public record ThreadSummary(
            UUID id,
            ChatThreadType type,
            String subject,
            boolean closed,
            UUID orderId,
            String customerName,
            String lastMessagePreview,
            LocalDateTime lastMessageAt,
            int unread) {}

    public record Message(UUID id, ChatSender sender, String content, LocalDateTime createdAt) {}

    public record ThreadDetail(ThreadSummary thread, List<Message> messages) {}

    public record SendMessageRequest(String content) {}

    public record UnreadCount(long unread) {}
}
