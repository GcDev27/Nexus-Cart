"use client";

import { Suspense, useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authFetch } from "../../lib/auth";
import {
  CHAT_POLL_MS, MAX_CHAT_MESSAGE, ChatThreadDetail, ChatThreadSummary,
  errorMessage, formatChatTime, useComposer, usePolling, useStickToBottom,
} from "../../lib/chat";

type Filter = "open" | "unread" | "closed";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "Abertas" },
  { id: "unread", label: "Não lidas" },
  { id: "closed", label: "Encerradas" },
];

function ConversationsAdmin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("thread");
  const [threads, setThreads] = useState<ChatThreadSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");

  const loadThreads = useCallback(async () => {
    const res = await authFetch("/api/admin/chats");
    if (res.ok) setThreads(await res.json());
  }, []);

  usePolling(loadThreads, CHAT_POLL_MS * 2);

  const select = (id: string | null) => router.push(id ? `/admin/conversas?thread=${id}` : "/admin/conversas", { scroll: false });

  const visible = (threads || []).filter(t =>
    filter === "closed" ? t.closed : filter === "unread" ? t.unread > 0 : !t.closed
  );
  const counts = {
    open: (threads || []).filter(t => !t.closed).length,
    unread: (threads || []).filter(t => t.unread > 0).length,
    closed: (threads || []).filter(t => t.closed).length,
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-space-lg pb-10 pt-1 sm:pt-space-md">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">Conversas</h1>
        <p className="text-xs sm:text-sm text-outline mt-0.5">
          Mensagens dos compradores: entregas manuais combinadas pelo chat do pedido e pedidos de suporte.
        </p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] min-h-[600px] bg-surface-container-low border border-surface-container-high/40 rounded-xl overflow-hidden">
        <aside className={`flex flex-col border-r border-surface-container-high/40 ${selectedId ? "hidden lg:flex" : ""}`}>
          <div className="flex gap-1 p-2 border-b border-surface-container-high/40">
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  filter === f.id ? "bg-surface-container text-on-surface" : "text-outline hover:text-on-surface"
                }`}
              >
                {f.label} <span className="opacity-60 tabular-nums">{counts[f.id]}</span>
              </button>
            ))}
          </div>

          {threads === null ? (
            <p className="p-6 text-sm text-outline">Carregando...</p>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-3xl text-outline">forum</span>
              <p className="mt-2 text-sm text-on-surface">
                {filter === "unread" ? "Nada pendente por aqui." : filter === "closed" ? "Nenhuma conversa encerrada." : "Nenhuma conversa aberta."}
              </p>
              <p className="mt-1 text-xs text-outline">
                Conversas aparecem quando alguém compra um produto com entrega manual ou chama o suporte na loja.
              </p>
            </div>
          ) : (
            <ul className="flex-1 overflow-y-auto divide-y divide-surface-container-high/30 max-h-[560px]">
              {visible.map(t => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => select(t.id)}
                      className={`w-full text-left px-4 py-3.5 flex gap-3 transition-colors ${active ? "bg-primary-container/10" : "hover:bg-surface-container"}`}
                    >
                      <span className="w-9 h-9 shrink-0 rounded-lg bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg text-primary">{t.type === "ORDER" ? "package_2" : "support_agent"}</span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${t.unread > 0 ? "font-bold text-on-surface" : "font-medium text-on-surface"}`}>{t.customerName}</span>
                          <span className="text-[11px] text-outline shrink-0">{formatChatTime(t.lastMessageAt)}</span>
                        </span>
                        <span className="block text-[11px] text-primary truncate">{t.type === "ORDER" ? t.subject : "Suporte"}</span>
                        <span className="flex items-center justify-between gap-2 mt-0.5">
                          <span className="text-xs text-outline truncate">{t.lastMessagePreview}</span>
                          {t.unread > 0 && (
                            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary-container text-on-primary text-[11px] font-bold flex items-center justify-center">
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

        <section className={`flex flex-col min-h-[600px] ${selectedId ? "" : "hidden lg:flex"}`}>
          {selectedId ? (
            <AdminThread key={selectedId} threadId={selectedId} onBack={() => select(null)} onChange={loadThreads} />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-sm text-outline">Escolha uma conversa ao lado.</div>
          )}
        </section>
      </div>
    </div>
  );
}

