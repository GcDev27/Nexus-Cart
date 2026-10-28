"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authFetch } from "../../../lib/auth";
import CategorySelect from "../../../components/CategorySelect";
import ImageUploader from "../../../components/ImageUploader";

export default function NovoProdutoPacotePage() {
  const router = useRouter();

  // Estados do formulário
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"VISIBLE" | "HIDDEN">("VISIBLE");
  const [categoryName, setCategoryName] = useState("Geral");
  const [imageUrl, setImageUrl] = useState("");

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Função para gerar o slug a partir do nome
  const generateSlugFromName = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlugFromName(newName));
  };

  const addQuickAttribute = (text: string) => {
    setDescription((prev) => (prev ? `${prev} • ${text}` : text));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Por favor, informe o nome do produto/pacote.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = {
      name,
      slug: slug || generateSlugFromName(name),
      description,
      visibility,
      categoryName,
      imageUrl: imageUrl || null,
    };

    try {
      const response = await authFetch("/api/admin/produtos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.status === 403 || response.status === 401) {
        throw new Error("Sessão expirada ou sem permissão. Faça login novamente.");
      }

      if (!response.ok) {
        throw new Error("Ocorreu um erro ao salvar o pacote.");
      }

      const data = await response.json();
      // Sucesso! Vai para a tela de Edição (onde configurará a variação padrão ou estoque)
      router.push(`/admin/produtos/${data.id}/editar`);
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-4 sm:gap-space-lg max-w-full pb-16">
      {/* ───────────────────────────────────────────────────────────
          1. TOP BREADCRUMB & ACTION HEADER
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
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-surface-container-high flex items-center justify-center shadow-lg relative overflow-hidden shrink-0 border border-surface-container-high/60">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-container/30 to-tertiary-container/20"></div>
              <span className="material-symbols-outlined text-2xl text-primary relative z-10">
                package_2
              </span>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight truncate">
                  Criar Novo Pacote
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-wider font-semibold">
                  Passo 1 de 2
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                Crie a base do produto. Preços, entrega e estoque por linhas serão configurados a seguir.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Link
              href="/admin/produtos"
              className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface hover:bg-surface-container text-xs sm:text-sm font-medium transition-colors border border-surface-container-high/40"
            >
              Cancelar
            </Link>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              type="button"
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-lg bg-primary-container text-on-primary font-semibold text-xs sm:text-sm shadow-[0_4px_24px_rgba(160,120,255,0.4)] hover:bg-primary hover:text-on-primary-fixed transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isLoading ? "Processando..." : "Criar Pacote e Continuar"}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error-container/30 border border-error-container text-error p-3 rounded-xl text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────
          2. CONTENT 2-COLUMN GRID (8 COLS / 4 COLS)
      ──────────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-space-lg items-start">
        {/* Coluna Principal (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4 sm:gap-space-lg">
          {/* Card: Informações Gerais */}
          <div className="bg-surface-container-low rounded-xl p-4 sm:p-space-lg border border-surface-container-high/40 shadow-sm relative overflow-hidden flex flex-col gap-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-container via-tertiary to-transparent opacity-70"></div>

            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">description</span>
                <span className="text-xs sm:text-sm text-on-surface uppercase tracking-wider font-semibold">
                  Informações Gerais
                </span>
              </div>
              <span className="text-[10px] text-outline">* Campos obrigatórios</span>
            </div>

            {/* Nome do Pacote */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="packageName" className="text-xs sm:text-sm font-medium text-on-surface flex items-center gap-1">
                  Nome do Pacote / Produto <span className="text-error font-bold">*</span>
                </label>
                <span className="text-[10px] text-outline">{name.length}/80</span>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
                  label
                </span>
                <input
                  id="packageName"
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={handleNameChange}
                  placeholder="Ex: Assinatura Mensal VIP ou Licença Enterprise"
                  className="w-full bg-surface-container-lowest text-on-surface placeholder:text-outline text-xs sm:text-sm pl-11 pr-4 py-2.5 rounded-lg outline-none focus:ring-1 focus:ring-primary focus:bg-surface-container border border-surface-container-high/40 transition-all"
                />
              </div>
              <span className="text-[11px] text-outline">
                Título principal visível para os clientes na vitrine da sua loja.
              </span>
            </div>

            {/* Categoria com Suporte a Novas Categorias Dinâmicas */}
            <CategorySelect
              value={categoryName}
              onChange={setCategoryName}
              label="Categoria"
              required
            />

            {/* Descrição com Mini Rich-Text Toolbar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="packageDesc" className="text-xs sm:text-sm font-medium text-on-surface">
                  Descrição do Produto <span className="text-outline font-normal">(Opcional)</span>
                </label>
                <span className="text-[10px] text-outline">{description.length}/2000</span>
              </div>

              <div className="bg-surface-container-lowest rounded-lg border border-surface-container-high/40 overflow-hidden">
                <div className="flex items-center gap-1 bg-surface-container px-3 py-1.5 border-b border-surface-container-high/30">
                  <button
                    type="button"
                    onClick={() => setDescription((d) => `**${d}**`)}
                    className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                    title="Negrito"
                  >
                    <span className="material-symbols-outlined text-base">format_bold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescription((d) => `*${d}*`)}
                    className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                    title="Itálico"
                  >
                    <span className="material-symbols-outlined text-base">format_italic</span>
                  </button>
                  <div className="w-px h-3.5 bg-surface-container-highest mx-1"></div>
                  <button
                    type="button"
                    onClick={() => setDescription((d) => `${d}\n- `)}
                    className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
                    title="Lista com marcadores"
                  >
                    <span className="material-symbols-outlined text-base">format_list_bulleted</span>
                  </button>
                  <div className="ml-auto flex items-center gap-1 text-outline text-[10px]">
                    <span className="material-symbols-outlined text-xs">markdown</span>
                    <span>Suporta formatação simples</span>
                  </div>
                </div>

                <textarea
                  id="packageDesc"
                  rows={6}
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva detalhes, benefícios exclusivos, requisitos técnicos e instruções de ativação..."
                  className="w-full bg-transparent text-on-surface placeholder:text-outline text-xs sm:text-sm p-3 outline-none resize-y"
                />
              </div>
            </div>

            {/* Atributos Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-outline uppercase tracking-wider font-semibold mr-1">
                Atributos rápidos:
              </span>
              <button
                type="button"
                onClick={() => addQuickAttribute("Entrega Automática")}
                className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] transition-colors flex items-center gap-1 border border-surface-container-high/30"
              >
                <span className="material-symbols-outlined text-xs text-primary">bolt</span>
                <span>Entrega Automática</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickAttribute("Garantia Inclusa")}
                className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] transition-colors flex items-center gap-1 border border-surface-container-high/30"
              >
                <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                <span>Garantia Inclusa</span>
              </button>
              <button
                type="button"
                onClick={() => addQuickAttribute("Suporte Prioritário")}
                className="px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-[11px] transition-colors flex items-center gap-1 border border-surface-container-high/30"
              >
                <span className="material-symbols-outlined text-xs text-tertiary">support_agent</span>
                <span>Suporte Prioritário</span>
              </button>
            </div>
          </div>

          {/* Card: Pré-visualização ao Vivo */}
          <div className="bg-surface-container-lowest rounded-xl p-3 sm:p-4 border border-surface-container-high/40 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center shrink-0 border border-surface-container-high/40">
              <span className="material-symbols-outlined text-2xl text-primary">inventory_2</span>
            </div>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <span className="text-[10px] uppercase tracking-wider text-outline font-semibold block">
                Pré-visualização na Loja
              </span>
              <h3 className="text-sm sm:text-base font-bold text-on-surface truncate">
                {name.trim() || "Título do Pacote / Produto"}
              </h3>
              <p className="text-xs text-outline line-clamp-1 mt-0.5">
                {description.trim() || "Nenhuma descrição informada ainda."}
              </p>
            </div>
            <div className="shrink-0">
              <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium flex items-center gap-1 border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span>Pronto para Variações</span>
              </span>
            </div>
          </div>
        </div>

        {/* Coluna Lateral (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Card: Imagem do Produto (Upload do Dispositivo) */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-3">
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
          </div>

          {/* Card: Slug da URL */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">link</span>
                <label htmlFor="urlSlug" className="text-xs sm:text-sm font-semibold text-on-surface">
                  Slug da URL
                </label>
              </div>
              <button
                type="button"
                onClick={() => setSlug(generateSlugFromName(name))}
                className="text-primary hover:text-primary-fixed text-[11px] font-semibold uppercase tracking-wider transition-colors"
                title="Regenerar slug a partir do nome"
              >
                Auto-gerar
              </button>
            </div>
            <input
              id="urlSlug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex-pacote-exemplo"
              className="w-full bg-surface-container-lowest text-on-surface font-mono text-xs p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 transition-all"
            />
            <span className="text-[10px] text-outline">
              Identificador único na URL pública da sua loja.
            </span>
          </div>

          {/* Card: Visibilidade Inicial */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-surface-container-high/40 shadow-sm flex flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-secondary text-base">visibility</span>
              <label htmlFor="visibilitySelect" className="text-xs sm:text-sm font-semibold text-on-surface">
                Visibilidade Inicial
              </label>
            </div>
            <select
              id="visibilitySelect"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "VISIBLE" | "HIDDEN")}
              className="w-full bg-surface-container-lowest text-on-surface text-xs p-2.5 rounded-lg outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 transition-all cursor-pointer"
            >
              <option value="VISIBLE">Visível na vitrine pública</option>
              <option value="HIDDEN">Oculto (Rascunho)</option>
            </select>
            <span className="text-[10px] text-outline">
              Você pode alterar a visibilidade a qualquer momento diretamente na tabela do catálogo.
            </span>
          </div>

          {/* Dica Operacional */}
          <div className="bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high/30 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary font-semibold text-xs">
              <span className="material-symbols-outlined text-base">lightbulb</span>
              <span>Dica de Conversão</span>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed">
              No próximo passo você definirá o preço de venda e adicionará as chaves de estoque para entrega automática via PIX instantâneo.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}