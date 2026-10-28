'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { Copy, Check, ArrowLeft, Clock, ExternalLink, User } from 'lucide-react';
import { PixIcon } from '../../../components/BankIcons';
import { getCustomerData } from '../../../lib/customerAuth';

type Variation = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  deliveryType: string;
  stockLines?: { id: string; content: string; isDelivered?: boolean; delivered?: boolean }[];
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
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'form' | 'processing' | 'pix' | 'success'>('form');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [errors, setErrors] = useState<{ email?: string; name?: string }>({});

  const [order, setOrder] = useState<OrderData | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const storeName = storeSlug?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Auto-preenche dados caso o comprador já esteja logado na loja
  useEffect(() => {
    const cust = getCustomerData();
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
      .then((products: any[]) => {
        for (const p of products) {
          const found = p.variations?.find((v: any) => v.id === variationId);
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
      (variation.deliveryType === 'AUTOMATIC_LINES' && (!variation.stockLines || variation.stockLines.filter((l: any) => !l.isDelivered && !l.delivered).length === 0)) ||
      (variation.deliveryType === 'MANUAL_CHAT' && (variation.stockQuantity ?? 0) <= 0)
    )
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !variation) return;
    if (isOutOfStock) return;

    setStep('processing');

    try {
      const res = await fetch(`${API_BASE}/api/checkout/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug: storeSlug,
          variationId: variation.id,
          customerName: name,
          customerEmail: email,
          customerCpf: cpf,
          customerId: getCustomerData()?.id
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

  const handleCopyPix = () => {
    if (!order?.qrCode) return;
    navigator.clipboard.writeText(order.qrCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
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
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (!variation) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-neutral-400">Produto ou variação não encontrado.</p>
        <Link href={`/loja/${storeSlug}`} className="text-sm text-neutral-500 hover:text-white transition-colors">
          ← Voltar à loja
        </Link>
      </div>
    );
  }

  const isChat = variation.deliveryType === 'MANUAL_CHAT';

  // ━━━ TELA: SUCESSO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Confirmação */}
          <div className="text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Pagamento confirmado</h1>
            <p className="text-sm text-neutral-500">
              Pedido <span className="font-mono text-neutral-400">#{order?.orderId.substring(0, 8)}</span>
            </p>
          </div>

          {/* Conteúdo entregue */}
          <div className="bg-[#111114] rounded-xl p-5 space-y-4">
            {isChat ? (
              <>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Instruções do vendedor</p>
                <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {order?.deliveredContent || 'O vendedor entrará em contato pelo seu e-mail para concluir a entrega.'}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Sua chave de acesso</p>
                <div className="bg-[#0a0a0c] rounded-lg p-4 border border-neutral-800/50">
                  <p className="font-mono text-sm text-emerald-400 break-all select-all leading-relaxed">
                    {order?.deliveredContent || 'Licença liberada com sucesso.'}
                  </p>
                </div>
              </>
            )}
            <p className="text-xs text-neutral-600">
              Também enviamos para <strong className="text-neutral-400">{email}</strong>
            </p>
          </div>

          {/* Resumo */}
          <div className="flex items-center justify-between text-sm border-t border-neutral-800/50 pt-5">
            <span className="text-neutral-500">{productName} · {variation.name}</span>
            <span className="font-semibold">R$ {Number(order?.amount || variation.price).toFixed(2)}</span>
          </div>

          <Link
            href={`/loja/${storeSlug}`}
            className="block w-full text-center py-3 bg-white text-black font-medium text-sm rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Voltar para a loja
          </Link>
        </div>
      </div>
    );
  }

  // ━━━ TELA: PIX ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (step === 'pix' && order) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] text-white">
        {/* Header minimalista */}
        <header className="border-b border-neutral-800/40">
          <div className="max-w-lg mx-auto px-5 py-4 flex items-center justify-between">
            <Link href={`/loja/${storeSlug}`} className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              {storeName}
            </Link>
            <span className="text-xs text-neutral-600">Checkout seguro</span>
          </div>
        </header>

        <main className="max-w-lg mx-auto px-5 py-10 space-y-8">
          {/* Status + Valor */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm text-neutral-400">Aguardando pagamento</span>
            </div>
            <div className="flex items-baseline justify-between">
              <h1 className="text-3xl font-semibold tabular-nums">
                R$ {Number(order.amount).toFixed(2)}
              </h1>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-mono text-sm">{formatTimer(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Aviso modo teste */}
          {order.simulated && (
            <div className="px-4 py-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
              <p className="text-xs text-amber-400/80 leading-relaxed">
                <strong>Modo demonstração</strong> — {order.message}
              </p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex flex-col items-center gap-6">
            <div className="bg-white p-5 rounded-2xl shadow-lg shadow-black/20">
              {order.qrCodeBase64 ? (
                <img 
                  src={`data:image/png;base64,${order.qrCodeBase64}`} 
                  alt="QR Code PIX" 
                  className="w-52 h-52 object-contain"
                />
              ) : (
                <div className="w-52 h-52 flex flex-col items-center justify-center text-neutral-400 gap-2">
                  <PixIcon className="w-12 h-12 text-[#32bcad]" />
                  <span className="text-xs text-neutral-500">Use o código abaixo</span>
                </div>
              )}
            </div>

            <p className="text-xs text-neutral-600 text-center max-w-xs">
              Abra o app do seu banco, escaneie o código ou use a chave copia e cola abaixo
            </p>
          </div>

          {/* Copia e cola */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-[#111114] rounded-lg border border-neutral-800/50 overflow-hidden">
              <input
                type="text"
                readOnly
                value={order.qrCode}
                className="flex-1 bg-transparent px-4 py-3 text-xs text-neutral-400 font-mono outline-none select-all truncate"
              />
              <button
                onClick={handleCopyPix}
                className={`px-4 py-3 text-xs font-medium flex items-center gap-1.5 transition-colors border-l border-neutral-800/50 ${
                  copied 
                    ? 'text-emerald-400 bg-emerald-500/5' 
                    : 'text-white hover:bg-white/5'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-neutral-600">
              <div className="w-3 h-3 border border-neutral-600 border-t-neutral-400 rounded-full animate-spin" />
              <span>Verificando pagamento automaticamente...</span>
            </div>

            <button
              onClick={handleCheckStatus}
              disabled={checkingStatus}
              className="w-full py-3 text-sm font-medium text-neutral-300 bg-[#111114] hover:bg-[#161619] rounded-lg border border-neutral-800/50 transition-colors"
            >
              {checkingStatus ? 'Verificando...' : 'Já paguei · verificar agora'}
            </button>
          </div>

          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mx-auto"
          >
            <ArrowLeft className="w-3 h-3" />
            Alterar dados
          </button>
        </main>
      </div>
    );
  }

  // ━━━ TELA: FORMULÁRIO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">
      {/* Header */}
      <header className="border-b border-neutral-800/40 sticky top-0 z-30 bg-[#0a0a0c]/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href={`/loja/${storeSlug}`} className="flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            {storeName}
          </Link>
          <span className="text-xs text-neutral-600">Checkout</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 items-start">
          
          {/* Formulário — 3 colunas */}
          <div className="md:col-span-3 space-y-8">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Finalizar compra</h1>
              <p className="text-sm text-neutral-500 mt-1">
                {isChat ? 'Preencha seus dados para que o vendedor entre em contato.' : 'Preencha seus dados para receber o produto automaticamente.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Dados pessoais */}
              <fieldset className="space-y-4">
                <legend className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Dados de contato</legend>
                
                <div>
                  <label htmlFor="checkout-name" className="block text-sm text-neutral-300 mb-1.5">Nome completo</label>
                  <input
                    id="checkout-name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Seu nome"
                    autoComplete="name"
                    className={`w-full bg-[#111114] border rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-700 ${
                      errors.name ? 'border-red-500/40 focus:border-red-500/60' : 'border-neutral-800/50 focus:border-neutral-600'
                    }`}
                  />
                  {errors.name && <p className="text-red-400/80 text-xs mt-1.5">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="checkout-email" className="block text-sm text-neutral-300 mb-1.5">E-mail</label>
                  <input
                    id="checkout-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
                    className={`w-full bg-[#111114] border rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-700 ${
                      errors.email ? 'border-red-500/40 focus:border-red-500/60' : 'border-neutral-800/50 focus:border-neutral-600'
                    }`}
                  />
                  {errors.email && <p className="text-red-400/80 text-xs mt-1.5">{errors.email}</p>}
                  <p className="text-xs text-neutral-600 mt-1.5">
                    {isChat ? 'O vendedor entrará em contato por este e-mail.' : 'Enviaremos o produto para este endereço.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="checkout-cpf" className="block text-sm text-neutral-300 mb-1.5">
                    CPF <span className="text-neutral-600 font-normal">· opcional</span>
                  </label>
                  <input
                    id="checkout-cpf"
                    type="text"
                    value={cpf}
                    onChange={e => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    inputMode="numeric"
                    className="w-full bg-[#111114] border border-neutral-800/50 focus:border-neutral-600 rounded-lg px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-neutral-700"
                  />
                </div>
              </fieldset>

              {/* Método de pagamento */}
              <fieldset>
                <legend className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Pagamento</legend>
                <div className="flex items-center gap-3 p-4 bg-[#111114] rounded-lg border border-neutral-800/50">
                  <div className="w-9 h-9 rounded-lg bg-[#32bcad]/10 flex items-center justify-center flex-shrink-0">
                    <PixIcon className="w-5 h-5 text-[#32bcad]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">PIX</p>
                    <p className="text-xs text-neutral-500">Aprovação instantânea · 24h</p>
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-[#32bcad] flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#32bcad]" />
                  </div>
                </div>
              </fieldset>

              {/* Estoque esgotado */}
              {isOutOfStock && (
                <p className="text-sm text-red-400/70 py-2">
                  Este produto está esgotado no momento.
                </p>
              )}

              <button
                type="submit"
                disabled={step === 'processing' || isOutOfStock}
                className="w-full py-3.5 bg-white text-black font-medium text-sm rounded-lg transition-all hover:bg-neutral-100 active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isOutOfStock 
                  ? 'Produto esgotado' 
                  : step === 'processing' 
                    ? 'Processando...' 
                    : `Pagar R$ ${Number(variation.price).toFixed(2)}`
                }
              </button>
            </form>
          </div>

          {/* Resumo — 2 colunas */}
          <div className="md:col-span-2">
            <div className="sticky top-20 bg-[#111114] rounded-xl p-5 space-y-5 border border-neutral-800/30">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Resumo</p>

              <Link href={`/loja/${storeSlug}/produto/${productSlug}`} className="block group">
                <p className="text-sm font-medium text-white group-hover:text-neutral-300 transition-colors leading-snug">
                  {productName}
                </p>
                <p className="text-xs text-neutral-500 mt-1">{variation.name}</p>
                <p className="text-[11px] text-neutral-600 mt-1.5">
                  {isChat ? 'Entrega via chat' : 'Entrega automática'}
                </p>
              </Link>

              <div className="border-t border-neutral-800/40 pt-4 space-y-2.5 text-sm">
                {variation.compareAtPrice && (
                  <>
                    <div className="flex justify-between text-neutral-500">
                      <span>Preço original</span>
                      <span className="line-through">R$ {Number(variation.compareAtPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-500/80">
                      <span>Desconto</span>
                      <span>- R$ {(Number(variation.compareAtPrice) - Number(variation.price)).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-neutral-800/40 pt-4 flex items-baseline justify-between">
                <span className="text-sm text-neutral-400">Total</span>
                <span className="text-xl font-semibold tabular-nums">R$ {Number(variation.price).toFixed(2)}</span>
              </div>

              <p className="text-[11px] text-neutral-600 text-center pt-1">
                Compra protegida · Entrega garantida
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
