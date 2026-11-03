'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type ChatSender = 'CUSTOMER' | 'MERCHANT' | 'SYSTEM';

export type ChatThreadSummary = {
  id: string;
  type: 'ORDER' | 'SUPPORT';
  subject: string;
  closed: boolean;
  orderId: string | null;
  customerName: string;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  unread: number;
};

export type ChatMessage = { id: string; sender: ChatSender; content: string; createdAt: string };

export type ChatThreadDetail = { thread: ChatThreadSummary; messages: ChatMessage[] };

export const CHAT_POLL_MS = 4000;
export const MAX_CHAT_MESSAGE = 2000;

/** "14:32" para hoje, "ontem 14:32" ou "12/10 14:32" para dias anteriores. */
export function formatChatTime(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return time;
  if (date.toDateString() === yesterday.toDateString()) return `ontem ${time}`;
  return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} ${time}`;
}

/**
 * Executa `load` agora e a cada `intervalMs`, só enquanto a aba está visível
 * (não gasta requisições com a aba em segundo plano). Recarrega ao voltar para a aba.
 */
export function usePolling(load: () => Promise<void> | void, intervalMs: number, enabled = true) {
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | null = null;
    const tick = () => {
      if (document.visibilityState === 'visible') loadRef.current();
    };
    const start = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(tick, intervalMs);
    };
    loadRef.current();
    start();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadRef.current();
        start();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs, enabled]);
}

/** Rola até o fim quando chegam mensagens novas, mas só se a pessoa já estava perto do fim. */
export function useStickToBottom(dependency: unknown) {
  const ref = useRef<HTMLDivElement | null>(null);
  const nearBottom = useRef(true);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [dependency]);

  return { ref, onScroll };
}

/** Estado de envio comum aos dois lados do chat. */
export function useComposer(send: (text: string) => Promise<void>) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    try {
      await send(content);
      setText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar.');
    } finally {
      setSending(false);
    }
  };

  return { text, setText, sending, error, submit };
}

export async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  return body?.error || fallback;
}
