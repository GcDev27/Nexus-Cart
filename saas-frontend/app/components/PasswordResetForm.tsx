'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

type Variant = 'platform' | 'store';

interface Props {
  mode: 'request' | 'reset';
  variant: Variant;
  /** Só nas lojas: o slug da loja do comprador. */
  storeSlug?: string;
  loginHref: string;
}

// O visual segue o painel (platform) ou o tema da loja (store)
const styles: Record<Variant, { field: string; fieldStyle?: React.CSSProperties; button: string; buttonStyle?: React.CSSProperties; muted: string; link: string }> = {
  platform: {
    field: 'w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline outline-none',
    button: 'w-full bg-primary-container hover:bg-primary text-on-primary font-bold py-3 rounded-xl disabled:opacity-60',
    muted: 'text-outline',
    link: 'text-primary underline',
  },
  store: {
    field: 'w-full bg-[var(--bg-primary)] border border-[var(--border-color)] focus:border-[var(--color-brand)] px-3.5 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none',
    fieldStyle: { borderRadius: 'var(--store-radius-sm)' },
    button: 'w-full py-3 text-sm font-semibold hover:brightness-110 disabled:opacity-50',
    buttonStyle: { background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' },
    muted: 'text-[var(--text-secondary)]',
    link: 'underline',
  },
};

export default function PasswordResetForm({ mode, variant, storeSlug, loginHref }: Props) {
  const s = styles[variant];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'reset') setToken(new URLSearchParams(window.location.search).get('token'));
  }, [mode]);

  const base = variant === 'store' ? '/api/storefront/customer' : '/api/auth';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'reset' && password !== confirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    try {
      const url = mode === 'request'
        ? `${API_BASE}${base}/forgot-password${variant === 'store' ? `?storeSlug=${encodeURIComponent(storeSlug || '')}` : ''}`
        : `${API_BASE}${base}/reset-password`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mode === 'request' ? { email } : { token, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || 'Não foi possível concluir agora. Tente de novo.');
        return;
      }
      setDone(mode === 'request'
        ? 'Se este e-mail tiver uma conta, você vai receber um link para criar uma nova senha. Ele vale por 30 minutos. Confira também a caixa de spam.'
        : 'Senha alterada. Entre com a nova senha.');
    } catch {
      setError('Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm">{done}</p>
        <Link href={loginHref} className={`inline-block text-sm ${s.link}`}>Voltar para o login</Link>
      </div>
    );
  }

  if (mode === 'reset' && token === null) {
    return (
      <div className="space-y-4 text-center">
        <p className={`text-sm ${s.muted}`}>Link incompleto. Abra de novo o link que chegou no seu e-mail.</p>
        <Link href={loginHref} className={`inline-block text-sm ${s.link}`}>Voltar para o login</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <p role="alert" className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{error}</p>
      )}
      {mode === 'request' ? (
        <label className="block">
          <span className="block text-sm mb-1.5">E-mail da conta</span>
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
            className={s.field} style={s.fieldStyle} placeholder="seu@email.com" />
        </label>
      ) : (
        <>
          <label className="block">
            <span className="block text-sm mb-1.5">Nova senha <span className={s.muted}>(mínimo 8 caracteres)</span></span>
            <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={password}
              onChange={e => setPassword(e.target.value)} className={s.field} style={s.fieldStyle} />
          </label>
          <label className="block">
            <span className="block text-sm mb-1.5">Repita a nova senha</span>
            <input type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={confirm}
              onChange={e => setConfirm(e.target.value)} className={s.field} style={s.fieldStyle} />
          </label>
        </>
      )}
      <button type="submit" disabled={loading} className={s.button} style={s.buttonStyle}>
        {loading ? 'Enviando...' : mode === 'request' ? 'Enviar link' : 'Salvar nova senha'}
      </button>
      <p className={`text-center text-sm ${s.muted}`}>
        Lembrou a senha? <Link href={loginHref} className={s.link}>Entrar</Link>
      </p>
    </form>
  );
}
