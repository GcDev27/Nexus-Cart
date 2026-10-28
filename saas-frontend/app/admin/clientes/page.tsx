"use client";

import React, { useState, useEffect, useMemo } from "react";
import { authFetch } from "../../lib/auth";
import { useToast } from "../../components/Toast";

interface CustomerItem {
  id: string;
  name: string;
  email: string;
  cpf?: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
}

interface OrderDetail {
  orderId: string;
  productName: string;
  variationName: string;
  amount: number;
  status: "PENDING" | "PAID" | "CANCELLED" | "REFUNDED";
  deliveredContent?: string;
  createdAt: string;
}

export default function AdminClientesPage() {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<{
    customer: CustomerItem;
    orders: OrderDetail[];
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await authFetch("/api/admin/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      addToast("Erro ao carregar lista de clientes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerDetails = async (id: string) => {
    setSelectedCustomerId(id);
    setLoadingDetails(true);
    try {
      const res = await authFetch(`/api/admin/customers/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerDetails(data);
      } else {
        addToast("Falha ao buscar dados do cliente.", "error");
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes do cliente:", err);
      addToast("Erro de conexão com o servidor.", "error");
    } finally {
      setLoadingDetails(false);
    }
  };

  const closeDetails = () => {
    setSelectedCustomerId(null);
    setCustomerDetails(null);
  };

  // Filtro de busca
  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const q = search.toLowerCase();
      return (
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.cpf && c.cpf.includes(q))
      );
    });
  }, [customers, search]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const totalRevenue = useMemo(() => {
    return customers.reduce((acc, c) => acc + Number(c.totalSpent || 0), 0);
  }, [customers]);

  const avgTicket = customers.length > 0 ? totalRevenue / customers.length : 0;

  return (
    <div className="flex flex-col w-full pb-space-2xl text-on-surface">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md py-space-lg mb-space-md">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-primary text-2xl">group</span>
            <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              Base de Clientes & Compradores
            </h1>
          </div>
          <p className="font-body-sm text-body-sm text-outline">
            Acompanhe o histórico de consumo, LTV e fidelidade dos compradores cadastrados na sua loja.
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="flex items-center gap-space-xs px-space-md py-2 bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md rounded-lg transition-colors border border-outline-variant/30 w-fit shrink-0"
        >
          <span className={`material-symbols-outlined text-lg ${loading ? "animate-spin" : ""}`}>
            refresh
          </span>
          <span>Atualizar Clientes</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter-lg mb-space-lg">
        {/* Total Clientes */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Total de Clientes</span>
            <span className="material-symbols-outlined text-primary text-xl">group</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-on-surface tabular-nums">
            {customers.length}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            Compradores com conta na sua loja
          </span>
        </div>

        {/* Faturamento Total */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Faturamento Total Gerado</span>
            <span className="material-symbols-outlined text-secondary text-xl">payments</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-secondary tabular-nums">
            R$ {totalRevenue.toFixed(2).replace(".", ",")}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            Receita total de pedidos aprovados
          </span>
        </div>

        {/* Ticket Médio */}
        <div className="rounded-xl bg-surface-container-low p-space-lg border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] relative overflow-hidden">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="font-label-sm text-label-sm font-medium">Ticket Médio por Cliente</span>
            <span className="material-symbols-outlined text-tertiary text-xl">account_balance_wallet</span>
          </div>
          <p className="font-metric-kpi text-headline-lg text-on-surface tabular-nums">
            R$ {avgTicket.toFixed(2).replace(".", ",")}
          </p>
          <span className="font-label-xs text-label-xs text-outline mt-1 block">
            Média de gasto por comprador ativo
          </span>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="rounded-xl bg-surface-container-low border border-outline-variant/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.45)] overflow-hidden">
        {/* Barra de Busca */}
        <div className="p-space-md border-b border-outline-variant/20 flex items-center justify-between gap-space-md">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou CPF..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-surface-container-lowest text-on-surface font-body-sm text-body-sm pl-10 pr-space-md py-2 rounded-lg outline-none focus:ring-1 focus:ring-primary shadow-inner"
            />
          </div>
          <span className="font-label-xs text-label-xs text-outline hidden sm:inline">
            Exibindo {filtered.length} de {customers.length} clientes
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-label-md text-label-md text-outline">Carregando clientes...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-4xl text-outline/40">group_off</span>
            <p className="font-headline-md text-body-lg font-bold text-on-surface">
              Nenhum cliente cadastrado ainda
            </p>
            <p className="font-body-sm text-body-sm text-outline max-w-sm">
              Quando os compradores se cadastrarem ou realizarem compras na sua vitrine, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-body-sm text-body-sm">
                <thead>
                  <tr className="bg-surface-container-high/60 text-outline font-label-xs text-label-xs uppercase tracking-wider">
                    <th className="py-3 px-space-md">Cliente</th>
                    <th className="py-3 px-space-md">CPF</th>
                    <th className="py-3 px-space-md text-center">Pedidos</th>
                    <th className="py-3 px-space-md text-right">Total Gasto</th>
                    <th className="py-3 px-space-md">Cadastro</th>
                    <th className="py-3 px-space-md text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                  {paginatedCustomers.map((c) => {
                    const initials =
                      c.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase() || "C";

                    const createdStr = c.createdAt
                      ? new Date(c.createdAt).toLocaleDateString("pt-BR")
                      : "-";

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-surface-container-high/40 transition-colors cursor-pointer group"
                        onClick={() => openCustomerDetails(c.id)}
                      >
                        <td className="py-3.5 px-space-md">
                          <div className="flex items-center gap-space-sm">
                            <div className="w-8 h-8 rounded-full bg-primary-container/20 border border-primary-container/30 text-primary flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                              {initials}
                            </div>
                            <div className="truncate max-w-[220px]">
                              <p className="font-medium text-on-surface group-hover:text-primary transition-colors truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-outline truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-space-md font-mono text-outline text-xs">
                          {c.cpf || <span className="text-outline/50 italic">Não informado</span>}
                        </td>

                        <td className="py-3.5 px-space-md text-center font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface text-xs font-mono">
                            {c.totalOrders}
                          </span>
                        </td>

                        <td className="py-3.5 px-space-md text-right font-mono font-bold text-on-surface">
                          R$ {Number(c.totalSpent || 0).toFixed(2).replace(".", ",")}
                        </td>

                        <td className="py-3.5 px-space-md text-outline text-xs">{createdStr}</td>

                        <td className="py-3.5 px-space-md text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openCustomerDetails(c.id)}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-fixed font-medium px-2.5 py-1 rounded-lg hover:bg-surface-container transition-colors"
                          >
                            <span>Ver Ficha</span>
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                          </button>
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
                  Mostrando {paginatedCustomers.length} de {filtered.length} clientes
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

      {/* Modal / Ficha do Cliente */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-space-md bg-surface-container-lowest/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl rounded-xl bg-surface-container-low p-space-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-outline-variant/30 relative max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="pb-space-md border-b border-outline-variant/20 flex items-center justify-between mb-space-md shrink-0">
              <div className="flex items-center gap-space-sm">
                <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-xl">account_circle</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">Ficha do Cliente</h3>
                  <p className="font-body-sm text-body-sm text-outline">Histórico e compras efetuadas</p>
                </div>
              </div>
              <button
                onClick={closeDetails}
                className="text-outline hover:text-on-surface p-1 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto space-y-space-md flex-1 pr-1">
              {loadingDetails || !customerDetails ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-outline">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Carregando histórico do comprador...</span>
                </div>
              ) : (
                <>
                  {/* Dados Cadastrais */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-sm bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-space-md text-xs">
                    <div>
                      <span className="text-outline block mb-0.5 text-[11px]">Nome</span>
                      <strong className="text-on-surface text-sm font-semibold">
                        {customerDetails.customer.name}
                      </strong>
                    </div>
                    <div>
                      <span className="text-outline block mb-0.5 text-[11px]">E-mail</span>
                      <strong className="text-on-surface font-medium break-all">
                        {customerDetails.customer.email}
                      </strong>
                    </div>
                    <div>
                      <span className="text-outline block mb-0.5 text-[11px]">CPF</span>
                      <strong className="text-on-surface font-mono">
                        {customerDetails.customer.cpf || "Não informado"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-outline block mb-0.5 text-[11px]">Total de Pedidos</span>
                      <strong className="text-on-surface font-semibold">
                        {customerDetails.customer.totalOrders} compras
                      </strong>
                    </div>
                    <div>
                      <span className="text-outline block mb-0.5 text-[11px]">Total Gasto (LTV)</span>
                      <strong className="text-secondary font-bold text-sm">
                        R$ {Number(customerDetails.customer.totalSpent || 0).toFixed(2).replace(".", ",")}
                      </strong>
                    </div>
                    <div>
                      <span className="text-outline block mb-0.5 text-[11px]">Cliente desde</span>
                      <strong className="text-on-surface">
                        {new Date(customerDetails.customer.createdAt).toLocaleDateString("pt-BR")}
                      </strong>
                    </div>
                  </div>

                  {/* Histórico de Compras */}
                  <div>
                    <h4 className="font-label-xs text-label-xs text-outline font-semibold uppercase tracking-wider mb-space-sm">
                      Histórico de Pedidos ({customerDetails.orders.length})
                    </h4>

                    {customerDetails.orders.length === 0 ? (
                      <p className="text-xs text-outline italic py-4 text-center">
                        Nenhum pedido registrado para este cliente.
                      </p>
                    ) : (
                      <div className="space-y-space-sm">
                        {customerDetails.orders.map((o) => (
                          <div
                            key={o.orderId}
                            className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-space-md text-xs space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-on-surface text-sm">
                                  {o.productName}
                                </span>
                                <span className="text-outline ml-2">({o.variationName})</span>
                              </div>
                              <span className="font-bold text-on-surface text-sm font-mono">
                                R$ {Number(o.amount || 0).toFixed(2).replace(".", ",")}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-outline pt-1 border-t border-outline-variant/10">
                              <span>
                                ID: #{o.orderId.slice(0, 8)} •{" "}
                                {new Date(o.createdAt).toLocaleDateString("pt-BR")}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded font-semibold ${
                                  o.status === "PAID"
                                    ? "bg-secondary-container/20 text-secondary"
                                    : "bg-amber-400/10 text-amber-400"
                                }`}
                              >
                                {o.status === "PAID" ? "Aprovado" : "Aguardando"}
                              </span>
                            </div>

                            {/* Conteúdo Entregue */}
                            {o.deliveredContent && (
                              <div className="mt-2 bg-surface-container-high/40 border border-outline-variant/20 p-2.5 rounded-lg">
                                <span className="text-[10px] text-outline uppercase block mb-1 font-semibold">
                                  Chave / Acesso Entregue:
                                </span>
                                <code className="text-xs text-secondary font-mono select-all break-all block">
                                  {o.deliveredContent}
                                </code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-space-md border-t border-outline-variant/20 flex justify-end shrink-0">
              <button
                type="button"
                onClick={closeDetails}
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
