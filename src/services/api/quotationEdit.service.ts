import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getMethodUrl, getResourceUrl } from '../urlService';

type QuotationUpdateInput = {
  name: string;
  fields: Record<string, any>;
  items: any[];
};

type QuotationUpdateResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

const getBases = async () => {
  const baseResource = (await getResourceUrl()) || '';
  const baseMethod = (await getMethodUrl()) || '';
  return { baseResource, baseMethod };
};

const authHeaders = async (): Promise<Record<string, string>> => {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  let sid = '';
  try {
    sid = (await AsyncStorage.getItem('sid')) || '';
  } catch {
    // ignore storage errors
  }

  if (sid) {
    base.Cookie = `sid=${sid}`;
  } else {
    const { apiKey, apiSecret } = getApiKeySecret();
    if (apiKey && apiSecret) base.Authorization = `token ${apiKey}:${apiSecret}`;
  }

  return base;
};

const requestJSON = async <T = any>(url: string, options: RequestInit): Promise<T> => {
  const res = await fetch(url, options);
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const msg =
      json?.message ||
      json?.exception ||
      json?._server_messages ||
      `Request failed with status ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : 'Request failed');
  }

  return (json as T) ?? (text as unknown as T);
};

export const updateQuotation = async (input: QuotationUpdateInput): Promise<QuotationUpdateResult> => {
  const cleaned = String(input?.name || '').trim();
  if (!cleaned) return { ok: false, message: 'Quotation id is required' };
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const { baseResource, baseMethod } = await getBases();

    const doc: Record<string, any> = {
      doctype: 'Quotation',
      name: cleaned,
      ...(input.fields || {}),
      items: input.items || [],
    };

    try {
      if (!baseResource) throw new Error('Resource base not configured');
      const res = await requestJSON<{ data?: any }>(`${baseResource}/Quotation/${encodeURIComponent(cleaned)}`, {
        method: 'PUT',
        headers: await authHeaders(),
        body: JSON.stringify(doc),
      });
      const saved = (res as any)?.data || res;
      if (saved?.name) return { ok: true, data: saved };
    } catch (err1: any) {
      console.warn('updateQuotation resource failed', err1?.message || err1);
    }

    try {
      if (!baseMethod) throw new Error('Method base not configured');
      const res = await requestJSON<{ message?: any }>(`${baseMethod}/frappe.client.save`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ doc }),
      });
      const saved = (res as any)?.message || res;
      if (saved?.name) return { ok: true, data: saved };
    } catch (err2: any) {
      console.error('updateQuotation method failed', err2?.message || err2);
      return { ok: false, message: err2?.message || 'Failed to update quotation' };
    }

    return { ok: false, message: 'Failed to update quotation' };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while updating quotation';
    console.log('Quotation update error:', message);
    return { ok: false, message };
  }
};

export type { QuotationUpdateInput };
