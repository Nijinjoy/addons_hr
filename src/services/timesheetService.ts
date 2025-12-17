import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getMethodUrl, getResourceUrl } from './urlService';

type Timesheet = {
  name: string;
  employee?: string;
  employee_name?: string;
  start_date?: string;
  end_date?: string;
  total_hours?: number;
  status?: string;
  company?: string;
  modified?: string;
};

type TimesheetListParams = {
  limit?: number;
  employee?: string;
};

type TimesheetResult =
  | { ok: true; data: Timesheet[] }
  | { ok: false; message: string; status?: number; raw?: string };

type CustomerResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string; status?: number; raw?: string };

type ActivityTypeResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string; status?: number; raw?: string };

type ProjectResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string; status?: number; raw?: string };

type TaskResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string; status?: number; raw?: string };

type CreateTimesheetInput = {
  employee?: string;
  customer?: string;
  activity_type?: string;
  project?: string;
  task?: string;
  from_time: string;
  to_time: string;
  description?: string;
};

type CreateTimesheetResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

type SubmitTimesheetResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

const formatLocalDateTime = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

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

const normalizeTimesheets = (rows: any[]): Timesheet[] => {
  return (rows || []).map((r) => ({
    name: String(r.name || ''),
    employee: (r as any)?.employee,
    employee_name: (r as any)?.employee_name,
    start_date: (r as any)?.start_date,
    end_date: (r as any)?.end_date,
    total_hours: (r as any)?.total_hours ?? (r as any)?.total_hours_worked,
    status: (r as any)?.status,
    company: (r as any)?.company,
    modified: (r as any)?.modified,
  }));
};

const fetchTimesheets = async (params: TimesheetListParams): Promise<Timesheet[]> => {
  const { limit = 50, employee } = params;
  const filters: any[] = [];
  if (employee) {
    filters.push(['employee', '=', employee]);
  }
  const { baseResource, baseMethod } = await getBases();

  // Try resource API
  try {
    if (!baseResource) throw new Error('Resource base not configured');
    const url = buildQuery(`${baseResource}/Timesheet`, {
      fields: JSON.stringify([
        'name',
        'employee',
        'employee_name',
        'start_date',
        'end_date',
        'total_hours',
        'status',
        'company',
        'modified',
      ]),
      order_by: 'modified desc',
      limit_page_length: limit,
      ...(filters.length ? { filters: JSON.stringify(filters) } : {}),
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeTimesheets(res?.data ?? []);
  } catch (err1: any) {
    console.warn('fetchTimesheets resource failed', err1?.message || err1);
  }

  // Fallback to method API
  try {
    if (!baseMethod) throw new Error('Method base not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Timesheet',
      fields: JSON.stringify([
        'name',
        'employee',
        'employee_name',
        'start_date',
        'end_date',
        'total_hours',
        'status',
        'company',
        'modified',
      ]),
      order_by: 'modified desc',
      limit_page_length: limit,
      ...(filters.length ? { filters: JSON.stringify(filters) } : {}),
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeTimesheets(res?.message ?? []);
  } catch (err2: any) {
    console.error('fetchTimesheets method failed', err2?.message || err2);
    return [];
  }
};

export const getTimesheets = async (params: TimesheetListParams = {}): Promise<TimesheetResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }

    const data = await fetchTimesheets(params);
    return { ok: true, data };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching timesheets';
    console.log('Timesheet fetch error:', message);
    return { ok: false, message };
  }
};

const normalizeCustomers = (rows: any[]): string[] => {
  const set = new Set<string>();
  (rows || []).forEach((row) => {
    const name = (row?.customer_name || row?.name || '').trim?.() || '';
    if (name) set.add(name);
  });
  return Array.from(set);
};

