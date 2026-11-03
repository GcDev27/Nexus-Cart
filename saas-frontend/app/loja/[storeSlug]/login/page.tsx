'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { setCustomerSession } from '../../../lib/customerAuth';
import { Eye, EyeOff, Mail, User, CreditCard } from 'lucide-react';
import { useStore } from '../../../components/store/StoreContext';
import { AnnouncementBar, StoreFooter, StoreHeader } from '../../../components/store/StoreChrome';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

function LoginContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const storeSlug = params.storeSlug as string;
  const store = useStore();
  // Só redireciona para páginas desta loja: evita que um link malicioso mande o comprador para outro site
  const requested = searchParams.get('redirect') || '';
  const redirect = requested.startsWith(`/loja/${storeSlug}/`) && !requested.startsWith('//')
    ? requested
    : `/loja/${storeSlug}/minhas-compras`;

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Formatação de CPF: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 9) {
      val = val.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (val.length > 6) {
      val = val.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (val.length > 3) {
      val = val.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    setRegCpf(val);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/storefront/customer/login?storeSlug=${storeSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': storeSlug,
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Credenciais inválidas.');
      }

      setCustomerSession(data.token, data.customer);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/storefront/customer/register?storeSlug=${storeSlug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Slug': storeSlug,
        },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          cpf: regCpf,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível criar sua conta.');
      }

      setCustomerSession(data.token, data.customer);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    'w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--color-brand)] px-3.5 py-3 pr-10 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition-colors';
  const fieldStyle = { borderRadius: 'var(--store-radius-sm)' };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
    >
      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );

  const submitButton = (label: string) => (
    <button
      type="submit"
      disabled={loading}
      className="w-full mt-2 py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
      style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
    >
      {loading ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" aria-label="Carregando" /> : label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <StoreHeader />

      <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-16">
        <div
          className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] p-7 sm:p-8 shadow-2xl"
          style={{ borderRadius: 'var(--store-radius)' }}
        >
          <div className="text-center mb-7">
            <h1 className="text-2xl font-bold tracking-tight">
              {activeTab === 'login' ? 'Entrar na sua conta' : 'Criar sua conta'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              {activeTab === 'login'
                ? `Veja suas compras e chaves em ${store.name}.`
                : 'Com uma conta, todas as suas chaves ficam salvas em "Minhas compras".'}
            </p>
          </div>

          <div
            role="tablist"
            className="grid grid-cols-2 p-1 bg-[var(--bg-primary)] border border-[var(--border-color)] mb-6 text-sm font-medium"
            style={{ borderRadius: 'var(--store-radius-sm)' }}
          >
            {(['login', 'register'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => { setActiveTab(tab); setError(null); }}
                className={`py-2 transition-colors ${activeTab === tab ? 'font-semibold' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                style={{
                  borderRadius: 'calc(var(--store-radius-sm) - 2px)',
                  ...(activeTab === tab ? { background: 'var(--color-brand)', color: 'var(--store-on-brand)' } : {}),
                }}
              >
                {tab === 'login' ? 'Já tenho conta' : 'Criar conta'}
              </button>
            ))}
          </div>

          {error && (
            <p role="alert" className="mb-5 p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/25" style={fieldStyle}>
              {error}
            </p>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <label className="block">
                <span className="block text-sm mb-1.5">E-mail</span>
                <span className="relative block">
                  <input type="email" required autoComplete="email" placeholder="seu@email.com" value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)} className={fieldClass} style={fieldStyle} />
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </span>
              </label>

              <label className="block">
                <span className="block text-sm mb-1.5">Senha</span>
                <span className="relative block">
                  <input type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)} className={fieldClass} style={fieldStyle} />
                  {passwordToggle}
                </span>
              </label>

              {submitButton('Entrar')}
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <label className="block">
                <span className="block text-sm mb-1.5">Nome completo</span>
                <span className="relative block">
                  <input type="text" required autoComplete="name" placeholder="Seu nome" value={regName}
                    onChange={e => setRegName(e.target.value)} className={fieldClass} style={fieldStyle} />
                  <User className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </span>
              </label>

              <label className="block">
                <span className="block text-sm mb-1.5">E-mail</span>
                <span className="relative block">
                  <input type="email" required autoComplete="email" placeholder="seu@email.com" value={regEmail}
                    onChange={e => setRegEmail(e.target.value)} className={fieldClass} style={fieldStyle} />
                  <Mail className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </span>
              </label>

              <label className="block">
                <span className="block text-sm mb-1.5">CPF <span className="text-[var(--text-secondary)]">(opcional)</span></span>
                <span className="relative block">
                  <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={regCpf}
                    onChange={handleCpfChange} className={fieldClass} style={fieldStyle} />
                  <CreditCard className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </span>
              </label>

              <label className="block">
                <span className="block text-sm mb-1.5">Senha <span className="text-[var(--text-secondary)]">(mínimo 8 caracteres)</span></span>
                <span className="relative block">
                  <input type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={regPassword}
                    onChange={e => setRegPassword(e.target.value)} className={fieldClass} style={fieldStyle} />
                  {passwordToggle}
                </span>
              </label>

              {submitButton('Criar conta')}
            </form>
          )}
        </div>

        <Link href={`/loja/${storeSlug}`} className="mt-6 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Voltar para a loja
        </Link>
      </main>

      <StoreFooter />
    </div>
  );
}

export default function StoreCustomerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginContent />
    </Suspense>
  );
}
