"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "../../../../components/Toast";
import { authFetch, getToken } from "../../../../lib/auth";
import CategorySelect from "../../../../components/CategorySelect";
import ImageUploader from "../../../../components/ImageUploader";
import VariationsSection from "./VariationsSection";
import { errorMessage } from '@/app/lib/apiTypes';

export default function EditarProdutoPage() {
  const router = useRouter();
  const params = useParams();
  const produtoId = params.id as string;
  const { addToast } = useToast();

  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);

  // Campos do Produto
  const [name, setName] = useState("");
  const [categoryName, setCategoryName] = useState("Geral");
  const [description, setDescription] = useState("");
  const [slug, setSlug] = useState("");
  const [visibility, setVisibility] = useState<"VISIBLE" | "HIDDEN">("VISIBLE");
  const [imageUrl, setImageUrl] = useState("");


  const fetchProductData = async () => {
    try {
      const res = await authFetch(`/api/admin/produtos/${produtoId}`);
      if (!res.ok) throw new Error("Produto não encontrado");
      const data = await res.json();

      setName(data.name || "");
      setCategoryName(data.categoryName || "Geral");
      setDescription(data.description || "");
      setSlug(data.slug || "");
      setVisibility(data.visibility === "HIDDEN" ? "HIDDEN" : "VISIBLE");
      setImageUrl(data.imageUrl || "");
      setFetching(false);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar dados do produto.", "error");
      router.push("/admin/produtos");
    }
  };

  useEffect(() => {
    if (!produtoId) return;
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payloadBase64 = token.split(".")[1];
      const decodedJson = atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/"));
      const payload = JSON.parse(decodedJson);
      const slugVal = payload.tenantSlug || localStorage.getItem("tenant_slug");
      if (slugVal) setTenantSlug(slugVal);
    } catch {
      // Usa valor default
    }

    fetchProductData();
  }, [produtoId, router]);

  // Lê a mensagem de erro que o backend devolve ({ error: "..." })
  const errorFrom = async (res: Response, fallback: string) => {
    const body = await res.json().catch(() => null);
    return body?.error || fallback;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      addToast("O nome do produto é obrigatório.", "error");
      return;
    }

    setSaving(true);
    try {
      // 1. Atualiza Dados Básicos do Produto
      const productRes = await authFetch(`/api/admin/produtos/${produtoId}`, {
        method: "PUT",
        body: JSON.stringify({
          name,
          categoryName,
          description,
          slug,
          visibility,
          imageUrl,
        }),
      });

      if (!productRes.ok) throw new Error(await errorFrom(productRes, "Erro ao atualizar dados do produto"));

      addToast("Produto atualizado com sucesso!", "success");
    } catch (error) {
      console.error(error);
      addToast(errorMessage(error) || "Falha ao salvar alterações.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Excluir Produto
  const handleDeleteProduct = async () => {
    setDeleting(true);
    try {
      const res = await authFetch(`/api/admin/produtos/${produtoId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        addToast("Produto excluído com sucesso.", "success");
        router.push("/admin/produtos");
      } else {
        throw new Error("Erro ao excluir produto.");
      }
    } catch (err) {
      addToast(errorMessage(err) || "Falha de conexão.", "error");
      setDeleting(false);
    }
  };

  // Abrir Loja do Produto
  const handleOpenStoreProduct = () => {
    if (tenantSlug && slug) {
      window.open(`/loja/${tenantSlug}/produto/${slug}`, "_blank");
    } else if (tenantSlug) {
      window.open(`/loja/${tenantSlug}`, "_blank");
    } else {
      addToast("Slug da loja não encontrado.", "error");
    }
  };

  if (fetching) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-outline">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
        <span className="text-xs">Carregando configurações do produto...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-space-lg max-w-full pb-16">
      {/* ───────────────────────────────────────────────────────────
          1. HEADER COM BREADCRUMB E BOTÕES DE AÇÃO
      ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-1 sm:pt-space-md">
        <div>
          <Link
            href="/admin/produtos"
            className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors text-xs font-medium group"
          >
            <span className="material-symbols-outlined text-base group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span>Voltar para Produtos</span>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight truncate">
                Editar Produto: <span className="text-primary font-semibold">{name}</span>
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-high text-secondary text-[11px] font-medium border border-surface-container-high">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                <span>Configuração ativa</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-outline mt-0.5">
              Dados do produto e opções de compra, com preço, entrega e estoque de cada uma.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={handleOpenStoreProduct}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface hover:text-primary transition-all text-xs sm:text-sm font-medium border border-surface-container-high/40 shadow-sm"
            >
              <span className="material-symbols-outlined text-base">open_in_new</span>
              <span>Visualizar na Loja</span>
            </button>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              type="button"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs sm:text-sm shadow-[0_4px_20px_-2px_rgba(160,120,255,0.45)] hover:bg-primary hover:text-on-primary-fixed transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-base">
                {saving ? "sync" : "check"}
              </span>
              <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          2. GRADE EM 2 COLUNAS (8 COLS PRINCIPAL / 4 COLS LATERAL)
      ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-space-lg items-start">
        {/* Coluna Principal (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-space-lg">
          {/* Card 1: Informações Básicas */}
          <section className="bg-surface-container-low rounded-xl p-4 sm:p-space-lg border border-surface-container-high/40 shadow-sm flex flex-col gap-4 relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">tune</span>
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-on-surface">Informações Básicas</h2>
                  <p className="text-[11px] sm:text-xs text-outline">Dados de identificação e apresentação do item</p>
                </div>
              </div>
              <span className="text-[10px] text-outline bg-surface-container px-2 py-0.5 rounded uppercase tracking-wider">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs sm:text-sm font-medium text-on-surface flex items-center gap-1">
                  Nome do Produto <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: VIP Mensal ou Chave Deluxe"
                  className="w-full bg-surface-container text-on-surface text-xs sm:text-sm px-3 py-2.5 rounded-lg outline-none focus:bg-surface-container-high border border-surface-container-high/40 transition-all"
                />
              </div>

              <CategorySelect
                value={categoryName}
                onChange={setCategoryName}
                label="Categoria"
              />
            </div>

            {/* Descrição */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-medium text-on-surface">Descrição</label>
                <span className="text-[10px] text-outline">{description.length} caracteres</span>
              </div>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva detalhes, termos e instruções de ativação deste produto..."
                className="w-full bg-surface-container text-on-surface text-xs sm:text-sm p-3 rounded-lg outline-none focus:bg-surface-container-high border border-surface-container-high/40 resize-y transition-all"
              />
            </div>
          </section>

          {/* Card 2: Opções de compra (variações com preço, entrega e estoque próprios) */}
          <VariationsSection productId={produtoId} />
        </div>

        {/* Coluna Lateral (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card: Imagem do Produto (Upload do Dispositivo) */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-surface-container-high/30">
              <span className="material-symbols-outlined text-primary text-base">image</span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">Imagem do Produto</h3>
            </div>

            <ImageUploader
              value={imageUrl}
              onChange={setImageUrl}
              label=""
              helperText="Escolha uma imagem do seu dispositivo (PNG, JPG, WEBP)."
              aspectRatio="video"
            />
          </section>

          {/* Card: Visibilidade na Vitrine */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-1.5 pb-2 border-b border-surface-container-high/30">
              <span className="material-symbols-outlined text-secondary text-base">visibility</span>
              <h3 className="text-xs sm:text-sm font-bold text-on-surface">Visibilidade</h3>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setVisibility("VISIBLE")}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  visibility === "VISIBLE"
                    ? "bg-secondary/15 text-secondary border-secondary/40 shadow-sm"
                    : "bg-surface-container text-outline border-transparent hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Visível na Vitrine Pública</span>
                </div>
                {visibility === "VISIBLE" && <span className="material-symbols-outlined text-sm">check</span>}
              </button>

              <button
                type="button"
                onClick={() => setVisibility("HIDDEN")}
                className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  visibility === "HIDDEN"
                    ? "bg-surface-container-high text-on-surface border-surface-container-highest shadow-sm"
                    : "bg-surface-container text-outline border-transparent hover:text-on-surface"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-outline"></span>
                  <span>Oculto (Rascunho)</span>
                </div>
                {visibility === "HIDDEN" && <span className="material-symbols-outlined text-sm">check</span>}
              </button>
            </div>
          </section>

          {/* Card: Slug da URL */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between pb-1 border-b border-surface-container-high/30">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">link</span>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">Slug da URL</h3>
              </div>
            </div>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full bg-surface-container text-on-surface font-mono text-xs p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 transition-all"
            />
            <span className="text-[10px] text-outline">
              Link direto: /loja/{tenantSlug || "sua-loja"}/{slug || "item"}
            </span>
          </section>

          {/* Card: Zona de Perigo (Exclusão) */}
          <section className="bg-surface-container-low rounded-xl p-4 border border-error-container/40 shadow-sm flex flex-col gap-2">
            <span className="text-xs font-bold text-error uppercase tracking-wider">Zona de Perigo</span>
            <p className="text-[11px] text-outline">
              Esta ação removerá o produto, suas variações e histórico de chaves permanentemente.
            </p>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="w-full mt-1 py-2 px-3 rounded-lg bg-error-container/30 hover:bg-error text-error hover:text-white transition-colors text-xs font-semibold flex items-center justify-center gap-1.5 border border-error/20"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              <span>Excluir Produto</span>
            </button>
          </section>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────
          4. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO
      ──────────────────────────────────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md bg-surface-container-low border border-surface-container-high rounded-2xl p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-11 h-11 rounded-xl bg-error-container/30 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">warning</span>
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-on-surface">Apagar Produto</h3>
              <p className="text-xs text-outline leading-relaxed">
                Tem certeza que deseja apagar <strong className="text-on-surface">{name}</strong>? Esta ação é definitiva e removerá este item de sua vitrine pública.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-medium hover:bg-surface-container-high transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteProduct}
                className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleting ? "Excluindo..." : "Sim, Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
