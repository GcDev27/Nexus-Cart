'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Tag, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import { authFetch, getToken } from '../../lib/auth';
import { getStoredCategories } from '../../components/CategorySelect';
import MotionCheckbox from '../../components/motion/MotionCheckbox';
import MotionSelect from '../../components/motion/MotionSelect';
import MotionModal from '../../components/motion/MotionModal';

export interface Product {
  id: number | string;
  name: string;
  sku: string;
  categoryName: string;
  price: number;
  compareAtPrice?: number | null;
  visibility: 'VISIBLE' | 'HIDDEN';
  imageUrl?: string;
  variationsCount: number;
}

export default function ProdutosCleanPage() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<(string | number)[]>([]);

  // Modais
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null);

  // Carrega categorias salvas localmente
  useEffect(() => {
    const saved = getStoredCategories();
    setCustomCategories(saved);
  }, []);

  // Carrega produtos do backend
  const loadProdutos = async () => {
    try {
      const res = await authFetch('/api/admin/produtos');
      if (!res.ok) throw new Error('Falha ao buscar produtos');
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped: Product[] = data.map((p: any) => {
          const variations = p.variations || [];
          const primaryVar = variations[0] || {};
          return {
            id: p.id,
            name: p.name,
            sku: p.slug ? `SKU-${p.slug.slice(0, 8).toUpperCase()}` : `SKU-PROD-${p.id}`,
            categoryName: (p.categoryName || 'Geral').trim(),
            price: primaryVar.price != null ? Number(primaryVar.price) : 0,
            compareAtPrice: primaryVar.compareAtPrice != null ? Number(primaryVar.compareAtPrice) : null,
            visibility: p.visibility === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE',
            imageUrl: p.imageUrl,
            variationsCount: variations.length || 1,
          };
        });
        setProdutos(mapped);
      } else {
        setProdutos([]);
      }
    } catch {
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = '/login';
      return;
    }
    loadProdutos();
  }, []);

  // Categorias para filtro
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    customCategories.forEach(c => {
      if (c && c.trim()) set.add(c.trim());
    });
    produtos.forEach(p => {
      if (p.categoryName && p.categoryName.trim()) set.add(p.categoryName.trim());
    });
    if (!set.has('Geral')) set.add('Geral');
    return Array.from(set);
  }, [produtos, customCategories]);

  // Alternar Visibilidade
  const toggleVisibility = async (id: number | string) => {
    const prod = produtos.find(p => p.id === id);
    if (!prod) return;
    const nextVis = prod.visibility === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, visibility: nextVis } : p));

    try {
      await authFetch(`/api/admin/produtos/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ visibility: nextVis }),
      });
    } catch {
      // Ignora erro
    }
  };

  // Excluir Produto
  const confirmDeleteProduct = async () => {
    if (!deleteModalProduct) return;
    const id = deleteModalProduct.id;
    setProdutos(prev => prev.filter(p => p.id !== id));
    setSelectedProductIds(prev => prev.filter(i => i !== id));
    setDeleteModalProduct(null);

    try {
      await authFetch(`/api/admin/produtos/${id}`, {
        method: 'DELETE',
      });
    } catch {
      // Ignora erro
    }
  };

  // Produtos Filtrados
  const filteredProducts = useMemo(() => {
    return produtos.filter(p => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesSku = p.sku.toLowerCase().includes(query);
        const matchesCat = p.categoryName.toLowerCase().includes(query);
        if (!matchesName && !matchesSku && !matchesCat) return false;
      }
      if (selectedCategory !== 'all' && p.categoryName.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (selectedVisibility === 'visible' && p.visibility !== 'VISIBLE') return false;
      if (selectedVisibility === 'hidden' && p.visibility !== 'HIDDEN') return false;

      return true;
    });
  }, [produtos, searchTerm, selectedCategory, selectedVisibility]);

  return (
    <div className="flex flex-col w-full gap-6 max-w-full pb-16">
      
      {/* ── HEADER CLEAN E DIRETO ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
            <Link href="/admin" className="hover:text-white transition-colors">Painel</Link>
            <span>/</span>
            <span className="text-[var(--color-brand,#8b5cf6)] font-medium">Produtos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Gerenciamento de Produtos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Cadastre, edite e gerencie os produtos e categorias da sua loja.
          </p>
        </div>

        {/* Botão Novo Produto */}
        <div className="flex items-center gap-3">
          <Link
            href="/admin/produtos/novo"
            className="inline-flex items-center gap-2 bg-[var(--color-brand,#8b5cf6)] hover:brightness-110 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-[var(--color-brand,#8b5cf6)]/20"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </Link>
        </div>
      </div>

      {/* ── BARRA DE FILTROS MINIMALISTA ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141419] p-3 rounded-2xl border border-white/10 shadow-sm">
        
        {/* Input de Busca */}
        <div className="flex-1 flex items-center bg-[#0d0e12] border border-white/10 rounded-xl px-3 py-2 focus-within:border-[var(--color-brand,#8b5cf6)] transition-colors">
          <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, SKU ou categoria..."
            className="w-full bg-transparent text-xs text-white placeholder-zinc-500 outline-none"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-zinc-500 hover:text-white text-xs ml-1">
              Limpar
            </button>
          )}
        </div>

        {/* Filtros Dropdowns (MotionSelect) */}
        <div className="flex items-center gap-2">
          <MotionSelect
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[
              { value: 'all', label: 'Todas as Categorias' },
              ...categoriesList.map(cat => ({ value: cat, label: cat }))
            ]}
          />

          <MotionSelect
            value={selectedVisibility}
            onChange={setSelectedVisibility}
            options={[
              { value: 'all', label: 'Todos os Status' },
              { value: 'visible', label: 'Visível na Loja' },
              { value: 'hidden', label: 'Oculto' },
            ]}
          />
        </div>
      </div>

      {/* ── TABELA DE PRODUTOS ── */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-xs flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-white/10 border-t-[var(--color-brand,#8b5cf6)] rounded-full animate-spin" />
          <span>Carregando produtos...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#141419]/50 border border-white/10 rounded-2xl p-6">
          <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">Nenhum produto encontrado</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedCategory !== 'all' || selectedVisibility !== 'all'
              ? 'Nenhum item corresponde aos filtros selecionados.'
              : 'Sua loja ainda não possui produtos cadastrados.'}
          </p>
          {searchTerm || selectedCategory !== 'all' || selectedVisibility !== 'all' ? (
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('all'); setSelectedVisibility('all'); }}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Limpar Filtros
            </button>
          ) : (
            <Link
              href="/admin/produtos/novo"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-brand,#8b5cf6)] text-white text-xs font-bold rounded-xl hover:brightness-110 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-[#141419] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-white/[0.02] border-b border-white/10 text-zinc-400 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4 w-10">
                    <MotionCheckbox
                      checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                      onChange={(checked) => {
                        setSelectedProductIds(checked ? filteredProducts.map(p => p.id) : []);
                      }}
                    />
                  </th>
                  <th className="py-3 px-4">Produto</th>
                  <th className="py-3 px-4">Categoria</th>
                  <th className="py-3 px-4 text-right">Preço</th>
                  <th className="py-3 px-4 text-center">Visibilidade</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map(product => {
                  const isSelected = selectedProductIds.includes(product.id);
                  return (
                    <tr
                      key={product.id}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        isSelected ? 'bg-white/[0.03]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <MotionCheckbox
                          checked={isSelected}
                          onChange={() => {
                            setSelectedProductIds(prev =>
                              prev.includes(product.id)
                                ? prev.filter(id => id !== product.id)
                                : [...prev, product.id]
                            );
                          }}
                        />
                      </td>

                      {/* Produto (Imagem + Nome + SKU) */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
                            {product.imageUrl ? (
                              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-zinc-600" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/admin/produtos/${product.id}/editar`}
                              className="font-semibold text-white hover:text-[var(--color-brand,#8b5cf6)] transition-colors truncate max-w-[200px] sm:max-w-xs"
                            >
                              {product.name}
                            </Link>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {product.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-medium">
                          <Tag className="w-3 h-3 text-[var(--color-brand,#8b5cf6)]" />
                          <span>{product.categoryName}</span>
                        </span>
                      </td>

                      {/* Preço */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-white font-mono text-sm">
                            R$ {product.price.toFixed(2)}
                          </span>
                          {product.compareAtPrice && product.compareAtPrice > product.price && (
                            <span className="text-[10px] text-zinc-500 line-through font-mono">
                              R$ {product.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Visibilidade */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleVisibility(product.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                            product.visibility === 'VISIBLE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:bg-zinc-700'
                          }`}
                          title="Clique para alternar visibilidade"
                        >
                          {product.visibility === 'VISIBLE' ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>Visível</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>Oculto</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/produtos/${product.id}/editar`}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                            title="Editar produto e categoria"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeleteModalProduct(product)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar Exclusão de Produto (MotionModal) ── */}
      <MotionModal
        isOpen={deleteModalProduct !== null}
        onClose={() => setDeleteModalProduct(null)}
        title="Excluir Produto"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 leading-relaxed">
              Tem certeza que deseja apagar permanentemente o produto <strong>{deleteModalProduct?.name}</strong>? Esta ação não pode ser desfeita.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setDeleteModalProduct(null)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDeleteProduct}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-red-600/30"
            >
              Sim, Excluir
            </button>
          </div>
        </div>
      </MotionModal>

    </div>
  );
}