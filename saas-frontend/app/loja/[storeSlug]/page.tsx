import React from 'react';
import { notFound } from 'next/navigation';
import StorefrontCatalog, { Product } from '../../components/StorefrontCatalog';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

async function getStoreData(storeSlug: string): Promise<Product[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/storefront/produtos`, {
      headers: { 'X-Tenant-Slug': storeSlug },
      cache: 'no-store',
    });
    if (res.status === 404 || !res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Os dados da loja (nome, tema, textos) chegam pelo StoreProvider do layout
export default async function StorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  const products = await getStoreData(storeSlug);

  if (!products) {
    notFound();
  }

  return <StorefrontCatalog initialProducts={products} />;
}
