'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

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

type Product = {
  id: string;
  name: string;
  description: string;
  slug: string;
  categoryName?: string;
  imageUrl?: string;
  variations?: Variation[];
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeSlug = params.storeSlug as string;
  const productSlug = params.productSlug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const storeName = storeSlug?.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  useEffect(() => {
    if (!storeSlug || !productSlug) return;

    fetch(`${API_BASE}/api/storefront/produtos/${productSlug}`, {
      headers: { 'X-Tenant-Slug': storeSlug },
    })
      .then(res => {
        if (!res.ok) { setNotFound(true); return null; }
        return res.json();
      })
      .then(data => {
        if (!data) return;
        setProduct(data);
        if (data.variations?.length > 0) {
          setSelectedVariation(data.variations[0]);
        }
        setLoading(false);
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [storeSlug, productSlug]);

  const isInStock = (v: Variation) => {
    if (v.hasUnlimitedStock) return true;
    if (v.deliveryType === 'AUTOMATIC_LINES') {
      if (!v.stockLines || v.stockLines.length === 0) return false;
      return v.stockLines.filter((l: any) => !l.isDelivered && !l.delivered).length > 0;
    }
    return (v.stockQuantity ?? 0) > 0;
  };

  const handleBuyNow = () => {
    if (!selectedVariation) return;
    router.push(`/loja/${storeSlug}/checkout?variationId=${selectedVariation.id}`);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
    </div>
  );

  if (notFound || !product) return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center gap-4">
      <p className="text-neutral-400">Produto não encontrado</p>
      <Link href={`/loja/${storeSlug}`} className="text-sm text-neutral-500 hover:text-white transition-colors">
        ← Voltar à loja
      </Link>
    </div>
  );

  const hasMultipleVariations = product.variations && product.variations.length > 1;
  const isChat = selectedVariation?.deliveryType === 'MANUAL_CHAT';
  const discount = selectedVariation?.compareAtPrice
    ? Math.round((1 - (selectedVariation.price / selectedVariation.compareAtPrice)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white">

      {/* Header */}
      <header className="border-b border-neutral-800/40 sticky top-0 z-50 bg-[#0a0a0c]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href={`/loja/${storeSlug}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-md bg-neutral-800 flex items-center justify-center text-white text-xs font-semibold">
              {storeName?.charAt(0)}
            </div>
            <span className="font-medium text-sm">{storeName}</span>
          </Link>
          <Link
            href={`/loja/${storeSlug}`}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8 lg:py-14">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-600 mb-8">
          <Link href={`/loja/${storeSlug}`} className="hover:text-neutral-400 transition-colors">{storeName}</Link>
          <span>/</span>
          <span>{product.categoryName || 'Produtos'}</span>
          <span>/</span>
          <span className="text-neutral-400 truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">

          {/* Coluna esquerda: Imagem */}
          <div className="space-y-4">
            <div className="relative w-full aspect-[4/3] bg-[#111114] rounded-xl overflow-hidden">
              {product.imageUrl ? (
                <>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Descrição */}
            {product.description && (
              <div className="pt-2">
                <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">Sobre o produto</h2>
                <div className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">
                  {product.description}
                </div>
              </div>
            )}
          </div>

          {/* Coluna direita: Info + Compra */}
          <div>
            <div className="lg:sticky lg:top-24 space-y-6">

              {/* Título e preço */}
              <div className="space-y-4">
                <div className="space-y-1">
                  {product.categoryName && (
                    <p className="text-xs text-neutral-500">{product.categoryName}</p>
                  )}
                  <h1 className="text-2xl font-semibold tracking-tight leading-tight">{product.name}</h1>
                </div>

                {selectedVariation && (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-semibold tabular-nums">
                      R$ {Number(selectedVariation.price).toFixed(2)}
                    </span>
                    {selectedVariation.compareAtPrice && (
                      <>
                        <span className="text-base text-neutral-600 line-through tabular-nums">
                          R$ {Number(selectedVariation.compareAtPrice).toFixed(2)}
                        </span>
                        <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                          -{discount}%
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Seletor de variações */}
              {hasMultipleVariations && product.variations && (
                <div>
                  <p className="text-xs text-neutral-500 mb-2.5">Opções disponíveis</p>
                  <div className="space-y-1.5">
                    {product.variations.map(v => {
                      const inStock = isInStock(v);
                      const isSelected = selectedVariation?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => inStock && setSelectedVariation(v)}
                          disabled={!inStock}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
                            isSelected
                              ? 'border-white/20 bg-white/[0.04]'
                              : inStock
                              ? 'border-neutral-800/50 hover:border-neutral-700'
                              : 'border-neutral-800/30 opacity-35 cursor-not-allowed'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center ${
                              isSelected ? 'border-white' : 'border-neutral-700'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p className="text-sm text-white">{v.name}</p>
                              {!inStock && <p className="text-[10px] text-neutral-600 mt-0.5">Esgotado</p>}
                            </div>
                          </div>
                          <div className="text-right">
                            {v.compareAtPrice && (
                              <p className="text-xs text-neutral-600 line-through tabular-nums">R$ {Number(v.compareAtPrice).toFixed(2)}</p>
                            )}
                            <p className="text-sm font-medium tabular-nums">R$ {Number(v.price).toFixed(2)}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status do estoque */}
              {selectedVariation && (
                <div className="flex items-center gap-2 text-xs">
                  {isInStock(selectedVariation) ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-neutral-400">
                        Em estoque · {isChat ? 'Entrega via chat após pagamento' : 'Entrega automática após pagamento'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-neutral-600" />
                      <span className="text-neutral-600">Sem estoque no momento</span>
                    </>
                  )}
                </div>
              )}

              {/* Botão de compra */}
              <button
                onClick={handleBuyNow}
                disabled={!selectedVariation || !isInStock(selectedVariation)}
                className="w-full py-3.5 bg-white text-black font-medium text-sm rounded-lg transition-all hover:bg-neutral-100 active:scale-[0.99] disabled:opacity-25 disabled:cursor-not-allowed"
              >
                {!selectedVariation || !isInStock(selectedVariation)
                  ? 'Produto esgotado'
                  : 'Comprar agora'
                }
              </button>

              {/* Info adicional */}
              <div className="border-t border-neutral-800/40 pt-5 space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <div>
                    <p className="text-xs text-neutral-300">Entrega instantânea</p>
                    <p className="text-xs text-neutral-600 mt-0.5">
                      {isChat
                        ? 'O vendedor entrará em contato após a confirmação do pagamento.'
                        : 'Receba seu produto automaticamente no e-mail após o pagamento via PIX.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-neutral-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-xs text-neutral-300">Compra segura</p>
                    <p className="text-xs text-neutral-600 mt-0.5">Pagamento processado com criptografia. Suporte disponível pós-compra.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
