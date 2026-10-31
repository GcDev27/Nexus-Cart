'use client';

import React from 'react';
import Link from 'next/link';
import { ImageOff } from 'lucide-react';
import { formatPrice } from './StoreContext';

export type Variation = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  deliveryType: string;
  availableStockCount?: number;
  stockQuantity?: number;
  hasUnlimitedStock?: boolean;
};

export type Product = {
  id: string | number;
  name: string;
  description: string;
  slug: string;
  categoryName?: string;
  imageUrl?: string;
  variations?: Variation[];
};

export function getMinPrice(product: Product): number {
  const prices = (product.variations || []).map((v) => Number(v.price)).filter((p) => !isNaN(p) && p > 0);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

export function isVariationInStock(v: Variation): boolean {
  if (v.hasUnlimitedStock) return true;
  if (v.deliveryType === 'AUTOMATIC_LINES') return (v.availableStockCount ?? 0) > 0;
  return (v.stockQuantity ?? 0) > 0;
}

export function isProductInStock(product: Product): boolean {
  return (product.variations || []).some(isVariationInStock);
}

// A descrição vem do editor do painel (HTML); nos cards só cabe o texto puro
export function plainText(html: string | undefined): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

type CardProps = { product: Product; href: string };

function ProductImage({ product, className = '' }: { product: Product; className?: string }) {
  return product.imageUrl ? (
    <img src={product.imageUrl} alt="" className={`w-full h-full object-cover ${className}`} loading="lazy" />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]" aria-hidden>
      <ImageOff className="w-8 h-8" />
    </div>
  );
}

function StockLabel({ inStock }: { inStock: boolean }) {
  return inStock ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-500">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      Disponível
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      Esgotado
    </span>
  );
}

/* Dark Premium: card de vidro com imagem emoldurada */
export function GlassCard({ product, href }: CardProps) {
  const inStock = isProductInStock(product);
  return (
    <Link
      href={href}
      className="group flex flex-col h-full bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-hover)] hover:shadow-[var(--card-hover-shadow)] transition-all duration-300 overflow-hidden"
      style={{ borderRadius: 'var(--store-radius)' }}
    >
      <div className="p-2.5 pb-0">
        <div
          className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-primary)]"
          style={{ borderRadius: 'calc(var(--store-radius) - 6px)' }}
        >
          <ProductImage product={product} className="group-hover:scale-[1.03] transition-transform duration-500" />
          {product.categoryName && (
            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 text-[11px] font-semibold bg-black/60 text-white backdrop-blur-md rounded-md">
              {product.categoryName}
            </span>
          )}
        </div>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-lg leading-snug line-clamp-1 group-hover:text-[var(--color-brand)] transition-colors">
          {product.name}
        </h3>
        <div className="mt-1"><StockLabel inStock={inStock} /></div>
        <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{plainText(product.description)}</p>
        <div className="mt-auto pt-4 flex items-end justify-between gap-3">
          <div>
            <span className="block text-xs text-[var(--text-secondary)]">A partir de</span>
            <span className="text-xl font-bold tabular-nums">{formatPrice(getMinPrice(product))}</span>
          </div>
          <span
            className="px-3.5 py-2 text-sm font-semibold transition-colors"
            style={{
              background: 'color-mix(in srgb, var(--color-brand) 16%, transparent)',
              color: 'var(--color-brand)',
              borderRadius: 'var(--store-radius-sm)',
            }}
          >
            Ver opções
          </span>
        </div>
      </div>
    </Link>
  );
}

/* Clean Light: imagem domina, texto mínimo embaixo, sem moldura */
export function LightCard({ product, href }: CardProps) {
  const inStock = isProductInStock(product);
  return (
    <Link href={href} className="group block">
      <div
        className="relative aspect-square overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-color)]"
        style={{ borderRadius: 'var(--store-radius)' }}
      >
        <ProductImage product={product} className="group-hover:scale-105 transition-transform duration-700" />
        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 py-2 text-center text-xs font-semibold bg-white/85 text-neutral-700 backdrop-blur">
            Esgotado
          </span>
        )}
      </div>
      <div className="mt-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {product.categoryName && <p className="text-xs text-[var(--text-secondary)]">{product.categoryName}</p>}
          <h3 className="mt-0.5 font-semibold leading-snug line-clamp-2 group-hover:underline underline-offset-4">
            {product.name}
          </h3>
        </div>
        <span className="shrink-0 font-semibold tabular-nums">{formatPrice(getMinPrice(product))}</span>
      </div>
    </Link>
  );
}

/* Gamer Neon: canto cortado, borda na cor da marca e etiqueta de preço */
export function NeonCard({ product, href }: CardProps) {
  const inStock = isProductInStock(product);
  const cut = 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))';
  return (
    <Link
      href={href}
      className="group relative block p-px transition-all duration-300 hover:-translate-y-1"
      style={{
        clipPath: cut,
        background: 'linear-gradient(135deg, var(--color-brand), color-mix(in srgb, var(--color-brand) 25%, transparent) 45%, var(--color-brand))',
      }}
    >
      <div className="h-full bg-[var(--bg-card)] flex flex-col" style={{ clipPath: cut }}>
        <div className="relative aspect-video overflow-hidden">
          <ProductImage product={product} className="group-hover:scale-110 transition-transform duration-500 saturate-[1.15]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent" />
          <span
            className="absolute left-3 bottom-3 px-3 py-1 text-sm font-black italic tabular-nums"
            style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
          >
            {formatPrice(getMinPrice(product))}
          </span>
        </div>
        <div className="p-4 pt-3 flex flex-col flex-1">
          <h3 className="font-black italic uppercase tracking-wide leading-tight line-clamp-2 group-hover:text-[var(--color-brand)] transition-colors">
            {product.name}
          </h3>
          <div className="mt-auto pt-3 flex items-center justify-between">
            <span className="text-xs text-[var(--text-secondary)]">{product.categoryName || 'Geral'}</span>
            <StockLabel inStock={inStock} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* Lista Rápida: uma linha por produto, pronta para comprar */
export function ProductRow({ product, href }: CardProps) {
  const inStock = isProductInStock(product);
  const variations = product.variations?.length ?? 0;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 px-3 sm:px-4 py-3 hover:bg-[var(--surface-hover)] transition-colors"
    >
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 overflow-hidden bg-[var(--bg-primary)] border border-[var(--border-color)]"
        style={{ borderRadius: 'var(--store-radius-sm)' }}
      >
        <ProductImage product={product} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug truncate">{product.name}</h3>
        <p className="mt-0.5 text-xs text-[var(--text-secondary)] truncate">
          {variations > 1 ? `${variations} opções` : plainText(product.description) || 'Produto digital'}
        </p>
      </div>
      <div className="hidden sm:block w-28 shrink-0">
        <StockLabel inStock={inStock} />
      </div>
      <div className="text-right shrink-0">
        <span className="block font-bold tabular-nums">{formatPrice(getMinPrice(product))}</span>
        {variations > 1 && <span className="block text-[11px] text-[var(--text-secondary)]">a partir de</span>}
      </div>
      <span
        className={`hidden sm:inline-block shrink-0 px-4 py-2 text-sm font-semibold transition-opacity ${inStock ? '' : 'opacity-40'}`}
        style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
      >
        Comprar
      </span>
    </Link>
  );
}
