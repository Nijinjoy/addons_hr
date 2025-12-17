import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getMethodUrl, getResourceUrl } from './urlService';

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

type LeadSourceResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string };

type AssociateDetailsResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string };

const getBases = async () => {
  const baseResource = (await getResourceUrl()) || '';
  const baseMethod = (await getMethodUrl()) || '';
  return { baseResource, baseMethod };
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
  const { baseResource, baseMethod } = await getBases();
  // Try resource
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/Lead`, {
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
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
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

const normalizeLeadSources = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const name =
      (typeof row?.name === 'string' && row.name.trim()) ||
      (typeof row?.source_name === 'string' && row.source_name.trim()) ||
      '';
    if (name) deduped.add(name);
  });
  return Array.from(deduped);
};

const fetchLeadSources = async (limit: number = 100): Promise<string[]> => {
  const doc = 'Lead Source';
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
      fields: JSON.stringify(['name', 'source_name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeadSources(res?.data ?? []);
  } catch (err1: any) {
    console.warn('fetchLeadSources resource failed', err1?.message || err1);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: doc,
      fields: JSON.stringify(['name', 'source_name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeadSources(res?.message ?? []);
  } catch (err2: any) {
    console.error('fetchLeadSources method failed', err2?.message || err2);
    return [];
  }
};

export const getLeadSources = async (limit: number = 100): Promise<LeadSourceResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const data = await fetchLeadSources(limit);
    return { ok: true, data };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching lead sources';
    console.log('Lead sources fetch error:', message);
    return { ok: false, message };
  }
};

const normalizeAssociateDetails = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const name =
      (typeof row?.name === 'string' && row.name.trim()) ||
      (typeof row?.associate_name === 'string' && row.associate_name.trim()) ||
      (typeof row?.associate_details === 'string' && row.associate_details.trim()) ||
      '';
    if (name) deduped.add(name);
  });
  return Array.from(deduped);
};

const fetchAssociateDetailsFromDoc = async (doc: string, limit: number): Promise<string[]> => {
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
      fields: JSON.stringify(['name', 'associate_name', 'associate_details']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAssociateDetails(res?.data ?? []);
  } catch (err1: any) {
    console.warn(`fetchAssociateDetails resource failed for ${doc}`, err1?.message || err1);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: doc,
      fields: JSON.stringify(['name', 'associate_name', 'associate_details']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAssociateDetails(res?.message ?? []);
  } catch (err2: any) {
    console.error(`fetchAssociateDetails method failed for ${doc}`, err2?.message || err2);
    return [];
  }
};

export const getAssociateDetails = async (
  limit: number = 100
): Promise<AssociateDetailsResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const docCandidates = ['Associate Details', 'Associate'];
    for (const doc of docCandidates) {
      const data = await fetchAssociateDetailsFromDoc(doc, limit);
      if (data.length) return { ok: true, data };
    }

    // Fallback: derive from existing leads if no dedicated doctype exists
    const leads = await fetchLeads(limit);
    const data = normalizeAssociateDetails(leads || []);
    return { ok: true, data };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching associate details';
    console.log('Associate details fetch error:', message);
    return { ok: false, message };
  }
};

export type { Lead };
