package com.example.saasecommerce.service;

import com.example.saasecommerce.dto.ChatDtos;
import com.example.saasecommerce.model.*;
import com.example.saasecommerce.repository.ChatMessageRepository;
import com.example.saasecommerce.repository.ChatThreadRepository;
import com.example.saasecommerce.repository.CustomerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final int PREVIEW_LENGTH = 140;

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final CustomerRepository customerRepository;
    private final RateLimiter rateLimiter;

    // ─── Criação ──────────────────────────────────────────────────

    /** Conversa do pedido com entrega manual. Idempotente: um pedido tem no máximo uma conversa. */
    @Transactional
    public ChatThread openOrderThread(Order order, String firstMessage) {
        if (order.getCustomerId() == null) return null;
        return threadRepository.findByOrderId(order.getId()).orElseGet(() -> {
            ChatThread thread = threadRepository.save(ChatThread.builder()
                    .tenantId(order.getTenantId())
                    .customerId(order.getCustomerId())
                    .orderId(order.getId())
                    .type(ChatThreadType.ORDER)
                    .subject(order.getProductName() + " (" + order.getVariationName() + ")")
                    .build());
            appendMessage(thread, ChatSender.SYSTEM, firstMessage);
            return thread;
        });
    }

    /** Suporte: reaproveita a conversa de suporte aberta do comprador em vez de criar várias. */
    @Transactional
    public ChatDtos.ThreadDetail openSupportThread(Customer customer, String content) {
        String text = validate(content);
        limitCustomer(customer);

        ChatThread thread = threadRepository
                .findFirstByTenantIdAndCustomerIdAndTypeAndClosedFalse(customer.getTenantId(), customer.getId(), ChatThreadType.SUPPORT)
                .orElseGet(() -> threadRepository.save(ChatThread.builder()
                        .tenantId(customer.getTenantId())
                        .customerId(customer.getId())
                        .type(ChatThreadType.SUPPORT)
                        .subject("Suporte")
                        .build()));

        appendMessage(thread, ChatSender.CUSTOMER, text);
        return detail(thread, customer.getName(), false);
    }

    // ─── Comprador ────────────────────────────────────────────────

    public List<ChatDtos.ThreadSummary> listForCustomer(Customer customer) {
        return threadRepository.findByTenantIdAndCustomerIdOrderByLastMessageAtDesc(customer.getTenantId(), customer.getId())
                .stream().map(t -> summary(t, customer.getName(), false)).toList();
    }

    @Transactional
    public ChatDtos.ThreadDetail readAsCustomer(UUID threadId, Customer customer) {
        ChatThread thread = ownedByCustomer(threadId, customer);
        thread.setUnreadForCustomer(0);
        return detail(threadRepository.save(thread), customer.getName(), false);
    }

    @Transactional
    public ChatDtos.ThreadDetail postAsCustomer(UUID threadId, Customer customer, String content) {
        ChatThread thread = ownedByCustomer(threadId, customer);
        String text = validate(content);
        limitCustomer(customer);
        // Resposta do comprador reabre uma conversa encerrada
        thread.setClosed(false);
        thread.setUnreadForCustomer(0);
        appendMessage(thread, ChatSender.CUSTOMER, text);
        return detail(thread, customer.getName(), false);
    }

    public long unreadForCustomer(Customer customer) {
        return threadRepository.sumUnreadForCustomer(customer.getTenantId(), customer.getId());
    }

    // ─── Lojista ──────────────────────────────────────────────────

    public List<ChatDtos.ThreadSummary> listForMerchant(UUID tenantId) {
        List<ChatThread> threads = threadRepository.findByTenantIdOrderByLastMessageAtDesc(tenantId);
        Map<UUID, String> names = customerRepository
                .findAllById(threads.stream().map(ChatThread::getCustomerId).distinct().toList())
                .stream().collect(Collectors.toMap(Customer::getId, Customer::getName, (a, b) -> a));
        return threads.stream()
                .map(t -> summary(t, names.getOrDefault(t.getCustomerId(), "Comprador"), true))
                .toList();
    }

    @Transactional
    public ChatDtos.ThreadDetail readAsMerchant(UUID threadId, UUID tenantId) {
        ChatThread thread = ownedByTenant(threadId, tenantId);
        thread.setUnreadForMerchant(0);
        return detail(threadRepository.save(thread), customerName(thread), true);
    }

    @Transactional
    public ChatDtos.ThreadDetail postAsMerchant(UUID threadId, UUID tenantId, String content) {
        ChatThread thread = ownedByTenant(threadId, tenantId);
        String text = validate(content);
        thread.setUnreadForMerchant(0);
        appendMessage(thread, ChatSender.MERCHANT, text);
        return detail(thread, customerName(thread), true);
    }

    @Transactional
    public ChatDtos.ThreadSummary setClosed(UUID threadId, UUID tenantId, boolean closed) {
        ChatThread thread = ownedByTenant(threadId, tenantId);
        thread.setClosed(closed);
        return summary(threadRepository.save(thread), customerName(thread), true);
    }

    public long unreadForMerchant(UUID tenantId) {
        return threadRepository.sumUnreadForMerchant(tenantId);
    }

    // ─── Internos ─────────────────────────────────────────────────

    private void appendMessage(ChatThread thread, ChatSender sender, String content) {
        ChatMessage message = messageRepository.save(ChatMessage.builder()
                .threadId(thread.getId())
                .sender(sender)
                .content(content)
                .build());

        thread.setLastMessageAt(message.getCreatedAt());
        thread.setLastMessagePreview(content.length() > PREVIEW_LENGTH ? content.substring(0, PREVIEW_LENGTH) + "…" : content);
        // Quem escreve não tem o que ler; o outro lado ganha uma mensagem não lida
        if (sender == ChatSender.CUSTOMER) {
            thread.setUnreadForMerchant(thread.getUnreadForMerchant() + 1);
        } else {
            thread.setUnreadForCustomer(thread.getUnreadForCustomer() + 1);
        }
        threadRepository.save(thread);
    }

    private String validate(String content) {
        String text = content == null ? "" : content.trim();
        if (text.isEmpty()) throw new IllegalArgumentException("Escreva uma mensagem.");
        if (text.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("A mensagem pode ter no máximo " + MAX_MESSAGE_LENGTH + " caracteres.");
        }
        return text;
    }

    private void limitCustomer(Customer customer) {
        rateLimiter.hit("chat:" + customer.getId(), 15, 60_000, "Você enviou muitas mensagens seguidas. Aguarde um minuto.");
    }

    private ChatThread ownedByCustomer(UUID threadId, Customer customer) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Conversa não encontrada."));
        // Mesma mensagem para "não existe" e "não é sua": não revela conversas de outros compradores
        if (!thread.getCustomerId().equals(customer.getId()) || !thread.getTenantId().equals(customer.getTenantId())) {
            throw new IllegalArgumentException("Conversa não encontrada.");
        }
        return thread;
    }

    private ChatThread ownedByTenant(UUID threadId, UUID tenantId) {
        ChatThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Conversa não encontrada."));
        if (!thread.getTenantId().equals(tenantId)) {
            throw new IllegalArgumentException("Conversa não encontrada.");
        }
        return thread;
    }

    private String customerName(ChatThread thread) {
        return customerRepository.findById(thread.getCustomerId()).map(Customer::getName).orElse("Comprador");
    }

    private ChatDtos.ThreadSummary summary(ChatThread t, String customerName, boolean merchantView) {
        return new ChatDtos.ThreadSummary(
                t.getId(), t.getType(), t.getSubject(), t.isClosed(), t.getOrderId(), customerName,
                t.getLastMessagePreview(), t.getLastMessageAt(),
                merchantView ? t.getUnreadForMerchant() : t.getUnreadForCustomer());
    }

    private ChatDtos.ThreadDetail detail(ChatThread thread, String customerName, boolean merchantView) {
        List<ChatDtos.Message> messages = messageRepository.findByThreadIdOrderByCreatedAtAsc(thread.getId()).stream()
                .map(m -> new ChatDtos.Message(m.getId(), m.getSender(), m.getContent(), m.getCreatedAt()))
                .toList();
        return new ChatDtos.ThreadDetail(summary(thread, customerName, merchantView), messages);
    }
}
