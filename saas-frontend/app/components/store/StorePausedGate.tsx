'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Mesmo com a loja pausada, quem já comprou continua vendo os pedidos e as conversas
const ALWAYS_OPEN = ['/login', '/minhas-compras', '/conversas', '/esqueci-senha', '/redefinir-senha'];

export default function StorePausedGate({
  open, storeSlug, storeName, children,
}: { open: boolean; storeSlug: string; storeName: string; children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const sub = pathname.replace(`/loja/${storeSlug}`, '');
  if (open || ALWAYS_OPEN.some(p => sub.startsWith(p))) return <>{children}</>;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold mb-3">{storeName} está temporariamente fora do ar</h1>
        <p className="text-[var(--text-secondary)] mb-6">
          A loja não está recebendo pedidos agora. Se você já comprou aqui, seus pedidos e chaves continuam disponíveis.
        </p>
        <Link
          href={`/loja/${storeSlug}/minhas-compras`}
          className="inline-flex px-5 py-2.5 font-semibold"
          style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)', borderRadius: 'var(--store-radius-sm)' }}
        >
          Ver minhas compras
        </Link>
      </div>
    </main>
  );
}
