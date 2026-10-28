'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getCustomerToken, getCustomerData, removeCustomerSession, customerFetch, CustomerData } from '../../../lib/customerAuth';
import { 
  ShoppingBag, CheckCircle2, Clock, XCircle, Copy, Check, 
  ExternalLink, LogOut, ArrowLeft, Key, ShieldCheck, Sparkles, RefreshCw 
} from 'lucide-react';

interface OrderItem {
  orderId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  amount: number;
  productName: string;
  variationName: string;
  deliveredContent?: string;
  qrCode?: string;
  createdAt: string;
  paidAt?: string;
}

export default function MinhasComprasPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  const storeName = storeSlug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const loadData = async () => {
    const token = getCustomerToken();
    if (!token) {
      router.push(`/loja/${storeSlug}/login`);
      return;
    }

    setCustomer(getCustomerData());

    try {
      const res = await customerFetch('/api/storefront/customer/orders', {}, storeSlug);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401) {
        removeCustomerSession();
        router.push(`/loja/${storeSlug}/login`);
      }
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [storeSlug]);

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleLogout = () => {
    removeCustomerSession();
    router.push(`/loja/${storeSlug}`);
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'PAID') return o.status === 'PAID';
    if (filter === 'PENDING') return o.status === 'PENDING';
    return true;
  });

  const totalSpent = orders
    .filter(o => o.status === 'PAID')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalDelivered = orders.filter(o => o.status === 'PAID').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-zinc-500 font-medium">Carregando suas compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-white">

      {/* Header Fixo do Portal */}
      <header className="border-b border-white/[0.06] bg-[#0c0c0e]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href={`/loja/${storeSlug}`}
              className="text-xs text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar à loja</span>
            </Link>
            <span className="text-zinc-700">|</span>
            <span className="text-sm font-semibold tracking-tight">{storeName}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 hidden sm:inline">
              Olá, <strong className="text-white font-medium">{customer?.name}</strong>
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-lg border border-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 sm:py-10">

        {/* Resumo do Comprador */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
            Minhas Compras & Licenças
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Acompanhe o status dos seus pedidos e acesse as chaves digitais entregues.
          </p>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5">
            <span className="text-xs text-zinc-500 font-medium">Total de Pedidos</span>
            <p className="text-2xl font-semibold text-white mt-1 tabular-nums">{orders.length}</p>
          </div>

          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5">
            <span className="text-xs text-zinc-500 font-medium">Produtos Entregues</span>
            <p className="text-2xl font-semibold text-emerald-400 mt-1 tabular-nums">{totalDelivered}</p>
          </div>

          <div className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5">
            <span className="text-xs text-zinc-500 font-medium">Total Aprovado</span>
            <p className="text-2xl font-semibold text-indigo-400 mt-1 tabular-nums">
              R$ {totalSpent.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Filtros de Pedidos */}
        <div className="flex items-center justify-between mb-6 border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('ALL')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                filter === 'ALL'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Todos ({orders.length})
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                filter === 'PAID'
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Aprovados ({totalDelivered})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                filter === 'PENDING'
                  ? 'bg-amber-500/10 text-amber-400 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Aguardando ({orders.filter(o => o.status === 'PENDING').length})
            </button>
          </div>

          <button
            onClick={loadData}
            title="Atualizar pedidos"
            className="text-xs text-zinc-400 hover:text-white p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista de Pedidos */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-[#121215] border border-white/[0.08] rounded-2xl px-4">
            <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-zinc-300">Nenhum pedido encontrado</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1 mb-6">
              Você ainda não realizou compras com este status nesta loja.
            </p>
            <Link
              href={`/loja/${storeSlug}`}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              <span>Explorar Produtos</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => {
              const isPaid = order.status === 'PAID';
              const isPending = order.status === 'PENDING';

              const formattedDate = order.createdAt 
                ? new Date(order.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'Recente';

              return (
                <div
                  key={order.orderId}
                  className="bg-[#121215] border border-white/[0.08] rounded-2xl p-5 sm:p-6 transition-all hover:border-white/[0.15]"
                >
                  {/* Linha superior: Produto & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-zinc-500 font-mono">
                          ID: #{order.orderId.slice(0, 8)}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-xs text-zinc-500">{formattedDate}</span>
                      </div>
                      <h3 className="text-base font-semibold text-white tracking-tight">
                        {order.productName}
                      </h3>
                      {order.variationName && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Variação: <span className="text-zinc-200">{order.variationName}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end justify-between gap-2">
                      <span className="text-base font-semibold text-white tabular-nums">
                        R$ {Number(order.amount).toFixed(2)}
                      </span>

                      {/* Status Badge */}
                      {isPaid && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aprovado & Entregue</span>
                        </span>
                      )}

                      {isPending && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3 h-3" />
                          <span>Aguardando Pagamento</span>
                        </span>
                      )}

                      {order.status === 'CANCELLED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          <span>Cancelado</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Área de Entrega (Se Pago) */}
                  {isPaid && order.deliveredContent && (
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="bg-[#17171c] border border-indigo-500/20 rounded-xl p-4 relative overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-indigo-400">
                            <Key className="w-3.5 h-3.5" />
                            <span>Chave / Conteúdo Digital Liberado:</span>
                          </div>
                          <span className="text-[11px] text-zinc-500">Pronto para uso</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[#0c0c0e] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs font-mono text-emerald-400 select-all break-all">
                            {order.deliveredContent}
                          </div>

                          <button
                            onClick={() => handleCopy(order.deliveredContent || '', order.orderId)}
                            className={`px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                              copiedId === order.orderId
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white/10 hover:bg-white/15 text-white'
                            }`}
                          >
                            {copiedId === order.orderId ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ação para Pedido Pendente (Concluir PIX) */}
                  {isPending && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                      <p className="text-xs text-zinc-400">
                        O PIX expira em breve. Finalize para liberar seu produto instantaneamente.
                      </p>
                      <Link
                        href={`/loja/${storeSlug}/checkout?variationId=pending&orderId=${order.orderId}`}
                        className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-semibold px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <span>Pagar PIX agora</span>
                        <ArrowLeft className="w-3 h-3 rotate-180" />
                      </Link>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
