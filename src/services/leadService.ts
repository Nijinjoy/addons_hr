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
type ServiceTypeResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string };
type RequestTypeResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string };
type LeadTypeResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string };
type LeadStatusResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string };
type LeadOwnerOption = { label: string; value: string };
type LeadOwnerResult =
  | { ok: true; data: LeadOwnerOption[] }
  | { ok: false; message: string };
type BuildingLocationResult =
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

const normalizeLeadOwners = (rows: any[]): LeadOwnerOption[] => {
  const deduped = new Map<string, string>(); // value -> label
  (rows || []).forEach((row) => {
    const value =
      (typeof row?.name === 'string' && row.name.trim()) ||
      (typeof row?.owner === 'string' && row.owner.trim()) ||
      (typeof row?.lead_owner === 'string' && row.lead_owner.trim()) ||
      '';
    if (!value || !/[@.]/.test(value)) return; // skip non-user identifiers like plain names
    const fullName =
      (typeof row?.full_name === 'string' && row.full_name.trim()) ||
      (typeof row?.first_name === 'string' && row.first_name.trim()) ||
      '';
    if (!value) return;
    const label = fullName && fullName !== value ? `${fullName} (${value})` : value;
    if (!deduped.has(value)) deduped.set(value, label);
  });
  return Array.from(deduped.entries()).map(([value, label]) => ({ value, label }));
};

const normalizeServiceTypes = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const serviceName =
      (typeof row?.service_type === 'string' && row.service_type.trim()) ||
      (typeof row?.service_type_name === 'string' && row.service_type_name.trim()) ||
      (typeof row?.service_name === 'string' && row.service_name.trim()) ||
      (typeof row?.service === 'string' && row.service.trim()) ||
      '';
    const name = (typeof row?.name === 'string' && row.name.trim()) || '';
    const candidate =
      serviceName ||
      (name && !/^CRM-LEAD-/i.test(name) ? name : ''); // avoid lead IDs when falling back
    if (candidate) deduped.add(candidate);
  });
  return Array.from(deduped);
};

const normalizeRequestTypes = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const requestName =
      (typeof row?.request_type === 'string' && row.request_type.trim()) ||
      (typeof row?.request_type_name === 'string' && row.request_type_name.trim()) ||
      (typeof row?.request_name === 'string' && row.request_name.trim()) ||
      '';
    const name = (typeof row?.name === 'string' && row.name.trim()) || '';
    const candidate = requestName || (name && !/^CRM-LEAD-/i.test(name) ? name : '');
    if (candidate) deduped.add(candidate);
  });
  return Array.from(deduped);
};

const normalizeLeadTypes = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const leadType =
      (typeof row?.lead_type === 'string' && row.lead_type.trim()) ||
      (typeof row?.lead_type_name === 'string' && row.lead_type_name.trim()) ||
      (typeof row?.leadname === 'string' && row.leadname.trim()) ||
      '';
    const name = (typeof row?.name === 'string' && row.name.trim()) || '';
    const candidate = leadType || (name && !/^CRM-LEAD-/i.test(name) ? name : '');
    if (candidate) deduped.add(candidate);
  });
  return Array.from(deduped);
};

const normalizeStatuses = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const status =
      (typeof row?.status === 'string' && row.status.trim()) ||
      (typeof row?.lead_status === 'string' && row.lead_status.trim()) ||
      '';
    const name = (typeof row?.name === 'string' && row.name.trim()) || '';
    const candidate = status || (name && !/^CRM-LEAD-/i.test(name) ? name : '');
    if (candidate) deduped.add(candidate);
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

