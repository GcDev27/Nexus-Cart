"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../../../components/Toast";
import { authFetch, getToken } from "../../../../lib/auth";
import CategorySelect from "../../../../components/CategorySelect";
import ImageUploader from "../../../../components/ImageUploader";

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params.id as string;
  const { addToast } = useToast();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  // Campos do Produto
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("Geral");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState<"VISIBLE" | "HIDDEN">("VISIBLE");
  const [imageUrl, setImageUrl] = useState("");

  // Variação / Preço / Entrega
  const [defaultVarId, setDefaultVarId] = useState<string | null>(null);
  const [price, setPrice] = useState("49,90");
  const [compareAtPrice, setCompareAtPrice] = useState("69,90");
  const [deliveryType, setDeliveryType] = useState<"AUTOMATIC_LINES" | "MANUAL_CHAT">("AUTOMATIC_LINES");
  const [chatInitialMessage, setChatInitialMessage] = useState("");

  // Gestão de Linhas de Estoque
  const [stockLines, setStockLines] = useState<any[]>([]);
  const [newStockInput, setNewStockInput] = useState("");
  const [isAddingStock, setIsAddingStock] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);

  useEffect(() => {
    if (!produtoId) return;
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payloadBase64 = token.split(".")[1];
      const decodedJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(decodedJson);
      const slugVal = payload.tenantSlug || localStorage.getItem("tenant_slug");
      if (slugVal) setTenantSlug(slugVal);
    } catch {
      // Usa valor default
    }

    fetchProductData();
  }, [produtoId, router]);

  const fetchProductData = async () => {
    try {
      const res = await authFetch(`/api/admin/produtos/${produtoId}`);
      if (!res.ok) throw new Error("Produto não encontrado");
      const data = await res.json();

      setName(data.name || "");
      setCategoryName(data.categoryName || "Geral");
      setDescription(data.description || "");
      setSlug(data.slug || "");
      setVisibility(data.visibility === "HIDDEN" ? "HIDDEN" : "VISIBLE");
      setImageUrl(data.imageUrl || "");

      const vars = data.variations || [];
      if (vars.length > 0) {
        const v = vars[0];
        setDefaultVarId(v.id);
        setPrice(v.price != null ? Number(v.price).toFixed(2).replace(".", ",") : "0,00");
        setCompareAtPrice(v.compareAtPrice != null ? Number(v.compareAtPrice).toFixed(2).replace(".", ",") : "");
        setDeliveryType(v.deliveryType === "MANUAL_CHAT" ? "MANUAL_CHAT" : "AUTOMATIC_LINES");
        setChatInitialMessage(v.chatInitialMessage || "");

        // Carrega linhas de estoque da variação
        fetchStockLines(v.id);
      }
      setFetching(false);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar dados do produto.", "error");
      router.push("/admin/produtos");
    }
  };

  const fetchStockLines = async (varId: string) => {
    try {
      const res = await authFetch(`/api/admin/variacoes/${varId}/estoque`);
      if (res.ok) {
        const lines = await res.json();
        setStockLines(Array.isArray(lines) ? lines : []);
      }
    } catch (err) {
      console.error("Erro ao carregar estoque:", err);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      addToast("O nome do produto é obrigatório.", "error");
      return;
    }

    setSaving(true);
    try {
      // 1. Atualiza Dados Básicos do Produto
      const parsedPrice = parseFloat(price.replace(",", ".")) || 0;
      const parsedCompare = compareAtPrice ? parseFloat(compareAtPrice.replace(",", ".")) : null;

      const productRes = await authFetch(`/api/admin/produtos/${produtoId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          categoryName,
          description,
          slug,
          visibility,
          imageUrl,
        }),
      });

      if (!productRes.ok) throw new Error("Erro ao atualizar dados do produto");

      // 2. Atualiza Variação Primária (Preço, Entrega e Mensagem)
      if (defaultVarId) {
        const varRes = await authFetch(`/api/admin/variacoes/${defaultVarId}`, {
          method: "PUT",
          body: JSON.stringify({
            name: "Padrão",
            price: parsedPrice,
            compareAtPrice: parsedCompare,
            deliveryType,
            chatInitialMessage: deliveryType === "MANUAL_CHAT" ? chatInitialMessage : null,
          }),
        });
        if (!varRes.ok) throw new Error("Erro ao atualizar preço e entrega");
      }

      addToast("Produto atualizado com sucesso!", "success");
    } catch (error: any) {
      console.error(error);
      addToast(error.message || "Falha ao salvar alterações.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Adicionar Linhas de Estoque em Lote
  const handleAddStockLines = async () => {
    if (!defaultVarId) {
      addToast("Variação padrão não identificada.", "error");
      return;
    }

    const lines = newStockInput
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      addToast("Insira ao menos uma linha de chave/conta.", "error");
      return;
    }

    setIsAddingStock(true);
    try {
      const res = await authFetch(`/api/admin/variacoes/${defaultVarId}/estoque`, {
        method: "POST",
        body: JSON.stringify({ lines }),
      });

      if (!res.ok) throw new Error("Erro ao inserir estoque");

      addToast(`${lines.length} ${lines.length === 1 ? "linha adicionada" : "linhas adicionadas"} com sucesso!`, "success");
      setNewStockInput("");
      setShowAddStockModal(false);
      fetchStockLines(defaultVarId);
    } catch (err: any) {
      addToast(err.message || "Erro ao adicionar linhas de estoque.", "error");
    } finally {
      setIsAddingStock(false);
    }
  };

  // Remover Linha de Estoque
  const handleDeleteStockLine = async (lineId: string | number) => {
    if (!defaultVarId) return;
    try {
      const res = await authFetch(`/api/admin/variacoes/${defaultVarId}/estoque/${lineId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setStockLines((prev) => prev.filter((l) => l.id !== lineId));
        addToast("Linha removida do estoque.", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Excluir Produto
  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/produtos/${produtoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        addToast("Produto excluído com sucesso.", "success");
        router.push("/admin/produtos");
      } else {
        throw new Error("Erro ao excluir produto.");
      }
    } catch (err: any) {
      addToast(err.message || "Falha de conexão.", "error");
      setDeleting(false);
    }
  };

  // Abrir Loja do Produto
  const handleOpenStoreProduct = () => {
    if (tenantSlug && slug) {
      window.open(`/loja/${tenantSlug}/${slug}`, "_blank");
    } else if (tenantSlug) {
      window.open(`/loja/${tenantSlug}`, "_blank");
    } else {
      addToast("Slug da loja não encontrado.", "error");
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-outline">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="text-xs">Carregando configurações do produto...</span>
      </div>
    );
  }

  const freeLinesCount = stockLines.filter((l) => !l.isUsed && l.status !== "DELIVERED").length;
  const usedLinesCount = stockLines.filter((l) => l.isUsed || l.status === "DELIVERED").length;

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-space-lg max-w-full pb-16">
      {/* ───────────────────────────────────────────────────────────
          1. HEADER COM BREADCRUMB E BOTÕES DE AÇÃO
      ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1 sm:pt-space-md">
        <div>
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-medium group"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span>Voltar para Produtos</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight truncate">
                Editar Produto: <span className="text-primary font-semibold">{name}</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-secondary text-[11px] font-medium border border-surface-container-high">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>Configuração ativa</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-outline mt-0.5">
              Ajuste preços, estoque digital por chaves e regras de despacho automático.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleOpenStoreProduct}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface hover:text-primary transition-all text-xs sm:text-sm font-medium border border-surface-container-high/40 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              <span>Visualizar na Loja</span>
            </button>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs sm:text-sm shadow-[0_4px_20px_-2px_rgba(160,120,255,0.45)] hover:bg-primary hover:text-on-primary-fixed transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {saving ? "sync" : "check"}
              </span>
              <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. GRADE EM 2 COLUNAS (8 COLS PRINCIPAL / 4 COLS LATERAL)
      ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-space-lg items-start">
        {/* Coluna Principal (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-space-lg">
          {/* Card 1: Informações Básicas */}
          <section className="bg-surface-container-low rounded-xl p-4 sm:p-space-lg border border-surface-container-high/40 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">tune</span>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-on-surface">Informações Básicas</h2>
                  <p className="text-[11px] sm:text-xs text-outline">Dados de identificação e apresentação do item</p>
                </div>
              </div>
              <span className="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded uppercase tracking-wider">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-medium text-on-surface flex items-center gap-1">
                  Nome do Produto <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: VIP Mensal ou Chave Deluxe"
                  className="w-full bg-surface-container text-on-surface text-xs sm:text-sm px-3 py-2.5 rounded-lg outline-none focus:bg-surface-container-high border border-surface-container-high/40 transition-all"
                />
              </div>

              <CategorySelect
                value={categoryName}
                onChange={setCategoryName}
                label="Categoria"
              />
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium text-on-surface">Descrição</label>
                <span className="text-[10px] text-outline">{description.length} caracteres</span>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva detalhes, termos e instruções de ativação deste produto..."
                className="w-full bg-surface-container text-on-surface text-xs sm:text-sm p-3 rounded-lg outline-none focus:bg-surface-container-high border border-surface-container-high/40 resize-y transition-all"
              />
            </div>
          </section>

          {/* Card 2: Precificação e Conversão */}
          <section className="bg-surface-container-low rounded-xl p-4 sm:p-space-lg border border-surface-container-high/40 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high/30">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/20 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-on-surface">Precificação e Conversão</h2>
                <p className="text-[11px] sm:text-xs text-outline">Defina a taxa de venda e ancoragem visual</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Preço Comparativo (Riscado) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm text-outline flex items-center justify-between">
                  <span>Preço Comparativo (De:)</span>
                  <span className="text-[10px] text-outline">Riscado</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-outline font-semibold">R$</span>
                  <input
                    type="text"
                    value={compareAtPrice}
                    onChange={(e) => setCompareAtPrice(e.target.value)}
                    placeholder="99,00"
                    className="w-full bg-surface-container text-outline text-xs sm:text-sm pl-9 pr-3 py-2.5 rounded-lg outline-none line-through border border-surface-container-high/40 focus:bg-surface-container-high transition-all"
                  />
                </div>
                <p className="text-[10px] text-outline">Aparece riscado na vitrine para demonstrar desconto.</p>
              </div>

              {/* Preço de Venda Final */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-semibold text-on-surface flex items-center justify-between">
                  <span>Preço de Venda (Por:) *</span>
                  <span className="text-[10px] text-secondary font-bold">Valor Final</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-primary font-bold">R$</span>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="49,90"
                    className="w-full bg-surface-container text-primary font-bold text-sm sm:text-base pl-9 pr-3 py-2.5 rounded-lg outline-none focus:bg-surface-container-high border border-primary/30 shadow-[0_0_15px_-4px_rgba(208,188,255,0.2)] transition-all"
                  />
                </div>
                <p className="text-[10px] text-outline">Valor efetivo cobrado no Pix instantâneo.</p>
              </div>
            </div>
          </section>

          {/* Banner de Acesso à Gestão Completa de Variação & Linhas de Estoque */}
          {defaultVarId && (
            <div className="p-4 rounded-xl bg-surface-container-high/30 border border-primary-container/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-xl">tune</span>
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-on-surface">
                    Gestão Avançada de Variações e Estoque
                  </h3>
                  <p className="text-[11px] text-outline">
                    Acesse a tela dedicada para gestão profunda de SKU, tabelas de chaves e métricas de entrega.
                  </p>
                </div>
              </div>
              <Link
                href={`/admin/produtos/${produtoId}/variacoes/${defaultVarId}`}
                className="px-4 py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                <span>Gerenciar Variação & Estoque</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Card 3: Método de Entrega */}
          <section className="bg-surface-container-low rounded-xl p-4 sm:p-space-lg border border-surface-container-high/40 shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-surface-container-high/30">
              <div className="w-8 h-8 rounded-lg bg-tertiary-container/20 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-lg">local_shipping</span>
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-on-surface">Método de Entrega</h2>
                <p className="text-[11px] sm:text-xs text-outline">
                  Selecione como o comprador receberá os produtos após a aprovação
                </p>
              </div>
            </div>

            {/* Alternância Automática vs Manual */}
            <div className="grid grid-cols-1 sm:grid-cols-2 p-1 rounded-xl bg-surface-container-lowest gap-1 border border-surface-container-high/30">
              <button
                type="button"
                onClick={() => setDeliveryType("AUTOMATIC_LINES")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  deliveryType === "AUTOMATIC_LINES"
                    ? "bg-surface-container-high text-on-surface shadow-sm ring-1 ring-primary/30"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-primary text-base sm:text-lg">bolt</span>
                <span>Entrega Automática (Chaves / Linhas)</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType("MANUAL_CHAT")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  deliveryType === "MANUAL_CHAT"
                    ? "bg-surface-container-high text-on-surface shadow-sm ring-1 ring-primary/30"
                    : "text-outline hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-tertiary text-base sm:text-lg">forum</span>
                <span>Entrega Manual (Chat Suporte)</span>
              </button>
            </div>

            {/* Conteúdo: Entrega Automática (Linhas de Estoque) */}
            {deliveryType === "AUTOMATIC_LINES" && (
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-lowest/60 p-3 rounded-xl border border-surface-container-high/30">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-secondary font-medium">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span>{freeLinesCount} Livres para envio</span>
                    </div>
                    <div className="h-3 w-px bg-surface-container-highest"></div>
                    <div className="flex items-center gap-1.5 text-xs text-outline">
                      <span className="w-2 h-2 rounded-full bg-outline"></span>
                      <span>{usedLinesCount} Entregues historicamente</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddStockModal(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all shadow-sm shrink-0"
                  >
                    <span className="material-symbols-outlined text-base">add_circle</span>
                    <span>+ Adicionar Estoque</span>
                  </button>
                </div>

                {/* Tabela de Linhas de Estoque Cadastradas */}
                <div className="rounded-lg border border-surface-container-high/40 overflow-hidden bg-surface-container-lowest">
                  {stockLines.length === 0 ? (
                    <div className="p-8 text-center text-outline text-xs flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-2xl text-amber-400">inventory</span>
                      <span>Nenhuma chave ou linha cadastrada no estoque.</span>
                      <button
                        type="button"
                        onClick={() => setShowAddStockModal(true)}
                        className="text-primary hover:underline text-xs font-medium"
                      >
                        Clique aqui para adicionar seu estoque digital
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto divide-y divide-surface-container">
                      {stockLines.map((line, idx) => (
                        <div
                          key={line.id || idx}
                          className="flex items-center justify-between px-3 py-2 text-xs hover:bg-surface-container/40 transition-colors gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[10px] text-outline font-mono w-6 text-center">
                              #{idx + 1}
                            </span>
                            <span className="font-mono text-on-surface truncate">
                              {line.content || line.line || "Chave/Item oculto"}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {line.isUsed || line.status === "DELIVERED" ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container text-outline">
                                Entregue
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-secondary/15 text-secondary">
                                Disponível
                              </span>
                            )}

                            {(!line.isUsed && line.status !== "DELIVERED") && (
                              <button
                                type="button"
                                onClick={() => handleDeleteStockLine(line.id)}
                                className="p-1 text-outline hover:text-error transition-colors"
                                title="Remover linha"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conteúdo: Entrega Manual (Mensagem de Chat) */}
            {deliveryType === "MANUAL_CHAT" && (
              <div className="flex flex-col gap-2 pt-2">
                <label className="text-xs sm:text-sm font-medium text-on-surface">
                  Mensagem Automática Inicial no Chat
                </label>
                <textarea
                  rows={3}
                  value={chatInitialMessage}
                  onChange={(e) => setChatInitialMessage(e.target.value)}
                  placeholder="Ex: Olá! Recebemos seu pagamento com sucesso. Em instantes nosso operador enviará os dados do seu serviço por aqui..."
                  className="w-full bg-surface-container text-on-surface text-xs sm:text-sm p-3 rounded-lg outline-none focus:bg-surface-container-high border border-surface-container-high/40 resize-y transition-all"
                />
                <span className="text-[11px] text-outline">
                  Esta mensagem é enviada automaticamente no painel de compras do cliente logo após a confirmação do Pix.
                </span>
              </div>
            )}
          </section>
        </div>

        {/* Coluna Lateral (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card: Imagem do Produto (Upload do Dispositivo) */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-surface-container-high/30">
              <span className="material-symbols-outlined text-primary text-base">image</span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">Imagem do Produto</h3>
            </div>

            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label=""
              helperText="Escolha uma imagem do seu dispositivo (PNG, JPG, WEBP)."
              aspectRatio="video"
            />
          </section>

          {/* Card: Visibilidade na Vitrine */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-surface-container-high/30">
              <span className="material-symbols-outlined text-secondary text-base">visibility</span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">Visibilidade</h3>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setVisibility("VISIBLE")}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  visibility === "VISIBLE"
                    ? "bg-secondary/15 text-secondary border-secondary/40 shadow-sm"
                    : "bg-surface-container text-outline border-transparent hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Visível na Vitrine Pública</span>
                </div>
                {visibility === "VISIBLE" && <span className="material-symbols-outlined text-sm">check</span>}
              </button>

              <button
                type="button"
                onClick={() => setVisibility("HIDDEN")}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  visibility === "HIDDEN"
                    ? "bg-surface-container-high text-on-surface border-surface-container-highest shadow-sm"
                    : "bg-surface-container text-outline border-transparent hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  <span>Oculto (Rascunho)</span>
                </div>
                {visibility === "HIDDEN" && <span className="material-symbols-outlined text-sm">check</span>}
              </button>
            </div>
          </section>

          {/* Card: Slug da URL */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/30">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">link</span>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">Slug da URL</h3>
              </div>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-surface-container text-on-surface font-mono text-xs p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 transition-all"
            />
            <span className="text-[10px] text-outline">
              Link direto: /loja/{tenantSlug || "sua-loja"}/{slug || "item"}
            </span>
          </section>

          {/* Card: Zona de Perigo (Exclusão) */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-error-container/40 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-error uppercase tracking-wider">Zona de Perigo</span>
            <p className="text-[11px] text-outline">
              Esta ação removerá o produto, suas variações e histórico de chaves permanentemente.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full mt-1 py-2 px-3 rounded-lg bg-error-container/30 hover:bg-error text-error hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 border border-error/20"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>Excluir Produto</span>
            </button>
          </section>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          3. MODAL DE ADIÇÃO DE ESTOQUE EM LOTE
      ──────────────────────────────────────────────────────────── */}
      {showAddStockModal && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowAddStockModal(false)}
        >
          <div
            className="w-full max-w-lg bg-surface-container-low border border-surface-container-high rounded-2xl p-5 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">add_box</span>
                </div>
                <h3 className="text-base font-bold text-on-surface">Inserir Chaves / Linhas de Estoque</h3>
              </div>
              <button
                onClick={() => setShowAddStockModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-on-surface">
                Cole suas chaves, licenças ou credenciais (uma por linha):
              </label>
              <textarea
                rows={8}
                value={newStockInput}
                onChange={(e) => setNewStockInput(e.target.value)}
                placeholder={"KEY-XXXX-YYYY-ZZZZ\nKEY-AAAA-BBBB-CCCC\nKEY-1111-2222-3333"}
                className="w-full bg-surface-container-lowest font-mono text-xs p-3 rounded-lg border border-surface-container-high/40 text-on-surface outline-none focus:ring-1 focus:ring-primary resize-y"
              />
              <span className="text-[10px] text-outline">
                Cada quebra de linha será registrada como 1 unidade de estoque entregue automaticamente ao cliente após o pagamento.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAddingStock || !newStockInput.trim()}
                onClick={handleAddStockLines}
                className="px-5 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
              >
                <span>{isAddingStock ? "Cadastrando..." : "Cadastrar Linhas"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          4. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
      ──────────────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-low border border-surface-container-high rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-xl bg-error-container/30 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-on-surface">Apagar Produto</h3>
              <p className="text-xs text-outline leading-relaxed">
                Tem certeza que deseja apagar <strong className="text-on-surface">{name}</strong>? Esta ação é definitiva e removerá este item de sua vitrine pública.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
