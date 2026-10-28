'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { setCustomerSession } from '../../../lib/customerAuth';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Lock, Mail, User, CreditCard } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function StoreCustomerLoginPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const storeSlug = params.storeSlug as string;
  const redirect = searchParams.get('redirect') || `/loja/${storeSlug}/minhas-compras`;

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

  const storeName = storeSlug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

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
    } catch (err: any) {
      setError(err.message || 'Erro ao realizar login.');
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
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      
      {/* Luz ambiente de fundo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-indigo-600/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Header com retorno para a loja */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between text-xs text-zinc-500">
        <Link href={`/loja/${storeSlug}`} className="hover:text-zinc-300 transition-colors flex items-center gap-1.5">
          ← Voltar à vitrine
        </Link>
        <span className="text-zinc-600 font-medium">{storeName}</span>
      </div>

      <div className="w-full max-w-md bg-[#121215] border border-white/[0.08] rounded-2xl p-7 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Título & Boas-vindas */}
        <div className="text-center mb-7">
          <div className="w-11 h-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mx-auto mb-3 text-zinc-300">
            <Lock className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            {activeTab === 'login' ? 'Área do Cliente' : 'Criar Conta de Comprador'}
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            {activeTab === 'login' 
              ? `Acesse seu histórico de pedidos em ${storeName}` 
              : 'Cadastre-se para acessar suas chaves digitais e compras'}
          </p>
        </div>

        {/* Abas Alternadoras */}
        <div className="grid grid-cols-2 p-1 bg-white/[0.04] rounded-xl border border-white/5 mb-6 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'login' 
                ? 'bg-white/10 text-white shadow-sm font-semibold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            className={`py-2 rounded-lg transition-all ${
              activeTab === 'register' 
                ? 'bg-white/10 text-white shadow-sm font-semibold' 
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Formulário de Login */}
        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
                <Mail className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar e ver compras</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Formulário de Registro */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome completo</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="João da Silva"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
                <User className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">E-mail</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
                <Mail className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">CPF (opcional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={regCpf}
                  onChange={handleCpfChange}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors font-mono"
                />
                <CreditCard className="w-4 h-4 text-zinc-600 absolute right-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Senha (mínimo 6 dígitos)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full bg-[#18181c] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/80 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Criar conta e continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Ambiente seguro criptografado</span>
        </div>

      </div>
    </div>
  );
}
