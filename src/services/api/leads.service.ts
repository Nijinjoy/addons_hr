import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getResourceUrl } from '../urlService';

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
};

export type LeadTaskPayload = {
  subject: string;
  description?: string;
  due_date?: string; // ISO date string
  lead?: string;
  assigned_to?: string; // user id/email
  status?: string;
  priority?: string;
};

export type LeadEventPayload = {
  subject: string;
  description?: string;
  category?: string;
  starts_on?: string; // ISO datetime
  ends_on?: string; // ISO datetime
  lead?: string;
  assigned_to?: string; // user id/email
  is_public?: boolean;
};

export type EventCategory = {
  name: string;
  event_type?: string;
};

export type Assignee = {
  name: string;
  full_name?: string;
};

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

export const getLeads = async (companyUrl?: string, limit: number = 50): Promise<Lead[]> => {
  const baseResource =
    normalizeResourceBase(companyUrl) || normalizeResourceBase(await getResourceUrl());
  if (!baseResource) throw new Error('ERP resource URL not configured');

  const url =
    baseResource +
    '/Lead?' +
    new URLSearchParams({
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
      limit_page_length: String(limit),
    }).toString();

  const res = await requestJSON<{ data?: any[] }>(url, {
    method: 'GET',
    headers: await authHeaders(),
  });
  console.log('Leads API response:', res);
  const rows = res?.data || (res as any) || [];
  return Array.isArray(rows) ? rows : [];
};

export const createLeadTask = async (
  payload: LeadTaskPayload,
  companyUrl?: string,
): Promise<{ name: string; alreadyExists?: boolean }> => {
  const leadName = payload.lead;
  if (!leadName) throw new Error('Lead ID is required to create an activity');

  // Use assign_to API so it shows under Activities
  const methodBase =
    normalizeMethodBase(companyUrl) || normalizeMethodBase(await getResourceUrl());
  const resourceBase =
    normalizeResourceBase(companyUrl) || normalizeResourceBase(await getResourceUrl());
  if (!methodBase || !resourceBase) throw new Error('ERP URLs not configured');

  const toDateOnly = (iso?: string) => {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const body = {
    doctype: 'Lead',
    name: leadName,
    assign_to: payload.assigned_to ? [payload.assigned_to] : undefined,
    description: payload.description || payload.subject || 'Lead task',
    date: toDateOnly(payload.due_date),
    priority: payload.priority || 'Medium',
    status: payload.status || 'Open',
    notify: 0,
  };

  const res = await requestJSON<{ message?: any; data?: { name: string }; _server_messages?: string }>(
    `${methodBase}/frappe.desk.form.assign_to.add`,
    {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    },
  );
  console.log('Lead task create response:', res);

  let alreadyExists = false;
  let name: string | null = null;
  const serverMsgs = (res as any)?._server_messages;
  if (typeof serverMsgs === 'string') {
    try {
      const arr = JSON.parse(serverMsgs);
      if (Array.isArray(arr)) {
        const msgStr = arr.join(' ');
        if (/Already in the following Users ToDo list/i.test(msgStr)) {
          alreadyExists = true;
        }
      }
    } catch {
      /* ignore parse */
    }
  }

  const doc = (res as any)?.data || (res as any)?.message || (res as any);
  name = doc?.name || doc?.todo || doc?.message || doc || null;

  // Always append a comment so the Activity timeline updates
  if (resourceBase) {
    try {
      const content =
        payload.description ||
        payload.subject ||
        'Lead activity';
      const commentPayload = {
        doctype: 'Comment',
        comment_type: 'Comment',
        reference_doctype: 'Lead',
        reference_name: leadName,
        content,
      };
      const commentRes = await requestJSON<{ data?: { name: string } }>(`${resourceBase}/Comment`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(commentPayload),
      });
      const commentDoc = (commentRes as any)?.data || (commentRes as any);
      if (commentDoc?.name) {
        name = commentDoc.name;
      }
      console.log('Lead activity comment response:', commentRes);
    } catch (commentErr) {
      // swallow comment errors, but log for visibility
      console.log('Lead comment create error:', (commentErr as any)?.message || commentErr);
    }
  }

  if (!name && !alreadyExists) throw new Error('Task creation failed');
  return { name: String(name || payload.assigned_to || leadName), alreadyExists };
};

