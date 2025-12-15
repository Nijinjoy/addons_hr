import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

type Lead = {
  name: string;
  lead_name?: string;
  company_name?: string;
  status?: string;
  email_id?: string;
  phone?: string;
  mobile_no?: string;
  source?: string;
  creation?: string;
  job_title?: string;
  gender?: string;
  lead_type?: string;
  request_type?: string;
  service_type?: string;
  whatsapp?: string;
  building?: string;
  location?: string;
  territory?: string;
  no_of_employees?: string | number;
  industry?: string;
  owner?: string;
  associate_details?: string;
};

type LeadResult =
  | { ok: true; data: Lead[] }
  | { ok: false; message: string; status?: number; raw?: string };

const pick = (...values: (string | undefined | null)[]): string => {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
};

const BASE_URL = (
  pick(Config.ERP_URL_RESOURCE, process.env?.ERP_URL_RESOURCE) ||
  'https://addonsajith.frappe.cloud/api/resource'
).replace(/\/$/, '');

const deriveMethodFromResource = (resourceUrl: string): string => {
  const clean = (resourceUrl || '').replace(/\/$/, '');
  if (!clean) return '';
  if (clean.endsWith('/api/resource')) {
    return clean.replace(/\/api\/resource$/, '/api/method');
  }
  return `${clean}/api/method`;
};

const METHOD_URL = (
  pick(Config.ERP_URL_METHOD, process.env?.ERP_URL_METHOD) ||
  deriveMethodFromResource(BASE_URL) ||
  'https://addonsajith.frappe.cloud/api/method'
).replace(/\/$/, '');

const API_KEY = pick(Config.ERP_APIKEY, process.env?.ERP_APIKEY);
const API_SECRET = pick(Config.ERP_SECRET, process.env?.ERP_SECRET);

const authHeaders = async (): Promise<Record<string, string>> => {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (API_KEY && API_SECRET) base.Authorization = `token ${API_KEY}:${API_SECRET}`;
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

const buildQuery = (url: string, params: Record<string, string | number | undefined>): string => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
};

const normalizeLeads = (rows: any[]): Lead[] => {
  return (rows || []).map((r) => ({
    name: String(r.name || ''),
    lead_name: r.lead_name,
    company_name: r.company_name,
    status: r.status,
    email_id: r.email_id,
    phone: r.phone,
    mobile_no: r.mobile_no,
    source: r.source,
    creation: r.creation,
    job_title: (r as any)?.job_title,
    gender: (r as any)?.gender,
    lead_type: (r as any)?.lead_type,
    request_type: (r as any)?.request_type,
    service_type: (r as any)?.service_type,
    whatsapp: (r as any)?.whatsapp,
    building: (r as any)?.building,
    location: (r as any)?.location,
    territory: (r as any)?.territory,
    no_of_employees: (r as any)?.no_of_employees ?? (r as any)?.number_of_employees,
    industry: (r as any)?.industry,
    owner: (r as any)?.owner,
    associate_details: (r as any)?.associate_details,
  }));
};

export const fetchLeads = async (limit: number = 50): Promise<Lead[]> => {
  // Try resource
  try {
    const url = buildQuery(`${BASE_URL}/Lead`, {
      fields: JSON.stringify([
        'name',
        'lead_name',
        'company_name',
        'status',
        'email_id',
        'phone',
        'mobile_no',
        'source',
        'creation',
      ]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeads(res?.data ?? []);
  } catch (err1: any) {
    console.warn('fetchLeads resource failed', err1?.message || err1);
  }

  // Fallback to method
  try {
    const url = buildQuery(`${METHOD_URL}/frappe.client.get_list`, {
      doctype: 'Lead',
      fields: JSON.stringify([
        'name',
        'lead_name',
        'company_name',
        'status',
        'email_id',
        'phone',
        'mobile_no',
        'source',
        'creation',
        'job_title',
        'gender',
        'lead_type',
        'request_type',
        'service_type',
        'whatsapp',
        'building',
        'location',
        'territory',
        'no_of_employees',
        'number_of_employees',
        'industry',
        'owner',
        'associate_details',
      ]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeads(res?.message ?? []);
  } catch (err2: any) {
    console.error('fetchLeads method failed', err2?.message || err2);
    return [];
  }
};

export const getLeads = async (limit: number = 50): Promise<LeadResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const data = await fetchLeads(limit);
    return { ok: true, data };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching leads';
    console.log('Leads fetch error:', message);
    return { ok: false, message };
  }
};

export type { Lead };
