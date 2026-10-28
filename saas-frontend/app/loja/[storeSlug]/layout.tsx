import React from 'react';
import { notFound } from 'next/navigation';
import { 
  Inter, Roboto, Playfair_Display, Poppins, 
  Nunito, Raleway, Montserrat, Space_Grotesk 
} from "next/font/google";

const inter = Inter({ subsets: ['latin'] });
const roboto = Roboto({ weight: ['300', '400', '500', '700'], subsets: ['latin'] });
const playfair = Playfair_Display({ subsets: ['latin'] });
const poppins = Poppins({ weight: ['300', '400', '500', '600', '700'], subsets: ['latin'] });
const nunito = Nunito({ subsets: ['latin'] });
const raleway = Raleway({ subsets: ['latin'] });
const montserrat = Montserrat({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'] });

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getTenantData(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/tenants/${slug}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
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

  const themeClass = tenant.theme || 'theme-glass';
  const primaryColor = tenant.primaryColor || '#8b5cf6';
  
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

  return (
    <div
      className={`${themeClass} ${fontClass} min-h-screen`} 
      style={{
        '--store-primary-color': primaryColor,
        backgroundColor: 'var(--bg-primary)',
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