export const createLeadEvent = async (
  payload: LeadEventPayload,
  companyUrl?: string,
): Promise<{ name: string; event?: any }> => {
  const leadName = payload.lead;
  if (!leadName) throw new Error('Lead ID is required to create an event');

  const baseResource =
    normalizeResourceBase(companyUrl) || normalizeResourceBase(await getResourceUrl());
  if (!baseResource) throw new Error('ERP resource URL not configured');

  const formatDateTime = (iso?: string) => {
    if (!iso) return undefined;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return undefined;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
      d.getMinutes(),
    )}:${pad(d.getSeconds())}`;
  };

  const body = {
    doctype: 'Event',
    subject: payload.subject,
    description: payload.description,
    event_type: payload.is_public ? 'Public' : 'Private',
    event_category: payload.category,
    starts_on: formatDateTime(payload.starts_on),
    ends_on: formatDateTime(payload.ends_on || payload.starts_on),
    reference_doctype: 'Lead',
    reference_docname: leadName,
    all_day: 0,
    owner: payload.assigned_to,
    status: 'Open',
    event_participants: payload.assigned_to
      ? [
          {
            reference_doctype: 'User',
            reference_docname: payload.assigned_to,
          },
        ]
      : [],
  };

  const res = await requestJSON<{ data?: any }>(`${baseResource}/Event`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(body),
  });
  console.log('Lead event create response:', res);
  const doc = (res as any)?.data || (res as any);
  const eventName = doc?.name;
  if (!eventName) throw new Error('Event creation failed');

  // Add a timeline comment on Lead to reflect the event
  try {
    const content = `Event created: ${payload.subject || payload.category || 'Event'} (${eventName})${
      payload.description ? ` — ${payload.description}` : ''
    }`;
    const commentPayload = {
      doctype: 'Comment',
      comment_type: 'Comment',
      reference_doctype: 'Lead',
      reference_name: leadName,
      content,
    };
    await requestJSON(`${baseResource}/Comment`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(commentPayload),
    });
  } catch (err) {
    console.log('Lead event comment error:', (err as any)?.message || err);
  }

  return { name: eventName, event: doc };
};

export const getAssignableUsers = async (companyUrl?: string): Promise<Assignee[]> => {
  const baseResource =
    normalizeResourceBase(companyUrl) || normalizeResourceBase(await getResourceUrl());
  if (!baseResource) throw new Error('ERP resource URL not configured');

  const url =
    baseResource +
    '/User?' +
    new URLSearchParams({
      fields: JSON.stringify(['name', 'full_name']),
      filters: JSON.stringify([['enabled', '=', 1]]),
      order_by: 'full_name asc',
      limit_page_length: '200',
    }).toString();

  const res = await requestJSON<{ data?: Assignee[] }>(url, {
    method: 'GET',
    headers: await authHeaders(),
  });
  const rows = res?.data || (res as any) || [];
  return Array.isArray(rows) ? rows : [];
};

export const getEventCategories = async (companyUrl?: string): Promise<EventCategory[]> => {
  const baseResource =
    normalizeResourceBase(companyUrl) || normalizeResourceBase(await getResourceUrl());
  if (!baseResource) throw new Error('ERP resource URL not configured');

  const fetchDoc = async (doctype: string) => {
    const encoded = encodeURIComponent(doctype);
    const url =
      baseResource +
      `/${encoded}?` +
      new URLSearchParams({
        fields: JSON.stringify(['name', 'event_type']),
        order_by: 'name asc',
        limit_page_length: '200',
      }).toString();
    const res = await requestJSON<{ data?: EventCategory[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const rows = res?.data || (res as any) || [];
    return Array.isArray(rows) ? rows : [];
  };

  try {
    const rows = await fetchDoc('Event Type');
    if (rows.length) return rows;
  } catch (err: any) {
    const msg = err?.message || '';
    if (!/DocType Event Type not found/i.test(String(msg))) {
      throw err;
    }
  }

  try {
    const rows = await fetchDoc('Event Category');
    if (rows.length) return rows;
  } catch (err: any) {
    // fall through to empty
  }

  return [];
};
