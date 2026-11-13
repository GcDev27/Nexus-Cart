import Link from 'next/link';
import { LEGAL } from '../lib/legal';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-on-surface">{title}</h2>
      <div className="space-y-3 text-on-surface-variant leading-relaxed">{children}</div>
    </section>
  );
}

export default function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="max-w-3xl mx-auto px-5 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/nexuscart-icon.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold tracking-tight">
            Nexus<span className="text-[var(--color-brand,#8b5cf6)]">Cart</span>
          </span>
        </Link>
        <nav className="flex gap-4 text-sm text-outline">
          <Link href="/termos" className="hover:text-on-surface">Termos</Link>
          <Link href="/privacidade" className="hover:text-on-surface">Privacidade</Link>
        </nav>
      </header>
      <main className="max-w-3xl mx-auto px-5 pb-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-outline mb-10">Atualizado em {LEGAL.updatedAt}</p>
        <div className="space-y-10 text-[15px]">{children}</div>
        <p className="mt-12 text-sm text-outline">
          Dúvidas: <a href={`mailto:${LEGAL.contactEmail}`} className="underline">{LEGAL.contactEmail}</a>
        </p>
      </main>
    </div>
  );
}
