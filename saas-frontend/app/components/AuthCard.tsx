import Link from 'next/link';

/** Moldura das telas de conta do painel (esqueci minha senha, redefinir senha). */
export default function AuthCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <img src="/nexuscart-icon.png" alt="" className="w-8 h-8 rounded-lg object-contain" />
        <span className="font-headline-md text-headline-md font-bold tracking-tight">
          Nexus<span className="text-[var(--color-brand,#8b5cf6)]">Cart</span>
        </span>
      </Link>
      <main className="w-full max-w-[420px] bg-surface-container-low border border-outline-variant/30 rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        <h1 className="font-headline-lg text-headline-lg font-bold tracking-tight mb-1.5">{title}</h1>
        <p className="font-body-sm text-body-sm text-outline mb-6">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}
