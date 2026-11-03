package com.example.saasecommerce.controller;

import com.example.saasecommerce.dto.ChatDtos;
import com.example.saasecommerce.model.Customer;
import com.example.saasecommerce.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/** Conversas do comprador logado (pedido e suporte). A rota exige token de comprador (ROLE_CUSTOMER). */
@RestController
@RequestMapping("/api/storefront/customer/chats")
@RequiredArgsConstructor
public class StorefrontChatController {

    private final ChatService chatService;

    @GetMapping
    public List<ChatDtos.ThreadSummary> list(@AuthenticationPrincipal Customer customer) {
        return chatService.listForCustomer(customer);
    }

    @GetMapping("/unread")
    public ChatDtos.UnreadCount unread(@AuthenticationPrincipal Customer customer) {
        return new ChatDtos.UnreadCount(chatService.unreadForCustomer(customer));
    }

    @PostMapping("/support")
    public ResponseEntity<ChatDtos.ThreadDetail> openSupport(@AuthenticationPrincipal Customer customer,
                                                             @RequestBody ChatDtos.SendMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chatService.openSupportThread(customer, request.content()));
    }

    @GetMapping("/{threadId}")
    public ChatDtos.ThreadDetail read(@AuthenticationPrincipal Customer customer, @PathVariable UUID threadId) {
        return chatService.readAsCustomer(threadId, customer);
    }

    @PostMapping("/{threadId}/messages")
    public ChatDtos.ThreadDetail send(@AuthenticationPrincipal Customer customer, @PathVariable UUID threadId,
                                      @RequestBody ChatDtos.SendMessageRequest request) {
        return chatService.postAsCustomer(threadId, customer, request.content());
    }
}
