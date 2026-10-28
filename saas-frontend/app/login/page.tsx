'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShoppingBag, ArrowRight, RefreshCw, AlertCircle, ShieldCheck } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error) throw new Error(data.error);
        if (data.errors) throw new Error(Object.values(data.errors)[0] as string);
        throw new Error('E-mail ou senha incorretos.');
      }

      localStorage.setItem('token', data.token);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col justify-between p-4 sm:p-6 font-sans selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[35%] h-[35%] bg-secondary/5 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2 relative z-10">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-sm">
            <span className="material-symbols-outlined text-lg">shopping_cart</span>
          </div>
          <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
            CentralCart
          </span>
        </Link>

        <Link 
          href="/registro"
          className="font-label-xs text-label-xs text-outline hover:text-primary transition-colors font-semibold"
        >
          Criar nova loja →
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-[420px] mx-auto my-auto relative z-10">
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-6">
          
          <div className="space-y-1.5">
            <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight text-on-surface">
              Acessar Painel
            </h1>
            <p className="font-body-sm text-body-sm text-outline">
              Digite suas credenciais para gerenciar seus produtos e vendas.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-error-container/20 border border-error/30 text-error rounded-xl text-xs flex items-start gap-2.5">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">error</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block font-label-xs text-label-xs text-on-surface-variant font-semibold">
                E-mail
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none transition-colors shadow-inner"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-label-xs text-label-xs text-on-surface-variant font-semibold">
                  Senha
                </label>
                <a href="#recuperar" className="text-[11px] text-outline hover:text-primary transition-colors">
                  Esqueceu?
                </a>
              </div>
              
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 pr-10 text-sm text-on-surface placeholder:text-outline outline-none transition-colors shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-primary-container hover:bg-primary text-on-primary font-bold text-sm py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_20px_-2px_rgba(160,120,255,0.4)]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-on-primary" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Painel</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-2 border-t border-outline-variant/20 text-center">
            <p className="font-label-xs text-label-xs text-outline">
              Não tem uma conta?{' '}
              <Link href="/registro" className="text-primary hover:text-primary-fixed font-semibold underline">
                Criar loja grátis
              </Link>
            </p>
          </div>

        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-outline">
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>Autenticação criptografada com isolamento multi-tenant</span>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 font-label-xs text-label-xs text-outline/60">
        © 2026 CentralCart — Plataforma SaaS de comércio digital automatizado
      </footer>

    </div>
  );
}