/**
 * Utilidades para autenticação e sessão do COMPRADOR (Customer) na loja.
 * Totalmente isolado da sessão do Lojista/Admin.
 */

const CUSTOMER_TOKEN_KEY = 'customer_token';
const CUSTOMER_DATA_KEY = 'customer_data';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export interface CustomerData {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  cpf?: string;
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(CUSTOMER_TOKEN_KEY);
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
}

export function getCustomerData(): CustomerData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CUSTOMER_DATA_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CustomerData;
  } catch {
    return null;
  }
}

export function setCustomerSession(token: string, customer: CustomerData): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
  localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(customer));
}

export function removeCustomerSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_DATA_KEY);
}

/**
 * Fetch autenticado para o portal do comprador.
 */
export async function customerFetch(
  path: string,
  options: RequestInit = {},
  storeSlug?: string
): Promise<Response> {
  const token = getCustomerToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (storeSlug) {
    headers['X-Tenant-Slug'] = storeSlug;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
