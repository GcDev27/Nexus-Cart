'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '', // Novo campo
    storeName: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação de senhas iguais antes de enviar ao backend
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          storeName: formData.storeName
        }), // Enviamos sem o confirmPassword, pois o backend não precisa dele
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ocorreu um erro ao criar sua conta e loja.');
      }

      localStorage.setItem('token', data.token);
      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao registrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-4 sm:p-8 font-sans selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/5 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-surface-container-low border border-outline-variant/30 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative z-10">
        
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 py-10 sm:px-12 lg:px-16 z-10 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold shadow-md">
                <span className="material-symbols-outlined text-xl">shopping_cart</span>
              </div>
              <span className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                CentralCart
              </span>
            </div>

            <h1 className="font-headline-lg text-headline-lg font-bold text-on-surface tracking-tight mb-1.5">
              Crie sua Loja Digital
            </h1>
            <p className="font-body-sm text-body-sm text-outline mb-6">
              Venda licenças, chaves e contas com entrega automática e Pix instantâneo.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-error-container/20 border border-error/30 text-error rounded-xl text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base shrink-0">error</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block font-label-xs text-label-xs text-on-surface-variant mb-1 font-semibold">
                  Nome da sua Loja <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="storeName"
                  value={formData.storeName}
                  onChange={handleChange}
                  placeholder="Ex: Minha Loja Games"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block font-label-xs text-label-xs text-on-surface-variant mb-1 font-semibold">
                  Seu Nome Completo <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Como devemos te chamar?"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block font-label-xs text-label-xs text-on-surface-variant mb-1 font-semibold">
                  E-mail de Acesso <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  required
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-label-xs text-label-xs text-on-surface-variant mb-1 font-semibold">
                    Senha <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 dígitos"
                      required
                      minLength={6}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 pr-10 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-label-xs text-label-xs text-on-surface-variant mb-1 font-semibold">
                    Confirmar Senha <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repita a senha"
                      required
                      minLength={6}
                      className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 pr-10 text-on-surface text-sm placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-primary-container hover:bg-primary text-on-primary font-bold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 flex justify-center items-center shadow-[0_4px_24px_-2px_rgba(160,120,255,0.4)]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                    <span>Criando sua loja...</span>
                  </div>
                ) : (
                  <span>Criar Conta e Loja Grátis</span>
                )}
              </button>
            </form>
            
            <p className="mt-6 text-center font-label-xs text-label-xs text-outline">
              Já possui uma loja cadastrada?{' '}
              <Link href="/login" className="text-primary hover:text-primary-fixed underline transition-colors font-semibold">
                Acesse o painel
              </Link>
            </p>
          </motion.div>
        </div>

        {/* Painel Direito Decorativo */}
        <div className="hidden md:flex md:w-1/2 relative bg-surface-container-lowest flex-col items-center justify-center p-12 overflow-hidden border-l border-outline-variant/20">
          <div className="absolute inset-0 bg-radial from-primary/10 via-transparent to-transparent pointer-events-none"></div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center z-10 max-w-sm space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-primary mx-auto shadow-2xl">
              <span className="material-symbols-outlined text-3xl">bolt</span>
            </div>

            <h2 className="font-headline-lg text-headline-lg font-bold text-on-surface leading-tight">
              Sua infraestrutura de vendas completa.
            </h2>
            <p className="font-body-sm text-body-sm text-outline leading-relaxed">
              Elimine o trabalho manual. O cliente paga via Pix e o sistema entrega códigos, licenças e acessos em menos de 2 segundos.
            </p>

            <div className="pt-4 flex items-center justify-center gap-6 font-label-xs text-label-xs text-outline">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                Isolamento Multi-Tenant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-base">check_circle</span>
                Entrega Instantânea
              </span>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
}