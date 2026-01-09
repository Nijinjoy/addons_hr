import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiKeySecret, getMethodUrl, getResourceUrl } from './urlService';

const getBases = async () => {
  const baseResource = (await getResourceUrl()) || '';
  const baseMethod = (await getMethodUrl()) || '';
  return { baseResource, baseMethod };
};

async function authHeaders(): Promise<Record<string, string>> {
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
}

async function requestJSON<T = any>(url: string, options: RequestInit): Promise<T> {
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
}

function buildQuery(url: string, params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return qs ? `${url}?${qs}` : url;
}

// Resolve Employee document name for a given user (email/username)
export async function resolveEmployeeIdForUser(userId: string): Promise<string | null> {
  const user = decodeURIComponent(String(userId || '').trim());
  if (!user) return null;
  const { baseResource, baseMethod } = await getBases();

  const cacheKey = `employee_id_for_${encodeURIComponent(user)}`;
  const persistEmployeeId = async (empId: string) => {
    try {
      await AsyncStorage.multiSet([
        ['employee_id', empId],
        [cacheKey, empId],
      ]);
    } catch {
      // ignore storage errors; caller still gets the value
    }
  };

  // Prefer method endpoint (same host as login, works with sid)
  try {
    if (!baseMethod) throw new Error('Method URL not configured');
    // Method attempt 1: get_list
    try {
      const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
        doctype: 'Employee',
        fields: JSON.stringify(['name', 'user_id']),
        filters: JSON.stringify([['user_id', '=', user]]),
        limit_page_length: 10,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const row = (res?.message ?? []).find((r) => r?.name) || (res?.message ?? [])[0];
      const name = row?.name || row?.employee;
      if (name) {
        const id = String(name);
        await persistEmployeeId(id);
        return id;
      }
    } catch (inner) {
      // continue to get_value fallback
    }

    // Method attempt 2: get_value (single value fetch)
    try {
      const url = `${baseMethod}/frappe.client.get_value`;
      const filterVariants = [{ user_id: user }, { company_email: user }, { personal_email: user }];
      for (const filters of filterVariants) {
        try {
          const res = await requestJSON<{ message?: { name?: string } }>(url, {
            method: 'POST',
            headers: await authHeaders(),
            body: JSON.stringify({
              doctype: 'Employee',
              fieldname: 'name',
              filters,
            }),
          });
          const name = res?.message?.name;
          if (name) {
            const id = String(name);
            await persistEmployeeId(id);
            return id;
          }
        } catch {
          // try next filter
        }
      }
    } catch (inner2) {
      // continue to resource fallback
    }
  } catch (errMethod: any) {
    console.warn('resolveEmployeeIdForUser method failed', errMethod?.message || errMethod);
  }

  const tryResource = async (filters: any) => {
    if (!baseResource) throw new Error('Resource URL not configured');
    const url = buildQuery(`${baseResource}/Employee`, {
      filters: JSON.stringify(filters),
      fields: JSON.stringify(['name', 'user_id']),
      limit_page_length: 10,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const row = (res?.data ?? []).find((r) => r?.name) || (res?.data ?? [])[0];
    const name = row?.name || row?.employee;
    if (name) {
      const id = String(name);
      await persistEmployeeId(id);
      return id;
    }
    return null;
  };

  const resourceFilters = [
    [['user_id', '=', user]],
    [['company_email', '=', user]],
    [['personal_email', '=', user]],
  ];

  for (const filters of resourceFilters) {
    try {
      const found = await tryResource(filters);
      if (found) {
        await persistEmployeeId(found);
        return found;
      }
    } catch (errRes: any) {
      console.warn('resolveEmployeeIdForUser resource failed', errRes?.message || errRes);
    }
  }

  // Object-style filter variants
  const objectFilters = [{ user_id: user }, { company_email: user }, { personal_email: user }];
  for (const filters of objectFilters) {
    try {
      const found = await tryResource(filters);
      if (found) {
        await persistEmployeeId(found);
        return found;
      }
    } catch (errObj: any) {
      console.warn('resolveEmployeeIdForUser resource alt failed', errObj?.message || errObj);
    }
  }

  return null;
}

export type LeaveAllocation = {
  name: string;
  employee: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  leaves_allocated: number;
  new_leaves_allocated?: number;
  total_leaves_allocated?: number;
};

export type LeaveBalance = {
  leave_type: string;
  allocated: number;
  used: number;
  available: number;
};

function normalizeAllocations(rows: any[]): LeaveAllocation[] {
  return (rows || []).map((r) => {
    const leaves_allocated =
      r.leaves_allocated ?? r.total_leaves_allocated ?? r.new_leaves_allocated ?? 0;
    return {
      name: r.name,
      employee: r.employee,
      leave_type: r.leave_type,
      from_date: r.from_date,
      to_date: r.to_date,
      leaves_allocated,
      new_leaves_allocated: r.new_leaves_allocated,
      total_leaves_allocated: r.total_leaves_allocated,
    } as LeaveAllocation;
  });
}

// Fetch Leave Allocation rows for an employee (resource → fallback to method)
export async function fetchLeaveAllocations(employeeId: string): Promise<LeaveAllocation[]> {
  const id = String(employeeId || '').trim();
  if (!id) return [];
  const { baseResource, baseMethod } = await getBases();
  const fullFields = [
    'name',
    'employee',
    'leave_type',
    'from_date',
    'to_date',
    'total_leaves_allocated',
    'new_leaves_allocated',
  ];
  const minimalFields = ['name', 'employee', 'leave_type', 'from_date', 'to_date'];

  // Attempt 1: Resource endpoint with explicit fields/filters
  try {
    if (!baseResource) throw new Error('Resource URL not configured');
    const url = buildQuery(`${baseResource}/Leave%20Allocation`, {
      filters: JSON.stringify([['employee', '=', id]]),
      fields: JSON.stringify(fullFields),
      limit_page_length: 500,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAllocations(res?.data ?? []);
  } catch (err1: any) {
    console.warn('fetchLeaveAllocations resource failed', err1?.message || err1);
    const msg = err1?.message || '';
    if (typeof msg === 'string' && msg.toLowerCase().includes('field not permitted')) {
      try {
        if (!baseResource) throw new Error('Resource URL not configured');
        const url = buildQuery(`${baseResource}/Leave%20Allocation`, {
          filters: JSON.stringify([['employee', '=', id]]),
          fields: JSON.stringify(minimalFields),
          limit_page_length: 500,
        });
        const res = await requestJSON<{ data?: any[] }>(url, {
          method: 'GET',
          headers: await authHeaders(),
        });
        return normalizeAllocations(res?.data ?? []);
      } catch (retryErr: any) {
        console.warn('fetchLeaveAllocations resource retry failed', retryErr?.message || retryErr);
      }
    }
  }

  // Attempt 2: Simplified resource filter shape (some servers accept object)
  try {
    if (!baseResource) throw new Error('Resource URL not configured');
    const url = buildQuery(`${baseResource}/Leave%20Allocation`, {
      filters: JSON.stringify({ employee: id }),
      limit_page_length: 500,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAllocations(res?.data ?? []);
  } catch (err2: any) {
    console.warn('fetchLeaveAllocations resource alt failed', err2?.message || err2);
  }

  // Attempt 3: Method endpoint frappe.client.get_list
  try {
    if (!baseMethod) throw new Error('Method URL not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Leave Allocation',
      fields: JSON.stringify(fullFields),
      filters: JSON.stringify([['employee', '=', id]]),
      limit_page_length: 500,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeAllocations(res?.message ?? []);
  } catch (err3: any) {
    console.error('fetchLeaveAllocations method failed', err3?.message || err3);
    const msg = err3?.message || '';
    if (typeof msg === 'string' && msg.toLowerCase().includes('field not permitted')) {
      try {
        if (!baseMethod) throw new Error('Method URL not configured');
        const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
          doctype: 'Leave Allocation',
          fields: JSON.stringify(minimalFields),
          filters: JSON.stringify([['employee', '=', id]]),
          limit_page_length: 500,
        });
        const res = await requestJSON<{ message?: any[] }>(url, {
          method: 'GET',
          headers: await authHeaders(),
        });
        return normalizeAllocations(res?.message ?? []);
      } catch (retryErr: any) {
        console.error('fetchLeaveAllocations method retry failed', retryErr?.message || retryErr);
      }
    }
    return [];
  }
}

// Sum of approved leave days per type for an employee
export async function fetchLeaveUsage(employeeId: string): Promise<Record<string, number>> {
  const id = String(employeeId || '').trim();
  if (!id) return {};
  const { baseResource, baseMethod } = await getBases();
  const acc: Record<string, number> = {};

  // Attempt 1: Resource endpoint
  try {
    if (!baseResource) throw new Error('Resource URL not configured');
    const url = buildQuery(`${baseResource}/Leave%20Application`, {
      filters: JSON.stringify([
        ['employee', '=', id],
        ['status', '=', 'Approved'],
      ]),
      fields: JSON.stringify(['leave_type', 'total_leave_days']),
      limit_page_length: 1000,
    });
    const res = await requestJSON<{ data?: any[] }>(url, { method: 'GET', headers: await authHeaders() });
    const rows = res?.data ?? [];
    for (const r of rows) {
      const t = String(r?.leave_type || '').trim();
      const days = Number(r?.total_leave_days || 0) || 0;
      if (!t) continue;
      acc[t] = (acc[t] || 0) + days;
    }
    return acc;
  } catch (err1: any) {
    console.warn('fetchLeaveUsage resource failed', err1?.message || err1);
  }

  // Attempt 2: Method get_list
  try {
    if (!baseMethod) throw new Error('Method URL not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Leave Application',
      fields: JSON.stringify(['leave_type', 'total_leave_days', 'status', 'employee']),
      filters: JSON.stringify([
        ['employee', '=', id],
        ['status', '=', 'Approved'],
      ]),
      limit_page_length: 1000,
    });
    const res = await requestJSON<{ message?: any[] }>(url, { method: 'GET', headers: await authHeaders() });
    const rows = res?.message ?? [];
    for (const r of rows) {
      const t = String(r?.leave_type || '').trim();
      const days = Number(r?.total_leave_days || 0) || 0;
      if (!t) continue;
      acc[t] = (acc[t] || 0) + days;
    }
    return acc;
  } catch (err2: any) {
    console.error('fetchLeaveUsage method failed', err2?.message || err2);
    return acc;
  }
}

// Compute per-type balances using Leave Allocation (sum active allocations) minus used
export async function computeLeaveBalances(employeeId: string): Promise<LeaveBalance[]> {
  const [allocations, usedMap] = await Promise.all([
    fetchLeaveAllocations(employeeId),
    fetchLeaveUsage(employeeId).catch(() => ({} as Record<string, number>)),
  ]);

  const today = new Date();
  const isActive = (a: LeaveAllocation) => {
    try {
      const from = new Date(String(a.from_date).replace(' ', 'T'));
      const to = new Date(String(a.to_date).replace(' ', 'T'));
      return (!isNaN(from.getTime()) ? from <= today : true) && (!isNaN(to.getTime()) ? today <= to : true);
    } catch {
      return true;
    }
  };
  const active = allocations.filter(isActive);
  const base = active.length > 0 ? active : allocations;

  const byType = new Map<string, number>();
  for (const a of base) {
    const key = String(a.leave_type || '').trim();
    if (!key) continue;
    const qty = Number(a.leaves_allocated || 0) || 0;
    byType.set(key, (byType.get(key) || 0) + qty);
  }

  const result: LeaveBalance[] = [];
  for (const [leave_type, allocated] of byType) {
    const used = Number(usedMap[leave_type] || 0) || 0;
    const available = Math.max(0, allocated - used);
    result.push({ leave_type, allocated, used, available });
  }

  for (const t of Object.keys(usedMap)) {
    if (!byType.has(t)) {
      const used = Number(usedMap[t] || 0) || 0;
      result.push({ leave_type: t, allocated: 0, used, available: 0 });
    }
  }

  result.sort((a, b) => a.leave_type.localeCompare(b.leave_type));
  return result;
}

export type LeaveHistoryItem = {
  name: string;
  leave_type: string;
  description?: string | null;
  from_date: string;
  to_date: string;
  total_leave_days?: number;
  status: string;
};

export async function fetchLeaveHistory(employeeId: string, limit: number = 50): Promise<LeaveHistoryItem[]> {
  const id = String(employeeId || '').trim();
  if (!id) return [];
  const { baseResource, baseMethod } = await getBases();
  const fullFields = ['name', 'leave_type', 'description', 'from_date', 'to_date', 'total_leave_days', 'status'];
  const minimalFields = ['name', 'leave_type', 'from_date', 'to_date', 'status'];

  // Attempt 1: Resource endpoint
  try {
    if (!baseResource) throw new Error('Resource URL not configured');
    const url = buildQuery(`${baseResource}/Leave%20Application`, {
      filters: JSON.stringify([['employee', '=', id]]),
      fields: JSON.stringify(fullFields),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, { method: 'GET', headers: await authHeaders() });
    return (res?.data ?? []) as LeaveHistoryItem[];
  } catch (err1: any) {
    console.warn('fetchLeaveHistory resource failed', err1?.message || err1);
    const msg = err1?.message || '';
    if (typeof msg === 'string' && msg.toLowerCase().includes('field not permitted')) {
      try {
        if (!baseResource) throw new Error('Resource URL not configured');
        const url = buildQuery(`${baseResource}/Leave%20Application`, {
          filters: JSON.stringify([['employee', '=', id]]),
          fields: JSON.stringify(minimalFields),
          order_by: 'creation desc',
          limit_page_length: limit,
        });
        const res = await requestJSON<{ data?: any[] }>(url, { method: 'GET', headers: await authHeaders() });
        return (res?.data ?? []) as LeaveHistoryItem[];
      } catch (retryErr: any) {
        console.warn('fetchLeaveHistory resource retry failed', retryErr?.message || retryErr);
      }
    }
  }

  // Attempt 2: Method endpoint
  try {
    if (!baseMethod) throw new Error('Method URL not configured');
    const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
      doctype: 'Leave Application',
      fields: JSON.stringify(fullFields),
      filters: JSON.stringify([['employee', '=', id]]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, { method: 'GET', headers: await authHeaders() });
    return (res?.message ?? []) as LeaveHistoryItem[];
  } catch (err2: any) {
    console.error('fetchLeaveHistory method failed', err2?.message || err2);
    const msg = err2?.message || '';
    if (typeof msg === 'string' && msg.toLowerCase().includes('field not permitted')) {
      try {
        if (!baseMethod) throw new Error('Method URL not configured');
        const url = buildQuery(`${baseMethod}/frappe.client.get_list`, {
          doctype: 'Leave Application',
          fields: JSON.stringify(minimalFields),
          filters: JSON.stringify([['employee', '=', id]]),
          order_by: 'creation desc',
          limit_page_length: limit,
        });
        const res = await requestJSON<{ message?: any[] }>(url, { method: 'GET', headers: await authHeaders() });
        return (res?.message ?? []) as LeaveHistoryItem[];
      } catch (retryErr: any) {
        console.error('fetchLeaveHistory method retry failed', retryErr?.message || retryErr);
      }
    }
    return [];
  }
}

export type ApplyLeaveInput = {
  employee: string;
  leave_type: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  description?: string;
  company?: string;
};

// Create a Leave Application for the given employee
export async function applyLeave(input: ApplyLeaveInput): Promise<any> {
  const payload: Record<string, any> = {
    employee: input.employee,
    leave_type: input.leave_type,
    from_date: input.from_date,
    to_date: input.to_date,
  };
  if (input.description) payload.description = input.description;
  if (input.company) payload.company = input.company;
  const { baseResource, baseMethod } = await getBases();

  // Try resource endpoint first
  try {
    if (!baseResource) throw new Error('Resource URL not configured');
    const res = await requestJSON(`${baseResource}/Leave%20Application`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    return (res as any)?.data ?? res ?? true;
  } catch (err1: any) {
    console.warn('applyLeave resource failed', err1?.message || err1);
  }

  // Fallback: method endpoint
  try {
    if (!baseMethod) throw new Error('Method URL not configured');
    const doc = { doctype: 'Leave Application', ...payload };
    const res2 = await requestJSON(`${baseMethod}/frappe.client.insert`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ doc }),
    });
    return (res2 as any)?.message ?? true;
  } catch (err2: any) {
    console.error('applyLeave method failed', err2?.message || err2);
    throw err2;
  }
}
