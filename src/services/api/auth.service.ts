import { createApi, getApi } from './axiosInstance';
import { getMethodUrl } from '../urlService';

const parseCookies = (setCookieHeader?: string | null): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!setCookieHeader) return result;
  const regex = /(?:^|,)\s*([^=;]+)=([^;]+)/g;
  let match;
  while ((match = regex.exec(setCookieHeader)) !== null) {
    const key = match[1]?.trim();
    const value = match[2]?.trim();
    if (key && value) result[key] = value;
  }
  return result;
};

const normalizeMethodBase = (base?: string): string => {
  const trimmed = (base || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.endsWith('/api/method')) return trimmed;
  if (trimmed.endsWith('/api/resource')) return trimmed.replace(/\/api\/resource$/, '/api/method');
  if (trimmed.endsWith('/api')) return `${trimmed}/method`;
  if (trimmed.endsWith('/api/')) return `${trimmed}method`;
  return `${trimmed}/api/method`;
};

export const login = async (companyUrl: string, email: string, password: string) => {
  const directBase = normalizeMethodBase(companyUrl);
  const fallbackBase = normalizeMethodBase(await getMethodUrl());
  const methodBase = directBase || fallbackBase;
  if (!methodBase) throw new Error('ERP URL is not configured. Please enter a company URL.');

  const loginUrl = `${methodBase}/login`;
  console.log('Login URL:', loginUrl);

  // Use form encoding (preferred by ERPNext)
  const form = new URLSearchParams();
  form.append('usr', email);
  form.append('pwd', password);
  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await res.text();
  const cookies = parseCookies(res.headers?.get?.('set-cookie') || '');
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  console.log('Login response status:', res.status);
  console.log('Login response body:', json || text);

  if (!res.ok) {
    const message =
      json?.message ||
      json?.exception ||
      json?._server_messages ||
      `Login failed with status ${res.status}`;
    throw new Error(typeof message === 'string' ? message : 'Login failed');
  }

  // Fetch user profile via method endpoint (avoid resource 417)
  const userRes = await fetch(`${methodBase}/frappe.client.get`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookies.sid ? { Cookie: `sid=${cookies.sid}` } : {}),
    },
    body: JSON.stringify({
      doctype: 'User',
      name: email,
      fields: ['name', 'full_name', 'email', 'user_image'],
    }),
  });
  const userText = await userRes.text();
  let userJson: any = null;
  try {
    userJson = userText ? JSON.parse(userText) : null;
  } catch {
    userJson = null;
  }
  console.log('User fetch response:', userJson || userText);

  const userData = userJson?.message || userJson?.data || userJson || {};
  return { user: userData, cookies, roles: [] };
};

export const logout = async () => {
  const api = getApi();
  await api.post('/logout');
};
