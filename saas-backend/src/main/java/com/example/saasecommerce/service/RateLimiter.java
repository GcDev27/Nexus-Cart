package com.example.saasecommerce.service;

import com.example.saasecommerce.exception.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Janela deslizante em memória. Suficiente para uma instância do backend; com várias instâncias
 * o contador precisa ir para um armazenamento compartilhado (ex.: Redis).
 */
@Component
public class RateLimiter {

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    /** Registra uma ocorrência e lança 429 se a chave já passou do limite na janela. */
    public void hit(String key, int maxHits, long windowMillis, String message) {
        check(key, maxHits, windowMillis, message);
        record(key);
    }

    /** Lança 429 se a chave já está no limite, sem registrar (usado antes de conferir a senha). */
    public void check(String key, int maxHits, long windowMillis, String message) {
        if (count(key, windowMillis) >= maxHits) {
            throw new TooManyRequestsException(message);
        }
    }

    public void record(String key) {
        Deque<Long> queue = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (queue) {
            queue.addLast(System.currentTimeMillis());
        }
    }

    public void reset(String key) {
        hits.remove(key);
    }

    private int count(String key, long windowMillis) {
        Deque<Long> queue = hits.get(key);
        if (queue == null) return 0;
        long cutoff = System.currentTimeMillis() - windowMillis;
        synchronized (queue) {
            while (!queue.isEmpty() && queue.peekFirst() < cutoff) queue.pollFirst();
            return queue.size();
        }
    }
}