export const getCustomers = async (limit: number = 500): Promise<CustomerResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const { baseResource, baseMethod } = await getBases();

    // Resource API
    try {
      if (!baseResource) throw new Error('Resource base not configured');
      const url = buildQuery(`${baseResource}/Customer`, {
        fields: JSON.stringify(['name', 'customer_name']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ data?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeCustomers(res?.data ?? []);
      if (data.length) return { ok: true, data };
    } catch (err1: any) {
      console.warn('getCustomers resource failed', err1?.message || err1);
    }

    // Method API
    try {
      if (!baseMethod) throw new Error('Method base not configured');
      const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
        doctype: 'Customer',
        fields: JSON.stringify(['name', 'customer_name']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeCustomers(res?.message ?? []);
      return { ok: true, data };
    } catch (err2: any) {
      console.error('getCustomers method failed', err2?.message || err2);
      return { ok: false, message: err2?.message || 'Failed to load customers' };
    }
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching customers';
    console.log('Customers fetch error:', message);
    return { ok: false, message };
  }
};

const normalizeActivityTypes = (rows: any[]): string[] => {
  const set = new Set<string>();
  (rows || []).forEach((row) => {
    const name = (row?.activity_type || row?.name || '').trim?.() || '';
    if (name) set.add(name);
  });
  return Array.from(set);
};

export const getActivityTypes = async (limit: number = 200): Promise<ActivityTypeResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const { baseResource, baseMethod } = await getBases();

    // Resource API
    try {
      if (!baseResource) throw new Error('Resource base not configured');
      const url = buildQuery(`${baseResource}/Activity%20Type`, {
        fields: JSON.stringify(['name', 'activity_type']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ data?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeActivityTypes(res?.data ?? []);
      if (data.length) return { ok: true, data };
    } catch (err1: any) {
      console.warn('getActivityTypes resource failed', err1?.message || err1);
    }

    // Method API
    try {
      if (!baseMethod) throw new Error('Method base not configured');
      const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
        doctype: 'Activity Type',
        fields: JSON.stringify(['name', 'activity_type']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeActivityTypes(res?.message ?? []);
      return { ok: true, data };
    } catch (err2: any) {
      console.error('getActivityTypes method failed', err2?.message || err2);
      return { ok: false, message: err2?.message || 'Failed to load activity types' };
    }
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching activity types';
    console.log('Activity types fetch error:', message);
    return { ok: false, message };
  }
};

const normalizeProjects = (rows: any[]): string[] => {
  const set = new Set<string>();
  (rows || []).forEach((row) => {
    const name = (row?.project_name || row?.name || '').trim?.() || '';
    if (name) set.add(name);
  });
  return Array.from(set);
};

export const getProjects = async (limit: number = 200): Promise<ProjectResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const { baseResource, baseMethod } = await getBases();

    // Resource API
    try {
      if (!baseResource) throw new Error('Resource base not configured');
      const url = buildQuery(`${baseResource}/Project`, {
        fields: JSON.stringify(['name', 'project_name']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ data?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeProjects(res?.data ?? []);
      if (data.length) return { ok: true, data };
    } catch (err1: any) {
      console.warn('getProjects resource failed', err1?.message || err1);
    }

    // Method API
    try {
      if (!baseMethod) throw new Error('Method base not configured');
      const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
        doctype: 'Project',
        fields: JSON.stringify(['name', 'project_name']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeProjects(res?.message ?? []);
      return { ok: true, data };
    } catch (err2: any) {
      console.error('getProjects method failed', err2?.message || err2);
      return { ok: false, message: err2?.message || 'Failed to load projects' };
    }
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching projects';
    console.log('Projects fetch error:', message);
    return { ok: false, message };
  }
};

const normalizeTasks = (rows: any[]): string[] => {
  const set = new Set<string>();
  (rows || []).forEach((row) => {
    const name = (row?.name || row?.subject || row?.title || '').trim?.() || '';
    if (name) set.add(name);
  });
  return Array.from(set);
};

export const getTasks = async (limit: number = 200): Promise<TaskResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const { baseResource, baseMethod } = await getBases();

    // Resource API
    try {
      if (!baseResource) throw new Error('Resource base not configured');
      const url = buildQuery(`${baseResource}/Task`, {
        fields: JSON.stringify(['name', 'subject']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ data?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeTasks(res?.data ?? []);
      if (data.length) return { ok: true, data };
    } catch (err1: any) {
      console.warn('getTasks resource failed', err1?.message || err1);
    }

    // Method API
    try {
      if (!baseMethod) throw new Error('Method base not configured');
      const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
        doctype: 'Task',
        fields: JSON.stringify(['name', 'subject']),
        order_by: 'modified desc',
        limit_page_length: limit,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const data = normalizeTasks(res?.message ?? []);
      return { ok: true, data };
    } catch (err2: any) {
      console.error('getTasks method failed', err2?.message || err2);
      return { ok: false, message: err2?.message || 'Failed to load tasks' };
    }
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching tasks';
    console.log('Tasks fetch error:', message);
    return { ok: false, message };
  }
};

export const createTimesheet = async (input: CreateTimesheetInput): Promise<CreateTimesheetResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const { baseResource, baseMethod } = await getBases();

    const from = formatLocalDateTime(input.from_time);
    const to = formatLocalDateTime(input.to_time);
    if (!from || !to) return { ok: false, message: 'Invalid date/time selected.' };

    const baseTimeLog: Record<string, any> = {
      from_time: from,
      to_time: to,
    };
    if (input.activity_type) baseTimeLog.activity_type = input.activity_type;
    if (input.task) baseTimeLog.task = input.task;
    if (input.project) baseTimeLog.project = input.project;
    if (input.description) baseTimeLog.description = input.description;

    const baseDoc: Record<string, any> = {
      doctype: 'Timesheet',
      ...(input.employee ? { employee: input.employee } : {}),
      ...(input.customer ? { customer: input.customer } : {}),
    };

    const tryInsert = async (doc: Record<string, any>): Promise<CreateTimesheetResult> => {
      // Resource insert
      try {
        if (!baseResource) throw new Error('Resource base not configured');
        const res = await requestJSON<{ data?: any }>(`${baseResource}/Timesheet`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify(doc),
        });
        return { ok: true, data: (res as any)?.data ?? res };
      } catch (err1: any) {
        const msg = err1?.message || '';
        console.warn('createTimesheet resource failed', msg);
        if (typeof msg === 'string' && msg.toLowerCase().includes('task')) {
          return { ok: false, message: msg };
        }
      }

      // Method insert
      try {
        if (!baseMethod) throw new Error('Method base not configured');
        const res = await requestJSON<{ message?: any }>(`${baseMethod}/frappe.client.insert`, {
          method: 'POST',
          headers: await authHeaders(),
        body: JSON.stringify(doc),
      });
      const message: any = (res as any)?.message ?? res;
      if (message && Array.isArray(message.errors) && message.errors.length) {
        return { ok: false, message: message.errors[0] };
      }
      let serverMsgs: any[] = [];
      if (Array.isArray(message?._server_messages)) {
        serverMsgs = message._server_messages;
      } else if (typeof message?._server_messages === 'string') {
        try {
          serverMsgs = JSON.parse(message._server_messages);
        } catch {
          serverMsgs = [message._server_messages];
        }
      }
      if (serverMsgs.length) {
        const first = typeof serverMsgs[0] === 'string' ? serverMsgs[0] : JSON.stringify(serverMsgs[0]);
        return { ok: false, message: first || 'Failed to create timesheet' };
      }
      if (typeof message === 'string') {
        return { ok: true, data: message };
      }
      return { ok: true, data: message };
    } catch (err2: any) {
      const msg = err2?.message || err2;
      console.error('createTimesheet method failed', msg);
      return { ok: false, message: msg || 'Failed to create timesheet' };
    }
    };

    const docWithTask = { ...baseDoc, time_logs: [baseTimeLog] };
    return await tryInsert(docWithTask);
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while creating timesheet';
    console.log('createTimesheet error:', message);
    return { ok: false, message };
  }
};

export const submitTimesheet = async (name: string, doc?: any): Promise<SubmitTimesheetResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };
    const cleaned = String(name || '').trim();
    if (!cleaned) return { ok: false, message: 'Timesheet name is required to submit.' };
    const { baseResource, baseMethod } = await getBases();

    try {
      let docToSubmit = doc;
      if (!docToSubmit) {
        // Try resource fetch
        try {
          if (!baseResource) throw new Error('Resource base not configured');
          const resDoc = await requestJSON<{ data?: any }>(
            `${baseResource}/Timesheet/${encodeURIComponent(cleaned)}`,
            {
            method: 'GET',
            headers: await authHeaders(),
            }
          );
          docToSubmit = (resDoc as any)?.data ?? resDoc;
        } catch (errRes: any) {
          // fallback to method get
          try {
            if (!baseMethod) throw new Error('Method base not configured');
            const resGet = await requestJSON<{ message?: any }>(`${baseMethod}/frappe.client.get`, {
              method: 'POST',
              headers: await authHeaders(),
              body: JSON.stringify({ doctype: 'Timesheet', name: cleaned }),
            });
            docToSubmit = (resGet as any)?.message ?? resGet;
          } catch {
            docToSubmit = { doctype: 'Timesheet', name: cleaned };
          }
        }
      }

      if (!baseMethod) throw new Error('Method base not configured');
      const res = await requestJSON<{ message?: any }>(`${baseMethod}/runserverobj`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          docs: JSON.stringify(docToSubmit || { doctype: 'Timesheet', name: cleaned }),
          method: 'submit',
        }),
      });
      const message: any = (res as any)?.message ?? res;
      if (message && Array.isArray(message?.errors) && message.errors.length) {
        return { ok: false, message: message.errors[0] };
      }
      if (message && Array.isArray(message?._server_messages) && message._server_messages.length) {
        const first = typeof message._server_messages[0] === 'string' ? message._server_messages[0] : JSON.stringify(message._server_messages[0]);
        return { ok: false, message: first || 'Failed to submit timesheet' };
      }
      return { ok: true, data: message };
    } catch (err: any) {
      const msg = err?.message || err;
      console.error('submitTimesheet method failed', msg);
      return { ok: false, message: msg || 'Failed to submit timesheet' };
    }
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while submitting timesheet';
    console.log('submitTimesheet error:', message);
    return { ok: false, message };
  }
};

export type { Timesheet };
