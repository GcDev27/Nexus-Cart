"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../../../../lib/auth";
import { useToast } from "../../../../components/Toast";

type DeliveryType = "AUTOMATIC_LINES" | "MANUAL_CHAT";

type Variation = {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  deliveryType: DeliveryType;
  chatInitialMessage: string | null;
  hasUnlimitedStock: boolean;
  stockQuantity: number | null;
  availableStockCount: number;
};

type StockLine = { id: string; content: string; delivered?: boolean; isDelivered?: boolean };

// Formulário do painel lateral (preços como texto para aceitar vírgula)
type Draft = {
  id?: string;
  name: string;
  price: string;
  compareAtPrice: string;
  deliveryType: DeliveryType;
  chatInitialMessage: string;
  hasUnlimitedStock: boolean;
  stockQuantity: string;
  initialKeys: string;
};

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const toInput = (n: number | null | undefined) => (n == null ? "" : Number(n).toFixed(2).replace(".", ","));
const parseMoney = (s: string) => {
  const n = parseFloat(s.replace(/\./g, "").replace(",", "."));
  return isNaN(n) ? null : n;
};
const parseLines = (text: string) => text.split("\n").map((l) => l.trim()).filter(Boolean);
const isDelivered = (l: StockLine) => Boolean(l.delivered ?? l.isDelivered);

const emptyDraft = (): Draft => ({
  name: "",
  price: "",
  compareAtPrice: "",
  deliveryType: "AUTOMATIC_LINES",
  chatInitialMessage: "",
  hasUnlimitedStock: false,
  stockQuantity: "",
  initialKeys: "",
});

const draftFrom = (v: Variation): Draft => ({
  id: v.id,
  name: v.name,
  price: toInput(v.price),
  compareAtPrice: toInput(v.compareAtPrice),
  deliveryType: v.deliveryType,
  chatInitialMessage: v.chatInitialMessage || "",
  hasUnlimitedStock: v.hasUnlimitedStock,
  stockQuantity: v.stockQuantity == null ? "" : String(v.stockQuantity),
  initialKeys: "",
});

function stockLabel(v: Variation): { text: string; tone: "ok" | "warn" | "bad" } {
  if (v.deliveryType === "AUTOMATIC_LINES") {
    return v.availableStockCount > 0
      ? { text: `${v.availableStockCount} ${v.availableStockCount === 1 ? "chave" : "chaves"}`, tone: "ok" }
      : { text: "Sem chaves", tone: "bad" };
  }
  if (v.hasUnlimitedStock) return { text: "Sem limite", tone: "ok" };
  const qty = v.stockQuantity ?? 0;
  return qty > 0 ? { text: `${qty} em estoque`, tone: "ok" } : { text: "Esgotado", tone: "bad" };
}

const toneClass = { ok: "bg-secondary/10 text-secondary", warn: "bg-amber-500/10 text-amber-400", bad: "bg-error/10 text-error" };

const inputClass =
  "w-full bg-surface-container text-on-surface text-sm px-3 py-2.5 rounded-lg outline-none focus:bg-surface-container-high border border-surface-container-high/40 focus:border-primary/60 transition-all";

/**
 * Opções de compra de um produto (ex.: "30 dias", "90 dias", "Vitalícia").
 * Cada opção tem preço, tipo de entrega e estoque próprios.
 */
