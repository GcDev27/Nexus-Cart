'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Copy, Check, ArrowLeft, Clock, Lock } from 'lucide-react';
import { PixIcon } from '../../../components/BankIcons';
import { formatPrice, useStore } from '../../../components/store/StoreContext';
import type { Product } from '../../../components/store/ProductCards';
import { AnnouncementBar, StoreBrand, useSocialLinks } from '../../../components/store/StoreChrome';
import { getStoreCustomerData, getStoreCustomerToken } from '../../../lib/customerAuth';

type Variation = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  deliveryType: string;
  availableStockCount?: number;
  stockQuantity?: number;
  hasUnlimitedStock?: boolean;
};

type OrderData = {
  orderId: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  amount: number;
  productName: string;
  variationName: string;
  qrCode: string;
  qrCodeBase64?: string;
  ticketUrl?: string;
  deliveredContent?: string;
  simulated: boolean;
  message?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

function CheckoutContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const storeSlug = params.storeSlug as string;
  const variationId = searchParams.get('variationId');

  const [variation, setVariation] = useState<Variation | null>(null);
  const [productName, setProductName] = useState('');
  const [productSlug, setProductSlug] = useState('');
  // Sem variationId (ex.: pedido aberto a partir de "Minhas compras") não há produto para carregar
  const [loading, setLoading] = useState(() => Boolean(searchParams.get('variationId')));
  const [step, setStep] = useState<'form' | 'processing' | 'pix' | 'success'>('form');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState<'pix' | 'key' | null>(null);
  const [timeLeft, setTimeLeft] = useState(1800);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const socials = useSocialLinks();
  const store = useStore();
  const getCustomerToken = () => getStoreCustomerToken(store.id);

  // Auto-preenche dados caso o comprador já esteja logado na loja
  useEffect(() => {
    const cust = getStoreCustomerData(store.id);
    if (cust) {
      if (cust.name) setName(cust.name);
      if (cust.email) setEmail(cust.email);
      if (cust.cpf) setCpf(cust.cpf);
    }

    const existingOrderId = searchParams.get('orderId');
    if (existingOrderId) {
      fetch(`${API_BASE}/api/checkout/orders/${existingOrderId}/status`)
        .then(r => r.json())
        .then(data => {
          if (data && data.orderId) {
            setOrder(data);
            setStep('pix');
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  useEffect(() => {
    if (!variationId || !storeSlug) return;
    
    fetch(`${API_BASE}/api/storefront/produtos`, {
      headers: { 'X-Tenant-Slug': storeSlug },
    })
      .then(r => r.json())
      .then((products: Product[]) => {
        for (const p of products) {
          const found = p.variations?.find(v => v.id === variationId);
          if (found) {
            setVariation(found);
            setProductName(p.name);
            setProductSlug(p.slug);
            break;
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [variationId, storeSlug]);

  // Timer de expiração
  useEffect(() => {
    if (step !== 'pix') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  // Polling de status
  useEffect(() => {
    if (step !== 'pix' || !order?.orderId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/checkout/orders/${order.orderId}/status`);
        if (res.ok) {
          const data: OrderData = await res.json();
          if (data.status === 'PAID') {
            setOrder(data);
            setStep('success');
            clearInterval(interval);
          }
        }
      } catch (err) { /* silently retry */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, order?.orderId]);

  const validate = () => {
    const errs: { email?: string; name?: string } = {};
    if (!name.trim()) errs.name = 'Digite seu nome completo';
    if (!email.trim() || !email.includes('@')) errs.email = 'Digite um e-mail válido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const isOutOfStock = Boolean(
    variation && !variation.hasUnlimitedStock && (
      (variation.deliveryType === 'AUTOMATIC_LINES' && (variation.availableStockCount ?? 0) <= 0) ||
      (variation.deliveryType === 'MANUAL_CHAT' && (variation.stockQuantity ?? 0) <= 0)
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !variation) return;
    if (isOutOfStock) return;

    setStep('processing');

    try {
      const customerToken = getCustomerToken();
      const res = await fetch(`${API_BASE}/api/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // O backend identifica o comprador logado pelo token (não aceita customerId no corpo)
          ...(customerToken ? { Authorization: `Bearer ${customerToken}` } : {}),
        },
        body: JSON.stringify({
          tenantSlug: storeSlug,
          variationId: variation.id,
          customerName: name,
          customerEmail: email,
          customerCpf: cpf,
        })
      });

      if (res.ok) {
        const data: OrderData = await res.json();
        setOrder(data);
        setStep('pix');
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.error || 'Não foi possível gerar a cobrança. Tente novamente.');
        setStep('form');
      }
    } catch (err) {
      alert('Erro de conexão ao processar checkout.');
      setStep('form');
    }
  };

  const handleCheckStatus = async () => {
    if (!order?.orderId) return;
    setCheckingStatus(true);
    try {
      const res = await fetch(`${API_BASE}/api/checkout/orders/${order.orderId}/status`);
      if (res.ok) {
        const data: OrderData = await res.json();
        if (data.status === 'PAID') {
          setOrder(data);
          setStep('success');
        } else {
          alert('Pagamento ainda não identificado. Se você já transferiu, aguarde alguns segundos.');
        }
      }
    } catch {
      alert('Erro ao consultar status.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyText = (text: string, what: 'pix' | 'key') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(null), 2500);
    }).catch(() => {});
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0,3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6)}`;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  };

  if (loading) {
    return (
      <CheckoutShell>
        <div className="py-32 flex justify-center" aria-label="Carregando">
          <Spinner />
        </div>
      </CheckoutShell>
    );
  }

  const isChat = variation?.deliveryType === 'MANUAL_CHAT';

  // ━━━ TELA: SUCESSO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'success') {
    return (
      <CheckoutShell>
        <div className="max-w-md mx-auto py-12 space-y-8">
          <div className="text-center">
            <span className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500">
              <Check className="w-7 h-7" strokeWidth={2.5} />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight">Pagamento confirmado</h1>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Pedido <span className="font-mono">#{order?.orderId.substring(0, 8)}</span>
            </p>
          </div>

          <Card className="p-5 space-y-3">
            {isChat ? (
              <>
                <p className="text-sm font-semibold">Instruções do vendedor</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {order?.deliveredContent || 'O vendedor vai entrar em contato para concluir a entrega.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold">Sua chave</p>
                <div className="flex items-center gap-3 p-4 bg-[var(--bg-primary)] border border-[var(--border-color)]" style={{ borderRadius: 'var(--store-radius-sm)' }}>
                  <p className="flex-1 font-mono text-sm break-all select-all leading-relaxed">
                    {order?.deliveredContent || 'Licença liberada.'}
                  </p>
                  {order?.deliveredContent && (
                    <button
                      type="button"
                      onClick={() => copyText(order.deliveredContent!, 'key')}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-brand)]"
                    >
                      {copied === 'key' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === 'key' ? 'Copiada' : 'Copiar'}
                    </button>
                  )}
                </div>
              </>
            )}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {getCustomerToken()
                ? 'Esta compra também fica salva em "Minhas compras".'
                : 'Copie e guarde agora: você comprou sem estar logado, então este é o único lugar onde ela aparece.'}
            </p>
          </Card>

          {socials.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)]">Algum problema com o pedido?</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {socials.map(({ label, href, Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-color)] hover:border-[var(--color-brand)] transition-colors"
                    style={{ borderRadius: 'var(--store-radius-sm)' }}>
                    <Icon className="w-4 h-4" />
                    Falar no {label}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm border-t border-[var(--border-color)] pt-5">
            <span className="text-[var(--text-secondary)]">{order?.productName || productName}, {order?.variationName || variation?.name}</span>
            <span className="font-semibold tabular-nums">{formatPrice(Number(order?.amount || variation?.price || 0))}</span>
          </div>

          {isChat && getCustomerToken() ? (
            <PrimaryLink href={`/loja/${storeSlug}/conversas`}>Abrir conversa do pedido</PrimaryLink>
          ) : (
            <PrimaryLink href={`/loja/${storeSlug}`}>Voltar para a loja</PrimaryLink>
          )}
        </div>
      </CheckoutShell>
    );
  }

  // ━━━ TELA: PIX ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'pix' && order) {
    return (
      <CheckoutShell>
        <div className="max-w-md mx-auto py-10 space-y-7">
          <div>
            <p className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 motion-safe:animate-pulse" />
              Aguardando pagamento
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <h1 className="text-3xl font-bold tabular-nums">{formatPrice(Number(order.amount))}</h1>
              <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]" aria-label="Tempo para pagar">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{formatTimer(timeLeft)}</span>
              </span>
            </div>
          </div>

          {order.simulated && (
            <p className="px-4 py-3 text-xs leading-relaxed bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25" style={{ borderRadius: 'var(--store-radius-sm)' }}>
              <strong>Modo de teste:</strong> esta loja ainda não conectou o Mercado Pago, então nenhuma cobrança real foi gerada e este código Pix não funciona.
            </p>
          )}

          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 shadow-lg" style={{ borderRadius: 'var(--store-radius)' }}>
              {order.qrCodeBase64 ? (
                <img src={`data:image/png;base64,${order.qrCodeBase64}`} alt="QR Code do Pix" className="w-52 h-52 object-contain" />
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center gap-2 text-neutral-500">
                  <PixIcon className="w-12 h-12 text-[#32bcad]" />
                  <span className="text-xs">Use o código abaixo</span>
                </div>
              )}
            </div>
            <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
              Abra o app do seu banco e escaneie o QR Code ou use o Pix copia e cola.
            </p>
          </div>

          <div className="flex items-center bg-[var(--bg-card)] border border-[var(--border-color)] overflow-hidden" style={{ borderRadius: 'var(--store-radius-sm)' }}>
            <input
              type="text"
              readOnly
              value={order.qrCode}
              aria-label="Código Pix copia e cola"
              className="flex-1 min-w-0 bg-transparent px-4 py-3 text-xs font-mono text-[var(--text-secondary)] outline-none truncate"
            />
            <button
              type="button"
              onClick={() => copyText(order.qrCode, 'pix')}
              className="px-4 py-3 text-sm font-semibold flex items-center gap-1.5 shrink-0"
              style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}
            >
              {copied === 'pix' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'pix' ? 'Copiado' : 'Copiar'}
            </button>
          </div>

          <div className="space-y-3">
            <p className="flex items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
              <Spinner small />
              A página atualiza sozinha quando o pagamento for aprovado.
            </p>
            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full py-3 text-sm font-medium bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-60"
              style={{ borderRadius: 'var(--store-radius-sm)' }}
            >
              {checkingStatus ? 'Verificando...' : 'Já paguei, verificar agora'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep('form')}
            className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Alterar dados
          </button>
        </div>
      </CheckoutShell>
    );
  }

  if (!variation) {
    return (
      <CheckoutShell>
        <div className="py-32 text-center">
          <p className="text-lg font-semibold">Produto não encontrado</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">A opção escolhida pode ter sido removida.</p>
          <Link href={`/loja/${storeSlug}`} className="inline-block mt-6 text-sm font-semibold text-[var(--color-brand)] hover:underline">
            Ver todos os produtos
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  // ━━━ TELA: FORMULÁRIO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // Entrega manual acontece pelo chat do pedido, que exige conta
  const needsLogin = isChat && !getCustomerToken();
  const loginHref = `/loja/${storeSlug}/login?redirect=${encodeURIComponent(`/loja/${storeSlug}/checkout?variationId=${variation.id}`)}`;

  const inputClass = (hasError?: boolean) =>
    `w-full bg-[var(--bg-primary)] border px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] ${
      hasError ? 'border-red-500/60' : 'border-[var(--border-color)] focus:border-[var(--color-brand)]'
    }`;

  return (
    <CheckoutShell>
      <Link href={`/loja/${storeSlug}/produto/${productSlug}`} className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mt-8">
        <ArrowLeft className="w-4 h-4" />
        Voltar ao produto
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start py-8">
        <div className="md:col-span-3">
          <h1 className="text-2xl font-bold tracking-tight">Finalizar compra</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isChat ? 'Preencha seus dados para o vendedor entrar em contato.' : 'Preencha seus dados e pague com Pix para receber a chave na hora.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold mb-4">Seus dados</legend>

              <div>
                <label htmlFor="checkout-name" className="block text-sm mb-1.5">Nome completo</label>
                <input id="checkout-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" autoComplete="name"
                  className={inputClass(Boolean(errors.name))} style={{ borderRadius: 'var(--store-radius-sm)' }} />
                {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="checkout-email" className="block text-sm mb-1.5">E-mail</label>
                <input id="checkout-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" autoComplete="email"
                  className={inputClass(Boolean(errors.email))} style={{ borderRadius: 'var(--store-radius-sm)' }} />
                {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                <p className="text-xs text-[var(--text-secondary)] mt-1.5">
                  {isChat ? 'O vendedor usa este e-mail para falar com você.' : 'Usado para identificar o seu pedido.'}
                </p>
              </div>

              <div>
                <label htmlFor="checkout-cpf" className="block text-sm mb-1.5">
                  CPF <span className="text-[var(--text-secondary)]">(opcional)</span>
                </label>
                <input id="checkout-cpf" type="text" value={cpf} onChange={e => setCpf(formatCpf(e.target.value))} placeholder="000.000.000-00" maxLength={14} inputMode="numeric"
                  className={inputClass()} style={{ borderRadius: 'var(--store-radius-sm)' }} />
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-semibold mb-4">Pagamento</legend>
              <Card className="flex items-center gap-3 p-4" style={{ borderColor: 'var(--color-brand)' }}>
                <span className="w-10 h-10 rounded-lg bg-[#32bcad]/15 flex items-center justify-center shrink-0">
                  <PixIcon className="w-5 h-5 text-[#32bcad]" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">Pix</span>
                  <span className="block text-xs text-[var(--text-secondary)]">Aprovação na hora, 24 horas por dia</span>
                </span>
                <span aria-hidden className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}>
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              </Card>
            </fieldset>

            {needsLogin ? (
              <div className="p-4 border border-[var(--color-brand)] text-sm" style={{ borderRadius: 'var(--store-radius-sm)', background: 'color-mix(in srgb, var(--color-brand) 8%, transparent)' }}>
                <p className="font-semibold">Entre na sua conta para comprar</p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  A entrega deste produto é combinada com a loja pelo chat do pedido, que fica na sua conta.
                </p>
                <Link
                  href={loginHref}
                  className="inline-block mt-3 px-4 py-2 font-semibold"
                  style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
                >
                  Entrar ou criar conta
                </Link>
              </div>
            ) : !getCustomerToken() && (
              <p className="text-sm text-[var(--text-secondary)]">
                <Link href={loginHref} className="font-semibold text-[var(--color-brand)] hover:underline">Entre na sua conta</Link>{' '}
                antes de pagar para a chave ficar salva em &quot;Minhas compras&quot;.
              </p>
            )}

            {isOutOfStock && <p className="text-sm text-red-500">Este produto está esgotado no momento.</p>}

            <button
              type="submit"
              disabled={step === 'processing' || isOutOfStock || needsLogin}
              className="w-full py-4 text-base font-bold transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
            >
              {isOutOfStock ? 'Produto esgotado' : step === 'processing' ? 'Gerando o Pix...' : `Pagar ${formatPrice(Number(variation.price))} com Pix`}
            </button>
          </form>
        </div>

        <aside className="md:col-span-2 md:sticky md:top-24">
          <Card className="p-5 space-y-5">
            <p className="text-sm font-semibold">Resumo do pedido</p>
            <div>
              <p className="font-medium leading-snug">{productName}</p>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">{variation.name}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5">{isChat ? 'Entrega pelo vendedor' : 'Entrega automática'}</p>
            </div>

            {variation.compareAtPrice && variation.compareAtPrice > variation.price && (
              <div className="border-t border-[var(--border-color)] pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-[var(--text-secondary)]">
                  <span>Preço original</span>
                  <span className="line-through tabular-nums">{formatPrice(Number(variation.compareAtPrice))}</span>
                </div>
                <div className="flex justify-between text-emerald-500">
                  <span>Desconto</span>
                  <span className="tabular-nums">- {formatPrice(Number(variation.compareAtPrice) - Number(variation.price))}</span>
                </div>
              </div>
            )}

            <div className="border-t border-[var(--border-color)] pt-4 flex items-baseline justify-between">
              <span className="text-sm text-[var(--text-secondary)]">Total</span>
              <span className="text-2xl font-bold tabular-nums">{formatPrice(Number(variation.price))}</span>
            </div>
          </Card>
        </aside>
      </div>
    </CheckoutShell>
  );
}

/* ── Peças visuais do checkout (usam o tema da loja) ─────────────── */
function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <header className="border-b border-[var(--border-color)] bg-[var(--header-bg)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <StoreBrand />
          <span className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
            <Lock className="w-4 h-4" aria-hidden />
            Pagamento seguro
          </span>
        </div>
      </header>
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6">{children}</main>
    </div>
  );
}

function Card({ className = '', style, children }: { className?: string; style?: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] ${className}`} style={{ borderRadius: 'var(--store-radius)', ...style }}>
      {children}
    </div>
  );
}

function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="block w-full text-center py-3.5 font-semibold hover:brightness-110 transition-all"
      style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}>
      {children}
    </Link>
  );
}

function Spinner({ small = false }: { small?: boolean }) {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-full border-2 border-[var(--border-color)] border-t-[var(--color-brand)] animate-spin ${small ? 'w-3.5 h-3.5' : 'w-6 h-6'}`}
    />
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CheckoutContent />
    </Suspense>
  );
}
