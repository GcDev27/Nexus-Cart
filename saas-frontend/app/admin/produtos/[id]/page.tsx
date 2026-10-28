'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Plus, MoreHorizontal, MessageSquare, List as ListIcon, 
  Trash2, X, Zap, FileText, Key, Bot, Gamepad2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authFetch, getToken } from '../../../lib/auth';

type DeliveryType = 'AUTOMATIC_LINES' | 'MANUAL_CHAT';

interface VariationData {
  id?: string;
  name: string;
  price: string;
  compareAtPrice: string;
  deliveryType: DeliveryType;
  chatInitialMessage: string;
  hasUnlimitedStock: boolean;
  stockQuantity: string;
  availableStockCount: number;
}

interface StockLineData {
  id: string;
  content: string;
  delivered: boolean;
}

export default function PackageVariationsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  // States
  const [packageName, setPackageName] = useState("Carregando pacote...");
  const [variations, setVariations] = useState<VariationData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingVariation, setEditingVariation] = useState<VariationData | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stock lines state (para a aba de Linhas)
  const [stockLines, setStockLines] = useState<StockLineData[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [newStockText, setNewStockText] = useState('');
  const [showAddStock, setShowAddStock] = useState(false);

  // Fetch product + variations
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar produto
      const prodRes = await authFetch(`/api/admin/produtos/${productId}`);
      if (!prodRes.ok) throw new Error('Produto não encontrado');
      const prodData = await prodRes.json();
      setPackageName(prodData.name);

      // Buscar variações
      const varRes = await authFetch(`/api/admin/produtos/${productId}/variacoes`);
      if (!varRes.ok) throw new Error('Erro ao buscar variações');
      const varData = await varRes.json();
      
      setVariations(varData.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: v.price?.toString() || '0',
        compareAtPrice: v.compareAtPrice?.toString() || '',
        deliveryType: v.deliveryType,
        chatInitialMessage: v.chatInitialMessage || '',
        hasUnlimitedStock: v.hasUnlimitedStock || false,
        stockQuantity: v.stockQuantity?.toString() || '0',
        availableStockCount: v.availableStockCount || 0,
      })));
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (!getToken()) { router.push('/login'); return; }
    fetchData();
  }, [fetchData, router]);

  // Fetch stock lines for a specific variation
  const fetchStockLines = async (variationId: string) => {
    setStockLoading(true);
    try {
      const res = await authFetch(`/api/admin/variacoes/${variationId}/estoque`);
      if (res.ok) {
        const data = await res.json();
        setStockLines(data);
      }
    } catch (err) {
      console.error('Erro ao buscar estoque:', err);
    } finally {
      setStockLoading(false);
    }
  };

  // Create or Update variation
  const handleSaveVariation = async () => {
    if (!editingVariation) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: editingVariation.name,
      price: parseFloat(editingVariation.price.replace(',', '.')) || 0,
      compareAtPrice: editingVariation.compareAtPrice ? parseFloat(editingVariation.compareAtPrice.replace(',', '.')) : null,
      deliveryType: editingVariation.deliveryType,
      chatInitialMessage: editingVariation.deliveryType === 'MANUAL_CHAT' ? editingVariation.chatInitialMessage : null,
      hasUnlimitedStock: editingVariation.hasUnlimitedStock,
      stockQuantity: parseInt(editingVariation.stockQuantity) || 0,
    };

    try {
      let res;
      if (editingVariation.id) {
        // Update
        res = await authFetch(`/api/admin/variacoes/${editingVariation.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        // Create
        res = await authFetch(`/api/admin/produtos/${productId}/variacoes`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao salvar variação');
      }

      setEditingVariation(null);
      fetchData(); // Recarrega a lista
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete variation
  const handleDeleteVariation = async (variationId: string) => {
    if (!confirm('Tem certeza que deseja apagar esta variação?')) return;
    
    try {
      const res = await authFetch(`/api/admin/variacoes/${variationId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  // Add stock lines
  const handleAddStockLines = async () => {
    if (!editingVariation?.id || !newStockText.trim()) return;

    const lines = newStockText.split('\n').filter(l => l.trim() !== '');
    if (lines.length === 0) return;

    try {
      const res = await authFetch(`/api/admin/variacoes/${editingVariation.id}/estoque`, {
        method: 'POST',
        body: JSON.stringify({ lines }),
      });

      if (res.ok) {
        setNewStockText('');
        setShowAddStock(false);
        fetchStockLines(editingVariation.id);
        fetchData(); // Atualiza contagem
      }
    } catch (err) {
      console.error('Erro ao adicionar estoque:', err);
    }
  };

  // Delete stock line
  const handleDeleteStockLine = async (stockLineId: string) => {
    try {
      const res = await authFetch(`/api/admin/estoque/${stockLineId}`, { method: 'DELETE' });
      if (res.ok && editingVariation?.id) {
        fetchStockLines(editingVariation.id);
        fetchData();
      }
    } catch (err) {
      console.error('Erro ao deletar linha:', err);
    }
  };

  const handleCreateNewVariation = () => {
    setEditingVariation({
      name: "",
      price: "",
      compareAtPrice: "",
      deliveryType: 'AUTOMATIC_LINES',
      chatInitialMessage: "",
      hasUnlimitedStock: false,
      stockQuantity: "0",
      availableStockCount: 0,
    });
    setStockLines([]);
  };

  const handleEditVariation = (v: VariationData) => {
    setEditingVariation(v);
    if (v.id && v.deliveryType === 'AUTOMATIC_LINES') {
      fetchStockLines(v.id);
    }
  };

  if (loading) {
    return <div className="p-8 text-neutral-400 flex items-center justify-center min-h-[400px]">Carregando...</div>;
  }

  // ─── EDITOR DE VARIAÇÃO ──────────────────────────────────────────
  if (editingVariation) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Header do Editor */}
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setEditingVariation(null)}
            className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Variações de {packageName}
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setEditingVariation(null)}
              className="bg-[#1C1C21] border border-neutral-800 text-sm px-4 py-2 rounded-lg text-neutral-300 hover:text-white hover:bg-[#2A2A32] transition-colors"
            >
              Cancelar 
            </button>
            <button 
              onClick={handleSaveVariation}
              disabled={saving}
              className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              {saving ? 'Salvando...' : (editingVariation.id ? 'Salvar Alterações' : 'Criar Variação')}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-400 p-4 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Coluna Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Nome */}
            <div className="bg-[#1C1C21] border border-neutral-800/60 rounded-xl p-6">
              <label className="block text-sm font-medium text-neutral-300 mb-2">Nome da Variação *</label>
              <input
                type="text"
                value={editingVariation.name}
                onChange={(e) => setEditingVariation({...editingVariation, name: e.target.value})}
                placeholder="Ex: Entrega Padrão, Premium, etc"
                className="w-full bg-[#131316] border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Preços */}
            <div className="bg-[#1C1C21] border border-neutral-800/60 rounded-xl p-6">
              <h3 className="text-sm font-medium text-neutral-300 mb-4">Precificação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Preço comparativo (opcional)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-neutral-500">R$</span>
                    <input
                      type="text"
                      value={editingVariation.compareAtPrice}
                      onChange={(e) => setEditingVariation({...editingVariation, compareAtPrice: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-[#131316] border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Preço de venda *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-neutral-500">R$</span>
                    <input
                      type="text"
                      value={editingVariation.price}
                      onChange={(e) => setEditingVariation({...editingVariation, price: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-[#131316] border border-neutral-800 rounded-lg py-3 pl-10 pr-4 text-white outline-none focus:border-violet-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TIPO DE ENTREGA */}
            <div className="bg-[#1C1C21] border border-neutral-800/60 rounded-xl overflow-hidden">
              <div className="flex border-b border-neutral-800/60 bg-[#131316]">
                <button 
                  onClick={() => setEditingVariation({...editingVariation, deliveryType: 'AUTOMATIC_LINES'})}
                  className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${editingVariation.deliveryType === 'AUTOMATIC_LINES' ? 'border-violet-500 text-white bg-[#1C1C21]' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                >
                  <ListIcon className="w-4 h-4" />
                  Entrega Automática
                  {editingVariation.deliveryType === 'AUTOMATIC_LINES' && <Check className="w-4 h-4 text-emerald-400 ml-1" />}
                </button>
                <button 
                  onClick={() => setEditingVariation({...editingVariation, deliveryType: 'MANUAL_CHAT'})}
                  className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${editingVariation.deliveryType === 'MANUAL_CHAT' ? 'border-violet-500 text-white bg-[#1C1C21]' : 'border-transparent text-neutral-500 hover:text-neutral-300'}`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Entrega Manual (Chat)
                  {editingVariation.deliveryType === 'MANUAL_CHAT' && <Check className="w-4 h-4 text-emerald-400 ml-1" />}
                </button>
              </div>

              <div className="p-6">
                
                {/* ── AUTOMÁTICA: Linhas de Estoque ── */}
                {editingVariation.deliveryType === 'AUTOMATIC_LINES' && (
                  <div className="animate-in fade-in">
                    <div className="flex items-start gap-4 mb-6">
                      <ListIcon className="w-5 h-5 text-violet-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">Linhas de Estoque (Entrega Automática)</h3>
                        <p className="text-xs text-neutral-500 mt-1">Cada linha é um item que será entregue automaticamente ao cliente após o pagamento (keys, logins, links, etc).</p>
                      </div>
                    </div>

                    {/* Botão adicionar + Modal de cola */}
                    {editingVariation.id ? (
                      <>
                        <div className="flex justify-between gap-4 mb-4">
                          <span className="text-xs text-neutral-500 self-center">
                            {stockLines.filter(s => !s.delivered).length} linhas disponíveis em estoque
                          </span>
                          <button 
                            onClick={() => setShowAddStock(!showAddStock)}
                            className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-neutral-200 transition-colors"
                          >
                            <Plus className="w-4 h-4" /> Adicionar estoque
                          </button>
                        </div>

                        {/* Área para colar keys */}
                        <AnimatePresence>
                          {showAddStock && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mb-4 overflow-hidden"
                            >
                              <div className="bg-[#131316] border border-neutral-800/60 rounded-xl p-4">
                                <p className="text-xs text-neutral-400 mb-3">Cole suas keys, logins ou links abaixo (uma por linha):</p>
                                <textarea
                                  value={newStockText}
                                  onChange={(e) => setNewStockText(e.target.value)}
                                  rows={6}
                                  placeholder={"codigo-de-resgate-123\nhttps://link-do-arquivo.com\n..."}
                                  className="w-full bg-[#0f0f11] border border-neutral-800 rounded-lg p-3 text-sm text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors resize-none font-mono"
                                />
                                <div className="flex justify-end gap-3 mt-3">
                                  <button onClick={() => setShowAddStock(false)} className="text-sm text-neutral-400 hover:text-white px-3 py-1.5">
                                    Cancelar
                                  </button>
                                  <button 
                                    onClick={handleAddStockLines}
                                    className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                  >
                                    Adicionar {newStockText.split('\n').filter(l => l.trim()).length} linhas
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Lista de linhas */}
                        <div className="bg-[#131316] border border-neutral-800/60 rounded-xl overflow-hidden">
                          {stockLoading ? (
                            <div className="p-6 text-center text-neutral-500 text-sm">Carregando estoque...</div>
                          ) : stockLines.length === 0 ? (
                            <div className="p-8 text-center text-neutral-500 text-sm">
                              Nenhuma linha de estoque cadastrada. <br/>
                              Clique em "Adicionar estoque" para colar suas keys ou links.
                            </div>
                          ) : (
                            <div className="max-h-64 overflow-y-auto">
                              {stockLines.map((line) => (
                                <div key={line.id} className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-800/40 last:border-0 hover:bg-[#1C1C21] transition-colors group">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${line.delivered ? 'bg-neutral-600' : 'bg-emerald-400'}`} />
                                    <span className={`text-sm font-mono truncate ${line.delivered ? 'text-neutral-600 line-through' : 'text-neutral-300'}`}>
                                      {line.content}
                                    </span>
                                  </div>
                                  {!line.delivered && (
                                    <button 
                                      onClick={() => handleDeleteStockLine(line.id)}
                                      className="text-neutral-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="bg-[#131316] border border-dashed border-neutral-700 rounded-xl p-6 text-center text-neutral-500 text-sm">
                        Salve a variação primeiro para poder adicionar linhas de estoque.
                      </div>
                    )}
                  </div>
                )}

                {/* ── MANUAL: Chat ── */}
                {editingVariation.deliveryType === 'MANUAL_CHAT' && (
                  <div className="animate-in fade-in">
                    <div className="flex items-start gap-4 mb-6">
                      <MessageSquare className="w-5 h-5 text-violet-400 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-white">Entrega via Chat</h3>
                        <p className="text-xs text-neutral-500 mt-1">Após o pagamento, um chat será criado automaticamente entre você e o comprador. Configure uma mensagem de boas-vindas.</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Mensagem inicial automática</h4>
                      <p className="text-xs text-neutral-500 mb-3">Esta mensagem será enviada automaticamente ao comprador quando o chat for criado.</p>
                      <textarea
                        value={editingVariation.chatInitialMessage}
                        onChange={(e) => setEditingVariation({...editingVariation, chatInitialMessage: e.target.value})}
                        className="w-full h-32 bg-[#131316] border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                        placeholder={"Obrigado pela compra!\nLogo estarei enviando seu produto. Qualquer dúvida, pode perguntar por aqui."}
                      />
                    </div>
                  </div>
                )}
                
              </div>
            </div>

          </div>

          {/* Coluna Lateral */}
          <div className="space-y-6">
            
            {/* Estoque manual (para MANUAL_CHAT) */}
            {editingVariation.deliveryType === 'MANUAL_CHAT' && (
              <div className="bg-[#1C1C21] border border-neutral-800/60 rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-sm font-medium text-white">Estoque manual</h4>
                    <p className="text-xs text-neutral-500 mt-1">Controle manualmente a quantidade disponível</p>
                  </div>
                  <button 
                    onClick={() => setEditingVariation({...editingVariation, hasUnlimitedStock: !editingVariation.hasUnlimitedStock})}
                    className={`w-10 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${editingVariation.hasUnlimitedStock ? 'bg-violet-600' : 'bg-neutral-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute transition-all shadow-sm ${editingVariation.hasUnlimitedStock ? 'left-[22px]' : 'left-1'}`}></div>
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mb-3">{editingVariation.hasUnlimitedStock ? 'Estoque ilimitado ativado' : 'Defina a quantidade disponível:'}</p>
                
                {!editingVariation.hasUnlimitedStock && (
                  <input
                    type="number"
                    value={editingVariation.stockQuantity}
                    onChange={(e) => setEditingVariation({...editingVariation, stockQuantity: e.target.value})}
                    className="w-full bg-[#131316] border border-neutral-800 rounded-lg px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500 transition-colors"
                    min="0"
                  />
                )}
              </div>
            )}

            {/* Info */}
            <div className="bg-[#1C1C21] border border-neutral-800/60 rounded-xl p-6">
              <h4 className="text-sm font-medium text-white mb-3">Como funciona?</h4>
              {editingVariation.deliveryType === 'AUTOMATIC_LINES' ? (
                <div className="space-y-3 text-xs text-neutral-400">
                  <div className="flex items-start gap-2.5">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p><strong className="text-neutral-300">Entrega Automática</strong> — O cliente recebe o item instantaneamente após o pagamento.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <p>Cada linha no estoque = 1 unidade vendida. Quando uma linha é entregue, ela é removida do estoque disponível.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p>Ideal para: keys de jogos, contas, links de download, códigos de ativação.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs text-neutral-400">
                  <div className="flex items-start gap-2.5">
                    <MessageSquare className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <p><strong className="text-neutral-300">Entrega Manual</strong> — Um chat é criado após o pagamento para você entregar manualmente.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Bot className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <p>A mensagem inicial que você configurar será enviada automaticamente ao comprador.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p>Ideal para: serviços personalizados, boosting, itens que requerem interação.</p>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─── LISTA DE VARIAÇÕES ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <button 
            onClick={() => router.push('/admin/produtos')}
            className="text-neutral-400 hover:text-white flex items-center gap-2 text-sm transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Pacotes
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            Variações de {packageName}
          </h1>
          <p className="text-sm text-neutral-400 mt-1">Gerencie as variações deste pacote. Cada variação tem seu próprio preço e tipo de entrega.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href={`/admin/produtos/${productId}/editar`}>
            <button className="bg-[#1C1C21] border border-neutral-800 text-sm px-4 py-2.5 rounded-xl text-neutral-300 hover:text-white hover:bg-[#2A2A32] transition-colors">
              Editar Produto
            </button>
          </Link>
          <button 
            onClick={handleCreateNewVariation}
            className="bg-white hover:bg-neutral-200 text-black px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nova variação
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-400 p-4 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Tabela de Variações */}
      <div className="bg-[#1C1C21] border border-neutral-800/60 rounded-xl overflow-hidden">
        {variations.map((v) => (
          <div 
            key={v.id} 
            className="flex items-center justify-between p-4 border-b border-neutral-800/60 hover:bg-[#232329] transition-colors group cursor-pointer" 
            onClick={() => handleEditVariation(v)}
          >
            <div className="flex items-center gap-4">
              <div className="text-neutral-500">
                {v.deliveryType === 'AUTOMATIC_LINES' ? <ListIcon className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
              </div>
              <div>
                <span className="text-sm font-medium text-white">{v.name}</span>
                <span className="text-sm text-neutral-500 ml-2">— R$ {parseFloat(v.price).toFixed(2).replace('.', ',')}</span>
              </div>
              
              {v.deliveryType === 'AUTOMATIC_LINES' ? (
                v.availableStockCount > 0 ? (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded ml-2">
                    {v.availableStockCount} EM ESTOQUE
                  </span>
                ) : (
                  <span className="bg-rose-500/10 text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded ml-2">
                    SEM ESTOQUE
                  </span>
                )
              ) : (
                <span className="bg-blue-500/10 text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded ml-2">
                  CHAT
                </span>
              )}
            </div>
            
            <button 
              className="text-neutral-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-all" 
              onClick={(e) => { e.stopPropagation(); if (v.id) handleDeleteVariation(v.id); }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {variations.length === 0 && (
          <div className="p-8 text-center text-neutral-500 text-sm">
            Nenhuma variação criada. Clique em "Nova variação" para começar.
          </div>
        )}
      </div>

    </div>
  );
}
