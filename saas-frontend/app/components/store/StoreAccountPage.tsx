'use client';

import { useParams } from 'next/navigation';
import PasswordResetForm from '../PasswordResetForm';
import { AnnouncementBar, StoreFooter, StoreHeader } from './StoreChrome';

/** "Esqueci minha senha" e "nova senha" do comprador, com o visual da loja. */
export default function StoreAccountPage({ mode }: { mode: 'request' | 'reset' }) {
  const storeSlug = useParams().storeSlug as string;
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <StoreHeader />
      <main className="flex-1 flex flex-col items-center px-4 py-12 sm:py-16">
        <div
          className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border-color)] p-7 sm:p-8 shadow-2xl"
          style={{ borderRadius: 'var(--store-radius)' }}
        >
          <h1 className="text-2xl font-bold tracking-tight text-center mb-2">
            {mode === 'request' ? 'Esqueceu a senha?' : 'Criar nova senha'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] text-center mb-7">
            {mode === 'request'
              ? 'Informe o e-mail da sua conta nesta loja. Vamos mandar um link para criar uma nova senha.'
              : 'Escolha a nova senha da sua conta.'}
          </p>
          <PasswordResetForm mode={mode} variant="store" storeSlug={storeSlug} loginHref={`/loja/${storeSlug}/login`} />
        </div>
      </main>
      <StoreFooter />
    </div>
  );
}
