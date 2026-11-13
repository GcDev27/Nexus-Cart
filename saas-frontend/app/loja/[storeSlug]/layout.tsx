import React, { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  Inter, Roboto, Playfair_Display, Poppins,
  Nunito, Raleway, Montserrat, Space_Grotesk
} from "next/font/google";
import { StoreProvider, StoreTenant, StoreTheme } from '../../components/store/StoreContext';
import StorePausedGate from '../../components/store/StorePausedGate';

const inter = Inter({ subsets: ['latin'] });
const roboto = Roboto({ weight: ['300', '400', '500', '700'], subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });
const poppins = Poppins({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'] });
const nunito = Nunito({ subsets: ['latin'] });
const raleway = Raleway({ subsets: ['latin'] });
const montserrat = Montserrat({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

const THEMES: StoreTheme[] = ['theme-glass', 'theme-light', 'theme-gamer', 'theme-list'];

// Raio dos cards (e dos botões, um pouco menor) para cada estilo de cantos
const RADIUS: Record<string, { card: string; control: string }> = {
  rounded: { card: '20px', control: '12px' },
  soft: { card: '10px', control: '8px' },
  sharp: { card: '2px', control: '2px' },
};

// cache(): o layout e o generateMetadata compartilham a mesma busca por requisição
const getTenantData = cache(async (slug: string) => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/tenants/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
});

// A aba do navegador mostra o nome da loja, não o da plataforma
export async function generateMetadata({ params }: { params: Promise<{ storeSlug: string }> }): Promise<Metadata> {
  const { storeSlug } = await params;
  const tenant = await getTenantData(storeSlug);
  if (!tenant) return {};
  return {
    title: tenant.name,
    description: tenant.heroDescription || undefined,
    icons: tenant.logoUrl?.startsWith('https://') ? { icon: tenant.logoUrl } : undefined,
  };
}

// Texto preto ou branco sobre a cor da marca, o que tiver mais contraste
function readableTextOn(hex: string): string {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return '#ffffff';
  const n = parseInt(match[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return luminance > 0.45 ? '#111111' : '#ffffff';
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  const tenant = await getTenantData(storeSlug);

  if (!tenant) {
    notFound();
  }

  const theme: StoreTheme = THEMES.includes(tenant.theme) ? tenant.theme : 'theme-glass';
  const primaryColor = /^#[0-9a-f]{6}$/i.test(tenant.primaryColor || '') ? tenant.primaryColor : '#8b5cf6';
  const radius = RADIUS[tenant.cornerStyle] || RADIUS.rounded;

  // Mapeia nome da fonte para a className do Next.js font
  const fontMap: Record<string, string> = {
    'Inter': inter.className,
    'Roboto': roboto.className,
    'Playfair Display': playfair.className,
    'Poppins': poppins.className,
    'Nunito': nunito.className,
    'Raleway': raleway.className,
    'Montserrat': montserrat.className,
    'Space Grotesk': spaceGrotesk.className,
  };

  const fontClass = fontMap[tenant.font] || inter.className;

  const store: StoreTenant = { ...tenant, slug: storeSlug, theme, primaryColor };

  return (
    <div
      className={`${theme} ${fontClass} min-h-screen`}
      style={{
        '--store-primary-color': primaryColor,
        '--store-on-brand': readableTextOn(primaryColor),
        '--store-radius': radius.card,
        '--store-radius-sm': radius.control,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
      } as React.CSSProperties}
    >
      <StoreProvider tenant={store}>
        <StorePausedGate open={tenant.storeOpen !== false} storeSlug={storeSlug} storeName={tenant.name}>
          {children}
        </StorePausedGate>
      </StoreProvider>
    </div>
  );
}
