'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getStoreCustomerToken, getStoreCustomerData, removeCustomerSession, customerFetch, CustomerData } from '../../../lib/customerAuth';
import { ShoppingBag, CheckCircle2, Clock, XCircle, Copy, Check, LogOut, Key, RefreshCw } from 'lucide-react';
import { useStore, formatPrice } from '../../../components/store/StoreContext';
import { AnnouncementBar, StoreFooter, StoreHeader } from '../../../components/store/StoreChrome';

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

  const store = useStore();

  const loadData = async () => {
    const token = getStoreCustomerToken(store.id);
    if (!token) {
      router.push(`/loja/${storeSlug}/login?redirect=${encodeURIComponent(`/loja/${storeSlug}/minhas-compras`)}`);
      return;
    }

    setCustomer(getStoreCustomerData(store.id));

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
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {});
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

  const card = 'bg-[var(--bg-card)] border border-[var(--border-color)]';
  const radius = { borderRadius: 'var(--store-radius)' };
  const radiusSm = { borderRadius: 'var(--store-radius-sm)' };

  const filters = [
    { id: 'ALL' as const, label: 'Todos', count: orders.length },
    { id: 'PAID' as const, label: 'Pagos', count: totalDelivered },
    { id: 'PENDING' as const, label: 'Aguardando pagamento', count: orders.filter(o => o.status === 'PENDING').length },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {loading ? (
          <div className="py-32 flex justify-center" aria-label="Carregando suas compras">
            <span className="w-6 h-6 rounded-full border-2 border-[var(--border-color)] border-t-[var(--color-brand)] animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Minhas compras</h1>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {customer?.name ? `Olá, ${customer.name.split(' ')[0]}. ` : ''}Aqui ficam todas as chaves que você comprou em {store.name}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="self-start sm:self-auto flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-red-500 px-3 py-2 border border-[var(--border-color)] transition-colors"
                style={radiusSm}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>

            <dl className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
              {[
                { label: 'Pedidos', value: String(orders.length) },
                { label: 'Pagos', value: String(totalDelivered) },
                { label: 'Total gasto', value: formatPrice(totalSpent) },
              ].map(stat => (
                <div key={stat.label} className={`${card} p-4 sm:p-5`} style={radius}>
                  <dt className="text-xs sm:text-sm text-[var(--text-secondary)]">{stat.label}</dt>
                  <dd className="mt-1 text-lg sm:text-2xl font-bold tabular-nums">{stat.value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {filters.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    aria-pressed={filter === f.id}
                    className={`shrink-0 px-3.5 py-2 text-sm font-medium border transition-colors ${
                      filter === f.id ? '' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                    style={{
                      ...radiusSm,
                      ...(filter === f.id ? { background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderColor: 'var(--color-brand)' } : {}),
                    }}
                  >
                    {f.label} <span className="opacity-70 tabular-nums">{f.count}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={loadData}
                aria-label="Atualizar pedidos"
                className="shrink-0 p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]"
                style={radiusSm}
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="py-16 px-6 text-center border border-dashed border-[var(--border-color)]" style={radius}>
                <ShoppingBag className="w-9 h-9 mx-auto text-[var(--text-muted)]" aria-hidden />
                <p className="mt-3 font-semibold">
                  {orders.length === 0 ? 'Você ainda não comprou nada nesta loja' : 'Nenhum pedido com esse filtro'}
                </p>
                <Link
                  href={`/loja/${storeSlug}`}
                  className="inline-block mt-5 px-5 py-2.5 text-sm font-semibold"
                  style={{ ...radiusSm, background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}
                >
                  Ver produtos
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {filteredOrders.map(order => {
                  const isPaid = order.status === 'PAID';
                  const isPending = order.status === 'PENDING';
                  const date = order.createdAt
                    ? new Date(order.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '';

                  return (
                    <li key={order.orderId} className={`${card} p-5 sm:p-6`} style={radius}>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="font-semibold leading-snug">{order.productName}</h2>
                          {order.variationName && <p className="text-sm text-[var(--text-secondary)] mt-0.5">{order.variationName}</p>}
                          <p className="text-xs text-[var(--text-muted)] mt-1.5">
                            Pedido <span className="font-mono">#{order.orderId.slice(0, 8)}</span>{date && `, ${date}`}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                          <span className="font-bold tabular-nums">{formatPrice(Number(order.amount))}</span>
                          {isPaid && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-500">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-500">
                              <Clock className="w-3.5 h-3.5" /> Aguardando pagamento
                            </span>
                          )}
                          {order.status === 'CANCELLED' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-500">
                              <XCircle className="w-3.5 h-3.5" /> Cancelado
                            </span>
                          )}
                        </div>
                      </div>

                      {isPaid && order.deliveredContent && (
                        <div className="mt-5 pt-5 border-t border-[var(--border-color)]">
                          <p className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Key className="w-4 h-4 text-[var(--color-brand)]" aria-hidden />
                            Sua chave
                          </p>
                          <div className="flex items-stretch gap-2">
                            <p className="flex-1 min-w-0 px-3.5 py-2.5 font-mono text-sm break-all select-all bg-[var(--bg-primary)] border border-[var(--border-color)]" style={radiusSm}>
                              {order.deliveredContent}
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCopy(order.deliveredContent || '', order.orderId)}
                              className="shrink-0 px-3.5 text-sm font-semibold flex items-center gap-1.5"
                              style={{ ...radiusSm, background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}
                            >
                              {copiedId === order.orderId ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copiedId === order.orderId ? 'Copiada' : 'Copiar'}
                            </button>
                          </div>
                        </div>
                      )}

                      {isPending && (
                        <div className="mt-5 pt-5 border-t border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <p className="text-sm text-[var(--text-secondary)]">Pague o Pix para receber a chave na hora.</p>
                          <Link
                            href={`/loja/${storeSlug}/checkout?orderId=${order.orderId}`}
                            className="shrink-0 text-center px-4 py-2 text-sm font-semibold"
                            style={{ ...radiusSm, background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}
                          >
                            Pagar com Pix
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
