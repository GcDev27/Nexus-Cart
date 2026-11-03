'use client';

import React from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import StoreCustomerNav from '../StoreCustomerNav';
import { useStore } from './StoreContext';

/* ── Ícones das redes (o lucide não traz marcas) ─────────────────── */
function DiscordIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18.2 18.2 0 0 0-5.5 0L8.6 3a19.5 19.5 0 0 0-4.9 1.4C.6 9.1-.3 13.6.1 18.1a19.8 19.8 0 0 0 6 3l1.3-2a12.8 12.8 0 0 1-2-1l.5-.4a14 14 0 0 0 12.2 0l.5.4a12.8 12.8 0 0 1-2 1l1.3 2a19.7 19.7 0 0 0 6-3c.5-5.2-.9-9.7-3.6-13.7ZM8 15.4c-1.2 0-2.2-1.1-2.2-2.4S6.8 10.6 8 10.6s2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Zm8 0c-1.2 0-2.2-1.1-2.2-2.4s1-2.4 2.2-2.4 2.2 1.1 2.2 2.4-1 2.4-2.2 2.4Z" />
    </svg>
  );
}

function WhatsappIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3Z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function useSocialLinks() {
  const store = useStore();
  return [
    { label: 'Discord', href: store.discordUrl, Icon: DiscordIcon },
    { label: 'WhatsApp', href: store.whatsappUrl, Icon: WhatsappIcon },
    { label: 'Instagram', href: store.instagramUrl, Icon: InstagramIcon },
  ].filter((link): link is { label: string; href: string; Icon: typeof DiscordIcon } => Boolean(link.href));
}

/* ── Faixa de aviso no topo ──────────────────────────────────────── */
export function AnnouncementBar() {
  const { announcementText } = useStore();
  if (!announcementText) return null;

  return (
    <div
      className="w-full px-4 py-2 text-center text-xs sm:text-sm font-medium"
      style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}
    >
      {announcementText}
    </div>
  );
}

/* ── Logo + nome ─────────────────────────────────────────────────── */
export function StoreBrand({ className = '' }: { className?: string }) {
  const store = useStore();
  const isGamer = store.theme === 'theme-gamer';

  return (
    <Link href={`/loja/${store.slug}`} className={`flex items-center gap-2.5 min-w-0 shrink-0 ${className}`}>
      {store.logoUrl ? (
        <img src={store.logoUrl} alt="" className="h-8 sm:h-9 w-auto max-w-[120px] object-contain" />
      ) : (
        <span
          aria-hidden
          className="w-8 h-8 flex items-center justify-center font-bold text-sm shrink-0"
          style={{
            background: 'var(--color-brand)',
            color: 'var(--store-on-brand)',
            borderRadius: 'var(--store-radius-sm)',
          }}
        >
          {store.name.charAt(0).toUpperCase()}
        </span>
      )}
      <span
        className={`truncate text-base sm:text-lg leading-none ${
          isGamer ? 'font-black uppercase tracking-[0.08em] italic' : 'font-bold tracking-tight'
        }`}
      >
        {store.name}
      </span>
    </Link>
  );
}

/* ── Campo de busca ──────────────────────────────────────────────── */
export type SearchProps = {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
};

export function StoreSearch({ value, onChange, inputRef, className = '' }: SearchProps & { className?: string }) {
  return (
    <label
      className={`flex items-center gap-2 px-3.5 py-2 border border-[var(--border-color)] bg-[var(--bg-primary)]/60 focus-within:border-[var(--color-brand)] transition-colors ${className}`}
      style={{ borderRadius: 'var(--store-radius-sm)' }}
    >
      <Search className="w-4 h-4 text-[var(--text-secondary)] shrink-0" aria-hidden />
      <span className="sr-only">Buscar produtos</span>
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar produtos"
        className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Limpar busca"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </label>
  );
}

/* ── Cabeçalho: cada template tem o seu formato ──────────────────── */
export function StoreHeader({ search }: { search?: SearchProps }) {
  const store = useStore();

  const searchField = search ? <StoreSearch {...search} className="hidden md:flex w-full max-w-sm" /> : null;
  const account = <StoreCustomerNav storeSlug={store.slug} />;

  if (store.theme === 'theme-glass') {
    // Barra flutuante de vidro
    return (
      <div className="sticky top-0 z-40 px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4">
        <header
          className="store-header max-w-[1400px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3 shadow-2xl"
          style={{ borderRadius: 'var(--store-radius)' }}
        >
          <StoreBrand />
          {searchField}
          {account}
        </header>
      </div>
    );
  }

  if (store.theme === 'theme-gamer') {
    // Barra preta com linha neon na cor da marca
    return (
      <header
        className="sticky top-0 z-40 bg-[var(--header-bg)] backdrop-blur-md border-b-2"
        style={{ borderColor: 'var(--color-brand)', boxShadow: '0 6px 30px -12px var(--color-brand)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <StoreBrand />
          {searchField}
          {account}
        </div>
      </header>
    );
  }

  // Clean Light e Lista Rápida: barra cheia e discreta
  return (
    <header className="sticky top-0 z-40 bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--border-color)]">
      <div
        className={`mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 ${
          store.theme === 'theme-list' ? 'max-w-5xl h-14' : 'max-w-[1280px] h-16'
        }`}
      >
        <StoreBrand />
        {searchField}
        {account}
      </div>
    </header>
  );
}

/* ── Rodapé ──────────────────────────────────────────────────────── */
export function StoreFooter() {
  const store = useStore();
  const socials = useSocialLinks();

  return (
    <footer className="mt-20 border-t border-[var(--border-color)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-start">
        <div className="max-w-md">
          <StoreBrand />
          {store.footerText && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] whitespace-pre-line">{store.footerText}</p>
          )}
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          {socials.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {socials.map(({ label, href, Icon }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-[var(--border-color)] hover:border-[var(--color-brand)] text-[var(--text-primary)] transition-colors"
                    style={{ borderRadius: 'var(--store-radius-sm)' }}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-5">
            <Link
              href={`/loja/${store.slug}/conversas?novo=suporte`}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Falar com a loja
            </Link>
            <Link
              href={`/loja/${store.slug}/minhas-compras`}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Minhas compras
            </Link>
          </div>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-[var(--text-muted)]">
        © {new Date().getFullYear()} {store.name}. Loja criada com NexusCart.
      </p>
    </footer>
  );
}
