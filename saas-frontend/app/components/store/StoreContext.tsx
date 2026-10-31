'use client';

import React, { createContext, useContext } from 'react';

export type StoreTheme = 'theme-glass' | 'theme-light' | 'theme-gamer' | 'theme-list';

export type StoreTenant = {
  id?: string;
  name: string;
  slug: string;
  theme: StoreTheme;
  primaryColor: string;
  font?: string;
  cornerStyle?: 'rounded' | 'soft' | 'sharp';
  heroTitle?: string;
  heroDescription?: string;
  announcementText?: string | null;
  footerText?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  discordUrl?: string | null;
  whatsappUrl?: string | null;
  instagramUrl?: string | null;
};

const StoreContext = createContext<StoreTenant | null>(null);

export function StoreProvider({ tenant, children }: { tenant: StoreTenant; children: React.ReactNode }) {
  return <StoreContext.Provider value={tenant}>{children}</StoreContext.Provider>;
}

// Dados da loja atual, disponíveis em qualquer página dentro de /loja/[storeSlug]
export function useStore(): StoreTenant {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore precisa estar dentro de <StoreProvider>');
  return store;
}

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
