/**
 * Utilidade centralizada para gerenciar o token JWT.
 * Todas as páginas DEVEM usar estas funções ao invés de acessar localStorage diretamente.
 */

const TOKEN_KEY = 'token';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Wrapper para fetch autenticado. Já adiciona o header Authorization.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
}