const fetchServiceTypes = async (limit: number = 100): Promise<string[]> => {
  const doc = 'Service Type';
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
      fields: JSON.stringify(['name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeServiceTypes(res?.data ?? []);
  } catch (err1: any) {
    console.warn('fetchServiceTypes resource failed', err1?.message || err1);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: doc,
      fields: JSON.stringify(['name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeServiceTypes(res?.message ?? []);
  } catch (err2: any) {
    console.error('fetchServiceTypes method failed', err2?.message || err2);
    return [];
  }
};

export const getServiceTypes = async (limit: number = 100): Promise<ServiceTypeResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const data = await fetchServiceTypes(limit);
    if (data.length) return { ok: true, data };

    // Fallback: derive from existing leads if no dedicated doctype exists
    const leads = await fetchLeads(limit);
    const derived = normalizeServiceTypes(leads || []);
    return { ok: true, data: derived };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching service types';
    console.log('Service types fetch error:', message);
    return { ok: false, message };
  }
};

const fetchRequestTypes = async (limit: number = 100): Promise<string[]> => {
  const doc = 'Request Type';
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
      fields: JSON.stringify(['name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeRequestTypes(res?.data ?? []);
  } catch (err1: any) {
    const msg = err1?.message || err1;
    const printable = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (/DocType .*not found/i.test(String(printable))) {
      return [];
    }
    console.warn('fetchRequestTypes resource failed', printable);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: doc,
      fields: JSON.stringify(['name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeRequestTypes(res?.message ?? []);
  } catch (err2: any) {
    const msg = err2?.message || err2;
    const printable = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (/DocType .*not found/i.test(String(printable))) {
      return [];
    }
    console.error('fetchRequestTypes method failed', printable);
    return [];
  }
};

const fetchLeadsForRequestType = async (limit: number = 100): Promise<any[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Lead',
      fields: JSON.stringify([
        'name',
        'request_type',
        'source',
      ]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return res?.message ?? [];
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('fetchLeadsForRequestType failed', msg);
    return [];
  }
};

const fetchRequestTypesFromMeta = async (): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const url = buildQuery(`${baseMethod}/frappe.desk.form.load.getdoctype`, { doctype: 'Lead' });
    const res = await requestJSON<{ docs?: any[]; doc?: any }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const doc = (res as any)?.docs?.[0] || (res as any)?.doc;
    const fields = doc?.fields || [];
    const requestField = fields.find((f: any) => f.fieldname === 'request_type');
    const opts = typeof requestField?.options === 'string' ? requestField.options : '';
    if (!opts) return [];
    return opts
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);
  } catch (err) {
    const msg = (err as any)?.message || err;
    console.warn('fetchRequestTypesFromMeta failed', msg);
    return [];
  }
};

export const getRequestTypes = async (limit: number = 100): Promise<RequestTypeResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const data = await fetchRequestTypes(limit);
    if (data.length) return { ok: true, data };

    const leads = await fetchLeadsForRequestType(limit);
    const derived = normalizeRequestTypes(leads || []);
    if (derived.length) return { ok: true, data: derived };

    const metaOptions = await fetchRequestTypesFromMeta();
    return { ok: true, data: metaOptions };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching request types';
    console.log('Request types fetch error:', message);
    return { ok: false, message };
  }
};

const fetchLeadTypes = async (limit: number = 100): Promise<string[]> => {
  const doc = 'Lead Type';
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
      fields: JSON.stringify(['name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeadTypes(res?.data ?? []);
  } catch (err1: any) {
    const msg = err1?.message || err1;
    const printable = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (/DocType .*not found/i.test(String(printable))) {
      return [];
    }
    console.warn('fetchLeadTypes resource failed', printable);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: doc,
      fields: JSON.stringify(['name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeadTypes(res?.message ?? []);
  } catch (err2: any) {
    const msg = err2?.message || err2;
    const printable = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (/DocType .*not found/i.test(String(printable))) {
      return [];
    }
    console.error('fetchLeadTypes method failed', printable);
    return [];
  }
};

const fetchLeadTypesViaSearch = async (limit: number = 100): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const res = await requestJSON<{ message?: { value?: string }[] }>(
      `${baseMethod}/frappe.desk.search.search_link`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          doctype: 'Lead Type',
          txt: '',
          page_length: limit,
        }),
      },
    );
    const rows = (res as any)?.message || [];
    return rows
      .map((r: any) => (typeof r?.value === 'string' ? r.value.trim() : ''))
      .filter(Boolean);
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('fetchLeadTypesViaSearch failed', msg);
    return [];
  }
};

const fetchLeadTypesViaLinkField = async (limit: number = 100): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const res = await requestJSON<{ message?: { value?: string }[] }>(
      `${baseMethod}/frappe.desk.search.search_link`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          doctype: 'Lead',
          reference_doctype: 'Lead Type',
          txt: '',
          page_length: limit,
        }),
      },
    );
    const rows = (res as any)?.message || [];
    return rows
      .map((r: any) => (typeof r?.value === 'string' ? r.value.trim() : ''))
      .filter(Boolean);
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('fetchLeadTypesViaLinkField failed', msg);
    return [];
  }
};

