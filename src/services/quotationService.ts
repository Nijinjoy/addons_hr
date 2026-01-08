import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getMethodUrl, getResourceUrl } from './urlService';

type Quotation = {
  name: string;
  party_name?: string;
  quotation_to?: string;
  status?: string;
  grand_total?: number;
  currency?: string;
  transaction_date?: string;
  valid_till?: string;
  modified?: string;
};

type QuotationListParams = {
  limit?: number;
  status?: string;
};

type QuotationResult =
  | { ok: true; data: Quotation[] }
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

const buildQuery = (url: string, params: Record<string, string | number | undefined>): string => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
};

const normalizeQuotations = (rows: any[]): Quotation[] => {
  return (rows || []).map((r) => ({
    name: String(r.name || ''),
    party_name: (r as any)?.party_name,
    quotation_to: (r as any)?.quotation_to,
    status: (r as any)?.status,
    grand_total: (r as any)?.grand_total ?? (r as any)?.total,
    currency: (r as any)?.currency,
    transaction_date: (r as any)?.transaction_date,
    valid_till: (r as any)?.valid_till,
    modified: (r as any)?.modified,
  }));
};

const fetchQuotations = async (params: QuotationListParams): Promise<Quotation[]> => {
  const { limit = 50, status } = params;
  const filters: any[] = [];
  if (status) filters.push(['status', '=', status]);
  const { baseResource, baseMethod } = await getBases();

  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/Quotation`, {
      fields: JSON.stringify([
        'name',
        'party_name',
        'quotation_to',
        'status',
        'grand_total',
        'currency',
        'transaction_date',
        'valid_till',
        'modified',
      ]),
      order_by: 'modified desc',
      limit_page_length: limit,
      filters: filters.length ? JSON.stringify(filters) : undefined,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const data = normalizeQuotations(res?.data ?? []);
    if (data.length) return data;
  } catch (err1: any) {
    console.warn('fetchQuotations resource failed', err1?.message || err1);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Quotation',
      fields: JSON.stringify([
        'name',
        'party_name',
        'quotation_to',
        'status',
        'grand_total',
        'currency',
        'transaction_date',
        'valid_till',
        'modified',
      ]),
      order_by: 'modified desc',
      limit_page_length: limit,
      filters: filters.length ? JSON.stringify(filters) : undefined,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeQuotations(res?.message ?? []);
  } catch (err2: any) {
    console.error('fetchQuotations method failed', err2?.message || err2);
    return [];
  }
};

export const getQuotations = async (params: QuotationListParams = {}): Promise<QuotationResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const data = await fetchQuotations(params);
    return { ok: true, data };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching quotations';
    console.log('Quotation fetch error:', message);
    return { ok: false, message };
  }
};

export type { Quotation, QuotationListParams };