function AdminThread({ threadId, onBack, onChange }: { threadId: string; onBack: () => void; onChange: () => void }) {
  const [detail, setDetail] = useState<ChatThreadDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { ref, onScroll } = useStickToBottom(detail?.messages.length);

  const load = useCallback(async () => {
    const res = await authFetch(`/api/admin/chats/${threadId}`);
    if (res.ok) {
      const data: ChatThreadDetail = await res.json();
      setDetail(prev => (prev && prev.messages.length === data.messages.length && prev.thread.closed === data.thread.closed ? prev : data));
    } else {
      setNotFound(true);
    }
  }, [threadId]);

  usePolling(load, CHAT_POLL_MS);

  const send = async (content: string) => {
    const res = await authFetch(`/api/admin/chats/${threadId}/messages`, { method: "POST", body: JSON.stringify({ content }) });
    if (!res.ok) throw new Error(await errorMessage(res, "Não foi possível enviar."));
    setDetail(await res.json());
    onChange();
  };
  const { text, setText, sending, error, submit } = useComposer(send);

  const toggleClosed = async () => {
    if (!detail) return;
    const res = await authFetch(`/api/admin/chats/${threadId}/${detail.thread.closed ? "reopen" : "close"}`, { method: "POST" });
    if (res.ok) {
      const thread: ChatThreadSummary = await res.json();
      setDetail({ ...detail, thread });
      onChange();
    }
  };

  if (notFound) return <div className="flex-1 flex items-center justify-center text-sm text-outline">Conversa não encontrada.</div>;
  if (!detail) return <div className="flex-1 flex items-center justify-center text-sm text-outline">Carregando...</div>;

  const { thread, messages } = detail;
  return (
    <>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-surface-container-high/40">
        <button type="button" onClick={onBack} className="lg:hidden p-1 -ml-1 text-outline" aria-label="Voltar para a lista">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-on-surface truncate">{thread.customerName}</p>
          <p className="text-xs text-outline truncate">
            {thread.type === "ORDER" ? `Pedido: ${thread.subject}` : "Suporte"}
            {thread.closed && " (encerrada)"}
          </p>
        </div>
        {thread.orderId && (
          <a href="/admin/pedidos" className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline shrink-0">
            <span className="material-symbols-outlined text-base">receipt_long</span>
            #{thread.orderId.slice(0, 8)}
          </a>
        )}
        <button
          type="button"
          onClick={toggleClosed}
          className="shrink-0 px-3 py-1.5 rounded-lg border border-surface-container-high text-xs font-medium text-on-surface hover:bg-surface-container"
        >
          {thread.closed ? "Reabrir" : "Encerrar"}
        </button>
      </header>

      <div ref={ref} onScroll={onScroll} className="flex-1 overflow-y-auto px-4 py-5 space-y-3 max-h-[480px]" aria-live="polite">
        {messages.map(m => {
          if (m.sender === "SYSTEM") {
            return (
              <div key={m.id} className="mx-auto max-w-md text-center px-4 py-3 rounded-lg border border-dashed border-surface-container-high text-sm text-outline">
                <p className="text-[11px] font-semibold mb-1">Mensagem automática enviada ao comprador</p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            );
          }
          const mine = m.sender === "MERCHANT";
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm ${mine ? "bg-primary-container text-on-primary" : "bg-surface-container text-on-surface"}`}>
                {!mine && <p className="text-[11px] font-semibold mb-0.5 text-primary">{thread.customerName}</p>}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={`mt-1 text-[10px] text-right ${mine ? "opacity-75" : "text-outline"}`}>{formatChatTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form
        className="border-t border-surface-container-high/40 p-3 sm:p-4"
        onSubmit={e => {
          e.preventDefault();
          submit();
        }}
      >
        {error && <p role="alert" className="mb-2 text-xs text-error">{error}</p>}
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="sr-only">Resposta</span>
            <textarea
              rows={1}
              value={text}
              maxLength={MAX_CHAT_MESSAGE}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={thread.type === "ORDER" ? "Responda ou envie os dados da entrega" : "Escreva sua resposta"}
              className="w-full max-h-36 resize-none bg-surface-container text-on-surface text-sm px-3.5 py-2.5 rounded-lg outline-none border border-surface-container-high/40 focus:border-primary/60"
            />
          </label>
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="shrink-0 h-[42px] px-4 rounded-lg bg-primary-container text-on-primary text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-base">send</span>
            <span className="hidden sm:inline">{sending ? "Enviando" : "Enviar"}</span>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-outline">Enter envia. Shift + Enter quebra a linha.</p>
      </form>
    </>
  );
}

export default function ConversasAdminPage() {
  return (
    <Suspense fallback={null}>
      <ConversationsAdmin />
    </Suspense>
  );
}