const fetchLeadTypesFromMeta = async (): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const url = buildQuery(`${baseMethod}/frappe.desk.form.load.getdoctype`, { doctype: 'Lead' });
    const res = await requestJSON<{ docs?: any[]; doc?: any }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const doc = (res as any)?.docs?.[0] || (res as any)?.doc;
    const fields = doc?.fields || [];
    const leadTypeField = fields.find((f: any) => f.fieldname === 'lead_type');
    const opts = typeof leadTypeField?.options === 'string' ? leadTypeField.options : '';
    if (!opts) return [];
    return opts
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);
  } catch (err) {
    const msg = (err as any)?.message || err;
    console.warn('fetchLeadTypesFromMeta failed', msg);
    return [];
  }
};

const fetchLeadTypesFromDoc = async (): Promise<string[]> => {
  const { baseMethod, baseResource } = await getBases();
  const extractOptions = (doc: any): string[] => {
    const fields = doc?.fields || [];
    const leadTypeField = fields.find((f: any) => f.fieldname === 'lead_type');
    const opts = typeof leadTypeField?.options === 'string' ? leadTypeField.options : '';
    return opts
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);
  };

  if (baseMethod) {
    try {
      const res = await requestJSON<{ message?: any }>(`${baseMethod}/frappe.client.get`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ doctype: 'DocType', name: 'Lead' }),
      });
      const doc = (res as any)?.message || res;
      const options = extractOptions(doc);
      if (options.length) return options;
    } catch (err: any) {
      const msg = err?.message || err;
      if (!/DocType .*not found/i.test(String(msg))) {
        console.warn('fetchLeadTypesFromDoc (method) failed', msg);
      }
    }
  }

  if (baseResource) {
    try {
      const url = `${baseResource}/DocType/${encodeURIComponent('Lead')}`;
      const res = await requestJSON<{ data?: any }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const doc = (res as any)?.data || res;
      const options = extractOptions(doc);
      if (options.length) return options;
    } catch (err: any) {
      const msg = err?.message || err;
      if (!/DocType .*not found/i.test(String(msg))) {
        console.warn('fetchLeadTypesFromDoc (resource) failed', msg);
      }
    }
  }

  return [];
};

const fetchLeadsForLeadType = async (limit: number = 100): Promise<any[]> => {
  // lead_type field may be restricted; skip fetching from leads to avoid noisy errors
  return [];
};

export const getLeadTypes = async (limit: number = 100): Promise<LeadTypeResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const data = await fetchLeadTypes(limit);
    if (data.length) return { ok: true, data };

    const docOptions = await fetchLeadTypesFromDoc();
    if (docOptions.length) return { ok: true, data: docOptions };

    const linkFieldOptions = await fetchLeadTypesViaLinkField(limit);
    if (linkFieldOptions.length) return { ok: true, data: linkFieldOptions };

    const searchOptions = await fetchLeadTypesViaSearch(limit);
    if (searchOptions.length) return { ok: true, data: searchOptions };

    const metaOptions = await fetchLeadTypesFromMeta();
    if (metaOptions.length) return { ok: true, data: metaOptions };

    // Fallback to common ERPNext lead types to unblock UI if none returned
    const defaults = ['Client', 'Channel Partner', 'Consultant', 'Supplier', 'Employee', 'Others'];
    return { ok: true, data: defaults, message: 'Using default lead types; none returned from ERP.' };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching lead types';
    console.log('Lead types fetch error:', message);
    const defaults = ['Client', 'Channel Partner', 'Consultant', 'Supplier', 'Employee', 'Others'];
    return { ok: true, data: defaults, message };
  }
};

