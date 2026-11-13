'use client';

import { useEffect, useState } from 'react';
import { authFetch } from './auth';

export type PlanId = 'STARTER' | 'SUPER' | 'RICH';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

export interface Subscription {
  plan: PlanId;
  planLabel: string;
  monthlyPrice: number;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  paidUntil: string | null;
  storeOpen: boolean;
  hasSubscription: boolean;
  customDesign: boolean;
  salesDashboard: boolean;
  billingAvailable: boolean;
  invoiceUrl: string | null;
}

// Mesmos planos e preços da landing (PricingSection)
export const PLANS: { id: PlanId; name: string; price: number; perks: string[] }[] = [
  { id: 'STARTER', name: 'Starter', price: 20, perks: ['Loja com entrega automática', 'Pix pelo seu Mercado Pago', 'Produtos e chaves sem limite'] },
  { id: 'SUPER', name: 'Super', price: 40, perks: ['Tudo do Starter', 'Tema, cores, fontes, logo e capa', 'Painel de vendas com gráficos'] },
  { id: 'RICH', name: 'Rich', price: 70, perks: ['Tudo do Super', 'Suporte prioritário pelo WhatsApp'] },
];

/** Dias inteiros que faltam até a data (0 se já passou). */
export function daysUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export async function fetchSubscription(): Promise<Subscription | null> {
  try {
    const res = await authFetch('/api/admin/assinatura');
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

/** Plano da loja do lojista logado. `null` enquanto carrega ou se a API falhar. */
export function useSubscription(deps: unknown[] = []) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  useEffect(() => {
    let alive = true;
    fetchSubscription().then(s => alive && setSubscription(s));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return subscription;
}
