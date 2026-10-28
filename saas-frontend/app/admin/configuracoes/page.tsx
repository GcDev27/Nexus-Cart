'use client';

import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../../lib/auth';
import { useToast } from '../../components/Toast';
import { GatewayLogo, PixIcon } from '../../components/BankIcons';
import ImageUploader from '../../components/ImageUploader';
import { 
  Palette, Type, AlignLeft, MonitorSmartphone, 
  Save, Store, CheckCircle2, RefreshCw, Sparkles,
  CreditCard, Zap, BookOpen, ExternalLink, Eye, EyeOff,
  ShieldCheck, AlertCircle, Check, X, ChevronRight, Info,
  Sliders, ArrowUpRight
} from 'lucide-react';

// ─── Tipos das Configurações de Loja ────────────────────────────────
type FormData = {
  theme: string;
  primaryColor: string;
  font: string;
  heroTitle: string;
  heroDescription: string;
  logoUrl: string;
};

// ─── Tipos dos Gateways ──────────────────────────────────────────────
type GatewayProvider = 'MERCADO_PAGO' | 'EFI_BANK' | 'ASAAS' | 'STRIPE';

interface GatewayConfig {
  id?: string;
  provider: GatewayProvider;
  enabled: boolean;
  isPixProvider: boolean;
  clientId: string;
  clientSecret: string;
  publicKey?: string;
  feePercentage?: number;
  feeFixed?: number;
}

// ─── Constantes de Design da Loja ──────────────────────────────────
const THEMES = [
  {
    id: 'theme-glass',
    name: 'Dark Premium',
    desc: 'Glassmorphism elegante, como Vercel e Linear',
    preview: { bg: '#09090b', card: 'rgba(255,255,255,0.04)', text: '#fafafa', accent: '#8b5cf6', border: 'rgba(255,255,255,0.07)' }
  },
  {
    id: 'theme-light',
    name: 'Clean Light',
    desc: 'Minimalismo premium, como Apple e Shopify',
    preview: { bg: '#f8f8f8', card: '#ffffff', text: '#111111', accent: '#2563eb', border: 'rgba(0,0,0,0.08)' }
  },
  {
    id: 'theme-gamer',
    name: 'Gamer Neon',
    desc: 'Alta intensidade, como Razer e Epic Games',
    preview: { bg: '#020204', card: '#0c0c14', text: '#e2e8ff', accent: '#22c55e', border: 'rgba(34,197,94,0.2)' }
  }
];

const FONTS = [
  { name: 'Inter', family: 'Inter, sans-serif', style: 'normal', desc: 'Clean & tecnológica' },
  { name: 'Space Grotesk', family: '"Space Grotesk", sans-serif', style: 'normal', desc: 'Moderna & geométrica' },
  { name: 'Poppins', family: 'Poppins, sans-serif', style: 'normal', desc: 'Amigável & versátil' },
  { name: 'Montserrat', family: 'Montserrat, sans-serif', style: 'normal', desc: 'Forte & marcante' },
  { name: 'Raleway', family: 'Raleway, sans-serif', style: 'normal', desc: 'Elegante & refinada' },
  { name: 'Nunito', family: 'Nunito, sans-serif', style: 'normal', desc: 'Suave & arredondada' },
  { name: 'Playfair Display', family: '"Playfair Display", serif', style: 'italic', desc: 'Luxuosa & editorial' },
  { name: 'Roboto', family: 'Roboto, sans-serif', style: 'normal', desc: 'Clássica & legível' },
];

