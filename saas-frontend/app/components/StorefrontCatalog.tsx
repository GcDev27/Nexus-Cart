'use client';

import React, { useMemo, useRef, useState } from 'react';
import { SearchX } from 'lucide-react';
import { useStore, formatPrice } from './store/StoreContext';
import { AnnouncementBar, StoreFooter, StoreHeader, StoreSearch } from './store/StoreChrome';
import StoreSelect from './store/StoreSelect';
import {
  GlassCard, LightCard, NeonCard, ProductRow,
  getMinPrice, Product,
} from './store/ProductCards';

export type { Product } from './store/ProductCards';

type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'name_asc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'featured', label: 'Destaques' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'name_asc', label: 'Nome (A a Z)' },
];

const ALL = 'ALL';
const categoryOf = (p: Product) => (p.categoryName || 'Geral').trim();

export default function StorefrontCatalog({ initialProducts = [] }: { initialProducts: Product[] }) {
  const store = useStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<string>(ALL);
  const [sortBy, setSortBy] = useState<SortKey>('featured');

  const maxStorePrice = useMemo(() => {
    const max = Math.max(0, ...initialProducts.map(getMinPrice));
    return max > 0 ? Math.ceil(max / 10) * 10 : 100;
  }, [initialProducts]);
  // null = sem limite; evita ter que sincronizar o estado quando o catálogo muda
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    initialProducts.forEach((p) => counts.set(categoryOf(p), (counts.get(categoryOf(p)) || 0) + 1));
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [initialProducts]);

  const products = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return initialProducts
      .filter((p) => {
        if (query) {
          const haystack = `${p.name} ${p.description || ''} ${p.categoryName || ''}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (category !== ALL && categoryOf(p).toLowerCase() !== category.toLowerCase()) return false;
        if (maxPrice !== null && getMinPrice(p) > maxPrice) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return getMinPrice(a) - getMinPrice(b);
        if (sortBy === 'price_desc') return getMinPrice(b) - getMinPrice(a);
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [initialProducts, searchTerm, category, maxPrice, sortBy]);

  const hasFilters = Boolean(searchTerm.trim()) || category !== ALL || maxPrice !== null;
  const resetFilters = () => {
    setSearchTerm('');
    setCategory(ALL);
    setMaxPrice(null);
  };

  const hrefOf = (p: Product) => `/loja/${store.slug}/produto/${p.slug}`;
  const search = { value: searchTerm, onChange: setSearchTerm, inputRef: searchInputRef };

  const shared: LayoutProps = {
    products,
    categories,
    totalCount: initialProducts.length,
    category,
    setCategory,
    sortBy,
    setSortBy,
    hasFilters,
    resetFilters,
    hrefOf,
    search,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <StoreHeader search={search} />
      <div className="flex-1">
        {store.theme === 'theme-light' && <LightLayout {...shared} />}
        {store.theme === 'theme-gamer' && <GamerLayout {...shared} />}
        {store.theme === 'theme-list' && <ListLayout {...shared} />}
        {store.theme === 'theme-glass' && (
          <GlassLayout {...shared} maxPrice={maxPrice} setMaxPrice={setMaxPrice} maxStorePrice={maxStorePrice} />
        )}
      </div>
      <StoreFooter />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Peças compartilhadas
═══════════════════════════════════════════════════════════════════ */

type LayoutProps = {
  products: Product[];
  categories: { name: string; count: number }[];
  totalCount: number;
  category: string;
  setCategory: (c: string) => void;
  sortBy: SortKey;
  setSortBy: (s: SortKey) => void;
  hasFilters: boolean;
  resetFilters: () => void;
  hrefOf: (p: Product) => string;
  search: { value: string; onChange: (v: string) => void; inputRef: React.RefObject<HTMLInputElement | null> };
};

function SortSelect({ sortBy, setSortBy }: Pick<LayoutProps, 'sortBy' | 'setSortBy'>) {
  return <StoreSelect label="Ordenar por" value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />;
}

function ResultCount({ count }: { count: number }) {
  return (
    <p className="text-sm text-[var(--text-secondary)]">
      {count === 1 ? '1 produto' : `${count} produtos`}
    </p>
  );
}

function EmptyState({ hasFilters, resetFilters }: Pick<LayoutProps, 'hasFilters' | 'resetFilters'>) {
  return (
    <div
      className="py-16 px-6 text-center border border-dashed border-[var(--border-color)]"
      style={{ borderRadius: 'var(--store-radius)' }}
    >
      <SearchX className="w-8 h-8 mx-auto text-[var(--text-muted)]" aria-hidden />
      <p className="mt-3 font-semibold">
        {hasFilters ? 'Nenhum produto com esses filtros' : 'Esta loja ainda não tem produtos'}
      </p>
      {hasFilters && (
        <button
          type="button"
          onClick={resetFilters}
          className="mt-4 px-4 py-2 text-sm font-semibold"
          style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

// Busca dentro da página para telas pequenas (no cabeçalho ela só aparece a partir do tablet)
function MobileSearch({ search }: Pick<LayoutProps, 'search'>) {
  return <StoreSearch {...search} className="md:hidden w-full mb-4" />;
}

type ChipStyle = 'pill' | 'tab' | 'neon' | 'compact';

function CategoryChips({
  categories, totalCount, category, setCategory, style,
}: Pick<LayoutProps, 'categories' | 'totalCount' | 'category' | 'setCategory'> & { style: ChipStyle }) {
  const items = [{ name: ALL, label: 'Todos', count: totalCount }, ...categories.map((c) => ({ ...c, label: c.name }))];

  return (
    <div className={`flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 ${style === 'tab' ? 'gap-6 border-b border-[var(--border-color)]' : ''}`}>
      {items.map((item) => {
        const active = category.toLowerCase() === item.name.toLowerCase();

        if (style === 'tab') {
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategory(item.name)}
              className={`shrink-0 pb-3 -mb-px border-b-2 text-sm font-medium transition-colors ${
                active ? 'border-[var(--color-brand)] text-[var(--text-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {item.label}
            </button>
          );
        }

        const base = 'shrink-0 flex items-center gap-2 text-sm font-semibold transition-colors border';
        const activeStyle = { background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderColor: 'var(--color-brand)' };

        if (style === 'neon') {
          return (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategory(item.name)}
              className={`${base} px-4 py-2 uppercase italic tracking-wide font-black ${active ? '' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'}`}
              style={{ ...(active ? activeStyle : {}), clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
            >
              {item.label}
            </button>
          );
        }

        return (
          <button
            key={item.name}
            type="button"
            onClick={() => setCategory(item.name)}
            className={`${base} ${style === 'compact' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'} ${
              active ? '' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]'
            }`}
            style={{ ...(active ? activeStyle : {}), borderRadius: style === 'pill' ? '999px' : 'var(--store-radius-sm)' }}
          >
            {item.label}
            <span className="text-xs opacity-70 tabular-nums">{item.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Dark Premium: banner com vidro, barra lateral de filtros e grade
═══════════════════════════════════════════════════════════════════ */
function GlassLayout(
  props: LayoutProps & { maxPrice: number | null; setMaxPrice: (v: number | null) => void; maxStorePrice: number }
) {
  const store = useStore();
  const { products, categories, totalCount, category, setCategory, maxPrice, setMaxPrice, maxStorePrice } = props;

  return (
    <div className="relative">
      <div aria-hidden className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -right-[5%] w-[45%] h-[45%] rounded-full blur-[140px] opacity-25" style={{ background: 'var(--color-brand)' }} />
        <div className="absolute -bottom-[10%] -left-[5%] w-[35%] h-[35%] rounded-full blur-[140px] opacity-15" style={{ background: 'var(--color-brand)' }} />
      </div>

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {store.bannerUrl ? (
          <section
            className="relative overflow-hidden border border-[var(--border-color)] mb-10 min-h-[240px] sm:min-h-[320px] flex items-end"
            style={{ borderRadius: 'var(--store-radius)' }}
          >
            <img src={store.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
            <div className="relative p-6 sm:p-10 max-w-2xl text-white">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{store.heroTitle}</h1>
              {store.heroDescription && <p className="mt-3 text-white/80 sm:text-lg leading-relaxed">{store.heroDescription}</p>}
            </div>
          </section>
        ) : (
          <section className="text-center mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight max-w-4xl mx-auto">{store.heroTitle}</h1>
            {store.heroDescription && (
              <p className="mt-4 text-[var(--text-secondary)] sm:text-lg max-w-2xl mx-auto leading-relaxed">{store.heroDescription}</p>
            )}
          </section>
        )}

        <MobileSearch search={props.search} />
        <div className="lg:hidden mb-6">
          <CategoryChips categories={categories} totalCount={totalCount} category={category} setCategory={setCategory} style="pill" />
        </div>

        <div className="flex gap-8 lg:gap-10">
          <aside className="hidden lg:block w-64 shrink-0 space-y-5">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 backdrop-blur-md" style={{ borderRadius: 'var(--store-radius)' }}>
              <h2 className="text-sm font-bold mb-3">Categorias</h2>
              <ul className="space-y-1">
                {[{ name: ALL, label: 'Todos os produtos', count: totalCount }, ...categories.map((c) => ({ ...c, label: c.name }))].map((c) => {
                  const active = category.toLowerCase() === c.name.toLowerCase();
                  return (
                    <li key={c.name}>
                      <button
                        type="button"
                        onClick={() => setCategory(c.name)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                          active ? 'font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                        }`}
                        style={{
                          borderRadius: 'var(--store-radius-sm)',
                          ...(active ? { background: 'color-mix(in srgb, var(--color-brand) 16%, transparent)', color: 'var(--color-brand)' } : {}),
                        }}
                      >
                        <span className="truncate">{c.label}</span>
                        <span className="text-xs opacity-70 tabular-nums">{c.count}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 backdrop-blur-md" style={{ borderRadius: 'var(--store-radius)' }}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold">Preço máximo</h2>
                {maxPrice !== null && (
                  <button type="button" onClick={() => setMaxPrice(null)} className="text-xs text-[var(--color-brand)] hover:underline">
                    Limpar
                  </button>
                )}
              </div>
              <p className="text-lg font-bold tabular-nums">{formatPrice(maxPrice ?? maxStorePrice)}</p>
              <input
                type="range"
                min={0}
                max={maxStorePrice}
                step={Math.max(1, Math.round(maxStorePrice / 50))}
                value={maxPrice ?? maxStorePrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                aria-label="Preço máximo"
                className="store-range mt-4"
                style={{ '--fill': `${((maxPrice ?? maxStorePrice) / maxStorePrice) * 100}%` } as React.CSSProperties}
              />
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-[var(--border-color)]">
              <ResultCount count={products.length} />
              <SortSelect sortBy={props.sortBy} setSortBy={props.setSortBy} />
            </div>
            {products.length === 0 ? (
              <EmptyState hasFilters={props.hasFilters} resetFilters={props.resetFilters} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {products.map((p) => <GlassCard key={p.id} product={p} href={props.hrefOf(p)} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Clean Light: hero dividido, abas de categoria e grade de 4 colunas
═══════════════════════════════════════════════════════════════════ */
function LightLayout(props: LayoutProps) {
  const store = useStore();
  const { products, categories, totalCount, category, setCategory } = props;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
      <section className="grid md:grid-cols-2 gap-8 md:gap-12 items-center py-10 sm:py-16">
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">{store.heroTitle}</h1>
          {store.heroDescription && (
            <p className="mt-5 text-lg text-[var(--text-secondary)] leading-relaxed max-w-lg">{store.heroDescription}</p>
          )}
          <a
            href="#catalogo"
            className="inline-block mt-8 px-6 py-3 font-semibold"
            style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
          >
            Ver produtos
          </a>
        </div>
        <div
          className="relative aspect-[4/3] overflow-hidden"
          style={{ borderRadius: 'var(--store-radius)', background: 'color-mix(in srgb, var(--color-brand) 14%, var(--bg-secondary))' }}
        >
          {store.bannerUrl ? (
            <img src={store.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span aria-hidden className="absolute inset-0 flex items-center justify-center text-[10rem] font-bold" style={{ color: 'var(--color-brand)', opacity: 0.85 }}>
              {store.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </section>

      <section id="catalogo" className="scroll-mt-24">
        <MobileSearch search={props.search} />
        <div className="flex flex-col-reverse sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <CategoryChips categories={categories} totalCount={totalCount} category={category} setCategory={setCategory} style="tab" />
          </div>
          <SortSelect sortBy={props.sortBy} setSortBy={props.setSortBy} />
        </div>
        {products.length === 0 ? (
          <EmptyState hasFilters={props.hasFilters} resetFilters={props.resetFilters} />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {products.map((p) => <LightCard key={p.id} product={p} href={props.hrefOf(p)} />)}
          </div>
        )}
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Gamer Neon: banner de tela cheia, título pesado e cards com corte
═══════════════════════════════════════════════════════════════════ */
function GamerLayout(props: LayoutProps) {
  const store = useStore();
  const { products, categories, totalCount, category, setCategory } = props;

  return (
    <div>
      <section className="relative overflow-hidden min-h-[320px] sm:min-h-[420px] flex items-center">
        {store.bannerUrl ? (
          <img src={store.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse at 75% 40%, color-mix(in srgb, var(--color-brand) 45%, transparent), transparent 60%), repeating-linear-gradient(115deg, transparent 0 38px, color-mix(in srgb, var(--color-brand) 10%, transparent) 38px 40px)',
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-primary)] via-[var(--bg-primary)]/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--bg-primary)] to-transparent" />

        <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <span aria-hidden className="block w-16 h-1.5 mb-6" style={{ background: 'var(--color-brand)', boxShadow: '0 0 20px var(--color-brand)' }} />
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black italic uppercase tracking-tight leading-[0.95] max-w-3xl">
            {store.heroTitle}
          </h1>
          {store.heroDescription && (
            <p className="mt-5 text-[var(--text-secondary)] sm:text-lg max-w-xl leading-relaxed">{store.heroDescription}</p>
          )}
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <MobileSearch search={props.search} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex-1 min-w-0">
            <CategoryChips categories={categories} totalCount={totalCount} category={category} setCategory={setCategory} style="neon" />
          </div>
          <SortSelect sortBy={props.sortBy} setSortBy={props.setSortBy} />
        </div>
        {products.length === 0 ? (
          <EmptyState hasFilters={props.hasFilters} resetFilters={props.resetFilters} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => <NeonCard key={p.id} product={p} href={props.hrefOf(p)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Lista Rápida: produtos agrupados por categoria, uma linha por item
═══════════════════════════════════════════════════════════════════ */
function ListLayout(props: LayoutProps) {
  const store = useStore();
  const { products, categories, totalCount, category, setCategory } = props;

  // Agrupa mantendo a ordem escolhida no seletor
  const groups = useMemo(() => {
    const map = new Map<string, Product[]>();
    products.forEach((p) => {
      const key = categoryOf(p);
      map.set(key, [...(map.get(key) || []), p]);
    });
    return [...map.entries()];
  }, [products]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10">
      {store.bannerUrl && (
        <div className="relative h-32 sm:h-44 overflow-hidden mb-6 border border-[var(--border-color)]" style={{ borderRadius: 'var(--store-radius)' }}>
          <img src={store.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      )}
      <section className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{store.heroTitle}</h1>
        {store.heroDescription && <p className="mt-2 text-[var(--text-secondary)] leading-relaxed max-w-2xl">{store.heroDescription}</p>}
      </section>

      <MobileSearch search={props.search} />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <CategoryChips categories={categories} totalCount={totalCount} category={category} setCategory={setCategory} style="compact" />
        </div>
        <SortSelect sortBy={props.sortBy} setSortBy={props.setSortBy} />
      </div>

      {products.length === 0 ? (
        <EmptyState hasFilters={props.hasFilters} resetFilters={props.resetFilters} />
      ) : (
        <div className="space-y-8">
          {groups.map(([name, items]) => (
            <section key={name}>
              <h2 className="flex items-baseline gap-2 text-sm font-semibold text-[var(--text-secondary)] mb-2 px-1">
                {name}
                <span className="text-xs font-normal text-[var(--text-muted)] tabular-nums">{items.length}</span>
              </h2>
              <div
                className="bg-[var(--bg-card)] border border-[var(--border-color)] divide-y divide-[var(--border-color)] overflow-hidden"
                style={{ borderRadius: 'var(--store-radius)' }}
              >
                {items.map((p) => <ProductRow key={p.id} product={p} href={props.hrefOf(p)} />)}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
