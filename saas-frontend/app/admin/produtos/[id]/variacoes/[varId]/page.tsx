"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../../../../components/Toast";
import { authFetch, getToken } from "../../../../../lib/auth";

interface StockLineItem {
  id: string;
  content: string;
  isDelivered: boolean;
  delivered?: boolean;
  createdAt: string;
  orderId?: string;
}

interface VariationDetail {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  deliveryType: "AUTOMATIC_LINES" | "MANUAL_CHAT";
  chatInitialMessage?: string;
  hasUnlimitedStock: boolean;
  stockQuantity?: number;
  availableStockCount?: number;
  createdAt?: string;
}

export default function EditarVariacaoEstoquePage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params.id as string;
  const variationId = params.varId as string;
  const { addToast } = useToast();

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productName, setProductName] = useState("");
  const [variation, setVariation] = useState<VariationDetail | null>(null);

  // Campos de edição
  const [varName, setVarName] = useState("");
  const [priceInput, setPriceInput] = useState("99,00");
  const [comparePriceInput, setComparePriceInput] = useState("149,00");
  const [deliveryType, setDeliveryType] = useState<"AUTOMATIC_LINES" | "MANUAL_CHAT">("AUTOMATIC_LINES");
  const [chatMessage, setChatMessage] = useState("");

  // Estoque
  const [stockLines, setStockLines] = useState<StockLineItem[]>([]);
  const [stockPage, setStockPage] = useState(1);
  const itemsPerPage = 6;
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);
  const [deletingLineId, setDeletingLineId] = useState<string | null>(null);

  // Modal de adição de estoque
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Modal de exclusão de variação
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingVar, setIsDeletingVar] = useState(false);

  // Carregamento de dados
  useEffect(() => {
    if (!produtoId || !variationId) return;
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    async function loadData() {
      try {
        setLoading(true);

        // 1. Busca nome do produto
        const prodRes = await authFetch(`/api/admin/produtos/${produtoId}`);
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProductName(prodData.name || "Pacote");
        }

        // 2. Busca dados da variação
        const varRes = await authFetch(`/api/admin/variacoes/${variationId}`);
        if (!varRes.ok) {
          throw new Error("Variação não encontrada");
        }
        const varData: VariationDetail = await varRes.json();
        setVariation(varData);
        setVarName(varData.name || "Variação");
        setPriceInput(
          varData.price != null ? Number(varData.price).toFixed(2).replace(".", ",") : "0,00"
        );
        setComparePriceInput(
          varData.compareAtPrice != null
            ? Number(varData.compareAtPrice).toFixed(2).replace(".", ",")
            : ""
        );
        setDeliveryType(varData.deliveryType || "AUTOMATIC_LINES");
        setChatMessage(varData.chatInitialMessage || "");

        // 3. Busca linhas de estoque se for entrega automática
        const stockRes = await authFetch(`/api/admin/variacoes/${variationId}/estoque`);
        if (stockRes.ok) {
          const stockData = await stockRes.json();
          setStockLines(Array.isArray(stockData) ? stockData : []);
        }
      } catch (err: any) {
        console.error(err);
        addToast(err.message || "Erro ao carregar variação", "error");
        router.push(`/admin/produtos/${produtoId}/editar`);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [produtoId, variationId, router]);

  // Cálculos de precificação e métricas
  const numericPrice = useMemo(() => {
    return parseFloat(priceInput.replace(".", "").replace(",", ".")) || 0;
  }, [priceInput]);

  const numericComparePrice = useMemo(() => {
    return parseFloat(comparePriceInput.replace(".", "").replace(",", ".")) || 0;
  }, [comparePriceInput]);

  const discountPercent = useMemo(() => {
    if (numericComparePrice > numericPrice && numericComparePrice > 0) {
      return Math.round(((numericComparePrice - numericPrice) / numericComparePrice) * 100);
    }
    return 0;
  }, [numericPrice, numericComparePrice]);

  const netEstimated = useMemo(() => {
    const fee = numericPrice * 0.049;
    return Math.max(0, numericPrice - fee);
  }, [numericPrice]);

  // Contagem de estoque
  const availableLines = useMemo(() => {
    return stockLines.filter((l) => !l.isDelivered && !l.delivered);
  }, [stockLines]);

  const deliveredLines = useMemo(() => {
    return stockLines.filter((l) => l.isDelivered || l.delivered);
  }, [stockLines]);

  // Linhas do lote no modal
  const detectedBatchLines = useMemo(() => {
    return batchText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
  }, [batchText]);

  // Paginação das linhas de estoque
  const totalPages = Math.max(1, Math.ceil(stockLines.length / itemsPerPage));
  const paginatedLines = useMemo(() => {
    const start = (stockPage - 1) * itemsPerPage;
    return stockLines.slice(start, start + itemsPerPage);
  }, [stockLines, stockPage]);

  // Copiar chave
  const handleCopyKey = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setIsCopiedId(id);
    addToast("Chave copiada para a área de transferência!", "success");
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  // Excluir linha de estoque
  const handleDeleteLine = async (stockLineId: string) => {
    setDeletingLineId(stockLineId);
    try {
      const res = await authFetch(`/api/admin/estoque/${stockLineId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro ao excluir item de estoque");
      setStockLines((prev) => prev.filter((l) => l.id !== stockLineId));
      addToast("Item de estoque removido com sucesso.", "success");
    } catch (err: any) {
      addToast(err.message || "Falha ao remover item de estoque", "error");
    } finally {
      setDeletingLineId(null);
    }
  };

  // Salvar alterações da variação
  const handleSave = async () => {
    if (!varName.trim()) {
      addToast("O nome da variação é obrigatório.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: varName,
        price: numericPrice,
        compareAtPrice: numericComparePrice > 0 ? numericComparePrice : null,
        deliveryType,
        chatInitialMessage: deliveryType === "MANUAL_CHAT" ? chatMessage : null,
        hasUnlimitedStock: false,
        stockQuantity: deliveryType === "MANUAL_CHAT" ? 999 : availableLines.length,
      };

      const res = await authFetch(`/api/admin/variacoes/${variationId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Erro ao salvar alterações da variação.");

      addToast("Variação atualizada com sucesso!", "success");
    } catch (err: any) {
      addToast(err.message || "Erro ao salvar variação.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Importar estoque em lote
  const handleImportStock = async () => {
    if (detectedBatchLines.length === 0) {
      addToast("Insira ao menos uma linha válida.", "error");
      return;
    }

    setIsImporting(true);
    try {
      const res = await authFetch(`/api/admin/variacoes/${variationId}/estoque`, {
        method: "POST",
        body: JSON.stringify({
          lines: detectedBatchLines,
        }),
      });

      if (!res.ok) throw new Error("Falha ao salvar linhas de estoque.");

      const newLines: StockLineItem[] = await res.json();
      setStockLines((prev) => [...newLines, ...prev]);
      setBatchText("");
      setShowAddStockModal(false);
      addToast(`${detectedBatchLines.length} itens adicionados ao estoque com sucesso!`, "success");
    } catch (err: any) {
      addToast(err.message || "Erro ao importar estoque.", "error");
    } finally {
      setIsImporting(false);
    }
  };

  // Excluir variação inteira
  const handleDeleteVariation = async () => {
    setIsDeletingVar(true);
    try {
      const res = await authFetch(`/api/admin/variacoes/${variationId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Erro ao excluir variação.");

      addToast("Variação excluída com sucesso.", "success");
      router.push(`/admin/produtos/${produtoId}/editar`);
    } catch (err: any) {
      addToast(err.message || "Falha ao excluir variação.", "error");
      setIsDeletingVar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="font-label-md text-label-md text-on-surface-variant">
          Carregando dados da variação...
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full pb-space-2xl text-on-surface">
      {/* Top Bar / Breadcrumb / Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md py-space-lg mb-space-md">
        <div className="flex flex-col gap-space-xs">
          <Link
            href={`/admin/produtos/${produtoId}/editar`}
            className="inline-flex items-center gap-space-xs text-primary hover:text-primary-fixed transition-colors font-label-sm text-label-sm tracking-wide"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            <span>Voltar para {productName}</span>
          </Link>
          <div className="flex items-center gap-space-sm mt-1 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Editar Variação: <span className="text-primary-fixed">{varName || "Opção"}</span>
            </h1>
            <span className="px-space-sm py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-xs text-label-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              Ativa no Checkout
            </span>
          </div>
        </div>

        <div className="flex items-center gap-space-sm self-start md:self-center">
          <Link
            href={`/admin/produtos/${produtoId}/editar`}
            className="px-space-md py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary hover:text-on-primary-fixed font-label-md text-label-md shadow-[0_0_24px_rgba(160,120,255,0.4)] transition-all flex items-center gap-space-xs disabled:opacity-60"
            type="button"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">save</span>
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2 Columns Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter-lg items-start">
        {/* Left Column (Main - 8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          {/* Card 1: Nome da Variação */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-44 h-44 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">sell</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    Nome da Variação <span className="text-error">*</span>
                  </h2>
                  <p className="font-body-sm text-body-sm text-outline">
                    Identificação exibida na página pública de compra e no checkout.
                  </p>
                </div>
              </div>
              <span className="font-label-xs text-label-xs text-outline bg-surface-container px-2 py-1 rounded">
                Obrigatório
              </span>
            </div>
            <div>
              <label
                className="block font-label-sm text-label-sm text-on-surface-variant mb-1.5"
                htmlFor="variation-name"
              >
                Rótulo público da opção
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
                  label
                </span>
                <input
                  id="variation-name"
                  type="text"
                  value={varName}
                  onChange={(e) => setVarName(e.target.value)}
                  placeholder="Ex: Opção Básica, Licença Anual, etc."
                  className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md pl-10 pr-space-md py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                />
              </div>
            </div>
          </section>

          {/* Card 2: Precificação */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
            <div className="flex items-center gap-space-sm mb-space-lg">
              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Precificação e Conversão
                </h2>
                <p className="font-body-sm text-body-sm text-outline">
                  Defina a taxa de venda e gere ancoragem visual com o valor de referência.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Preço comparativo */}
              <div className="p-space-md rounded-lg bg-surface-container-lowest/60">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-label-sm text-label-sm text-outline" htmlFor="price-compare">
                    Preço comparativo (De:)
                  </label>
                  <span className="font-label-xs text-label-xs text-outline/80">Opcional</span>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-label-md text-label-md text-outline">R$</span>
                  <input
                    id="price-compare"
                    type="text"
                    value={comparePriceInput}
                    onChange={(e) => setComparePriceInput(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-surface-container text-on-surface font-body-md text-body-md pl-10 pr-space-md py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary line-through text-outline"
                  />
                </div>
                <p className="font-label-xs text-label-xs text-outline mt-2">
                  Apresentado riscado para criar efeito de promoção.
                </p>
              </div>

              {/* Preço de venda */}
              <div className="p-space-md rounded-lg bg-surface-container-high/40 shadow-[0_0_20px_rgba(160,120,255,0.08)]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-label-sm text-label-sm text-primary-fixed" htmlFor="price-sale">
                    Preço de venda (Por:) <span className="text-error">*</span>
                  </label>
                  {discountPercent > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-label-xs text-label-xs font-semibold">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-label-md text-label-md text-primary font-bold">
                    R$
                  </span>
                  <input
                    id="price-sale"
                    type="text"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="0,00"
                    className="w-full bg-surface-container-lowest text-on-surface font-metric-kpi text-headline-md pl-11 pr-space-md py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-secondary font-bold shadow-inner"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 font-label-xs text-label-xs">
                  <span className="text-outline">Taxa gateway estimada: 4.9%</span>
                  <span className="text-on-surface-variant font-medium">
                    Líquido: R$ {netEstimated.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Card 3: Método de Entrega */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between mb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                  <span className="material-symbols-outlined text-lg">local_shipping</span>
                </div>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Método de Entrega</h2>
                  <p className="font-body-sm text-body-sm text-outline">
                    Selecione como o cliente terá acesso aos produtos desta variação.
                  </p>
                </div>
              </div>
            </div>

            {/* Pill/Switch Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 p-1.5 rounded-xl bg-surface-container-lowest gap-1.5">
              <button
                type="button"
                onClick={() => setDeliveryType("AUTOMATIC_LINES")}
                className={`flex items-center justify-center gap-space-sm py-space-sm px-space-md rounded-lg font-label-md text-label-md transition-all relative ${
                  deliveryType === "AUTOMATIC_LINES"
                    ? "bg-surface-container-high text-on-surface shadow-[0_2px_12px_rgba(160,120,255,0.25)] font-bold"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    deliveryType === "AUTOMATIC_LINES"
                      ? "bg-primary-container shadow-[0_0_8px_#a078ff]"
                      : "bg-outline/40"
                  }`}
                />
                <span className="material-symbols-outlined text-primary text-lg">bolt</span>
                <span>Entrega Automática</span>
              </button>

              <button
                type="button"
                onClick={() => setDeliveryType("MANUAL_CHAT")}
                className={`flex items-center justify-center gap-space-sm py-space-sm px-space-md rounded-lg font-label-md text-label-md transition-all relative ${
                  deliveryType === "MANUAL_CHAT"
                    ? "bg-surface-container-high text-on-surface shadow-[0_2px_12px_rgba(160,120,255,0.25)] font-bold"
                    : "text-outline hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    deliveryType === "MANUAL_CHAT"
                      ? "bg-secondary-container shadow-[0_0_8px_#4edea3]"
                      : "bg-outline/40"
                  }`}
                />
                <span className="material-symbols-outlined text-secondary text-lg">forum</span>
                <span>Entrega Manual (Chat)</span>
              </button>
            </div>

            {deliveryType === "MANUAL_CHAT" && (
              <div className="mt-space-md p-space-md rounded-lg bg-surface-container-lowest">
                <label className="block font-label-sm text-label-sm text-on-surface mb-1">
                  Mensagem pós-pagamento no chat/e-mail
                </label>
                <textarea
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ex: Olá! Seu pedido foi confirmado. Entre em contato com nosso Discord com o ID da sua compra para receber a entrega manual."
                  rows={4}
                  className="w-full bg-surface-container text-on-surface font-body-sm text-body-sm p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
                />
              </div>
            )}
          </section>

          {/* Card 4: Linhas de Estoque (Entrega Automática) */}
          {deliveryType === "AUTOMATIC_LINES" && (
            <section className="rounded-xl bg-surface-container-low p-space-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)]">
              {/* Header & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md pb-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary mt-0.5">
                    <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-sm flex-wrap">
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        Linhas de Estoque Digital
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-container/15 text-primary font-label-xs text-label-xs font-semibold">
                        {availableLines.length} disponíveis
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-outline mt-0.5">
                      Cada linha é um item único que será entregue automaticamente ao cliente após a confirmação do pagamento.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddStockModal(true)}
                  className="px-space-md py-2 rounded-lg bg-surface-container-highest hover:bg-primary-container hover:text-on-primary text-primary-fixed font-label-md text-label-md flex items-center justify-center gap-space-xs transition-all shrink-0 shadow-sm"
                >
                  <span className="material-symbols-outlined text-lg">add_circle</span>
                  <span>+ Adicionar estoque</span>
                </button>
              </div>

              {/* Filter / Quick Metrics */}
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-container-lowest mb-space-md text-outline font-label-xs text-label-xs">
                <div className="flex items-center gap-space-md">
                  <span className="flex items-center gap-1 text-secondary">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>{" "}
                    {availableLines.length} Livres
                  </span>
                  <span className="flex items-center gap-1 text-outline">
                    <span className="w-2 h-2 rounded-full bg-surface-variant"></span>{" "}
                    {deliveredLines.length} Entregues
                  </span>
                </div>
                <span className="font-mono text-outline">Entrega FIFO (Ordem de Chegada)</span>
              </div>

              {/* Stock Table */}
              <div className="overflow-x-auto rounded-lg bg-surface-container-lowest">
                {stockLines.length === 0 ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl text-outline/40">inventory_2</span>
                    <p className="text-on-surface font-medium text-sm">Nenhum item em estoque</p>
                    <p className="text-outline text-xs max-w-sm">
                      Clique em "+ Adicionar estoque" para colar suas chaves, licenças ou credenciais de acesso.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left font-body-sm text-body-sm">
                    <thead>
                      <tr className="bg-surface-container-high/60 text-outline font-label-xs text-label-xs uppercase tracking-wider">
                        <th className="py-2.5 px-4 w-12 text-center" scope="col">
                          #
                        </th>
                        <th className="py-2.5 px-4" scope="col">
                          Conteúdo / Chave de Acesso
                        </th>
                        <th className="py-2.5 px-4" scope="col">
                          Adicionado em
                        </th>
                        <th className="py-2.5 px-4" scope="col">
                          Status
                        </th>
                        <th className="py-2.5 px-4 text-right" scope="col">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-0 text-on-surface">
                      {paginatedLines.map((line, idx) => {
                        const globalIndex = (stockPage - 1) * itemsPerPage + idx + 1;
                        const isDelivered = line.isDelivered || line.delivered;

                        return (
                          <tr
                            key={line.id}
                            className={`hover:bg-surface-container-low transition-colors group ${
                              idx % 2 === 1 ? "bg-surface-container-lowest/50" : ""
                            }`}
                          >
                            <td className="py-3 px-4 text-center font-mono text-outline text-xs">
                              {String(globalIndex).padStart(2, "0")}
                            </td>
                            <td className="py-3 px-4 font-mono font-medium text-on-surface flex items-center gap-space-xs">
                              <span className="material-symbols-outlined text-outline text-sm">
                                {line.content.startsWith("http") ? "link" : "key"}
                              </span>
                              <span className="tracking-wide truncate max-w-xs">{line.content}</span>
                            </td>
                            <td className="py-3 px-4 text-outline font-label-xs text-label-xs">
                              {line.createdAt
                                ? new Date(line.createdAt).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Recentemente"}
                            </td>
                            <td className="py-3 px-4">
                              {isDelivered ? (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-outline-variant/20 text-outline font-label-xs text-label-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-outline"></span>
                                  Entregue
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-xs text-label-xs font-semibold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                  Disponível
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleCopyKey(line.content, line.id)}
                                  className="p-1 text-outline hover:text-primary transition-colors rounded hover:bg-surface-container"
                                  title="Copiar chave"
                                >
                                  <span className="material-symbols-outlined text-base">
                                    {isCopiedId === line.id ? "check" : "content_copy"}
                                  </span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteLine(line.id)}
                                  disabled={deletingLineId === line.id}
                                  className="p-1 text-outline hover:text-error transition-colors rounded hover:bg-surface-container disabled:opacity-50"
                                  title="Excluir item"
                                >
                                  <span className="material-symbols-outlined text-base">delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {stockLines.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-space-md text-outline font-label-xs text-label-xs">
                  <span>
                    Mostrando {paginatedLines.length} de {stockLines.length} itens
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setStockPage(p)}
                        type="button"
                        className={`px-2.5 py-1 rounded transition-colors ${
                          stockPage === p
                            ? "bg-surface-container text-on-surface font-semibold"
                            : "bg-surface-container-lowest hover:bg-surface-container text-outline"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Right Column (Side Support Panel - 4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-space-lg">
          {/* Card 'Como funciona?' (CentralCart signature) */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-tertiary-container/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center gap-space-sm mb-space-md">
              <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">help</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-surface">Como funciona?</h2>
            </div>

            <div className="flex flex-col gap-space-md">
              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-lowest/60">
                <div className="w-7 h-7 rounded-md bg-secondary/10 text-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-base">bolt</span>
                </div>
                <div className="text-left">
                  <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-0.5">
                    Entrega Automática
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline leading-snug">
                    O cliente recebe o item instantaneamente na tela do pedido e no e-mail logo após a aprovação do PIX.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-lowest/60">
                <div className="w-7 h-7 rounded-md bg-primary-container/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-base">dns</span>
                </div>
                <div className="text-left">
                  <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-0.5">
                    Estoque Unitário
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline leading-snug">
                    Cada linha cadastrada corresponde a 1 unidade disponível. Ao ser entregue ao comprador, a linha é baixada com Lock Pessimista.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-lowest/60">
                <div className="w-7 h-7 rounded-md bg-tertiary/10 text-tertiary flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-base">verified_user</span>
                </div>
                <div className="text-left">
                  <h3 className="font-label-md text-label-md text-on-surface font-semibold mb-0.5">
                    Recomendado para
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline leading-snug">
                    Códigos de ativação, licenças digitais, tokens de API, contas pré-configuradas ou links de acesso único.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-space-md p-space-sm rounded-lg bg-primary-container/10 flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-primary text-base">info</span>
              <span className="font-label-xs text-label-xs text-primary-fixed">
                Quando o estoque zera, o botão de compra é desabilitado em tempo real.
              </span>
            </div>
          </section>

          {/* Card Resumo da Variação */}
          <section className="rounded-xl bg-surface-container-low p-space-lg shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between mb-space-md">
              <h2 className="font-headline-md text-headline-md text-on-surface">Resumo da Variação</h2>
              <span className="material-symbols-outlined text-outline text-lg">insights</span>
            </div>

            <div className="space-y-space-md">
              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest">
                <span className="font-body-sm text-body-sm text-outline">Status Operacional</span>
                <div className="flex items-center gap-1.5 font-label-sm text-label-sm text-secondary font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  {availableLines.length > 0 ? "Em Estoque" : "Sem Estoque"}
                </div>
              </div>

              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest">
                <span className="font-body-sm text-body-sm text-outline">Unidades Entregues</span>
                <span className="font-metric-kpi text-label-md text-on-surface font-bold">
                  {deliveredLines.length} itens
                </span>
              </div>

              <div className="flex items-center justify-between p-space-sm rounded-lg bg-surface-container-lowest">
                <span className="font-body-sm text-body-sm text-outline">Faturamento Acumulado</span>
                <span className="font-metric-kpi text-label-md text-secondary font-bold">
                  R$ {(deliveredLines.length * numericPrice).toFixed(2).replace(".", ",")}
                </span>
              </div>

              {/* Saúde do Estoque */}
              <div className="pt-space-sm">
                <div className="flex justify-between items-center mb-1 text-label-xs font-label-xs">
                  <span className="text-outline">Estoque Disponível ({availableLines.length} restantes)</span>
                  <span className={availableLines.length > 5 ? "text-primary font-semibold" : "text-amber-400 font-semibold"}>
                    {availableLines.length > 5 ? "Saudável" : "Reabastecer"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary via-primary-container to-secondary rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(10, (availableLines.length / (stockLines.length || 1)) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Danger Zone Delete */}
            <div className="mt-space-lg pt-space-md border-t border-outline-variant/20 flex justify-between items-center">
              <span className="font-label-xs text-label-xs text-outline">Excluir esta variação?</span>
              <button
                type="button"
                onClick={() => setShowDeleteModal(true)}
                className="text-error hover:text-on-error-container font-label-xs text-label-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">delete_forever</span>
                Remover Variação
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Modal para Adição em Massa de Estoque */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-surface-container-lowest/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-xl bg-surface-container-low p-space-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-outline-variant/30 relative">
            <div className="flex items-center justify-between pb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">playlist_add</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Adicionar Linhas em Lote</h3>
                  <p className="font-body-sm text-body-sm text-outline">Cole suas chaves ou links, um por linha.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="my-space-md">
              <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2">
                Cole as chaves abaixo (1 por linha):
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"CHAVE-1902-AAAA-9999\nCHAVE-8821-BBBB-1111\nhttps://centralcart.io/access/exemplo-123"}
                rows={6}
                className="w-full bg-surface-container-lowest text-on-surface font-mono text-body-sm p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary shadow-inner"
              />
              <div className="flex items-center justify-between mt-2 text-outline font-label-xs text-label-xs">
                <span>Linhas em branco são filtradas automaticamente.</span>
                <span className="text-primary font-mono font-semibold">
                  {detectedBatchLines.length} {detectedBatchLines.length === 1 ? "linha detectada" : "linhas detectadas"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-md">
              <button
                type="button"
                onClick={() => setShowAddStockModal(false)}
                className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleImportStock}
                disabled={isImporting || detectedBatchLines.length === 0}
                className="px-space-lg py-2 rounded-lg bg-primary-container hover:bg-primary text-on-primary hover:text-on-primary-fixed font-label-md text-label-md shadow-[0_0_20px_rgba(160,120,255,0.35)] transition-all flex items-center gap-space-xs disabled:opacity-60"
              >
                {isImporting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check</span>
                    <span>Importar ao Estoque</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Exclusão da Variação */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-surface-container-lowest/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-surface-container-low p-space-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-error/30 relative">
            <div className="flex items-center gap-space-sm text-error mb-space-sm">
              <span className="material-symbols-outlined text-2xl">warning</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Excluir Variação?</h3>
            </div>
            <p className="font-body-sm text-body-sm text-outline mb-space-lg">
              Esta ação removerá a opção <strong className="text-on-surface">"{varName}"</strong> e todas as linhas de estoque associadas. Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteVariation}
                disabled={isDeletingVar}
                className="px-space-md py-2 rounded-lg bg-error hover:bg-error-container text-on-error font-label-md text-label-md transition-all flex items-center gap-1 disabled:opacity-60"
              >
                {isDeletingVar ? "Removendo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