export default function VariationsSection({ productId }: { productId: string }) {
  const { addToast } = useToast();
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Chaves da opção aberta no painel
  const [stockLines, setStockLines] = useState<StockLine[]>([]);
  const [newKeys, setNewKeys] = useState("");
  const [addingKeys, setAddingKeys] = useState(false);

  const errorFrom = async (res: Response, fallback: string) => {
    const body = await res.json().catch(() => null);
    return body?.error || (body?.errors ? Object.values(body.errors).join(" ") : fallback);
  };

  const loadVariations = useCallback(async () => {
    const res = await authFetch(`/api/admin/produtos/${productId}/variacoes`);
    if (res.ok) setVariations(await res.json());
    setLoading(false);
  }, [productId]);

  const loadStock = useCallback(async (variationId: string) => {
    const res = await authFetch(`/api/admin/variacoes/${variationId}/estoque`);
    if (res.ok) setStockLines(await res.json());
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial vinda da API
    loadVariations();
  }, [loadVariations]);

  const openNew = () => {
    setDraft(emptyDraft());
    setStockLines([]);
    setNewKeys("");
    setFormError(null);
  };

  const openEdit = (v: Variation) => {
    setDraft(draftFrom(v));
    setStockLines([]);
    setNewKeys("");
    setFormError(null);
    if (v.deliveryType === "AUTOMATIC_LINES") loadStock(v.id);
  };

  const close = () => setDraft(null);

  // Fecha o painel com Esc
  useEffect(() => {
    if (!draft) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDraft(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draft]);

  const saveDraft = async () => {
    if (!draft) return;
    const price = parseMoney(draft.price);
    const compare = draft.compareAtPrice.trim() ? parseMoney(draft.compareAtPrice) : null;

    if (!draft.name.trim()) return setFormError("Dê um nome para a opção, como \"30 dias\" ou \"Vitalícia\".");
    if (price == null || price <= 0) return setFormError("Informe um preço maior que zero.");
    if (compare != null && compare <= price) return setFormError("O preço \"de\" precisa ser maior que o preço de venda, ou fique vazio.");

    const isManual = draft.deliveryType === "MANUAL_CHAT";
    const payload = {
      name: draft.name.trim(),
      price,
      compareAtPrice: compare,
      deliveryType: draft.deliveryType,
      chatInitialMessage: isManual ? draft.chatInitialMessage.trim() || null : null,
      // Estoque por quantidade só faz sentido na entrega manual; na automática quem manda são as chaves
      hasUnlimitedStock: isManual && draft.hasUnlimitedStock,
      stockQuantity: isManual && !draft.hasUnlimitedStock ? Math.max(0, parseInt(draft.stockQuantity) || 0) : null,
    };

    setSaving(true);
    setFormError(null);
    try {
      const res = draft.id
        ? await authFetch(`/api/admin/variacoes/${draft.id}`, { method: "PUT", body: JSON.stringify(payload) })
        : await authFetch(`/api/admin/produtos/${productId}/variacoes`, { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await errorFrom(res, "Não foi possível salvar a opção."));
      const saved: Variation = await res.json();

      // Opção nova com chaves já coladas: cadastra logo em seguida
      const keys = parseLines(draft.initialKeys);
      if (!draft.id && keys.length > 0 && saved.deliveryType === "AUTOMATIC_LINES") {
        const keyRes = await authFetch(`/api/admin/variacoes/${saved.id}/estoque`, {
          method: "POST",
          body: JSON.stringify({ lines: keys }),
        });
        if (!keyRes.ok) addToast(await errorFrom(keyRes, "A opção foi criada, mas as chaves não foram salvas."), "error");
      }

      addToast(draft.id ? "Opção atualizada." : "Opção criada.", "success");
      setDraft(null);
      loadVariations();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  const deleteVariation = async (id: string) => {
    const res = await authFetch(`/api/admin/variacoes/${id}`, { method: "DELETE" });
    setConfirmDeleteId(null);
    if (res.ok) {
      addToast("Opção excluída.", "success");
      loadVariations();
    } else {
      addToast(await errorFrom(res, "Não foi possível excluir a opção."), "error");
    }
  };

  const addKeys = async () => {
    if (!draft?.id) return;
    const lines = parseLines(newKeys);
    if (lines.length === 0) return;
    setAddingKeys(true);
    try {
      // Se a opção ainda está salva como manual, grava a troca para automática antes
      const current = variations.find((v) => v.id === draft.id);
      if (current && current.deliveryType !== "AUTOMATIC_LINES") {
        await saveDraft();
      }
      const res = await authFetch(`/api/admin/variacoes/${draft.id}/estoque`, {
        method: "POST",
        body: JSON.stringify({ lines }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Erro ao adicionar chaves."));
      addToast(`${lines.length} ${lines.length === 1 ? "chave adicionada" : "chaves adicionadas"}.`, "success");
      setNewKeys("");
      loadStock(draft.id);
      loadVariations();
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Erro ao adicionar chaves.", "error");
    } finally {
      setAddingKeys(false);
    }
  };

  const deleteKey = async (lineId: string) => {
    const res = await authFetch(`/api/admin/estoque/${lineId}`, { method: "DELETE" });
    if (res.ok && draft?.id) {
      setStockLines((prev) => prev.filter((l) => l.id !== lineId));
      loadVariations();
    } else {
      addToast(await errorFrom(res, "Não foi possível remover a chave."), "error");
    }
  };

  const newKeyCount = parseLines(newKeys).length;
  const availableKeys = stockLines.filter((l) => !isDelivered(l));
  const deliveredKeys = stockLines.filter(isDelivered);

  return (
    <section className="bg-surface-container-low rounded-xl p-4 sm:p-space-lg border border-surface-container-high/40 shadow-sm flex flex-col gap-4">
      <div className="flex items-start sm:items-center justify-between gap-3 pb-2 border-b border-surface-container-high/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
            <span className="material-symbols-outlined text-lg">sell</span>
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">Opções de compra</h2>
            <p className="text-[11px] sm:text-xs text-outline">
              Cada opção tem preço, entrega e estoque próprios. Ex.: 30 dias, 90 dias, Vitalícia.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs sm:text-sm hover:bg-primary transition-colors"
        >
          <span className="material-symbols-outlined text-base">add</span>
          Adicionar opção
        </button>
      </div>

      {loading ? (
        <p className="py-6 text-center text-sm text-outline">Carregando opções...</p>
      ) : variations.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-surface-container-high rounded-lg">
          <p className="text-sm text-on-surface">Este produto ainda não tem opções de compra.</p>
          <p className="text-xs text-outline mt-1">Sem pelo menos uma opção, ninguém consegue comprar.</p>
        </div>
      ) : (
        <ul className="divide-y divide-surface-container-high/40 border border-surface-container-high/40 rounded-lg overflow-hidden">
          {variations.map((v) => {
            const stock = stockLabel(v);
            const noPrice = !v.price || Number(v.price) <= 0;
            return (
              <li key={v.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 px-3 sm:px-4 py-3 bg-surface-container/40 hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-outline text-lg shrink-0" aria-hidden>
                  {v.deliveryType === "AUTOMATIC_LINES" ? "key" : "forum"}
                </span>
                <button type="button" onClick={() => openEdit(v)} className="min-w-0 flex-1 text-left">
                  <span className="block text-sm font-semibold text-on-surface truncate">{v.name}</span>
                  <span className="block text-xs text-outline">
                    {v.deliveryType === "AUTOMATIC_LINES" ? "Entrega automática por chave" : "Entrega manual"}
                  </span>
                </button>
                <div className="text-right shrink-0">
                  {noPrice ? (
                    <span className={`text-[11px] font-semibold px-2 py-1 rounded ${toneClass.warn}`}>Defina o preço</span>
                  ) : (
                    <>
                      {v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price) && (
                        <span className="block text-[11px] text-outline line-through">{brl(Number(v.compareAtPrice))}</span>
                      )}
                      <span className="block text-sm font-semibold text-on-surface tabular-nums">{brl(Number(v.price))}</span>
                    </>
                  )}
                </div>
                <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded ${toneClass[stock.tone]}`}>{stock.text}</span>

                {confirmDeleteId === v.id ? (
                  <span className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => deleteVariation(v.id)} className="px-2.5 py-1.5 rounded-md bg-error/15 text-error text-xs font-semibold">
                      Excluir
                    </button>
                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1.5 rounded-md text-outline text-xs">
                      Cancelar
                    </button>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(v)}
                      className="p-2 rounded-md text-outline hover:text-on-surface hover:bg-surface-container-high"
                      aria-label={`Editar ${v.name}`}
                    >
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(v.id)}
                      disabled={variations.length === 1}
                      title={variations.length === 1 ? "O produto precisa de pelo menos uma opção" : undefined}
                      className="p-2 rounded-md text-outline hover:text-error hover:bg-error/10 disabled:opacity-30 disabled:hover:text-outline disabled:hover:bg-transparent"
                      aria-label={`Excluir ${v.name}`}
                    >
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Painel lateral de edição ─────────────────────────────── */}
      {draft && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="variation-panel-title">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
          <div className="relative w-full max-w-lg h-full bg-surface-container-low border-l border-surface-container-high/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-high/40">
              <h3 id="variation-panel-title" className="text-base font-bold text-on-surface">
                {draft.id ? `Editar opção` : "Nova opção de compra"}
              </h3>
              <button type="button" onClick={close} className="p-1.5 rounded-md text-outline hover:text-on-surface" aria-label="Fechar">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <label className="block">
                <span className="block text-sm font-medium text-on-surface mb-1.5">Nome da opção</span>
                <input
                  autoFocus
                  type="text"
                  maxLength={80}
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Ex.: 30 dias, Vitalícia, Pacote com 5"
                  className={inputClass}
                />
                <span className="block text-xs text-outline mt-1">É o que o comprador escolhe na página do produto.</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-sm font-medium text-on-surface mb-1.5">Preço de venda</span>
                  <span className="relative block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      placeholder="29,90"
                      className={`${inputClass} pl-9`}
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-on-surface mb-1.5">
                    Preço &quot;de&quot; <span className="text-outline font-normal">(opcional)</span>
                  </span>
                  <span className="relative block">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">R$</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={draft.compareAtPrice}
                      onChange={(e) => setDraft({ ...draft, compareAtPrice: e.target.value })}
                      placeholder="39,90"
                      className={`${inputClass} pl-9`}
                    />
                  </span>
                </label>
              </div>

              <fieldset>
                <legend className="text-sm font-medium text-on-surface mb-2">Como o comprador recebe</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {([
                    { id: "AUTOMATIC_LINES", icon: "bolt", title: "Automática", desc: "Cada venda entrega a próxima chave da sua lista, na hora." },
                    { id: "MANUAL_CHAT", icon: "forum", title: "Manual", desc: "Você entrega depois. O comprador vê a sua mensagem." },
                  ] as const).map((opt) => {
                    const active = draft.deliveryType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setDraft({ ...draft, deliveryType: opt.id })}
                        className={`text-left p-3 rounded-lg border transition-colors ${
                          active ? "border-primary bg-primary-container/10" : "border-surface-container-high/60 hover:border-surface-container-highest"
                        }`}
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                          <span className={`material-symbols-outlined text-base ${active ? "text-primary" : "text-outline"}`}>{opt.icon}</span>
                          {opt.title}
                        </span>
                        <span className="block text-xs text-outline mt-1">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {draft.deliveryType === "AUTOMATIC_LINES" ? (
                draft.id ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-medium text-on-surface">Chaves</span>
                      <span className="text-xs text-outline">
                        {availableKeys.length} disponíveis, {deliveredKeys.length} entregues
                      </span>
                    </div>

                    {stockLines.length > 0 && (
                      <ul className="max-h-56 overflow-y-auto rounded-lg border border-surface-container-high/40 divide-y divide-surface-container-high/30">
                        {[...availableKeys, ...deliveredKeys].map((line) => (
                          <li key={line.id} className="group flex items-center gap-2 px-3 py-2">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDelivered(line) ? "bg-outline" : "bg-secondary"}`} />
                            <span className={`flex-1 min-w-0 truncate font-mono text-xs ${isDelivered(line) ? "text-outline line-through" : "text-on-surface"}`}>
                              {line.content}
                            </span>
                            {!isDelivered(line) && (
                              <button
                                type="button"
                                onClick={() => deleteKey(line.id)}
                                className="p-1 rounded text-outline hover:text-error sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                                aria-label="Remover chave"
                              >
                                <span className="material-symbols-outlined text-base">delete</span>
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <textarea
                      rows={4}
                      value={newKeys}
                      onChange={(e) => setNewKeys(e.target.value)}
                      placeholder={"Cole as chaves aqui, uma por linha\nVIP-AAAA-1111\nVIP-BBBB-2222"}
                      className={`${inputClass} font-mono text-xs resize-y`}
                    />
                    <button
                      type="button"
                      onClick={addKeys}
                      disabled={addingKeys || newKeyCount === 0}
                      className="w-full py-2.5 rounded-lg border border-primary/50 text-primary text-sm font-semibold hover:bg-primary-container/10 disabled:opacity-40"
                    >
                      {addingKeys
                        ? "Adicionando..."
                        : newKeyCount === 0
                          ? "Adicionar chaves"
                          : `Adicionar ${newKeyCount} ${newKeyCount === 1 ? "chave" : "chaves"}`}
                    </button>
                  </div>
                ) : (
                  <label className="block">
                    <span className="block text-sm font-medium text-on-surface mb-1.5">
                      Chaves <span className="text-outline font-normal">(opcional, dá para adicionar depois)</span>
                    </span>
                    <textarea
                      rows={5}
                      value={draft.initialKeys}
                      onChange={(e) => setDraft({ ...draft, initialKeys: e.target.value })}
                      placeholder={"Uma chave por linha\nVIP-AAAA-1111\nVIP-BBBB-2222"}
                      className={`${inputClass} font-mono text-xs resize-y`}
                    />
                    <span className="block text-xs text-outline mt-1">
                      {parseLines(draft.initialKeys).length} {parseLines(draft.initialKeys).length === 1 ? "chave" : "chaves"} para cadastrar
                    </span>
                  </label>
                )
              ) : (
                <div className="space-y-4">
                  <div>
                    <span className="block text-sm font-medium text-on-surface mb-1.5">Estoque</span>
                    <label className="flex items-center gap-2 text-sm text-on-surface mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.hasUnlimitedStock}
                        onChange={(e) => setDraft({ ...draft, hasUnlimitedStock: e.target.checked })}
                        className="accent-[var(--color-primary-container)] w-4 h-4"
                      />
                      Sem limite de vendas
                    </label>
                    {!draft.hasUnlimitedStock && (
                      <input
                        type="number"
                        min={0}
                        value={draft.stockQuantity}
                        onChange={(e) => setDraft({ ...draft, stockQuantity: e.target.value })}
                        placeholder="Quantidade disponível"
                        className={inputClass}
                      />
                    )}
                  </div>
                  <label className="block">
                    <span className="block text-sm font-medium text-on-surface mb-1.5">Mensagem depois do pagamento</span>
                    <textarea
                      rows={4}
                      maxLength={1000}
                      value={draft.chatInitialMessage}
                      onChange={(e) => setDraft({ ...draft, chatInitialMessage: e.target.value })}
                      placeholder="Ex.: Pagamento confirmado! Chame a staff no Discord com o número do pedido para receber."
                      className={`${inputClass} resize-y`}
                    />
                    <span className="block text-xs text-outline mt-1">Aparece para o comprador na tela de confirmação e em Minhas compras.</span>
                  </label>
                </div>
              )}

              {formError && (
                <p role="alert" className="text-sm text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-surface-container-high/40">
              <button type="button" onClick={close} className="flex-1 py-2.5 rounded-lg text-sm text-on-surface border border-surface-container-high/60 hover:bg-surface-container">
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary text-sm font-semibold hover:bg-primary disabled:opacity-50"
              >
                {saving ? "Salvando..." : draft.id ? "Salvar opção" : "Criar opção"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
