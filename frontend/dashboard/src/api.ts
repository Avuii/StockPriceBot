import type {
  AccountSettings,
  AuthResponse,
  Category,
  CreateProductRequest,
  DashboardStats,
  EmailTestResult,
  PriceHistoryPoint,
  Product,
  ProductDetail,
  UpdateProductRequest,
  User
} from './types';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5080';
const TOKEN_KEY = 'pricestockbot.token';

export class AuthError extends Error {
  constructor() {
    super('Unauthorized');
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const response = await fetch(apiUrl(path), {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers
    },
    ...init
  });

  if (response.status === 401) {
    setToken(null);
    throw new AuthError();
  }

  if (!response.ok) {
    const errorText = await response.text();
    let message = errorText;
    try {
      const parsed = JSON.parse(errorText) as { error?: string; message?: string };
      message = parsed.error ?? parsed.message ?? errorText;
    } catch {
      message = errorText;
    }

    throw new Error(`API ${response.status}: ${message}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function apiUrl(path: string) {
  const normalizedBaseUrl = API_BASE_URL.trim().replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBaseUrl}${normalizedPath}`;
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  register: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),
  resetPassword: (email: string, token: string, password: string) =>
    request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, password })
    }),
  me: () => request<User>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  getSettings: () => request<AccountSettings>('/api/account/settings'),
  updateSettings: (payload: AccountSettings) =>
    request<AccountSettings>('/api/account/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  sendTestEmail: () => request<EmailTestResult>('/api/account/settings/test-email', { method: 'POST' }),
  getStats: () => request<DashboardStats>('/api/dashboard/stats'),
  getProducts: () => request<Product[]>('/api/products'),
  getProduct: (id: string) => request<ProductDetail>(`/api/products/${id}`),
  getHistory: (id: string) => request<PriceHistoryPoint[]>(`/api/products/${id}/history`),
  createProduct: (payload: CreateProductRequest) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateProduct: (id: string, payload: UpdateProductRequest) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteProduct: (id: string) =>
    request<void>(`/api/products/${id}`, {
      method: 'DELETE'
    }),
  checkProduct: (id: string) =>
    request<Product>(`/api/products/${id}/check`, {
      method: 'POST'
    }),
  getCategories: () => request<Category[]>('/api/categories'),
  createCategory: (name: string, iconName?: string, colorHex?: string) =>
    request<Category>('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, iconName, colorHex })
    }),
  updateCategory: (id: string, payload: { name: string; iconName?: string | null; colorHex?: string | null }) =>
    request<Category>(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
  deleteCategory: (id: string, force = false) =>
    request<void>(`/api/categories/${id}?force=${force}`, {
      method: 'DELETE'
    })
};

export type ApiClient = typeof api;
