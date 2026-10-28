"use client";

import React, { useState, useEffect, useMemo } from "react";
import { authFetch } from "../../lib/auth";
import { useToast } from "../../components/Toast";

interface OrderItem {
  orderId: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  amount: number;
  productName: string;
  variationName: string;
  customerName: string;
  customerEmail: string;
  customerCpf?: string;
  customerId?: string;
  deliveredContent?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  simulated?: boolean;
  createdAt: string;
  paidAt?: string;
}

export default function AdminPedidosPage() {
  const { addToast } = useToast();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PENDING" | "CANCELLED">("ALL");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar pedidos:", err);
      addToast("Falha ao carregar lista de pedidos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleSimulateApproval = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      const res = await authFetch(`/api/admin/orders/${orderId}/simulate-approval`, {
        method: "POST",
      });

      if (res.ok) {
        const updated = await res.json();
        setOrders((prev) => prev.map((o) => (o.orderId === orderId ? { ...o, ...updated } : o)));
        if (selectedOrder && selectedOrder.orderId === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, ...updated } : null));
        }
        addToast("Pedido aprovado! Chave de estoque liberada com sucesso.", "success");
      } else {
        addToast("Erro ao aprovar o pedido.", "error");
      }
    } catch {
      addToast("Erro de conexão com o servidor.", "error");
    } finally {
      setApprovingId(null);
    }
  };

  const handleCopy = (text: string, label = "Chave") => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    addToast(`${label} copiada para a área de transferência!`, "success");
    setTimeout(() => setCopiedKey(false), 2000);
  };

  // Filtros combinados
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        (o.productName && o.productName.toLowerCase().includes(q)) ||
        (o.variationName && o.variationName.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerEmail && o.customerEmail.toLowerCase().includes(q)) ||
        (o.orderId && o.orderId.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter === "PAID") return o.status === "PAID";
      if (statusFilter === "PENDING") return o.status === "PENDING";
      if (statusFilter === "CANCELLED") return o.status === "CANCELLED" || o.status === "REFUNDED";
      return true;
    });
  }, [orders, search, statusFilter]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  // Métricas
  const totalPaidRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === "PAID")
      .reduce((acc, o) => acc + Number(o.amount || 0), 0);
  }, [orders]);

  const totalPaidCount = orders.filter((o) => o.status === "PAID").length;
  const totalPendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="flex flex-col w-full pb-space-2xl text-on-surface">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md py-space-lg mb-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-2xl">shopping_cart</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Gerenciador de Pedidos & Vendas
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-outline">
            Monitore transações PIX em tempo real, entregas digitais e histórico financeiro da sua loja.
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md rounded-lg transition-colors border border-outline-variant/30 w-fit shrink-0"
        >
          <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
            refresh
          </span>
          <span>Atualizar Vendas</span>
        </button>
      </div>

      {/* KPI Cards (Obsidian Orbit aesthetic) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter-lg mb-space-lg">
        {/* Total Pedidos */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Total de Pedidos</span>
            <span className="material-symbols-outlined text-primary text-xl">shopping_bag</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-on-surface tabular-nums">
            {orders.length}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            Todas as transações geradas
          </span>
        </div>

        {/* Faturamento Aprovado */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Receita Aprovada</span>
            <span className="material-symbols-outlined text-secondary text-xl">payments</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-secondary tabular-nums">
            R$ {totalPaidRevenue.toFixed(2).replace(".", ",")}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            Faturamento líquido confirmado
          </span>
        </div>

        {/* Pedidos Aprovados */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Entregas Concluídas</span>
            <span className="material-symbols-outlined text-secondary text-xl">verified</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-on-surface tabular-nums">
            {totalPaidCount}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            Chaves & acessos entregues
          </span>
        </div>

        {/* Aguardando PIX */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Aguardando PIX</span>
            <span className="material-symbols-outlined text-amber-400 text-xl">schedule</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-amber-400 tabular-nums">
            {totalPendingCount}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            QR Codes gerados em aberto
          </span>
        </div>
      </div>

      {/* Tabela & Filtros */}
      <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] overflow-hidden">
        {/* Barra Superior: Busca & Filtros */}
        <div className="p-space-md border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por produto, comprador ou ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-10 pr-space-md py-2 rounded-lg outline-none focus:ring-1 focus:ring-primary shadow-inner"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setStatusFilter("ALL");
                setCurrentPage(1);
              }}
              className={`font-label-xs text-label-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-surface-container-high text-on-surface font-semibold shadow-sm"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-lowest"
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => {
                setStatusFilter("PAID");
                setCurrentPage(1);
              }}
              className={`font-label-xs text-label-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                statusFilter === "PAID"
                  ? "bg-secondary-container/20 text-secondary font-semibold border border-secondary/30"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-lowest"
              }`}
            >
              Aprovados ({totalPaidCount})
            </button>
            <button
              onClick={() => {
                setStatusFilter("PENDING");
                setCurrentPage(1);
              }}
              className={`font-label-xs text-label-xs px-3 py-1.5 rounded-lg transition-colors shrink-0 ${
                statusFilter === "PENDING"
                  ? "bg-amber-400/10 text-amber-400 font-semibold border border-amber-400/30"
                  : "text-outline hover:text-on-surface hover:bg-surface-container-lowest"
              }`}
            >
              Pendentes ({totalPendingCount})
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-label-md text-label-md text-outline">Carregando pedidos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline/40">shopping_cart</span>
            <p className="font-headline-md text-body-lg font-bold text-on-surface">
              Nenhum pedido encontrado
            </p>
            <p className="font-body-sm text-body-sm text-outline max-w-sm">
              Quando clientes realizarem compras na sua vitrine, as ordens de pagamento aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-high/60 text-outline font-label-xs text-label-xs uppercase tracking-wider">
                    <th className="py-3 px-space-md">ID / Data</th>
                    <th className="py-3 px-space-md">Produto & Variação</th>
                    <th className="py-3 px-space-md">Comprador</th>
                    <th className="py-3 px-space-md text-right">Valor</th>
                    <th className="py-3 px-space-md text-center">Status</th>
                    <th className="py-3 px-space-md text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {paginatedOrders.map((order) => {
                    const isPaid = order.status === "PAID";
                    const isPending = order.status === "PENDING";
                    const dateStr = order.createdAt
                      ? new Date(order.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";

                    return (
                      <tr
                        key={order.orderId}
                        className="hover:bg-surface-container-high/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="py-3.5 px-space-md">
                          <span className="font-mono text-primary font-medium text-xs block">
                            #{order.orderId.substring(0, 8)}
                          </span>
                          <span className="text-[11px] text-outline">{dateStr}</span>
                        </td>

                        <td className="py-3.5 px-space-md">
                          <span className="font-medium text-on-surface block truncate max-w-xs">
                            {order.productName}
                          </span>
                          <span className="text-[11px] text-primary-fixed block truncate max-w-xs">
                            {order.variationName || "Opção Padrão"}
                          </span>
                        </td>

                        <td className="py-3.5 px-space-md">
                          <span className="font-medium text-on-surface block truncate max-w-[200px]">
                            {order.customerName || "Cliente"}
                          </span>
                          <span className="text-[11px] text-outline block truncate max-w-[200px]">
                            {order.customerEmail}
                          </span>
                        </td>

                        <td className="py-3.5 px-space-md text-right">
                          <span className="font-mono font-bold text-on-surface">
                            R$ {Number(order.amount || 0).toFixed(2).replace(".", ",")}
                          </span>
                        </td>

                        <td className="py-3.5 px-space-md text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-xs text-label-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                              Aprovado
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-label-xs text-label-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                              Aguardando
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container text-outline font-label-xs text-label-xs">
                              Cancelado
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-space-md text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <button
                                type="button"
                                onClick={() => handleSimulateApproval(order.orderId)}
                                disabled={approvingId === order.orderId}
                                className="px-2.5 py-1 rounded bg-secondary-container/20 hover:bg-secondary-container/40 text-secondary font-label-xs text-label-xs font-semibold transition-all flex items-center gap-1 border border-secondary/30 disabled:opacity-50"
                                title="Aprovar manualmente e liberar estoque"
                              >
                                <span className="material-symbols-outlined text-sm">bolt</span>
                                <span>Aprovar</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded-lg transition-colors"
                              title="Ver Detalhes do Pedido"
                            >
                              <span className="material-symbols-outlined text-base">visibility</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="p-space-md border-t border-outline-variant/20 flex items-center justify-between text-outline font-label-xs text-label-xs">
                <span>
                  Mostrando {paginatedOrders.length} de {filtered.length} pedidos
                </span>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      type="button"
                      className={`px-3 py-1 rounded transition-colors ${
                        currentPage === p
                          ? "bg-surface-container-high text-on-surface font-semibold shadow-sm"
                          : "bg-surface-container-lowest hover:bg-surface-container text-outline"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal / Drawer de Detalhes do Pedido */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-surface-container-lowest/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl rounded-xl bg-surface-container-low p-space-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-outline-variant/30 relative max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="flex items-center justify-between pb-space-md border-b border-outline-variant/20 mb-space-md">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Pedido #{selectedOrder.orderId.substring(0, 8)}
                  </h3>
                  <p className="font-body-sm text-body-sm text-outline">
                    {new Date(selectedOrder.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Status & Valor */}
            <div className="grid grid-cols-2 gap-space-md p-space-md rounded-xl bg-surface-container-lowest mb-space-md">
              <div>
                <span className="font-label-xs text-label-xs text-outline block mb-1">Status</span>
                {selectedOrder.status === "PAID" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary font-label-xs text-label-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Pagamento Aprovado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-label-xs text-label-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    Aguardando Pagamento
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-label-xs text-label-xs text-outline block mb-1">Total</span>
                <span className="font-metric-kpi text-headline-md text-primary font-bold">
                  R$ {Number(selectedOrder.amount || 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            {/* Informações do Comprador */}
            <div className="space-y-space-sm p-space-md rounded-xl bg-surface-container-lowest mb-space-md">
              <span className="font-label-xs text-label-xs text-outline font-semibold uppercase tracking-wider block">
                Dados do Comprador
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm text-body-sm">
                <div>
                  <span className="text-outline text-xs block">Nome:</span>
                  <span className="text-on-surface font-medium">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-outline text-xs block">E-mail:</span>
                  <span className="text-on-surface font-medium">{selectedOrder.customerEmail}</span>
                </div>
                {selectedOrder.customerCpf && (
                  <div>
                    <span className="text-outline text-xs block">CPF:</span>
                    <span className="text-on-surface font-mono">{selectedOrder.customerCpf}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chave Entregue (se aprovado) */}
            {selectedOrder.status === "PAID" && (
              <div className="p-space-md rounded-xl bg-primary-container/10 border border-primary-container/30 mb-space-md">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-label-xs text-label-xs text-primary font-semibold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">key</span>
                    Conteúdo Entregue ao Cliente
                  </span>
                  {selectedOrder.deliveredContent && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedOrder.deliveredContent!, "Chave entregue")}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {copiedKey ? "check" : "content_copy"}
                      </span>
                      <span>Copiar</span>
                    </button>
                  )}
                </div>
                <div className="p-3 bg-surface-container-lowest rounded-lg font-mono text-xs text-secondary break-all border border-outline-variant/20 shadow-inner">
                  {selectedOrder.deliveredContent || "Nenhum conteúdo salvo para este pedido."}
                </div>
              </div>
            )}

            {/* QR Code / Copia e Cola (se pendente) */}
            {selectedOrder.status === "PENDING" && selectedOrder.qrCode && (
              <div className="p-space-md rounded-xl bg-surface-container-lowest border border-outline-variant/20 mb-space-md">
                <span className="font-label-xs text-label-xs text-outline font-semibold uppercase tracking-wider block mb-2">
                  Chave Pix Copia e Cola
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={selectedOrder.qrCode}
                    className="w-full bg-surface-container text-on-surface font-mono text-xs p-2 rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(selectedOrder.qrCode!, "Código Pix")}
                    className="px-3 py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            {/* Ações do Rodapé */}
            <div className="flex items-center justify-between pt-space-md border-t border-outline-variant/20">
              {selectedOrder.status === "PENDING" ? (
                <button
                  type="button"
                  onClick={() => handleSimulateApproval(selectedOrder.orderId)}
                  disabled={approvingId === selectedOrder.orderId}
                  className="px-space-md py-2 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary font-label-md text-label-md font-semibold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-base">bolt</span>
                  <span>{approvingId === selectedOrder.orderId ? "Aprovando..." : "Aprovar e Liberar Estoque"}</span>
                </button>
              ) : (
                <div />
              )}
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
