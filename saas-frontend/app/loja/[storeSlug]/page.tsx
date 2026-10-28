import React from 'react';
import { notFound } from 'next/navigation';
import StorefrontCatalog, { Product, TenantInfo } from '../../components/StorefrontCatalog';

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

async function getTenantData(storeSlug: string): Promise<TenantInfo | null> {
  try {
    const tenantRes = await fetch(`${API_BASE}/api/v1/tenants/${storeSlug}`, { cache: 'no-store' });
    if (!tenantRes.ok) return null;
    return tenantRes.json();
  } catch {
    return null;
  }
}

export default async function StorefrontPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;

  const [tenant, products] = await Promise.all([
    getTenantData(storeSlug),
    getStoreData(storeSlug)
  ]);

  if (!products || !tenant) {
    notFound();
  }

  return (
    <StorefrontCatalog
      tenant={tenant}
      initialProducts={products}
      storeSlug={storeSlug}
    />
  );
}