const fetchLeadStatusesFromDoc = async (): Promise<string[]> => {
  const { baseMethod, baseResource } = await getBases();
  const extractOptions = (doc: any): string[] => {
    const fields = doc?.fields || [];
    const statusField = fields.find((f: any) => f.fieldname === 'status');
    const opts = typeof statusField?.options === 'string' ? statusField.options : '';
    return opts
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);
  };

  if (baseMethod) {
    try {
      const res = await requestJSON<{ message?: any }>(`${baseMethod}/frappe.client.get`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ doctype: 'DocType', name: 'Lead' }),
      });
      const doc = (res as any)?.message || res;
      const options = extractOptions(doc);
      if (options.length) return options;
    } catch (err: any) {
      const msg = err?.message || err;
      if (!/DocType .*not found/i.test(String(msg))) {
        console.warn('fetchLeadStatusesFromDoc (method) failed', msg);
      }
    }
  }

  if (baseResource) {
    try {
      const url = `${baseResource}/DocType/${encodeURIComponent('Lead')}`;
      const res = await requestJSON<{ data?: any }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const doc = (res as any)?.data || res;
      const options = extractOptions(doc);
      if (options.length) return options;
    } catch (err: any) {
      const msg = err?.message || err;
      if (!/DocType .*not found/i.test(String(msg))) {
        console.warn('fetchLeadStatusesFromDoc (resource) failed', msg);
      }
    }
  }

  return [];
};

export const getLeadStatuses = async (limit: number = 100): Promise<LeadStatusResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }

    const docOptions = await fetchLeadStatusesFromDoc();
    if (docOptions.length) return { ok: true, data: docOptions };

    // Fallback to deriving from existing leads if status options are not exposed
    const leads = await fetchLeads(limit);
    const derived = normalizeStatuses(leads || []);
    if (derived.length) return { ok: true, data: derived };

    return { ok: false, message: 'No lead statuses found in ERPNext.' };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching lead statuses';
    console.log('Lead statuses fetch error:', message);
    return { ok: false, message };
  }
};

