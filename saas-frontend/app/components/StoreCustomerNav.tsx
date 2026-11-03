'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { customerFetch, getStoreCustomerData, removeCustomerSession, CustomerData } from '../lib/customerAuth';
import { useStore } from './store/StoreContext';
import { ShoppingBag, User, LogOut, ChevronDown, MessageCircle } from 'lucide-react';

// Usa as variáveis do tema da loja para funcionar tanto nos temas escuros quanto no claro
export default function StoreCustomerNav({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const store = useStore();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessão só existe no navegador
    setMounted(true);
    const data = getStoreCustomerData(store.id);
    setCustomer(data);
    // Mensagens da loja ainda não lidas (aparece como bolinha no botão da conta)
    if (data) {
      customerFetch('/api/storefront/customer/chats/unread', {}, storeSlug)
        .then((res) => (res.ok ? res.json() : null))
        .then((body) => body && setUnread(body.unread))
        .catch(() => {});
    }
  }, [store.id, storeSlug]);

  const handleLogout = () => {
    removeCustomerSession();
    setCustomer(null);
    setMenuOpen(false);
    router.refresh();
  };

  if (!mounted) {
    return <div className="h-9 w-28 bg-[var(--surface-hover)] animate-pulse" style={{ borderRadius: 'var(--store-radius-sm)' }} />;
  }

  if (!customer) {
    return (
      <Link
        href={`/loja/${storeSlug}/login`}
        className="flex items-center gap-2 shrink-0 text-sm font-semibold px-4 py-2 hover:brightness-110 transition-all"
        style={{
          background: 'var(--color-brand)',
          color: 'var(--store-on-brand)',
          borderRadius: 'var(--store-radius-sm)',
        }}
      >
        <User className="w-4 h-4" />
        <span className="hidden sm:inline">Entrar</span>
      </Link>
    );
  }

  const firstName = customer.name?.split(' ')[0] || 'Cliente';

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        aria-expanded={menuOpen}
        className="flex items-center gap-2.5 bg-[var(--surface-hover)] border border-[var(--border-color)] hover:border-[var(--border-hover)] py-1.5 pl-2 pr-3 text-sm font-medium transition-colors"
        style={{ borderRadius: 'var(--store-radius-sm)' }}
      >
        <span
          className="relative w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold"
          style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}
        >
          {firstName.charAt(0).toUpperCase()}
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-[var(--bg-primary)]">
              <span className="sr-only">{unread} mensagens não lidas</span>
            </span>
          )}
        </span>
        <span className="text-[var(--text-primary)] text-xs sm:text-sm">{firstName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-56 bg-[var(--bg-popover)] border border-[var(--border-color)] shadow-2xl py-2 z-50 backdrop-blur-xl"
            style={{ borderRadius: 'var(--store-radius-sm)' }}
          >
            <div className="px-4 py-2.5 border-b border-[var(--border-color)]">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{customer.name}</p>
              <p className="text-[11px] text-[var(--text-secondary)] truncate">{customer.email}</p>
            </div>

            <Link
              href={`/loja/${storeSlug}/minhas-compras`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[var(--color-brand)]" />
              Minhas compras
            </Link>

            <Link
              href={`/loja/${storeSlug}/conversas`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[var(--color-brand)]" />
              <span className="flex-1">Conversas</span>
              {unread > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-bold flex items-center justify-center" style={{ background: 'var(--color-brand)', color: 'var(--store-on-brand)' }}>
                  {unread}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </>
      )}
    </div>
  );
}