const PRESET_COLORS = [
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#f59e0b', name: 'Amber' },
  { color: '#ef4444', name: 'Red' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#f97316', name: 'Orange' },
  { color: '#14b8a6', name: 'Teal' },
  { color: '#a855f7', name: 'Purple' },
];

// ─── Gateways Suportados (Os 4 Principais do Mercado) ───────────────
const GATEWAY_DETAILS: Record<GatewayProvider, {
  name: string;
  tagline: string;
  badge: string;
  methods: string[];
  brandColor: string;
  brandBg: string;
  brandBorder: string;
  portalUrl: string;
  supportsPix: boolean;
  fields: { key: 'clientId' | 'clientSecret' | 'publicKey'; label: string; placeholder: string; isSecret?: boolean; hint: string }[];
  tutorial: {
    prerequisite: string;
    steps: { title: string; desc: string }[];
    tip: string;
  };
}> = {
  MERCADO_PAGO: {
    name: 'Mercado Pago',
    tagline: 'O gateway mais popular do Brasil. Liberação instantânea sem burocracia.',
    badge: 'Mais Recomendado',
    methods: ['PIX Instantâneo', 'Cartão de Crédito', 'Boleto'],
    brandColor: '#009ee3',
    brandBg: 'bg-sky-500/10 text-sky-400',
    brandBorder: 'border-sky-500/30',
    portalUrl: 'https://www.mercadopago.com.br/developers/panel/app',
    supportsPix: true,
    fields: [
      { 
        key: 'clientSecret', 
        label: 'Access Token de Produção', 
        placeholder: 'APP_USR-0000000000000000-000000-...', 
        isSecret: true,
        hint: 'Encontrado na aba Credenciais de Produção da sua aplicação.'
      },
      { 
        key: 'publicKey', 
        label: 'Public Key (Opcional para checkout)', 
        placeholder: 'APP_USR-00000000-...', 
        hint: 'Chave pública usada para tokenização de cartão.'
      }
    ],
    tutorial: {
      prerequisite: 'Você precisa de uma conta ativa no Mercado Pago (PF ou PJ).',
      steps: [
        {
          title: 'Acesse o Painel de Desenvolvedores',
          desc: 'Entre no portal oficial Mercado Pago Developers e faça login na sua conta.'
        },
        {
          title: 'Crie ou Selecione sua Aplicação',
          desc: 'Clique em "Criar aplicação". No tipo de solução, escolha "Checkout Transparente" ou "Pagamento Online".'
        },
        {
          title: 'Copie suas Credenciais de Produção',
          desc: 'No menu lateral da sua aplicação, clique em "Credenciais de Produção". Copie o seu "Access Token" (começa com APP_USR).'
        },
        {
          title: 'Cole no SaaS Commerce e Ative',
          desc: 'Cole o Access Token no campo de configuração aqui na loja e ative a chave do gateway.'
        }
      ],
      tip: 'Nunca utilize credenciais de teste em ambiente real para evitar pagamentos não confirmados.'
    }
  },
  EFI_BANK: {
    name: 'Efí Bank (Gerencianet)',
    tagline: 'Líder no mercado de scripts e digital. Menores taxas de PIX com Open Finance.',
    badge: 'Menor Taxa PIX',
    methods: ['PIX Direto na Conta', 'Cartão de Crédito'],
    brandColor: '#f37021',
    brandBg: 'bg-orange-500/10 text-orange-400',
    brandBorder: 'border-orange-500/30',
    portalUrl: 'https://app.sejaefi.com.br/',
    supportsPix: true,
    fields: [
      { 
        key: 'clientId', 
        label: 'Client ID', 
        placeholder: 'Client_Id_0000000000000000000000', 
        hint: 'Identificador gerado na sua aplicação na Efí.'
      },
      { 
        key: 'clientSecret', 
        label: 'Client Secret', 
        placeholder: 'Client_Secret_0000000000000000000000', 
        isSecret: true,
        hint: 'Chave secreta para autorização das transações Pix.'
      }
    ],
    tutorial: {
      prerequisite: 'Tenha uma conta digital aprovada no Efí Bank (PF ou PJ).',
      steps: [
        {
          title: 'Acesse o Internet Banking Efí',
          desc: 'Faça login pelo computador no site app.sejaefi.com.br.'
        },
        {
          title: 'Acesse o Menu API',
          desc: 'No menu lateral esquerdo, vá em "API" > "Aplicações" e clique em "Criar Aplicação".'
        },
        {
          title: 'Ative os Escopos de PIX',
          desc: 'Dê um nome para a aplicação (ex: SaaS Commerce) e marque as permissões de Pix (cobranças e webhook).'
        },
        {
          title: 'Copie o Client ID e Client Secret',
          desc: 'Copie as credenciais da aba Produção e salve aqui no painel da sua loja.'
        }
      ],
      tip: 'A Efí Bank tem taxas a partir de 0.89% por Pix, ideal para maximizar sua margem de lucro.'
    }
  },
  ASAAS: {
    name: 'Asaas',
    tagline: 'Plataforma completa de cobranças, PIX automático, cartão e split de pagamentos.',
    badge: 'Robusto para Vendas',
    methods: ['PIX', 'Cartão de Crédito', 'Boleto / Carnê'],
    brandColor: '#0030b9',
    brandBg: 'bg-blue-600/10 text-blue-400',
    brandBorder: 'border-blue-500/30',
    portalUrl: 'https://www.asaas.com/login',
    supportsPix: true,
    fields: [
      { 
        key: 'clientSecret', 
        label: 'API Key (Access Token)', 
        placeholder: '$aact_YTU5YTE0M2ZhN2Q...', 
        isSecret: true,
        hint: 'Chave de integração gerada nas configurações da sua conta Asaas.'
      }
    ],
    tutorial: {
      prerequisite: 'Conta no Asaas verificada para recebimento de pagamentos.',
      steps: [
        {
          title: 'Acesse o Painel do Asaas',
          desc: 'Entre na sua conta Asaas pelo navegador.'
        },
        {
          title: 'Vá em Integrações de API',
          desc: 'Clique na sua foto de perfil no topo direito > "Configurações da Conta" > aba "Integrações".'
        },
        {
          title: 'Gere uma Nova Chave de API',
          desc: 'Na seção Chaves de API, clique no botão "Gerar chave de API" e dê um nome identificador.'
        },
        {
          title: 'Insira a Chave no SaaS Commerce',
          desc: 'Copie a chave completa gerada (começa com $aact_) e cole no campo API Key abaixo.'
        }
      ],
      tip: 'O Asaas permite transferências automáticas diárias e cobranças recorrentes com facilidade.'
    }
  },
  STRIPE: {
    name: 'Stripe',
    tagline: 'Infraestrutura global de pagamentos. Venda em Dólar (USD), Euro (EUR) ou Real.',
    badge: 'Vendas Internacionais',
    methods: ['Cartões Globais', 'Apple Pay / Google Pay', 'Multimoedas'],
    brandColor: '#635bff',
    brandBg: 'bg-indigo-500/10 text-indigo-400',
    brandBorder: 'border-indigo-500/30',
    portalUrl: 'https://dashboard.stripe.com/apikeys',
    supportsPix: false,
    fields: [
      { 
        key: 'clientId', 
        label: 'Chave Publicável (Publishable Key)', 
        placeholder: 'pk_live_51...', 
        hint: 'Chave pública para processar formulários de cartão com segurança.'
      },
      { 
        key: 'clientSecret', 
        label: 'Chave Secreta (Secret Key)', 
        placeholder: 'sk_live_51...', 
        isSecret: true,
        hint: 'Chave secreta para autorizar cobranças direto com a API Stripe.'
      }
    ],
    tutorial: {
      prerequisite: 'Conta Stripe ativada com dados cadastrais preenchidos.',
      steps: [
        {
          title: 'Acesse o Dashboard da Stripe',
          desc: 'Faça login em dashboard.stripe.com e verifique se o botão "Modo de teste" está desativado.'
        },
        {
          title: 'Abra a Seção Desenvolvedores',
          desc: 'No canto superior direito, clique em "Desenvolvedores" > "Chaves de API".'
        },
        {
          title: 'Copie as Chaves Publicável e Secreta',
          desc: 'Copie a chave publicável (pk_live_...) e revele a chave secreta (sk_live_...).'
        },
        {
          title: 'Salve no Painel da Loja',
          desc: 'Cole ambas as chaves aqui no modal e ative o gateway para liberar cartões mundiais.'
        }
      ],
      tip: 'Essencial se você vende licenças de software, bots ou plugins para clientes estrangeiros.'
    }
  }
};

// ─── Tabs de Navegação Unificadas ──────────────────────────────────
const TABS = [
  { id: 'tema', label: 'Aparência', icon: Palette },
  { id: 'tipografia', label: 'Tipografia', icon: Type },
  { id: 'textos', label: 'Textos & Logo', icon: AlignLeft },
  { id: 'pagamentos', label: 'Gateways de Pagamento', icon: CreditCard },
];

// ─── Componente de Pré-visualização da Vitrine ────────────────────
function LivePreview({ formData }: { formData: FormData }) {
  const theme = THEMES.find(t => t.id === formData.theme) || THEMES[0];
  const colors = theme.preview;
  const primaryColor = formData.primaryColor || colors.accent;
  const font = FONTS.find(f => f.name === formData.font);
  const fontFamily = font?.family || 'Inter, sans-serif';

  return (
    <div className="sticky top-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <MonitorSmartphone className="w-4 h-4 text-zinc-400" />
        <span className="text-sm font-medium text-zinc-400">Pré-visualização</span>
        <span className="ml-auto text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-full">Ao vivo</span>
      </div>

      <div className="rounded-2xl overflow-hidden border border-zinc-800/80 shadow-2xl">
        <div className="bg-[#141418] px-4 py-2.5 flex items-center gap-2 border-b border-zinc-800/80">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
          </div>
          <div className="flex-1 bg-zinc-800/80 rounded-full h-4 mx-4 flex items-center px-2">
            <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: primaryColor, opacity: 0.8 }} />
            <div className="h-1.5 w-16 bg-zinc-700 rounded-full" />
          </div>
        </div>

        <div className="relative" style={{ backgroundColor: colors.bg, fontFamily }}>
          {formData.theme === 'theme-glass' && (
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20 blur-2xl"
              style={{ backgroundColor: primaryColor }} />
          )}

          {formData.theme === 'theme-gamer' && (
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)'
            }} />
          )}

          <div className="relative px-4 py-3 flex items-center justify-between" style={{
            background: formData.theme === 'theme-glass' ? 'rgba(0,0,0,0.4)' : formData.theme === 'theme-gamer' ? 'rgba(0,0,0,0.8)' : colors.bg,
            borderBottom: `1px solid ${colors.border}`,
            backdropFilter: formData.theme === 'theme-glass' ? 'blur(12px)' : 'none',
          }}>
            <div className="flex items-center gap-2">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="h-4 w-auto object-contain" style={{ maxWidth: 60 }} />
              ) : (
                <span className="font-bold text-[10px] tracking-widest uppercase" 
                  style={{ color: primaryColor, fontFamily }}>
                  Minha Loja
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-3 rounded-full" style={{ backgroundColor: colors.border }} />
              <div className="px-2 py-0.5 rounded-full text-[7px] font-bold text-white" 
                style={{ backgroundColor: primaryColor, fontFamily }}>
                Entrar
              </div>
            </div>
          </div>

          <div className="px-4 py-5 text-center relative z-10">
            <div className="font-extrabold text-[11px] leading-tight mb-1.5 line-clamp-1" 
              style={{ color: colors.text, fontFamily }}>
              {formData.heroTitle || 'Premium Digital Assets.'}
            </div>
            <div className="text-[8px] leading-relaxed line-clamp-2 mb-3" style={{ color: colors.text, opacity: 0.6, fontFamily }}>
              {formData.heroDescription || 'Eleve seu projeto com produtos de alta qualidade.'}
            </div>
            <div className="inline-block px-3 py-1 rounded-full text-[7px] font-bold text-white"
              style={{ backgroundColor: primaryColor }}>
              Ver Catálogo
            </div>
          </div>

          <div className="px-3 pb-4 grid grid-cols-3 gap-2">
            {[
              { name: 'VIP Pass', price: 'R$ 39,90' },
              { name: 'Script Pro', price: 'R$ 89,90' },
              { name: 'Licença Gold', price: 'R$ 149,90' },
            ].map((p, i) => (
              <div key={i} className="rounded-lg overflow-hidden relative" style={{
                backgroundColor: colors.card,
                border: `1px solid ${i === 0 ? primaryColor + '40' : colors.border}`,
              }}>
                <div className="aspect-square flex items-center justify-center" style={{
                  background: 'rgba(255,255,255,0.03)'
                }}>
                  <div className="w-4 h-4 rounded opacity-30" style={{ backgroundColor: primaryColor }} />
                </div>
                <div className="p-1.5">
                  <div className="text-[6px] font-semibold line-clamp-1 mb-0.5" style={{ color: colors.text, fontFamily }}>{p.name}</div>
                  <div className="text-[7px] font-bold" style={{ color: primaryColor, fontFamily }}>{p.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-800">
          {theme.name}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-800">
          {formData.font}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-800 font-mono" 
          style={{ color: primaryColor }}>
          {formData.primaryColor.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ─── Componente Principal de Configurações ─────────────────────────
export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('tema');
  const { addToast } = useToast();

  // Dados da loja
  const [formData, setFormData] = useState<FormData>({
    theme: 'theme-glass',
    primaryColor: '#8b5cf6',
    font: 'Inter',
    heroTitle: 'Premium Digital Assets.',
    heroDescription: 'Eleve seu projeto com produtos de alta qualidade desenvolvidos por especialistas.',
    logoUrl: ''
  });

  // Dados dos Gateways
  const [gateways, setGateways] = useState<GatewayConfig[]>([]);
  const [selectedPixProvider, setSelectedPixProvider] = useState<GatewayProvider>('MERCADO_PAGO');
  const [editingProvider, setEditingProvider] = useState<GatewayProvider | null>(null);
  const [tutorialProvider, setTutorialProvider] = useState<GatewayProvider | null>(null);
  
  // Estado do formulário do gateway em edição
  const [gatewayForm, setGatewayForm] = useState<{
    clientId: string;
    clientSecret: string;
    publicKey: string;
    enabled: boolean;
    hasFeeAdjust: boolean;
    feePercentage: number;
  }>({
    clientId: '',
    clientSecret: '',
    publicKey: '',
    enabled: false,
    hasFeeAdjust: false,
    feePercentage: 0
  });

  const [showSecret, setShowSecret] = useState(false);
  const [gatewaySaving, setGatewaySaving] = useState(false);

  // Lê query param `tab` da URL no carregamento
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['tema', 'tipografia', 'textos', 'pagamentos'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  const update = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }, []);

  // Busca dados de loja e gateways
  const fetchData = async () => {
    try {
      // 1. Dados da Loja
      const tenantRes = await authFetch('/api/v1/tenants/me');
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        setFormData({
          theme: tenantData.theme || 'theme-glass',
          primaryColor: tenantData.primaryColor || '#8b5cf6',
          font: tenantData.font || 'Inter',
          heroTitle: tenantData.heroTitle || 'Premium Digital Assets.',
          heroDescription: tenantData.heroDescription || 'Eleve seu projeto com produtos de alta qualidade.',
          logoUrl: tenantData.logoUrl || ''
        });
      }

      // 2. Dados dos Gateways
      const gwRes = await authFetch('/api/admin/gateways');
      if (gwRes.ok) {
        const gwData: GatewayConfig[] = await gwRes.json();
        setGateways(gwData);
        const pixConfig = gwData.find(g => g.isPixProvider);
        if (pixConfig) {
          setSelectedPixProvider(pixConfig.provider);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Salvar Aparência / Textos da Loja
  const handleSaveStore = async () => {
    setSaving(true);
    try {
      const res = await authFetch('/api/v1/tenants/me', {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSaved(true);
        addToast('Configurações da loja salvas com sucesso!', 'success');
      } else {
        addToast('Erro ao salvar configurações.', 'error');
      }
    } catch {
      addToast('Erro de comunicação com o servidor.', 'error');
    }
    setSaving(false);
  };

  // Helper para obter configuração de um gateway específico
  const getGatewayConfig = (provider: GatewayProvider): GatewayConfig => {
    return gateways.find(g => g.provider === provider) || {
      provider,
      enabled: false,
      isPixProvider: false,
      clientId: '',
      clientSecret: ''
    };
  };

  // Abrir Modal de Edição de Gateway
  const handleOpenGatewayEdit = (provider: GatewayProvider) => {
    const config = getGatewayConfig(provider);
    setEditingProvider(provider);
    setGatewayForm({
      clientId: config.clientId || '',
      clientSecret: config.clientSecret || '',
      publicKey: config.publicKey || '',
      enabled: config.enabled,
      hasFeeAdjust: !!config.feePercentage && config.feePercentage > 0,
      feePercentage: config.feePercentage || 0
    });
    setShowSecret(false);
  };

  // Salvar Gateway
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProvider) return;
    setGatewaySaving(true);

    try {
      const res = await authFetch(`/api/admin/gateways/${editingProvider}`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: gatewayForm.enabled,
          clientId: gatewayForm.clientId,
          clientSecret: gatewayForm.clientSecret,
          publicKey: gatewayForm.publicKey,
          feePercentage: gatewayForm.hasFeeAdjust ? gatewayForm.feePercentage : 0
        })
      });

      if (res.ok) {
        addToast(`${GATEWAY_DETAILS[editingProvider].name} atualizado com sucesso!`, 'success');
        setEditingProvider(null);
        fetchData();
      } else {
        addToast('Não foi possível salvar as credenciais.', 'error');
      }
    } catch {
      addToast('Erro ao conectar ao servidor.', 'error');
    } finally {
      setGatewaySaving(false);
    }
  };

  // Alternar Status Ativo/Inativo diretamente
  const handleToggleGateway = async (provider: GatewayProvider, currentStatus: boolean) => {
    const config = getGatewayConfig(provider);
    try {
      const res = await authFetch(`/api/admin/gateways/${provider}`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: !currentStatus,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          publicKey: config.publicKey,
          feePercentage: config.feePercentage
        })
      });

      if (res.ok) {
        addToast(`${GATEWAY_DETAILS[provider].name} ${!currentStatus ? 'ativado' : 'desativado'}!`, 'success');
        fetchData();
      }
    } catch {
      addToast('Erro ao alternar status do gateway.', 'error');
    }
  };

  // Definir Provedor Primário de PIX
  const handleSetPixProvider = async (provider: GatewayProvider) => {
    setSelectedPixProvider(provider);
    try {
      const res = await authFetch(`/api/admin/gateways/pix-provider/${provider}`, {
        method: 'PUT'
      });
      if (res.ok) {
        addToast(`PIX configurado via ${GATEWAY_DETAILS[provider].name}!`, 'success');
        fetchData();
      }
    } catch {
      addToast('Erro ao atualizar provedor de PIX.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-80 gap-3">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-zinc-500 text-sm">Carregando painel de configurações...</span>
      </div>
    );
  }

  const isPaymentsTab = activeTab === 'pagamentos';

  return (
    <div className="pb-16 max-w-7xl mx-auto">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center">
              <Store className="w-4 h-4 text-zinc-300" />
            </div>
            Configurações da Plataforma
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Personalize a vitrine, regras comerciais e formas de pagamento da sua loja.
          </p>
        </div>

        {/* Botão de Salvar (Apenas visível nas abas de Aparência/Textos) */}
        {!isPaymentsTab && (
          <button
            onClick={handleSaveStore}
            disabled={saving}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shadow-md ${
              saved 
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-zinc-100 hover:bg-white text-zinc-950 active:scale-95'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {saving ? (
              <><RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />Salvando...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4 text-emerald-400" />Alterações Salvas</>
            ) : (
              <><Save className="w-4 h-4 text-zinc-900" />Salvar Alterações</>
            )}
          </button>
        )}
      </div>

      {/* Tabs com Design Sólido e Limpo */}
      <div className="flex items-center gap-1.5 p-1 bg-[#141418] rounded-xl border border-zinc-800/80 mb-8 w-fit overflow-x-auto max-w-full">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                active 
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/60' 
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-zinc-100' : 'text-zinc-400'}`} />
              {tab.label}
              {tab.id === 'pagamentos' && (
                <span className="ml-1 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ABA: GATEWAYS DE PAGAMENTO (UI/UX PROFISSIONAL NÍVEL STRIPE)     */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {isPaymentsTab && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* Card Principal: Seleção do Provedor de PIX */}
          <div className="bg-[#141418] border border-zinc-800/80 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-white">Chave Primária de Recebimento PIX</h2>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Processamento Instantâneo
                  </span>
                </div>
                <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
                  O gateway selecionado abaixo será o responsável por emitir o QR Code Pix e confirmar automaticamente a entrega dos produtos na sua loja.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start lg:self-center">
                <span className="text-xs text-zinc-400">Provedor Ativo:</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-800 text-white border border-zinc-700/60">
                  {GATEWAY_DETAILS[selectedPixProvider]?.name || 'Nenhum'}
                </span>
              </div>
            </div>

            {/* Seleção do Provedor de PIX com 1 clique */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-6">
              {(['MERCADO_PAGO', 'EFI_BANK', 'ASAAS'] as GatewayProvider[]).map((prov) => {
                const info = GATEWAY_DETAILS[prov];
                const config = getGatewayConfig(prov);
                const isSelected = selectedPixProvider === prov;
                const isConfigured = !!config.clientSecret;

                return (
                  <div
                    key={prov}
                    onClick={() => handleSetPixProvider(prov)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all duration-150 relative ${
                      isSelected
                        ? 'bg-zinc-800/70 border-zinc-600 shadow-sm'
                        : 'bg-[#101014] border-zinc-800/80 hover:border-zinc-700 hover:bg-[#16161b]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <GatewayLogo provider={prov} className="w-5 h-5 rounded-md shrink-0" size={20} />
                        <span className="text-sm font-semibold text-white">{info.name}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isSelected ? 'border-emerald-400 bg-emerald-500/20' : 'border-zinc-700'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-zinc-400 leading-snug mb-3">
                      {prov === 'EFI_BANK' ? 'Taxa reduzida (~0.89%) direto na conta.' : prov === 'MERCADO_PAGO' ? 'Aprovação veloz sem verificação manual.' : 'Cobrança unificada e split dinâmico.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded ${
                        isConfigured ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-zinc-700/40'
                      }`}>
                        {isConfigured ? 'Credenciais Salvas' : 'Não Configurado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lista dos 4 Principais Gateways */}
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-white">Métodos de Pagamento & Gateways</h3>
              <p className="text-xs text-zinc-400">Configure suas credenciais de cada provedor para habilitar no checkout.</p>
            </div>

            <div className="space-y-3">
              {(['MERCADO_PAGO', 'EFI_BANK', 'ASAAS', 'STRIPE'] as GatewayProvider[]).map((prov) => {
                const info = GATEWAY_DETAILS[prov];
                const config = getGatewayConfig(prov);
                const isConfigured = !!config.clientSecret;

                return (
                  <div
                    key={prov}
                    className="bg-[#141418] border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-5 transition-all duration-150 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    {/* Informações do Gateway */}
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Logo Oficial Vetorial */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 bg-[#18181e] p-2 overflow-hidden shadow-inner">
                        <GatewayLogo provider={prov} className="w-8 h-8 rounded-lg" size={32} />
                      </div>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-semibold text-white">{info.name}</h4>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/50">
                            {info.badge}
                          </span>
                          {config.enabled ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              Ativo
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700/40">
                              Desativado
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                          {info.tagline}
                        </p>

                        {/* Badges de métodos aceitos */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {info.methods.map((method) => (
                            <span 
                              key={method} 
                              className="text-[11px] px-2 py-0.5 rounded-md bg-[#1a1a20] text-zinc-300 border border-zinc-800"
                            >
                              {method}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Ações: Tutorial, Configurar, Switch */}
                    <div className="flex items-center justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-zinc-800/80">
                      {/* Botão de Tutorial Passo a Passo */}
                      <button
                        onClick={() => setTutorialProvider(prov)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1c1c22] hover:bg-[#24242c] text-zinc-300 text-xs font-medium border border-zinc-700/50 transition-colors"
                        title="Ver passo a passo de como pegar as chaves"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                        Passo a Passo
                      </button>

                      {/* Botão Configurar */}
                      <button
                        onClick={() => handleOpenGatewayEdit(prov)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all active:scale-95 shadow-sm"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        Configurar
                      </button>

                      {/* Toggle Liga/Desliga */}
                      <button
                        onClick={() => handleToggleGateway(prov, config.enabled)}
                        disabled={!isConfigured}
                        title={!isConfigured ? 'Configure as credenciais primeiro' : 'Ativar/Desativar'}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
                          config.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150 ${
                            config.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          {/* Caixa de Segurança das Credenciais */}
          <div className="p-4 rounded-xl bg-[#141418] border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-zinc-200 block mb-0.5">Segurança de Pagamentos e Isolamento</span>
              <span>
                Suas credenciais são transmitidas de forma criptografada diretamente para o servidor. O dinheiro das vendas vai diretamente para a sua conta no gateway, sem intermediação ou retenção do SaaS.
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* ABAS DA VITRINE: TEMA, TIPOGRAFIA E TEXTOS COM LIVE PREVIEW       */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {!isPaymentsTab && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 items-start">
          
          <div className="space-y-6">
            
            {/* ── TAB: Tema ─────────────────────────────── */}
            {activeTab === 'tema' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Theme Cards */}
                <div className="bg-[#141418] border border-zinc-800/80 rounded-2xl p-6">
                  <div className="mb-5">
                    <h2 className="text-white font-semibold text-sm mb-1">Template da Loja</h2>
                    <p className="text-zinc-400 text-xs">Escolha a identidade visual que mais combina com seu produto.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {THEMES.map(theme => {
                      const isActive = formData.theme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          onClick={() => update('theme', theme.id)}
                          className={`relative text-left rounded-xl border-2 overflow-hidden transition-all duration-150 group ${
                            isActive 
                              ? 'border-violet-500 shadow-md shadow-violet-500/10' 
                              : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <div className="h-24 relative" style={{ backgroundColor: theme.preview.bg }}>
                            {theme.id === 'theme-glass' && (
                              <div className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-40 blur-xl" 
                                style={{ backgroundColor: theme.preview.accent }} />
                            )}
                            <div className="absolute top-0 left-0 right-0 px-2 py-1.5 flex items-center justify-between"
                              style={{ borderBottom: `1px solid ${theme.preview.border}` }}>
                              <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: theme.preview.accent, opacity: 0.8 }} />
                              <div className="flex gap-1">
                                <div className="w-4 h-1 rounded-full" style={{ backgroundColor: theme.preview.border }} />
                                <div className="w-4 h-1 rounded-full" style={{ backgroundColor: theme.preview.accent }} />
                              </div>
                            </div>
                            <div className="absolute bottom-2 left-2 right-2 grid grid-cols-3 gap-1">
                              {[0,1,2].map(i => (
                                <div key={i} className="rounded h-8" style={{
                                  backgroundColor: theme.preview.card,
                                  border: `1px solid ${i === 0 ? theme.preview.accent + '50' : theme.preview.border}`,
                                }} />
                              ))}
                            </div>
                          </div>
                          <div className="p-3 bg-[#18181c] border-t border-zinc-800">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-white text-xs font-semibold">{theme.name}</span>
                              {isActive && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-violet-400" />
                              )}
                            </div>
                            <span className="text-zinc-500 text-[10px]">{theme.desc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Color Section */}
                <div className="bg-[#141418] border border-zinc-800/80 rounded-2xl p-6">
                  <div className="mb-5">
                    <h2 className="text-white font-semibold text-sm mb-1">Cor Principal</h2>
                    <p className="text-zinc-400 text-xs">Define a cor dos botões, destaques e gradientes da sua loja.</p>
                  </div>

                  <div className="flex flex-wrap gap-2.5 mb-5">
                    {PRESET_COLORS.map(preset => (
                      <button
                        key={preset.color}
                        onClick={() => update('primaryColor', preset.color)}
                        title={preset.name}
                        className="relative w-8 h-8 rounded-full transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
                        style={{ backgroundColor: preset.color }}
                      >
                        {formData.primaryColor.toLowerCase() === preset.color && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-[#101014] border border-zinc-800 rounded-xl">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-lg cursor-pointer overflow-hidden border border-zinc-700"
                        style={{ backgroundColor: formData.primaryColor }}>
                        <input
                          type="color"
                          value={formData.primaryColor}
                          onChange={e => update('primaryColor', e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Código HEX</label>
                      <input
                        type="text"
                        value={formData.primaryColor.toUpperCase()}
                        onChange={e => update('primaryColor', e.target.value)}
                        className="w-full bg-transparent text-white font-mono text-sm outline-none border-none mt-0.5"
                        placeholder="#8B5CF6"
                      />
                    </div>
                    <Sparkles className="w-4 h-4 text-zinc-600" />
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB: Tipografia ──────────────────────── */}
            {activeTab === 'tipografia' && (
              <div className="bg-[#141418] border border-zinc-800/80 rounded-2xl p-6 animate-in fade-in duration-150">
                <div className="mb-6">
                  <h2 className="text-white font-semibold text-sm mb-1">Tipografia da Loja</h2>
                  <p className="text-zinc-400 text-xs">Selecione uma família de fontes otimizada para legibilidade.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {FONTS.map(font => {
                    const isActive = formData.font === font.name;
                    return (
                      <button
                        key={font.name}
                        onClick={() => update('font', font.name)}
                        className={`relative text-left p-4 rounded-xl border transition-all duration-150 ${
                          isActive 
                            ? 'border-violet-500 bg-violet-500/5' 
                            : 'border-zinc-800 bg-[#101014] hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span 
                            className="text-lg font-bold leading-none"
                            style={{ fontFamily: font.family, color: isActive ? '#ffffff' : '#d4d4d8', fontStyle: font.style === 'italic' ? 'italic' : 'normal' }}
                          >
                            {font.name}
                          </span>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />}
                        </div>
                        <span 
                          className="text-xs block mb-1"
                          style={{ fontFamily: font.family, color: '#71717a' }}
                        >
                          Aa Bb Cc — 1 2 3
                        </span>
                        <span className="text-[10px] text-zinc-500">{font.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── TAB: Textos & Logo ───────────────────── */}
            {activeTab === 'textos' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-[#141418] border border-zinc-800/80 rounded-2xl p-6">
                  <div className="mb-4">
                    <h2 className="text-white font-semibold text-sm mb-1">Logotipo da Loja</h2>
                    <p className="text-zinc-400 text-xs">Carregue a logomarca da sua loja diretamente do seu dispositivo (PNG, SVG, WEBP ou JPG).</p>
                  </div>
                  
                  <div className="max-w-xs">
                    <ImageUploader
                      value={formData.logoUrl}
                      onChange={val => update('logoUrl', val)}
                      label=""
                      helperText="Recomendado: imagem com fundo transparente."
                      aspectRatio="square"
                      maxDimension={600}
                    />
                  </div>
                </div>

                <div className="bg-[#141418] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                  <h2 className="text-white font-semibold text-sm mb-1">Textos de Apresentação</h2>
                  
                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Título Principal (Hero)</label>
                    <input 
                      type="text"
                      maxLength={80}
                      value={formData.heroTitle}
                      onChange={e => update('heroTitle', e.target.value)}
                      className="w-full bg-[#101014] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-zinc-500 outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-zinc-400 font-medium block mb-1.5">Descrição Curta</label>
                    <textarea 
                      rows={3}
                      maxLength={200}
                      value={formData.heroDescription}
                      onChange={e => update('heroDescription', e.target.value)}
                      className="w-full bg-[#101014] border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:border-zinc-500 outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Coluna da Direita: Live Preview */}
          <div className="hidden xl:block">
            <LivePreview formData={formData} />
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: TUTORIAL PASSO A PASSO INTEGRADO                            */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {tutorialProvider && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Header do Tutorial */}
            <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 bg-[#18181e] p-1.5 overflow-hidden shadow-inner">
                  <GatewayLogo provider={tutorialProvider} className="w-7 h-7 rounded-md" size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Tutorial: Como Configurar {GATEWAY_DETAILS[tutorialProvider].name}
                  </h3>
                  <span className="text-xs text-zinc-400">Guia passo a passo para obter suas chaves de API oficiais</span>
                </div>
              </div>

              <button 
                onClick={() => setTutorialProvider(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo dos Passos */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              
              {/* Pré-requisito */}
              <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5 text-xs text-zinc-300">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span><strong>Pré-requisito:</strong> {GATEWAY_DETAILS[tutorialProvider].tutorial.prerequisite}</span>
              </div>

              {/* Passos Numerados */}
              <div className="space-y-4">
                {GATEWAY_DETAILS[tutorialProvider].tutorial.steps.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-[#101014] border border-zinc-800/80">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-zinc-200">{st.title}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">{st.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dica de Segurança */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-400/90 leading-relaxed flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-300">Dica do Provedor:</strong> {GATEWAY_DETAILS[tutorialProvider].tutorial.tip}
                </div>
              </div>

            </div>

            {/* Rodapé com Links e Ação */}
            <div className="p-6 border-t border-zinc-800 bg-[#101014] flex flex-col sm:flex-row items-center justify-between gap-3">
              <a
                href={GATEWAY_DETAILS[tutorialProvider].portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-violet-400 hover:text-violet-300 font-medium inline-flex items-center gap-1.5"
              >
                Abrir Portal de Desenvolvedores
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setTutorialProvider(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    const prov = tutorialProvider;
                    setTutorialProvider(null);
                    handleOpenGatewayEdit(prov);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-sm"
                >
                  Configurar Agora
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: FORMULÁRIO DE CONFIGURAÇÃO DE CREDENCIAIS                 */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-zinc-800 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-zinc-800 bg-[#18181e] p-1.5 overflow-hidden shadow-inner">
                  <GatewayLogo provider={editingProvider} className="w-7 h-7 rounded-md" size={28} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Configurar {GATEWAY_DETAILS[editingProvider].name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const prov = editingProvider;
                      setEditingProvider(null);
                      setTutorialProvider(prov);
                    }}
                    className="text-xs text-violet-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    Dúvidas? Ver passo a passo
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setEditingProvider(null)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveGateway} className="p-6 space-y-4">
              
              {GATEWAY_DETAILS[editingProvider].fields.map((field) => {
                const value = gatewayForm[field.key] || '';

                return (
                  <div key={field.key} className="space-y-1.5">
                    <label className="block text-xs font-medium text-zinc-300">
                      {field.label}
                    </label>

                    <div className="relative">
                      <input
                        type={field.isSecret && !showSecret ? 'password' : 'text'}
                        value={value}
                        onChange={(e) => setGatewayForm({
                          ...gatewayForm,
                          [field.key]: e.target.value
                        })}
                        placeholder={field.placeholder}
                        className="w-full bg-[#101014] border border-zinc-800 focus:border-zinc-500 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 outline-none transition-colors"
                        required={field.key !== 'publicKey'}
                      />

                      {field.isSecret && (
                        <button
                          type="button"
                          onClick={() => setShowSecret(!showSecret)}
                          className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500">{field.hint}</p>
                  </div>
                );
              })}

              {/* Ajuste de Taxa / Desconto no Checkout */}
              <div className="p-3.5 bg-[#101014] border border-zinc-800/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-white block">Ajuste no valor final</span>
                    <span className="text-[10px] text-zinc-400">Adicione uma taxa ou desconto percentual no checkout.</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setGatewayForm({ ...gatewayForm, hasFeeAdjust: !gatewayForm.hasFeeAdjust })}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                      gatewayForm.hasFeeAdjust ? 'bg-violet-600' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        gatewayForm.hasFeeAdjust ? 'translate-x-4' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {gatewayForm.hasFeeAdjust && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="block text-[11px] text-zinc-400 mb-1">Porcentagem adicional (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={gatewayForm.feePercentage}
                      onChange={(e) => setGatewayForm({ ...gatewayForm, feePercentage: parseFloat(e.target.value) || 0 })}
                      placeholder="Ex: 2.5"
                      className="w-full bg-[#18181c] border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Status de Ativação */}
              <div className="flex items-center justify-between p-3.5 bg-[#101014] rounded-xl border border-zinc-800/80">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-white block">Habilitar Gateway</span>
                  <span className="text-[10px] text-zinc-400">Permitir que clientes paguem por este método na loja</span>
                </div>

                <button
                  type="button"
                  onClick={() => setGatewayForm({ ...gatewayForm, enabled: !gatewayForm.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    gatewayForm.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      gatewayForm.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProvider(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={gatewaySaving}
                  className="px-5 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold transition-all shadow-sm flex items-center gap-2"
                >
                  {gatewaySaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Salvar Configurações
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
