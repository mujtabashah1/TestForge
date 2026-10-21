'use client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
export type User = { id: string; email: string; name: string; role: 'CUSTOMER' | 'ADMIN' };
export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  inventory: number;
  category: string;
};
export type Order = {
  id: string;
  status: string;
  totalCents: number;
  createdAt: string;
  items: Array<{ id: string; productName: string; quantity: number; unitPriceCents: number }>;
  payment: { status: string } | null;
};

export function token() {
  return typeof window === 'undefined' ? null : localStorage.getItem('testforge_token');
}
export function currentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const value = localStorage.getItem('testforge_user');
  return value ? (JSON.parse(value) as User) : null;
}
export function saveSession(value: { token: string; user: User }) {
  localStorage.setItem('testforge_token', value.token);
  localStorage.setItem('testforge_user', JSON.stringify(value.user));
}
export function clearSession() {
  localStorage.removeItem('testforge_token');
  localStorage.removeItem('testforge_user');
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: response.statusText }))) as {
      error?: string;
    };
    throw new Error(body.error ?? 'Request failed');
  }
  return (response.status === 204 ? undefined : response.json()) as Promise<T>;
}
export const money = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
