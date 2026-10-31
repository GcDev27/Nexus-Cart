'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ImageOff, Zap, ShieldCheck, Check } from 'lucide-react';
import { useStore, formatPrice } from '../../../../components/store/StoreContext';
import { AnnouncementBar, StoreFooter, StoreHeader, useSocialLinks } from '../../../../components/store/StoreChrome';
import { Product, Variation, isVariationInStock } from '../../../../components/store/ProductCards';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

// A descrição vem do editor do painel em HTML. Sem um sanitizador, mostramos só o texto,
// preservando parágrafos e itens de lista como quebras de linha.
function descriptionToText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6])>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const store = useStore();
  const socials = useSocialLinks();
  const productSlug = params.productSlug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<Variation | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'not-found'>('loading');

  useEffect(() => {
    fetch(`${API_BASE}/api/storefront/produtos/${productSlug}`, {
      headers: { 'X-Tenant-Slug': store.slug },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: Product | null) => {
        if (!data) {
          setStatus('not-found');
          return;
        }
        setProduct(data);
        // Já deixa selecionada a primeira opção com estoque
        const variations = data.variations || [];
        setSelectedVariation(variations.find(isVariationInStock) || variations[0] || null);
        setStatus('ready');
      })
      .catch(() => setStatus('not-found'));
  }, [store.slug, productSlug]);

  const handleBuyNow = () => {
    if (!selectedVariation) return;
    router.push(`/loja/${store.slug}/checkout?variationId=${selectedVariation.id}`);
  };

  const isGamer = store.theme === 'theme-gamer';
  const canBuy = Boolean(selectedVariation && isVariationInStock(selectedVariation));
  const isManual = selectedVariation?.deliveryType === 'MANUAL_CHAT';
  const discount =
    selectedVariation?.compareAtPrice && selectedVariation.compareAtPrice > selectedVariation.price
      ? Math.round((1 - selectedVariation.price / selectedVariation.compareAtPrice) * 100)
      : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {status === 'loading' && (
          <div className="py-32 flex justify-center" aria-label="Carregando">
            <div className="w-6 h-6 border-2 border-[var(--border-color)] border-t-[var(--color-brand)] rounded-full animate-spin" />
          </div>
        )}

        {status === 'not-found' && (
          <div className="py-32 text-center">
            <p className="text-lg font-semibold">Produto não encontrado</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Ele pode ter sido removido ou o link está errado.</p>
            <Link href={`/loja/${store.slug}`} className="inline-block mt-6 text-sm font-semibold text-[var(--color-brand)] hover:underline">
              Ver todos os produtos
            </Link>
          </div>
        )}

        {status === 'ready' && product && (
          <>
            <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-8 min-w-0" aria-label="Você está em">
              <Link href={`/loja/${store.slug}`} className="hover:text-[var(--text-primary)] shrink-0">Início</Link>
              <span aria-hidden>/</span>
              {product.categoryName && (
                <>
                  <span className="shrink-0">{product.categoryName}</span>
                  <span aria-hidden>/</span>
                </>
              )}
              <span className="text-[var(--text-primary)] truncate">{product.name}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
              <div>
                <div
                  className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-card)] border border-[var(--border-color)]"
                  style={{ borderRadius: 'var(--store-radius)' }}
                >
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-[var(--text-muted)]">
                      <ImageOff className="w-10 h-10" aria-hidden />
                    </div>
                  )}
                </div>

                {product.description && (
                  <section className="mt-8">
                    <h2 className="text-lg font-semibold mb-3">Sobre o produto</h2>
                    <p className="text-[15px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">
                      {descriptionToText(product.description)}
                    </p>
                  </section>
                )}
              </div>

              <div>
                <div className="lg:sticky lg:top-28 space-y-6">
                  <div>
                    {product.categoryName && <p className="text-sm text-[var(--text-secondary)]">{product.categoryName}</p>}
                    <h1
                      className={`mt-1 text-3xl sm:text-4xl leading-tight ${
                        isGamer ? 'font-black italic uppercase tracking-wide' : 'font-bold tracking-tight'
                      }`}
                    >
                      {product.name}
                    </h1>
                  </div>

                  {selectedVariation && (
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="text-3xl font-bold tabular-nums">{formatPrice(Number(selectedVariation.price))}</span>
                      {discount > 0 && (
                        <>
                          <span className="text-lg text-[var(--text-muted)] line-through tabular-nums">
                            {formatPrice(Number(selectedVariation.compareAtPrice))}
                          </span>
                          <span className="text-xs font-bold px-2 py-1 rounded bg-emerald-500/15 text-emerald-500">-{discount}%</span>
                        </>
                      )}
                    </div>
                  )}

                  {product.variations && product.variations.length > 1 && (
                    <fieldset>
                      <legend className="text-sm font-medium mb-3">Escolha uma opção</legend>
                      <div className="space-y-2">
                        {product.variations.map((v) => {
                          const inStock = isVariationInStock(v);
                          const selected = selectedVariation?.id === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => inStock && setSelectedVariation(v)}
                              disabled={!inStock}
                              aria-pressed={selected}
                              className={`w-full flex items-center justify-between gap-4 px-4 py-3.5 border text-left transition-colors ${
                                selected
                                  ? 'border-[var(--color-brand)]'
                                  : inStock
                                    ? 'border-[var(--border-color)] hover:border-[var(--border-hover)]'
                                    : 'border-[var(--border-color)] opacity-45 cursor-not-allowed'
                              }`}
                              style={{
                                borderRadius: 'var(--store-radius-sm)',
                                background: selected ? 'color-mix(in srgb, var(--color-brand) 10%, transparent)' : 'var(--bg-card)',
                              }}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <span
                                  aria-hidden
                                  className="w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center"
                                  style={{
                                    borderColor: selected ? 'var(--color-brand)' : 'var(--border-hover)',
                                    background: selected ? 'var(--color-brand)' : 'transparent',
                                    color: 'var(--store-on-brand)',
                                  }}
                                >
                                  {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium truncate">{v.name}</span>
                                  {!inStock && <span className="block text-xs text-[var(--text-muted)]">Esgotado</span>}
                                </span>
                              </span>
                              <span className="text-right shrink-0">
                                {v.compareAtPrice && v.compareAtPrice > v.price && (
                                  <span className="block text-xs text-[var(--text-muted)] line-through tabular-nums">
                                    {formatPrice(Number(v.compareAtPrice))}
                                  </span>
                                )}
                                <span className="block text-sm font-semibold tabular-nums">{formatPrice(Number(v.price))}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}

                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!canBuy}
                    className={`w-full py-4 text-base font-bold transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${
                      isGamer ? 'uppercase italic tracking-wider' : ''
                    }`}
                    style={{
                      background: 'var(--color-brand)',
                      color: 'var(--store-on-brand)',
                      borderRadius: 'var(--store-radius-sm)',
                      boxShadow: isGamer ? '0 0 30px -6px var(--color-brand)' : undefined,
                    }}
                  >
                    {canBuy ? 'Comprar agora' : 'Produto esgotado'}
                  </button>

                  <ul className="space-y-4 pt-6 border-t border-[var(--border-color)] text-sm">
                    <li className="flex gap-3">
                      <Zap className="w-5 h-5 shrink-0 text-[var(--color-brand)]" aria-hidden />
                      <span>
                        <span className="block font-medium">{isManual ? 'Entrega pelo vendedor' : 'Entrega automática'}</span>
                        <span className="block text-[var(--text-secondary)] mt-0.5">
                          {isManual
                            ? 'Depois do pagamento você recebe as instruções do vendedor para concluir a entrega.'
                            : 'A chave aparece na tela assim que o Pix é aprovado e fica salva em "Minhas compras" se você estiver logado.'}
                        </span>
                      </span>
                    </li>
                    <li className="flex gap-3">
                      <ShieldCheck className="w-5 h-5 shrink-0 text-[var(--color-brand)]" aria-hidden />
                      <span>
                        <span className="block font-medium">Pagamento por Pix</span>
                        <span className="block text-[var(--text-secondary)] mt-0.5">
                          A cobrança é gerada pelo Mercado Pago, direto para a conta da loja.
                        </span>
                      </span>
                    </li>
                  </ul>

                  {socials.length > 0 && (
                    <div className="pt-6 border-t border-[var(--border-color)]">
                      <p className="text-sm font-medium">Dúvidas sobre o produto?</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {socials.map(({ label, href, Icon }) => (
                          <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-color)] hover:border-[var(--color-brand)] transition-colors"
                            style={{ borderRadius: 'var(--store-radius-sm)' }}
                          >
                            <Icon className="w-4 h-4" />
                            Falar no {label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <StoreFooter />
    </div>
  );
}
