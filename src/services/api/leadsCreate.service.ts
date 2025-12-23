import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getMethodUrl, getResourceUrl } from '../urlService';

export type CreateLeadPayload = {
  lead_name: string;
  gender?: string;
  job_title?: string;
  source?: string;
  associate_details?: string;
  building?: string;
  lead_owner?: string;
  status?: string;
  lead_type?: string;
  request_type?: string;
  service_type?: string;
  email_id?: string;
  mobile_no?: string;
  phone?: string;
  website?: string;
  whatsapp?: string;
  date?: string; // YYYY-MM-DD
  custom_date?: string; // YYYY-MM-DD (custom field)
  custom_building__location?: string;
};

export type CreateLeadResult =
  | { ok: true; name: string; lead: any }
  | { ok: false; message: string };

const clean = (value?: string | null) => (value || '').trim().replace(/\/+$/, '');

const normalizeResourceBase = (base?: string): string => {
  const trimmed = clean(base);
  if (!trimmed) return '';
  if (trimmed.endsWith('/api/resource')) return trimmed;
  if (trimmed.endsWith('/api/method')) return trimmed.replace(/\/api\/method$/, '/api/resource');
  if (trimmed.endsWith('/api')) return `${trimmed}/resource`;
  if (trimmed.endsWith('/api/')) return `${trimmed}resource`;
  return `${trimmed}/api/resource`;
};

const normalizeMethodBase = (base?: string): string => {
  const trimmed = clean(base);
  if (!trimmed) return '';
  if (trimmed.endsWith('/api/method')) return trimmed;
  if (trimmed.endsWith('/api/resource')) return trimmed.replace(/\/api\/resource$/, '/api/method');
  if (trimmed.endsWith('/api')) return `${trimmed}/method`;
  if (trimmed.endsWith('/api/')) return `${trimmed}method`;
  return `${trimmed}/api/method`;
};

const authHeaders = async (): Promise<Record<string, string>> => {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  const { apiKey, apiSecret } = getApiKeySecret();
  if (apiKey && apiSecret) base.Authorization = `token ${apiKey}:${apiSecret}`;
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (sid) base.Cookie = `sid=${sid}`;
  } catch {
    // ignore storage errors
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

const cleanErrorMessage = (raw?: string) => {
  if (!raw) return '';
  const plain = raw.replace(/<[^>]+>/g, '');
  if (/Email Address must be unique/i.test(plain)) {
    return 'Email Address must be unique. Please use a different email or leave it blank.';
  }
  return plain;
};

const pruneEmpty = (obj: Record<string, any>) => {
  const cleaned: Record<string, any> = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (val === undefined || val === null) return;
    if (typeof val === 'string' && val.trim() === '') return;
    cleaned[key] = val;
  });
  return cleaned;
};

export const createLead = async (
  payload: CreateLeadPayload,
  companyUrl?: string
): Promise<CreateLeadResult> => {
  if (!payload.lead_name?.trim()) {
    return { ok: false, message: 'Lead name is required' };
  }

  const baseResource =
    normalizeResourceBase(companyUrl) || normalizeResourceBase(await getResourceUrl());
  const baseMethod = normalizeMethodBase(companyUrl) || normalizeMethodBase(await getMethodUrl());

  if (!baseResource && !baseMethod) {
    return { ok: false, message: 'ERP URLs not configured' };
  }

  const body = pruneEmpty({
    doctype: 'Lead',
    lead_name: payload.lead_name,
    gender: payload.gender,
    job_title: payload.job_title,
    source: payload.source,
    associate_details: payload.associate_details,
    building: payload.building,
    custom_building__location: payload.custom_building__location || payload.building,
    lead_owner: payload.lead_owner,
    status: payload.status,
    lead_type: payload.lead_type,
    request_type: payload.request_type,
    service_type: payload.service_type,
    email_id: payload.email_id,
    mobile_no: payload.mobile_no,
    phone: payload.phone,
    website: payload.website,
    whatsapp: payload.whatsapp,
    date: payload.date,
    custom_date: payload.custom_date || payload.date,
  });

  // Try resource endpoint first
  if (baseResource) {
    try {
      const res = await requestJSON<{ data?: any }>(`${baseResource}/Lead`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(body),
      });
      const doc = (res as any)?.data || (res as any);
      if (doc?.name) return { ok: true, name: doc.name, lead: doc };
    } catch (err: any) {
      const message = cleanErrorMessage(err?.message || err);
      console.log('Create lead via resource failed:', message);
      // fall through to method call
    }
  }

  // Fallback to method insert
  if (baseMethod) {
    try {
      const res = await requestJSON<{ message?: any }>(`${baseMethod}/frappe.client.insert`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ doc: body }),
      });
      const doc = (res as any)?.message || (res as any);
      if (doc?.name) return { ok: true, name: doc.name, lead: doc };
    } catch (err: any) {
      const message = cleanErrorMessage(err?.message || err);
      console.log('Create lead via method failed:', message);
      return { ok: false, message: message || 'Lead creation failed' };
    }
  }

  return { ok: false, message: 'Lead creation failed' };
};