const fetchLeadOwners = async (limit: number = 200): Promise<LeadOwnerOption[]> => {
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/User`, {
      fields: JSON.stringify(['name', 'full_name']),
      filters: JSON.stringify([['enabled', '=', 1]]),
      order_by: 'name asc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeLeadOwners(res?.data ?? []);
  } catch (err1: any) {
    const msg = err1?.message || err1;
    const printable = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (/DocType .*not found/i.test(String(printable))) {
      return [];
    }
    console.warn('fetchLeadOwners resource failed', printable);
  }

  if (baseMethod) {
    try {
      const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
        doctype: 'User',
        fields: JSON.stringify(['name', 'full_name']),
        filters: JSON.stringify([['enabled', '=', 1]]),
        order_by: 'full_name asc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      return normalizeLeadOwners(res?.message ?? []);
    } catch (err2: any) {
      const msg = err2?.message || err2;
      const printable = typeof msg === 'string' ? msg : JSON.stringify(msg);
      if (/DocType .*not found/i.test(String(printable))) {
        return [];
      }
      console.warn('fetchLeadOwners method failed', printable);
    }
  }
  return [];
};

const fetchLeadOwnersFromLeads = async (limit: number = 200): Promise<LeadOwnerOption[]> => {
  try {
    const leads = await fetchLeads(limit);
    return normalizeLeadOwners(leads || []);
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('fetchLeadOwnersFromLeads failed', msg);
    return [];
  }
};

export const getLeadOwners = async (limit: number = 200): Promise<LeadOwnerResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const owners = await fetchLeadOwners(limit);
    if (owners.length) return { ok: true, data: owners };

    const derived = await fetchLeadOwnersFromLeads(limit);
    if (derived.length) return { ok: true, data: derived };

    return { ok: false, message: 'No lead owners found in ERPNext.' };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching lead owners';
    console.log('Lead owners fetch error:', message);
    return { ok: false, message };
  }
};

const fetchBuildingLocations = async (limit: number = 200): Promise<string[]> => {
  const { baseResource, baseMethod } = await getBases();
  const docs = ['Address'];
  const docFieldsMap: Record<string, string[]> = {
    Address: ['name', 'address_title', 'address_line1', 'city', 'country', 'custom_building__location'],
  };
  for (const doc of docs) {
    const fields = docFieldsMap[doc] || ['name'];
    // resource
    if (baseResource) {
      try {
        const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
          fields: JSON.stringify(fields),
          order_by: 'modified desc',
          limit_page_length: limit,
        });
        const res = await requestJSON<{ data?: any[] }>(url, {
          method: 'GET',
          headers: await authHeaders(),
        });
        const data = normalizeBuildingLocations(res?.data ?? []);
        if (data.length) return data;
      } catch (err: any) {
        const msg = err?.message || err;
        if (!/DocType .*not found/i.test(String(msg))) console.warn(`Building fetch failed for ${doc}`, msg);
      }
    }

    // method
    if (baseMethod) {
      try {
        const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
          doctype: doc,
          fields: JSON.stringify(fields),
          order_by: 'modified desc',
          limit_page_length: limit,
        });
        const res = await requestJSON<{ message?: any[] }>(url, {
          method: 'GET',
          headers: await authHeaders(),
        });
        const data = normalizeBuildingLocations(res?.message ?? []);
        if (data.length) return data;
      } catch (err: any) {
        const msg = err?.message || err;
        if (!/DocType .*not found/i.test(String(msg))) console.warn(`Building method fetch failed for ${doc}`, msg);
      }
    }
  }
  return [];
};

const fetchBuildingLocationsFromMeta = async (): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const url = buildQuery(`${baseMethod}/frappe.desk.form.load.getdoctype`, { doctype: 'Lead' });
    const res = await requestJSON<{ docs?: any[]; doc?: any }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const doc = (res as any)?.docs?.[0] || (res as any)?.doc;
    const fields = doc?.fields || [];
    const buildingField =
      fields.find((f: any) => f.fieldname === 'building') ||
      fields.find((f: any) => f.fieldname === 'custom_building__location');
    const opts = typeof buildingField?.options === 'string' ? buildingField.options : '';
    if (!opts) return [];
    return opts
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean);
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('Building options meta fetch failed', msg);
    return [];
  }
};

const fetchBuildingLocationsViaSearch = async (limit: number = 200): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const res = await requestJSON<{ message?: { value?: string; description?: string; label?: string }[] }>(
      `${baseMethod}/frappe.desk.search.search_link`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          doctype: 'Lead',
          reference_doctype: 'Address',
          txt: '',
          page_length: limit,
        }),
      },
    );
    const rows = (res as any)?.message || [];
    return normalizeBuildingSearch(rows);
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('Building/location search_link fetch failed', msg);
    return [];
  }
};

export const getBuildingLocations = async (
  limit: number = 200
): Promise<BuildingLocationResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }
    const data = await fetchBuildingLocations(limit);
    if (data.length) return { ok: true, data };

    const searchData = await fetchBuildingLocationsViaSearch(limit);
    if (searchData.length) return { ok: true, data: searchData };

    const meta = await fetchBuildingLocationsFromMeta();
    if (meta.length) return { ok: true, data: meta };

    return { ok: false, message: 'No building/location values found in ERPNext.' };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching building/location';
    console.log('Building/location fetch error:', message);
    return { ok: false, message };
  }
};

const normalizeAssociateDetails = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const name =
      (typeof row?.name === 'string' && row.name.trim()) ||
      (typeof row?.full_name === 'string' && row.full_name.trim()) ||
      (typeof row?.first_name === 'string' && row.first_name.trim()) ||
      (typeof row?.employee_name === 'string' && row.employee_name.trim()) ||
      (typeof row?.associate_name === 'string' && row.associate_name.trim()) ||
      (typeof row?.associate_details === 'string' && row.associate_details.trim()) ||
      '';
    if (name) deduped.add(name);
  });
  return Array.from(deduped);
};

const normalizeBuildingLocations = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const customLoc =
      (typeof row?.custom_building__location === 'string' && row.custom_building__location.trim()) || '';
    const addressTitle = (typeof row?.address_title === 'string' && row.address_title.trim()) || '';
    const addressLine1 = (typeof row?.address_line1 === 'string' && row.address_line1.trim()) || '';
    const city = (typeof row?.city === 'string' && row.city.trim()) || '';
    const country = (typeof row?.country === 'string' && row.country.trim()) || '';
    const name = (typeof row?.name === 'string' && row.name.trim()) || '';

    const addressCombined = addressTitle || addressLine1
      ? [addressTitle || addressLine1, city || country || ''].filter(Boolean).join(' - ')
      : '';
    const val =
      addressCombined ||
      customLoc;
    const fallback = name || '';
    const finalVal = val || fallback;
    if (finalVal && !/^CRM-LEAD-/i.test(finalVal) && !/associate/i.test(finalVal)) deduped.add(finalVal);
  });
  return Array.from(deduped);
};

const normalizeBuildingSearch = (rows: any[]): string[] => {
  const deduped = new Set<string>();
  (rows || []).forEach((row) => {
    const value = (typeof row?.value === 'string' && row.value.trim()) || '';
    const desc = (typeof row?.description === 'string' && row.description.trim()) || '';
    const label = (typeof row?.label === 'string' && row.label.trim()) || '';
    const candidate = desc || label || value;
    if (candidate && !/^CRM-LEAD-/i.test(candidate) && !/associate/i.test(candidate)) {
      deduped.add(candidate);
    }
  });
  return Array.from(deduped);
};

const resolveAssociateNamesFromLeads = async (ids: string[]): Promise<Record<string, string>> => {
  const map: Record<string, string> = {};
  const leadIds = ids.filter((id) => /^CRM-LEAD-/i.test(id));
  if (!leadIds.length) return map;
  const { baseMethod } = await getBases();
  if (!baseMethod) return map;
  try {
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Lead',
      fields: JSON.stringify(['name', 'lead_name']),
      filters: JSON.stringify([['name', 'in', leadIds]]),
      limit_page_length: leadIds.length,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    (res?.message || []).forEach((row: any) => {
      const key = typeof row?.name === 'string' ? row.name.trim() : '';
      const value = typeof row?.lead_name === 'string' ? row.lead_name.trim() : '';
      if (key && value) map[key] = value;
    });
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn('resolveAssociateNamesFromLeads failed', msg);
  }
  return map;
};

const fetchAssociateDetailsFromDoc = async (doc: string, limit: number): Promise<string[]> => {
  const { baseResource, baseMethod } = await getBases();
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/${encodeURIComponent(doc)}`, {
      fields: JSON.stringify(['name', 'full_name', 'associate_name', 'associate_details', 'first_name', 'employee_name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAssociateDetails(res?.data ?? []);
  } catch (err1: any) {
    const msg = err1?.message || '';
    if (/DocType .*not found/i.test(String(msg))) {
      return [];
    }
    console.warn(`fetchAssociateDetails resource failed for ${doc}`, msg || err1);
  }

  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: doc,
      fields: JSON.stringify(['name', 'full_name', 'associate_name', 'associate_details', 'first_name', 'employee_name']),
      order_by: 'modified desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAssociateDetails(res?.message ?? []);
  } catch (err2: any) {
    const msg = err2?.message || '';
    if (/DocType .*not found/i.test(String(msg))) {
      // ignore missing doctypes silently so we can fall back
      return [];
    }
    console.error(`fetchAssociateDetails method failed for ${doc}`, msg || err2);
    return [];
  }
};

const fetchAssociateDetailsViaSearch = async (referenceDoc: string, limit: number): Promise<string[]> => {
  const { baseMethod } = await getBases();
  if (!baseMethod) return [];
  try {
    const res = await requestJSON<{ message?: { value?: string }[] }>(
      `${baseMethod}/frappe.desk.search.search_link`,
      {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          doctype: 'Lead',
          reference_doctype: referenceDoc,
          txt: '',
          page_length: limit,
        }),
      },
    );
    const rows = (res as any)?.message || [];
    return rows
      .map((r: any) => (typeof r?.value === 'string' ? r.value.trim() : ''))
      .filter(Boolean);
  } catch (err: any) {
    const msg = err?.message || err;
    console.warn(`fetchAssociateDetailsViaSearch failed for ${referenceDoc}`, msg);
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

    for (const ref of docCandidates) {
      const data = await fetchAssociateDetailsViaSearch(ref, limit);
      if (data.length) return { ok: true, data };
    }

    // Fallback: derive from existing leads if no dedicated doctype exists
    const leads = await fetchLeads(limit);
    let data = normalizeAssociateDetails(leads || []);

    // Resolve any CRM-LEAD ids to friendly lead names if possible
    const resolution = await resolveAssociateNamesFromLeads(data);
    if (Object.keys(resolution).length) {
      data = data.map((item) => resolution[item] || item);
    }

    return { ok: true, data };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching associate details';
    console.log('Associate details fetch error:', message);
    return { ok: false, message };
  }
};

export type { Lead };
