package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.ChatDtos;
import com.example.saasecommerce.model.User;
import com.example.saasecommerce.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Caixa de conversas do lojista. A rota exige token de lojista (ROLE_USER). */
@RestController
@RequestMapping("/api/admin/chats")
@RequiredArgsConstructor
public class AdminChatController {

    private final ChatService chatService;

    @GetMapping
    public List<ChatDtos.ThreadSummary> list(@AuthenticationPrincipal User user) {
        return chatService.listForMerchant(user.getTenantId());
    }

    @GetMapping("/unread")
    public ChatDtos.UnreadCount unread(@AuthenticationPrincipal User user) {
        return new ChatDtos.UnreadCount(chatService.unreadForMerchant(user.getTenantId()));
    }

    @GetMapping("/{threadId}")
    public ChatDtos.ThreadDetail read(@AuthenticationPrincipal User user, @PathVariable UUID threadId) {
        return chatService.readAsMerchant(threadId, user.getTenantId());
    }

    @PostMapping("/{threadId}/messages")
    public ChatDtos.ThreadDetail send(@AuthenticationPrincipal User user, @PathVariable UUID threadId,
                                      @RequestBody ChatDtos.SendMessageRequest request) {
        return chatService.postAsMerchant(threadId, user.getTenantId(), request.content());
    }

    @PostMapping("/{threadId}/close")
    public ChatDtos.ThreadSummary close(@AuthenticationPrincipal User user, @PathVariable UUID threadId) {
        return chatService.setClosed(threadId, user.getTenantId(), true);
    }

    @PostMapping("/{threadId}/reopen")
    public ChatDtos.ThreadSummary reopen(@AuthenticationPrincipal User user, @PathVariable UUID threadId) {
        return chatService.setClosed(threadId, user.getTenantId(), false);
    }
}
