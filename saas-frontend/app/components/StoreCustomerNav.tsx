'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCustomerData, removeCustomerSession, CustomerData } from '../lib/customerAuth';
import { ShoppingBag, User, LogOut, ChevronDown } from 'lucide-react';

export default function StoreCustomerNav({ storeSlug }: { storeSlug: string }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCustomer(getCustomerData());
  }, []);

  const handleLogout = () => {
    removeCustomerSession();
    setCustomer(null);
    setMenuOpen(false);
    router.refresh();
  };

  if (!mounted) {
    return (
      <div className="h-9 w-28 bg-white/5 rounded-full animate-pulse" />
    );
  }

  if (!customer) {
    return (
      <Link
        href={`/loja/${storeSlug}/login`}
        className="flex items-center gap-2 bg-[var(--color-brand)] text-white text-sm font-semibold px-4 py-2 rounded-full hover:brightness-110 transition-all shadow-lg shadow-[var(--color-brand)]/20"
      >
        <User className="w-4 h-4" />
        <span>Minhas Compras</span>
      </Link>
    );
  }

  const firstName = customer.name?.split(' ')[0] || 'Cliente';

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full py-1.5 pl-2 pr-3.5 text-sm font-medium transition-all"
      >
        <div className="w-6 h-6 rounded-full bg-[var(--color-brand)] text-white text-xs flex items-center justify-center font-bold">
          {firstName.charAt(0).toUpperCase()}
        </div>
        <span className="text-white/90 text-xs sm:text-sm font-medium">{firstName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-white/50" />
      </button>

      {menuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setMenuOpen(false)} 
          />
          <div className="absolute right-0 mt-2 w-56 bg-[#16161a] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-2.5 border-b border-white/5">
              <p className="text-xs font-semibold text-white truncate">{customer.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{customer.email}</p>
            </div>

            <Link
              href={`/loja/${storeSlug}/minhas-compras`}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-[var(--color-brand)]" />
              <span>Minhas Compras</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
