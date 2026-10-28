'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import StoreCustomerNav from './StoreCustomerNav';
import MotionSelect from './motion/MotionSelect';
import MotionModal from './motion/MotionModal';
import { 
  Search, 
  X, 
  SlidersHorizontal, 
  ArrowUpDown, 
  Zap, 
  ShieldCheck, 
  Sparkles, 
  ShoppingBag, 
  Home, 
  Tag, 
  Check, 
  HelpCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export type Variation = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  deliveryType: string;
  stockLines?: any[];
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

export type TenantInfo = {
  name?: string;
  slug?: string;
  logoUrl?: string;
  heroTitle?: string;
  heroDescription?: string;
  primaryColor?: string;
  theme?: string;
};

interface StorefrontCatalogProps {
  tenant: TenantInfo;
  initialProducts: Product[];
  storeSlug: string;
}

export default function StorefrontCatalog({
  tenant,
  initialProducts = [],
  storeSlug,
}: StorefrontCatalogProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados de Filtros e Busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'name_asc'>('featured');
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [infoModal, setInfoModal] = useState<'delivery' | 'guarantee' | null>(null);

  // Helper para obter menor preço de um produto
  const getMinPrice = (product: Product): number => {
    if (!product.variations || product.variations.length === 0) return 0;
    const validPrices = product.variations.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0);
    if (validPrices.length > 0) {
      return Math.min(...validPrices);
    }
    return Math.min(...product.variations.map(v => Number(v.price) || 0));
  };

  // Cálculo dos limites de preço da loja
  const { minStorePrice, maxStorePrice } = useMemo(() => {
    if (initialProducts.length === 0) return { minStorePrice: 0, maxStorePrice: 500 };
    const prices = initialProducts.map(p => getMinPrice(p));
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    // Arredonda para cima para uma dezena ou centena limpa
    const ceilingMax = max > 0 ? Math.ceil(max / 10) * 10 : 500;
    return { minStorePrice: Math.max(0, Math.floor(min)), maxStorePrice: Math.max(100, ceilingMax) };
  }, [initialProducts]);

  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(maxStorePrice);

  // Atualiza maxPriceFilter quando maxStorePrice for calculado
  React.useEffect(() => {
    setMaxPriceFilter(maxStorePrice);
  }, [maxStorePrice]);

  // Extrair categorias reais com contagem de produtos
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {};
    initialProducts.forEach(p => {
      const cat = (p.categoryName || 'Geral').trim();
      stats[cat] = (stats[cat] || 0) + 1;
    });

    const categoriesList = Object.entries(stats).map(([name, count]) => ({
      name,
      count,
    }));

    return {
      allCount: initialProducts.length,
      list: categoriesList.sort((a, b) => b.count - a.count),
    };
  }, [initialProducts]);

  // Produtos Filtrados e Ordenados
  const filteredProducts = useMemo(() => {
    return initialProducts.filter(product => {
      // 1. Filtro por Busca de Texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = product.name?.toLowerCase().includes(query);
        const matchesDesc = product.description?.toLowerCase().includes(query);
        const matchesCat = product.categoryName?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // 2. Filtro por Categoria
      if (selectedCategory !== 'ALL') {
        const cat = (product.categoryName || 'Geral').trim().toLowerCase();
        if (cat !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Filtro por Preço
      const productPrice = getMinPrice(product);
      if (productPrice > maxPriceFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') {
        return getMinPrice(a) - getMinPrice(b);
      }
      if (sortBy === 'price_desc') {
        return getMinPrice(b) - getMinPrice(a);
      }
      if (sortBy === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      return 0; // 'featured' mantém a ordem original
    });
  }, [initialProducts, searchTerm, selectedCategory, maxPriceFilter, sortBy]);

  // Indicador de filtros ativos
  const activeFiltersCount = (selectedCategory !== 'ALL' ? 1 : 0) + 
                             (maxPriceFilter < maxStorePrice ? 1 : 0) + 
                             (searchTerm.trim() ? 1 : 0);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setMaxPriceFilter(maxStorePrice);
    setSortBy('featured');
  };

  const storeName = tenant.name || (storeSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

  const focusSearch = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 250);
  };

  return (
    <div className="min-h-screen text-[var(--text-primary)] relative selection:bg-[var(--color-brand)]/30 pb-28 lg:pb-16">
      
      {/* Background Glow Efeitos (Glassmorphism ambient light) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[var(--color-brand)]/15 blur-[120px] rounded-full opacity-60 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[var(--color-brand)]/10 blur-[120px] rounded-full opacity-50 mix-blend-screen" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* Header da Loja - Super Clean (Apenas Nome da Loja, Barra de Pesquisa e Login/Conta) */}
        <header className="flex items-center justify-between py-3.5 px-4 sm:px-6 bg-[var(--bg-secondary)]/70 backdrop-blur-2xl border border-[var(--border-color)] rounded-2xl mb-8 sm:mb-12 shadow-2xl">
          {/* Lado Esquerdo: Nome / Logo da Loja */}
          <Link href={`/loja/${storeSlug}`} className="flex items-center gap-3 group shrink-0">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={storeName} className="h-8 sm:h-9 w-auto object-contain rounded-lg" />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[var(--color-brand)]/20 border border-[var(--color-brand)]/40 flex items-center justify-center text-[var(--color-brand)] font-black text-sm">
                {storeName.charAt(0)}
              </div>
            )}
            <h1 className="text-base sm:text-lg font-black tracking-tight leading-none group-hover:text-[var(--color-brand)] transition-colors">
              {storeName}
            </h1>
          </Link>

          {/* Centro: Barra de Pesquisa */}
          <div className="hidden sm:flex items-center bg-[var(--bg-primary)]/70 border border-[var(--border-color)] rounded-full px-4 py-2 w-72 md:w-96 focus-within:border-[var(--color-brand)]/60 focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20 transition-all mx-4">
            <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0 mr-2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar produtos digitais..."
              className="w-full bg-transparent text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="text-[var(--text-secondary)] hover:text-white p-0.5 ml-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lado Direito: Aba de Login e Conta */}
          <div className="flex items-center gap-3 shrink-0">
            <StoreCustomerNav storeSlug={storeSlug} />
          </div>
        </header>

        {/* Hero Section Simplificado & Focado em Ativos Digitais */}
        <div className="text-center mb-8 sm:mb-12 px-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 text-[var(--color-brand)] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plataforma Oficial de Produtos Digitais</span>
          </div>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-3 sm:mb-4">
            {tenant.heroTitle || 'Produtos Digitais com Entrega Automática'}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {tenant.heroDescription || 'Compre scripts, contas, plugins e licenças com ativação instantânea no seu e-mail e suporte 24 horas.'}
          </p>
        </div>

        {/* ── MOBILE: Barra de Busca dedicada + Chips de Categorias Deslizantes (Estilo App) ── */}
        <div className="lg:hidden mb-6 space-y-3">
          
          {/* Input de Busca Mobile */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 shadow-sm focus-within:border-[var(--color-brand)]/60 transition-colors">
              <Search className="w-4 h-4 text-[var(--text-secondary)] mr-2 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome ou categoria..."
                className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="p-1 text-zinc-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Botão de Filtros Mobile com Badge */}
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className={`relative flex items-center justify-center p-2.5 rounded-xl border transition-all ${
                activeFiltersCount > 0
                  ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-white'
              }`}
              title="Abrir Filtros"
            >
              <SlidersHorizontal className="w-5 h-5" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 text-black text-[10px] font-black rounded-full flex items-center justify-center shadow-lg">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Carrossel Horizontal de Categorias (Chips/Pills) no Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar -mx-4 px-4">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedCategory === 'ALL'
                  ? 'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/20'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-zinc-700'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedCategory === 'ALL' ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400'
              }`}>
                {categoryStats.allCount}
              </span>
            </button>

            {categoryStats.list.map(cat => {
              const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[var(--color-brand)] text-white shadow-md shadow-[var(--color-brand)]/20'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-zinc-700'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Layout: Barra Lateral Funcional (Desktop) + Grid de Produtos ── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          
          {/* Barra Lateral Desktop */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-8">
            
            {/* Box 1: Categorias Funcionais com Contagem Real */}
            <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-md border border-[var(--border-color)] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                  Categorias
                </h3>
                {selectedCategory !== 'ALL' && (
                  <button 
                    onClick={() => setSelectedCategory('ALL')} 
                    className="text-[11px] text-[var(--color-brand)] hover:underline font-medium"
                  >
                    Resetar
                  </button>
                )}
              </div>

              <div className="space-y-1">
                {/* Opção Todos */}
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    selectedCategory === 'ALL'
                      ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] font-semibold border border-[var(--color-brand)]/30'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                      selectedCategory === 'ALL'
                        ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                        : 'border-white/20 bg-transparent'
                    }`}>
                      {selectedCategory === 'ALL' && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                    <span>Todos os Produtos</span>
                  </div>
                  <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-400 font-mono">
                    {categoryStats.allCount}
                  </span>
                </button>

                {/* Lista de Categorias Reais */}
                {categoryStats.list.map(cat => {
                  const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-[var(--color-brand)]/15 text-[var(--color-brand)] font-semibold border border-[var(--color-brand)]/30'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${
                          isSelected
                            ? 'bg-[var(--color-brand)] border-[var(--color-brand)] text-white'
                            : 'border-white/20 bg-transparent'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded-full text-zinc-400 font-mono shrink-0">
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Box 2: Filtro de Preço Interativo */}
            <div className="bg-[var(--bg-secondary)]/50 backdrop-blur-md border border-[var(--border-color)] rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                  Preço Máximo
                </h3>
                {maxPriceFilter < maxStorePrice && (
                  <button 
                    onClick={() => setMaxPriceFilter(maxStorePrice)} 
                    className="text-[11px] text-[var(--color-brand)] hover:underline font-medium"
                  >
                    Resetar
                  </button>
                )}
              </div>

              {/* Indicador de Preço Atual */}
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-[var(--text-secondary)]">Até</span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  R$ {maxPriceFilter.toFixed(2)}
                </span>
              </div>

              {/* Slider de Preço Interativo */}
              <div className="space-y-2">
                <input
                  type="range"
                  min={minStorePrice}
                  max={maxStorePrice}
                  step={Math.max(1, Math.floor((maxStorePrice - minStorePrice) / 50))}
                  value={maxPriceFilter}
                  onChange={e => setMaxPriceFilter(Number(e.target.value))}
                  className="w-full accent-[var(--color-brand)] cursor-pointer h-1.5 bg-zinc-800 rounded-lg appearance-none"
                />
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-mono">
                  <span>R$ {minStorePrice.toFixed(0)}</span>
                  <span>R$ {maxStorePrice.toFixed(0)}+</span>
                </div>
              </div>
            </div>

            {/* Box 3: Benefícios Digitais da Loja */}
            <div className="bg-gradient-to-br from-[var(--color-brand)]/10 via-[var(--bg-secondary)]/30 to-transparent border border-[var(--color-brand)]/20 rounded-2xl p-4.5 space-y-3.5">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                Vantagens da Plataforma
              </h4>
              <ul className="text-xs text-zinc-400 space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Entrega automática imediata após o pagamento</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Acesso e entrega imediata diretamente no seu e-mail</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Pagamento 100% via PIX com aprovação instantânea</span>
                </li>
              </ul>
            </div>
          </aside>

          {/* ── Conteúdo Central: Controles de Ordenação + Grid de Produtos ── */}
          <main className="flex-1">
            
            {/* Barra Superior do Catálogo: Contador + Ordenação */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {filteredProducts.length === 1 
                    ? '1 produto encontrado' 
                    : `${filteredProducts.length} produtos encontrados`}
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-[var(--color-brand)] hover:underline flex items-center gap-1 font-medium"
                  >
                    <X className="w-3 h-3" />
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Seletor de Ordenação com Motion */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-secondary)] hidden sm:inline">Ordenar por:</span>
                <MotionSelect
                  value={sortBy}
                  onChange={(val) => setSortBy(val as any)}
                  options={[
                    { value: 'featured', label: 'Destaques' },
                    { value: 'price_asc', label: 'Menor Preço' },
                    { value: 'price_desc', label: 'Maior Preço' },
                    { value: 'name_asc', label: 'Nome (A - Z)' },
                  ]}
                />
              </div>
            </div>

            {/* Grid de Produtos */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-[var(--bg-secondary)]/40 border border-[var(--border-color)] rounded-3xl backdrop-blur-md px-6">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-zinc-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Nenhum produto encontrado</h3>
                <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1 max-w-md mx-auto">
                  {searchTerm || selectedCategory !== 'ALL' || maxPriceFilter < maxStorePrice
                    ? 'Tente ajustar os filtros ou os termos da pesquisa para encontrar o que procura.'
                    : 'Esta loja ainda não possui produtos ativos no catálogo.'}
                </p>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="mt-5 px-5 py-2.5 bg-[var(--color-brand)] text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg shadow-[var(--color-brand)]/20"
                  >
                    Limpar Filtros e Ver Todos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
                {filteredProducts.map(product => {
                  const minPrice = getMinPrice(product);
                  const inStock = product.variations?.some(v =>
                    v.hasUnlimitedStock || (v.stockLines && v.stockLines.length > 0) || (v.stockQuantity ?? 0) > 0
                  );
                  const isAutomatic = product.variations?.some(v => v.deliveryType === 'AUTOMATIC_LINES');
                  const categoryBadge = product.categoryName || 'Geral';

                  return (
                    <Link 
                      key={product.id} 
                      href={`/loja/${storeSlug}/produto/${product.slug}`}
                      className="group block"
                    >
                      <div className="bg-[var(--bg-secondary)]/80 border border-[var(--border-color)] rounded-[20px] overflow-hidden hover:border-[var(--color-brand)]/40 transition-colors duration-150 flex flex-col h-full">
                        
                        {/* Imagem do Produto: Apenas a Categoria no topo, sem animação */}
                        <div className="p-2.5 pb-0 relative">
                          <div className="w-full aspect-[4/3] bg-[var(--bg-primary)] rounded-[14px] overflow-hidden relative border border-[var(--border-color)]">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 bg-gradient-to-b from-white/[0.02] to-transparent">
                                <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
                                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Produto Digital</span>
                              </div>
                            )}

                            {/* Badge: APENAS Categoria em cima da foto */}
                            <div className="absolute top-2.5 left-2.5">
                              <span className="px-2.5 py-1 bg-black/75 backdrop-blur-md border border-white/10 text-zinc-300 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                {categoryBadge}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Conteúdo Informativo do Card */}
                        <div className="p-4 sm:p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-[var(--text-primary)] text-base sm:text-lg leading-snug mb-1 group-hover:text-[var(--color-brand)] transition-colors line-clamp-1">
                            {product.name}
                          </h3>

                          {/* Disponibilidade onde fica a descrição */}
                          <div className="flex items-center gap-1.5 mb-2">
                            {inStock !== false ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Disponível
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600"></span>
                                Esgotado
                              </span>
                            )}
                          </div>

                          <p className="text-[var(--text-secondary)] text-xs line-clamp-2 leading-relaxed mb-4">
                            {product.description || 'Produto digital verificado com garantia e entrega instantânea.'}
                          </p>
                          
                          {/* Preço e Botão de Ação */}
                          <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-medium">A partir de</span>
                              <span className="text-[var(--text-primary)] font-black text-lg sm:text-xl font-mono">
                                R$ {minPrice.toFixed(2)}
                              </span>
                            </div>
                            
                            <span className="bg-[var(--color-brand)]/15 border border-[var(--color-brand)]/30 text-[var(--color-brand)] text-xs font-bold px-3.5 py-1.5 rounded-xl group-hover:bg-[var(--color-brand)] group-hover:text-white transition-colors flex items-center gap-1">
                              <span>Ver Opções</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── MODAL: Gaveta de Filtros para Mobile (Bottom Sheet) ── */}
      {isFilterDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay Escuro */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsFilterDrawerOpen(false)}
          />

          {/* Conteúdo Deslizante da Gaveta */}
          <div className="relative bg-[#121318] border-t border-white/10 rounded-t-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-6 animate-in slide-in-from-bottom duration-200">
            {/* Header da Gaveta */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[var(--color-brand)]" />
                <h3 className="text-base font-bold text-white">Filtrar Produtos</h3>
              </div>
              <button 
                onClick={() => setIsFilterDrawerOpen(false)}
                className="p-1.5 rounded-full bg-white/5 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Categorias no Mobile Sheet */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                Categorias
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCategory('ALL')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border flex items-center justify-between ${
                    selectedCategory === 'ALL'
                      ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                      : 'bg-white/5 text-zinc-300 border-white/10'
                  }`}
                >
                  <span>Todos</span>
                  <span className="text-[10px] opacity-70 font-mono">{categoryStats.allCount}</span>
                </button>
                {categoryStats.list.map(cat => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border flex items-center justify-between truncate ${
                      selectedCategory.toLowerCase() === cat.name.toLowerCase()
                        ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                        : 'bg-white/5 text-zinc-300 border-white/10'
                    }`}
                  >
                    <span className="truncate mr-1">{cat.name}</span>
                    <span className="text-[10px] opacity-70 font-mono shrink-0">{cat.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preço Máximo no Mobile Sheet */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Preço Máximo
                </h4>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  R$ {maxPriceFilter.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={minStorePrice}
                max={maxStorePrice}
                step={Math.max(1, Math.floor((maxStorePrice - minStorePrice) / 50))}
                value={maxPriceFilter}
                onChange={e => setMaxPriceFilter(Number(e.target.value))}
                className="w-full accent-[var(--color-brand)] cursor-pointer h-2 bg-zinc-800 rounded-lg appearance-none my-2"
              />
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>R$ {minStorePrice.toFixed(0)}</span>
                <span>R$ {maxStorePrice.toFixed(0)}+</span>
              </div>
            </div>

            {/* Ordenação no Mobile Sheet */}
            <div>
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Ordenar Por
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'featured', label: 'Destaques' },
                  { id: 'price_asc', label: 'Menor Preço' },
                  { id: 'price_desc', label: 'Maior Preço' },
                  { id: 'name_asc', label: 'Nome (A-Z)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setSortBy(opt.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border ${
                      sortBy === opt.id
                        ? 'bg-white/15 text-white border-white/30'
                        : 'bg-white/5 text-zinc-400 border-white/5'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões de Ação na Base do Sheet */}
            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  resetFilters();
                  setIsFilterDrawerOpen(false);
                }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-xl transition-colors text-center"
              >
                Limpar Tudo
              </button>
              <button
                onClick={() => setIsFilterDrawerOpen(false)}
                className="flex-1 py-3 bg-[var(--color-brand)] hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[var(--color-brand)]/25 text-center"
              >
                Ver {filteredProducts.length} Produtos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Informações de Entrega ou Garantia com MotionModal ── */}
      <MotionModal
        isOpen={infoModal !== null}
        onClose={() => setInfoModal(null)}
        title={
          infoModal === 'delivery' ? (
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>Entrega Automática 24/7</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[var(--color-brand)]" />
              <span>Garantia & Suporte</span>
            </div>
          )
        }
      >
        <div className="space-y-4">
          {infoModal === 'delivery' ? (
            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
              <p>
                Nossa plataforma entrega produtos digitais de forma <strong>100% automatizada</strong>.
              </p>
              <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-3 text-emerald-200">
                ⚡ Assim que seu pagamento PIX for confirmado, o acesso ao produto e as instruções aparecem imediatamente na tela e chegam no seu e-mail.
              </div>
              <p>
                Você também pode consultar todas as suas compras a qualquer momento clicando em <strong>Minhas Compras</strong>.
              </p>
            </div>
          ) : (
            <div className="text-xs text-zinc-300 space-y-3 leading-relaxed">
              <p>
                Todos os produtos disponibilizados nesta loja são <strong>testados e validados</strong> antes da publicação.
              </p>
              <div className="bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-xl p-3 text-zinc-200">
                🛡️ Caso encontre qualquer problema com o funcionamento ou acesso adquirido, nossa equipe de suporte está disponível para substituição ou auxílio rápido.
              </div>
              <p>
                Transações protegidas de ponta a ponta com criptografia avançada.
              </p>
            </div>
          )}

          <button
            onClick={() => setInfoModal(null)}
            className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Entendi
          </button>
        </div>
      </MotionModal>

      {/* ── BARRA DE NAVEGAÇÃO INFERIOR FIXA NO MOBILE (Bottom App Bar) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0e12]/95 backdrop-blur-2xl border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        
        {/* Aba 1: Catálogo */}
        <button
          onClick={() => {
            setSelectedCategory('ALL');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            selectedCategory === 'ALL' && !searchTerm
              ? 'text-[var(--color-brand)] font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Loja</span>
        </button>

        {/* Aba 2: Buscar */}
        <button
          onClick={focusSearch}
          className={`flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            searchTerm ? 'text-[var(--color-brand)] font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">Buscar</span>
        </button>

        {/* Aba 3: Filtros */}
        <button
          onClick={() => setIsFilterDrawerOpen(true)}
          className={`relative flex flex-col items-center gap-1 py-1 px-3 transition-colors ${
            activeFiltersCount > 0 ? 'text-emerald-400 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_6px_#34d399]" />
            )}
          </div>
          <span className="text-[10px]">Filtros</span>
        </button>

        {/* Aba 4: Minhas Compras */}
        <Link
          href={`/loja/${storeSlug}/minhas-compras`}
          className="flex flex-col items-center gap-1 py-1 px-3 text-zinc-400 hover:text-white transition-colors"
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px]">Compras</span>
        </Link>
      </div>

    </div>
  );
}
