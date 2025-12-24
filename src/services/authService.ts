import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMethodUrl } from './urlService';
import { clearSession } from './storage/secureStorage';
import { clearApi } from './api/axiosInstance';

type LoginResult =
  | { ok: true; data: any; cookies?: Record<string, string> }
  | { ok: false; status?: number; message: string; raw?: string; cookies?: Record<string, string> };

const normalizeMethodBase = (base?: string): string => {
  const trimmed = (base || '').trim();
  if (!trimmed) return '';
  if (trimmed.endsWith('/api/method')) return trimmed;
  if (trimmed.endsWith('/api/resource')) return trimmed.replace(/\/api\/resource$/, '/api/method');
  if (trimmed.endsWith('/api')) return `${trimmed}/method`;
  if (trimmed.endsWith('/api/')) return `${trimmed}method`;
  return `${trimmed.replace(/\/+$/, '')}/api/method`;
};

const parseServerMessages = (payload: any): string | undefined => {
  try {
    const messages = payload?._server_messages ? JSON.parse(payload._server_messages) : [];
    if (messages.length) {
      const parsed = JSON.parse(messages[0]);
      return parsed?.message;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

const extractCookies = (setCookieHeader: string): Record<string, string> => {
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

export const login = async (username: string, password: string, companyUrl?: string): Promise<LoginResult> => {
  try {
    const methodBase = companyUrl?.trim() || (await getMethodUrl());
    if (!methodBase) {
      const message = 'ERP method URL is not configured. Please provide a company URL.';
      console.error(message);
      return { ok: false, message };
    }

    const normalizedBase = normalizeMethodBase(methodBase);
    const url = `${normalizedBase}/login`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usr: username, pwd: password }),
    });

    const rawText = await response.text();
    const cookies = extractCookies(response.headers?.get?.('set-cookie') || '');

    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const serverMessage = parseServerMessages(parsed);
      return {
        ok: false,
        status: response.status,
        message: serverMessage || parsed?.message || parsed?.exception || 'Login failed',
        raw: rawText,
        cookies,
      };
    }

    return { ok: true, data: parsed ?? rawText, cookies };
  } catch (error: any) {
    console.error('ERP login error:', error?.message || error);
    return { ok: false, message: error?.message || 'Unexpected error' };
  }
};

export const logout = async (): Promise<{ ok: boolean; message?: string }> => {
  try {
    // Resolve base before clearing storage
    let methodBase = '';
    try {
      methodBase = normalizeMethodBase(await getMethodUrl());
    } catch {
      methodBase = '';
    }

    try {
      if (methodBase) {
        await fetch(`${methodBase}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (err: any) {
      console.warn('logout API call failed (continuing with local cleanup):', err?.message || err);
    }

    try {
      const userId = (await AsyncStorage.getItem('user_id')) || '';
      const userEmail = (await AsyncStorage.getItem('user_email')) || '';
      const derivedKeys = [
        userId ? `employee_id_for_${encodeURIComponent(userId)}` : '',
        userEmail ? `employee_id_for_${encodeURIComponent(userEmail)}` : '',
      ].filter(Boolean) as string[];

      await AsyncStorage.multiRemove([
        'sid',
        'full_name',
        'user_id',
        'user_image',
        'employee_id',
        'roles',
        'company_url',
        'user_email',
        ...derivedKeys,
      ]);

      await clearSession();
      clearApi();
    } catch (err2) {
      console.warn('Error clearing storage during logout:', err2);
    }

    return { ok: true };
  } catch (error: any) {
    console.error('logout error:', error?.message || error);
    return { ok: false, message: error?.message || 'Failed to logout' };
  }
};
