import { ERP_URL_METHOD } from '../config/env';

type LoginResult =
  | { ok: true; data: any; cookies?: Record<string, string> }
  | { ok: false; status?: number; message: string; raw?: string; cookies?: Record<string, string> };

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

export const login = async (username: string, password: string): Promise<LoginResult> => {
  try {
    const url = `${ERP_URL_METHOD}/login`;
    console.log('Calling ERPNext login API at:', url);
    console.log('Login payload (sanitized):', { username, pwdLength: password?.length || 0 });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usr: username, pwd: password }),
    });

    const rawText = await response.text();
    console.log('ERPNext login raw response text:', rawText);
    console.log('ERPNext login response status:', response.status);
    console.log('ERPNext login response headers:', Object.fromEntries(response.headers.entries?.() || []));

    const setCookieHeader = response.headers?.get?.('set-cookie') || '';
    const cookies = extractCookies(setCookieHeader);

    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const serverMessage = parseServerMessages(parsed);
      console.error('ERPNext login failed with status:', response.status);
      return {
        ok: false,
        status: response.status,
        message: serverMessage || parsed?.message || parsed?.exception || 'Login failed',
        raw: rawText,
        cookies,
      };
    }

    console.log('ERPNext login response JSON:', parsed);
    return { ok: true, data: parsed, cookies };
  } catch (error: any) {
    console.error('ERPNext login API error:', error.message || error);
    return { ok: false, message: error.message || 'Unexpected error' };
  }
};

const extractCookies = (setCookieHeader: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!setCookieHeader) return result;

  const regex = /(?:^|,)\s*([^=;]+)=([^;]+)/g;
  let match;
  while ((match = regex.exec(setCookieHeader)) !== null) {
    const key = match[1]?.trim();
    const value = match[2]?.trim();
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
};
