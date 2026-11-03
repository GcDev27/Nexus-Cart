'use client';

import React, { Suspense, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Headphones, Package, Send, MessageCircle } from 'lucide-react';
import { useStore } from '../../../components/store/StoreContext';
import { AnnouncementBar, StoreFooter, StoreHeader } from '../../../components/store/StoreChrome';
import { customerFetch, getStoreCustomerToken } from '../../../lib/customerAuth';
import {
  CHAT_POLL_MS, MAX_CHAT_MESSAGE, ChatThreadDetail, ChatThreadSummary,
  errorMessage, formatChatTime, useComposer, usePolling, useStickToBottom,
} from '../../../lib/chat';

const radius = { borderRadius: 'var(--store-radius)' };
const radiusSm = { borderRadius: 'var(--store-radius-sm)' };
const brandButton = { background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' };

function ConversationsContent() {
  const store = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get('thread');
  const startSupport = searchParams.get('novo') === 'suporte';

  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);

  const loadThreads = useCallback(async () => {
    if (!getStoreCustomerToken(store.id)) {
      const back = `/loja/${store.slug}/conversas${window.location.search}`;
      router.replace(`/loja/${store.slug}/login?redirect=${encodeURIComponent(back)}`);
      return;
    }
    const res = await customerFetch('/api/storefront/customer/chats', {}, store.slug);
    if (res.ok) setThreads(await res.json());
  }, [store.id, store.slug, router]);

  usePolling(loadThreads, CHAT_POLL_MS * 2);

  const select = (id: string | null, extra = '') =>
    router.push(`/loja/${store.slug}/conversas${id ? `?thread=${id}` : extra}`, { scroll: false });

  const showingThread = Boolean(selectedId) || startSupport;

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Conversas</h1>
            <p className="mt-1 text-[var(--text-secondary)]">Fale com {store.name} sobre seus pedidos ou tire dúvidas.</p>
          </div>
          <button
            type="button"
            onClick={() => select(null, '?novo=suporte')}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 text-sm font-semibold hover:brightness-110"
            style={brandButton}
          >
            <Headphones className="w-4 h-4" />
            Falar com o suporte
          </button>
        </div>

        <div
          className="grid md:grid-cols-[320px_1fr] min-h-[560px] bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden"
          style={radius}
        >
          {/* Lista de conversas */}
          <aside className={`border-r border-[var(--border-color)] ${showingThread ? 'hidden md:block' : ''}`}>
            {threads === null ? (
              <p className="p-6 text-sm text-[var(--text-secondary)]">Carregando...</p>
            ) : threads.length === 0 ? (
              <div className="p-6 text-center">
                <MessageCircle className="w-8 h-8 mx-auto text-[var(--text-muted)]" aria-hidden />
                <p className="mt-3 text-sm font-medium">Nenhuma conversa ainda</p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  Compras com entrega manual abrem uma conversa automaticamente. Para outras dúvidas, use o suporte.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-color)] max-h-[560px] overflow-y-auto">
                {threads.map((t) => {
                  const active = t.id === selectedId;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => select(t.id)}
                        className={`w-full text-left px-4 py-3.5 flex gap-3 transition-colors ${active ? '' : 'hover:bg-[var(--surface-hover)]'}`}
                        style={active ? { background: 'color-mix(in srgb, var(--color-brand) 12%, transparent)' } : undefined}
                      >
                        <span
                          className="w-9 h-9 shrink-0 flex items-center justify-center"
                          style={{ ...radiusSm, background: 'var(--surface-hover)', color: 'var(--color-brand)' }}
                          aria-hidden
                        >
                          {t.type === 'ORDER' ? <Package className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold truncate">{t.type === 'ORDER' ? t.subject : 'Suporte'}</span>
                            <span className="text-[11px] text-[var(--text-muted)] shrink-0">{formatChatTime(t.lastMessageAt)}</span>
                          </span>
                          <span className="flex items-center justify-between gap-2 mt-0.5">
                            <span className="text-xs text-[var(--text-secondary)] truncate">{t.lastMessagePreview}</span>
                            {t.unread > 0 && (
                              <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}>
                                {t.unread}
                              </span>
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {/* Conversa aberta */}
          <section className={`flex flex-col min-h-[560px] ${showingThread ? '' : 'hidden md:flex'}`}>
            {selectedId ? (
              <ThreadView key={selectedId} threadId={selectedId} onBack={() => select(null)} onChange={loadThreads} />
            ) : startSupport ? (
              <NewSupport
                onCreated={(id) => {
                  loadThreads();
                  select(id);
                }}
                onBack={() => select(null)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-[var(--text-secondary)]">
                Escolha uma conversa ao lado.
              </div>
            )}
          </section>
        </div>
      </main>

      <StoreFooter />
    </div>
  );
}

function Composer({ onSend, placeholder }: { onSend: (text: string) => Promise<void>; placeholder: string }) {
  const { text, setText, sending, error, submit } = useComposer(onSend);
  return (
    <form
      className="border-t border-[var(--border-color)] p-3 sm:p-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      {error && <p role="alert" className="mb-2 text-xs text-red-500">{error}</p>}
      <div className="flex items-end gap-2">
        <label className="flex-1">
          <span className="sr-only">Mensagem</span>
          <textarea
            rows={1}
            value={text}
            maxLength={MAX_CHAT_MESSAGE}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              // Enter envia; Shift+Enter quebra a linha
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder={placeholder}
            className="w-full max-h-36 resize-none bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--color-brand)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            style={radiusSm}
          />
        </label>
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="shrink-0 h-[42px] px-4 flex items-center gap-2 text-sm font-semibold disabled:opacity-40"
          style={brandButton}
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{sending ? 'Enviando' : 'Enviar'}</span>
        </button>
      </div>
    </form>
  );
}

function ThreadView({ threadId, onBack, onChange }: { threadId: string; onBack: () => void; onChange: () => void }) {
  const store = useStore();
  const [detail, setDetail] = useState<ChatThreadDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { ref, onScroll } = useStickToBottom(detail?.messages.length);

  const load = useCallback(async () => {
    const res = await customerFetch(`/api/storefront/customer/chats/${threadId}`, {}, store.slug);
    if (res.ok) {
      const data: ChatThreadDetail = await res.json();
      // Só re-renderiza quando chegou mensagem nova
      setDetail((prev) => (prev && prev.messages.length === data.messages.length && prev.thread.closed === data.thread.closed ? prev : data));
    } else if (res.status === 400 || res.status === 404) {
      setNotFound(true);
    }
  }, [threadId, store.slug]);

  usePolling(load, CHAT_POLL_MS);

  const send = async (content: string) => {
    const res = await customerFetch(`/api/storefront/customer/chats/${threadId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }, store.slug);
    if (!res.ok) throw new Error(await errorMessage(res, 'Não foi possível enviar.'));
    setDetail(await res.json());
    onChange();
  };

  if (notFound) {
    return <div className="flex-1 flex items-center justify-center p-8 text-sm text-[var(--text-secondary)]">Conversa não encontrada.</div>;
  }
  if (!detail) {
    return <div className="flex-1 flex items-center justify-center p-8 text-sm text-[var(--text-secondary)]">Carregando...</div>;
  }

  const { thread, messages } = detail;
  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
        <button type="button" onClick={onBack} className="md:hidden p-1 -ml-1 text-[var(--text-secondary)]" aria-label="Voltar para a lista">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{thread.type === 'ORDER' ? thread.subject : 'Suporte'}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {thread.type === 'ORDER' ? 'Conversa do pedido' : `Atendimento de ${store.name}`}
            {thread.closed && ' (encerrada pela loja)'}
          </p>
        </div>
        {thread.orderId && (
          <Link href={`/loja/${store.slug}/minhas-compras`} className="shrink-0 text-xs font-medium text-[var(--color-brand)] hover:underline">
            Ver pedido
          </Link>
        )}
      </header>

      <div ref={ref} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-5 space-y-3 max-h-[480px]" aria-live="polite">
        {messages.map((m) => {
          if (m.sender === 'SYSTEM') {
            return (
              <div key={m.id} className="mx-auto max-w-md text-center px-4 py-3 text-sm border border-dashed border-[var(--border-color)] text-[var(--text-secondary)]" style={radiusSm}>
                <p className="text-[11px] font-semibold text-[var(--text-muted)] mb-1">Mensagem automática da loja</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            );
          }
          const mine = m.sender === 'CUSTOMER';
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3.5 py-2.5 text-sm ${mine ? '' : 'bg-[var(--bg-primary)] border border-[var(--border-color)]'}`}
                style={{
                  ...radiusSm,
                  ...(mine ? { background: 'var(--color-brand)', color: 'var(--store-on-brand)' } : {}),
                }}
              >
                {!mine && <p className="text-[11px] font-semibold mb-0.5 text-[var(--color-brand)]">{store.name}</p>}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] text-right ${mine ? 'opacity-75' : 'text-[var(--text-muted)]'}`}>{formatChatTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Composer onSend={send} placeholder={thread.closed ? 'Escreva para reabrir a conversa' : 'Escreva sua mensagem'} />
    </>
  );
}

function NewSupport({ onCreated, onBack }: { onCreated: (id: string) => void; onBack: () => void }) {
  const store = useStore();
  const send = async (content: string) => {
    const res = await customerFetch('/api/storefront/customer/chats/support', {
      method: 'POST',
      body: JSON.stringify({ content }),
    }, store.slug);
    if (!res.ok) throw new Error(await errorMessage(res, 'Não foi possível enviar.'));
    const data: ChatThreadDetail = await res.json();
    onCreated(data.thread.id);
  };

  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border-color)]">
        <button type="button" onClick={onBack} className="md:hidden p-1 -ml-1 text-[var(--text-secondary)]" aria-label="Voltar para a lista">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="font-semibold">Falar com o suporte</p>
          <p className="text-xs text-[var(--text-secondary)]">A loja responde por aqui. Você vê a resposta nesta página.</p>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="max-w-sm">
          <Headphones className="w-9 h-9 mx-auto text-[var(--color-brand)]" aria-hidden />
          <p className="mt-3 font-medium">Como podemos ajudar?</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            Para dúvidas sobre um pedido, conte o número dele (está em Minhas compras).
          </p>
        </div>
      </div>
      <Composer onSend={send} placeholder="Escreva sua dúvida" />
    </>
  );
}

export default function ConversasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ConversationsContent />
    </Suspense>
  );
}
