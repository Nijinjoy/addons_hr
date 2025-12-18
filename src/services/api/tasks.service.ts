import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi, ensureApi } from './axiosInstance';
import { getResourceUrl, getMethodUrl, getApiKeySecret } from '../urlService';

const logTasks = (label: string, payload: any) => {
  console.log(`[tasks] ${label}:`, payload);
};

export type SimpleOption = { id: string; label: string };

export type TaskListItem = {
  name: string;
  subject?: string;
  status?: string;
  priority?: string;
  exp_end_date?: string;
  exp_start_date?: string;
  owner?: string;
  project?: string;
  issue?: string;
  completed_on?: string;
};

type TasksResponse = {
  data?: TaskListItem[];
  message?: TaskListItem[];
};

type CreateTaskPayload = {
  subject: string;
  status?: string;
  priority?: string;
  description?: string;
  exp_start_date?: string;
  exp_end_date?: string;
  project?: string;
  issue?: string;
  type?: string;
  parent_task?: string;
};

const persistCompanyUrl = async (companyUrl?: string) => {
  const url = (companyUrl || '').trim();
  if (!url) return;
  try {
    await AsyncStorage.setItem('company_url', url);
  } catch {
    // ignore storage errors
  }
};

const authHeaders = async () => {
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

export const fetchTasks = async (
  companyUrl?: string,
  limit: number = 50,
  start: number = 0
): Promise<TaskListItem[]> => {
  await persistCompanyUrl(companyUrl);

  // First attempt: use axios instance on the method endpoint with Frappe query
  try {
    const api = await ensureApi(companyUrl);
    const fields = [
      'name',
      'subject',
      'status',
      'priority',
      'exp_start_date',
      'exp_end_date',
      'owner',
      'project',
      'issue',
      'completed_on',
    ];
    const res = await api.post('/frappe.client.get_list', {
      doctype: 'Task',
      fields,
      order_by: 'creation desc',
      limit_page_length: limit,
      limit_start: start,
    });
    const list = (res?.data?.message as TaskListItem[]) || [];
    logTasks('method success', { count: list.length, items: list });
    return list;
  } catch (err) {
    logTasks('method fallback', err?.message || err);
  }

  // Fallback: fetch via resource API
  const baseResource = (await getResourceUrl()) || '';
  const baseMethod = (await getMethodUrl()) || '';
  if (!baseResource && !baseMethod) throw new Error('ERP base URL is not configured.');
  const resourceUrl = baseResource || baseMethod.replace('/api/method', '/api/resource');
  const url = `${resourceUrl}/Task?fields=["name","subject","status","priority","exp_start_date","exp_end_date","owner","project","issue","completed_on"]&order_by=creation desc&limit_page_length=${limit}&limit_start=${start}`;
  const headers = await authHeaders();
  const res = await requestJSON<TasksResponse>(url, { method: 'GET', headers });
  const list = (res?.data as TaskListItem[]) || (res?.message as TaskListItem[]) || [];
  logTasks('resource success', { count: list.length, items: list });
  return list;
};

const fetchOptions = async (
  doctype: string,
  fields: string[],
  labelField: string,
  companyUrl?: string,
  filters?: any,
  limit: number = 50,
  start: number = 0
): Promise<SimpleOption[]> => {
  await persistCompanyUrl(companyUrl);
  const api = await ensureApi(companyUrl);
  const res = await api.post('/frappe.client.get_list', {
    doctype,
    fields,
    filters,
    order_by: 'creation desc',
    limit_page_length: limit,
    limit_start: start,
  });
  const rows = (res?.data?.message as any[]) || [];
  return rows.map((r, idx) => ({
    id: r.name || String(idx),
    label: r[labelField] || r.name || `Item ${idx + 1}`,
  }));
};

export const fetchProjects = async (companyUrl?: string, limit: number = 50): Promise<SimpleOption[]> => {
  try {
    const opts = await fetchOptions('Project', ['name', 'project_name'], 'project_name', companyUrl, undefined, limit);
    logTasks('projects success', { count: opts.length });
    return opts;
  } catch (err: any) {
    logTasks('projects failed', err?.message || err);
    return [];
  }
};

export const fetchIssues = async (companyUrl?: string, limit: number = 50): Promise<SimpleOption[]> => {
  try {
    const opts = await fetchOptions('Issue', ['name', 'subject'], 'subject', companyUrl, undefined, limit);
    logTasks('issues success', { count: opts.length });
    return opts;
  } catch (err: any) {
    logTasks('issues failed', err?.message || err);
    return [];
  }
};

export const fetchParentTasks = async (companyUrl?: string, limit: number = 50): Promise<SimpleOption[]> => {
  const results: SimpleOption[] = [];
  let start = 0;
  const pageSize = limit;
  try {
    while (true) {
      const page = await fetchOptions(
        'Task',
        ['name', 'subject'],
        'subject',
        companyUrl,
        { is_group: 1 },
        pageSize,
        start
      );
      results.push(...page);
      if (page.length < pageSize) break;
      start += pageSize;
    }
    logTasks('parent tasks success', { count: results.length });
    return results;
  } catch (err: any) {
    logTasks('parent tasks failed', err?.message || err);
    return results;
  }
};

export const fetchTaskTypes = async (companyUrl?: string, limit: number = 50): Promise<SimpleOption[]> => {
  try {
    const opts = await fetchOptions('Task Type', ['name'], 'name', companyUrl, undefined, limit);
    logTasks('task types success', { count: opts.length });
    return opts;
  } catch (err: any) {
    logTasks('task types failed', err?.message || err);
    return [];
  }
};

export const fetchTaskStatuses = async (companyUrl?: string): Promise<SimpleOption[]> => {
  const defaults = [
    { id: 'Open', label: 'Open' },
    { id: 'Working', label: 'Working' },
    { id: 'Pending Review', label: 'Pending Review' },
    { id: 'Completed', label: 'Completed' },
    { id: 'Cancelled', label: 'Cancelled' },
  ];
  try {
    await persistCompanyUrl(companyUrl);
    const api = await ensureApi(companyUrl);
    const res = await api.post('/frappe.desk.form.load.getdoctype', {
      doctype: 'Task',
    });
    const fields = res?.data?.docs?.[0]?.fields || [];
    const statusField = fields.find((f: any) => f?.fieldname === 'status');
    const optionsStr = statusField?.options || '';
    const opts = optionsStr
      .split('\n')
      .map((o: string) => o.trim())
      .filter(Boolean)
      .map((o: string) => ({ id: o, label: o }));
    if (opts.length) {
      logTasks('task statuses success', { count: opts.length });
      return opts;
    }
    logTasks('task statuses fallback to defaults', { count: defaults.length });
    return defaults;
  } catch (err: any) {
    logTasks('task statuses failed', err?.message || err);
    return defaults;
  }
};

export const fetchTaskPriorities = async (companyUrl?: string): Promise<SimpleOption[]> => {
  const defaults = [
    { id: 'Low', label: 'Low' },
    { id: 'Medium', label: 'Medium' },
    { id: 'High', label: 'High' },
    { id: 'Urgent', label: 'Urgent' },
  ];
  try {
    await persistCompanyUrl(companyUrl);
    const api = await ensureApi(companyUrl);
    const res = await api.post('/frappe.desk.form.load.getdoctype', {
      doctype: 'Task',
    });
    const fields = res?.data?.docs?.[0]?.fields || [];
    const priorityField = fields.find((f: any) => f?.fieldname === 'priority');
    const optionsStr = priorityField?.options || '';
    const opts = optionsStr
      .split('\n')
      .map((o: string) => o.trim())
      .filter(Boolean)
      .map((o: string) => ({ id: o, label: o }));
    if (opts.length) {
      logTasks('task priorities success', { count: opts.length });
      return opts;
    }
    logTasks('task priorities fallback to defaults', { count: defaults.length });
    return defaults;
  } catch (err: any) {
    logTasks('task priorities failed', err?.message || err);
    return defaults;
  }
};

export const createTask = async (payload: CreateTaskPayload, companyUrl?: string) => {
  const subject = (payload.subject || '').trim();
  if (!subject) throw new Error('Subject is required');

  await persistCompanyUrl(companyUrl);
  const baseResource = (await getResourceUrl()) || '';
  const baseMethod = (await getMethodUrl()) || '';
  if (!baseResource && !baseMethod) throw new Error('ERP base URL is not configured.');
  const resourceUrl = baseResource || baseMethod.replace('/api/method', '/api/resource');
  const url = `${resourceUrl}/Task`;

  const body = {
    subject,
    status: payload.status?.trim() || 'Open',
    priority: payload.priority?.trim() || 'Medium',
    description: (payload.description || '').trim(),
    exp_start_date: payload.exp_start_date,
    exp_end_date: payload.exp_end_date,
    project: payload.project?.trim() || undefined,
    issue: payload.issue?.trim() || undefined,
    task_type: payload.type?.trim() || 'Task',
    parent_task: payload.parent_task?.trim() || undefined,
    is_group: 0,
  };

  const headers = await authHeaders();
  // Try resource insert first
  try {
    const res = await requestJSON<any>(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    logTasks('create success (resource)', res);
    return res;
  } catch (err: any) {
    logTasks('create resource failed, trying method insert', err?.message || err);
  }

  // Fallback: method insert
  try {
    const api = await ensureApi(companyUrl);
    const res = await api.post('/frappe.client.insert', { doc: { doctype: 'Task', ...body } });
    logTasks('create success (method)', res?.data);
    return res?.data;
  } catch (err: any) {
    logTasks('create method failed', err?.message || err);
    throw new Error(err?.message || 'Failed to create task');
  }
};
