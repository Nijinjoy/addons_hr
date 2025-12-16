import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveEmployeeIdForUser } from './leaves';
import { ERP_URL_METHOD, ERP_URL_RESOURCE, ERP_APIKEY, ERP_SECRET } from '../config/env';

type ExpenseHistoryItem = {
  id: string;
  employee: string;
  amount: number;
  claimedAmount?: number;
  sanctionedAmount?: number;
  date: string;
  status: string;
  title?: string;
  expenseType?: string;
  description?: string;
};

type ExpenseHistoryResult =
  | { ok: true; data: ExpenseHistoryItem[] }
  | { ok: false; message: string; status?: number; raw?: string };

type ExpenseTypeResult =
  | { ok: true; data: string[] }
  | { ok: false; message: string; status?: number; raw?: string };

const EXPENSE_TYPES_CACHE_KEY = 'expense_types_cache';

type ApplyExpenseInput = {
  employee: string;
  expense_type: string;
  amount: number;
  posting_date: string; // YYYY-MM-DD
  description?: string;
};

type ApplyExpenseResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

const BASE_URL = (ERP_URL_RESOURCE || '').replace(/\/$/, '');
const METHOD_URL = (ERP_URL_METHOD || '').replace(/\/$/, '');
const API_KEY = ERP_APIKEY || '';
const API_SECRET = ERP_SECRET || '';

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

const normalizeClaims = (rows: any[]): ExpenseHistoryItem[] => {
  return (rows || []).map((r, idx) => {
    const claimed = Number(r.total_claimed_amount ?? r.total ?? 0) || 0;
    const sanctioned = Number(r.total_sanctioned_amount ?? r.grand_total ?? 0) || 0;
    const amount = sanctioned || claimed;
    // Derive expense type/description from child table if available
    let expenseType = '';
    let description = '';
    const child = Array.isArray(r.expenses) && r.expenses.length ? r.expenses[0] : null;
    if (child) {
      expenseType = child.expense_type || '';
      description = child.description || child.remarks || '';
    }

    return {
      id: String(r.name || r.id || idx),
      employee: String(r.employee || ''),
      amount,
      claimedAmount: claimed,
      sanctionedAmount: sanctioned,
      date: String(r.posting_date || r.creation || ''),
      status: String(r.status || r.approval_status || ''),
      title: expenseType || r.title || '',
      expenseType,
      description: description || r.remarks || r.description || '',
    };
  });
};

const fetchExpenseDetail = async (name: string): Promise<any | null> => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;
  try {
    const res = await requestJSON<{ message?: any }>(`${METHOD_URL}/frappe.client.get`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ doctype: 'Expense Claim', name: trimmed }),
    });
    return res?.message ?? null;
  } catch (err: any) {
    console.warn('fetchExpenseDetail failed', err?.message || err);
    return null;
  }
};

export const fetchExpenseHistory = async (
  employeeId: string,
  limit: number = 50
): Promise<ExpenseHistoryItem[]> => {
  const id = String(employeeId || '').trim();
  if (!id) return [];

  // Attempt 1: Resource endpoint
  try {
    const url = buildQuery(`${BASE_URL}/Expense%20Claim`, {
      filters: JSON.stringify([['employee', '=', id]]),
      fields: JSON.stringify([
        'name',
        'employee',
        'total_sanctioned_amount',
        'total_claimed_amount',
        'posting_date',
        'status',
        'approval_status',
        'grand_total',
        'expenses',
      ]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const items = normalizeClaims(res?.data ?? []);

    // Enrich missing expenseType/description with detail fetch (limit to 10 to avoid overfetch)
    const missing = items.filter((i) => !i.expenseType).slice(0, 10);
    for (const m of missing) {
      const detail = await fetchExpenseDetail(m.id);
      if (detail) {
        const child = Array.isArray(detail.expenses) && detail.expenses.length ? detail.expenses[0] : null;
        const expenseType = (child && (child.expense_type || child.expense)) || detail.expense_type || m.expenseType;
        const description = (child && (child.description || child.remarks)) || detail.remarks || detail.description || m.description;
        if (expenseType) {
          m.expenseType = expenseType;
          m.title = expenseType;
        }
        if (description) m.description = description;
      }
    }

    return items;
  } catch (err1: any) {
    console.warn('fetchExpenseHistory resource failed', err1?.message || err1);
  }

  // Attempt 2: Method endpoint
  try {
    const url = buildQuery(`${METHOD_URL}/frappe.client.get_list`, {
      doctype: 'Expense Claim',
      fields: JSON.stringify([
        'name',
        'employee',
        'total_sanctioned_amount',
        'total_claimed_amount',
        'posting_date',
        'status',
        'approval_status',
        'grand_total',
        'expenses',
      ]),
      filters: JSON.stringify([['employee', '=', id]]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    const items = normalizeClaims(res?.message ?? []);

    const missing = items.filter((i) => !i.expenseType).slice(0, 10);
    for (const m of missing) {
      const detail = await fetchExpenseDetail(m.id);
      if (detail) {
        const child = Array.isArray(detail.expenses) && detail.expenses.length ? detail.expenses[0] : null;
        const expenseType = (child && (child.expense_type || child.expense)) || detail.expense_type || m.expenseType;
        const description = (child && (child.description || child.remarks)) || detail.remarks || detail.description || m.description;
        if (expenseType) {
          m.expenseType = expenseType;
          m.title = expenseType;
        }
        if (description) m.description = description;
      }
    }

    return items;
  } catch (err2: any) {
    console.error('fetchExpenseHistory method failed', err2?.message || err2);
    return [];
  }
};

export const getExpenseHistory = async (params?: {
  employeeId?: string;
  userId?: string;
  limit?: number;
}): Promise<ExpenseHistoryResult> => {
  const { employeeId: explicitEmployeeId, userId, limit = 50 } = params || {};

  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }

    const storedEmployee = explicitEmployeeId || (await AsyncStorage.getItem('employee_id')) || '';
    const storedUser = userId || (await AsyncStorage.getItem('user_id')) || '';

    let employeeId = storedEmployee.trim();

    if (!employeeId && storedUser) {
      const employeeCacheKey = `employee_id_for_${encodeURIComponent(storedUser)}`;
      try {
        const cached = await AsyncStorage.getItem(employeeCacheKey);
        if (cached) employeeId = cached;
      } catch {
        // ignore storage errors
      }
      if (!employeeId) {
        const resolved = await resolveEmployeeIdForUser(storedUser);
        if (resolved) {
          employeeId = resolved;
          try {
            await AsyncStorage.multiSet([
              ['employee_id', resolved],
              [employeeCacheKey, resolved],
            ]);
          } catch {
            // ignore storage errors
          }
        }
      }
    }

    if (!employeeId) {
      return { ok: false, message: 'Employee id not found. Please log in.' };
    }

    const history = await fetchExpenseHistory(employeeId, limit);
    return { ok: true, data: history };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching expense history';
    console.log('Expense history error:', message);
    return { ok: false, message };
  }
};

export type { ExpenseHistoryItem };

export const applyExpenseClaim = async (input: ApplyExpenseInput): Promise<ApplyExpenseResult> => {
  const employee = String(input.employee || '').trim();
  if (!employee) return { ok: false, message: 'Employee id is required.' };
  if (!input.expense_type) return { ok: false, message: 'Expense type is required.' };
  if (!input.posting_date) return { ok: false, message: 'Posting date is required.' };
  if (isNaN(Number(input.amount))) return { ok: false, message: 'Amount must be a number.' };

  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };

    const payload: Record<string, any> = {
      employee,
      expense_type: input.expense_type,
      total_claimed_amount: Number(input.amount),
      posting_date: input.posting_date,
      expenses: [
        {
          expense_type: input.expense_type,
          amount: Number(input.amount),
          expense_date: input.posting_date,
          description: input.description || 'Expense',
        },
      ],
    };
    if (input.description) payload.remarks = input.description;

    // Attempt resource POST
    try {
      const res = await requestJSON(`${BASE_URL}/Expense%20Claim`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify(payload),
      });
      return { ok: true, data: (res as any)?.data ?? res ?? true };
    } catch (err1: any) {
      console.warn('applyExpenseClaim resource failed', err1?.message || err1);
    }

    // Fallback to method insert
    try {
      const doc = { doctype: 'Expense Claim', ...payload };
      const res2 = await requestJSON(`${METHOD_URL}/frappe.client.insert`, {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ doc }),
      });
      return { ok: true, data: (res2 as any)?.message ?? true };
    } catch (err2: any) {
      console.error('applyExpenseClaim method failed', err2?.message || err2);
      return { ok: false, message: err2?.message || 'Failed to submit expense claim' };
    }
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while applying expense claim';
    return { ok: false, message };
  }
};

export const getExpenseTypes = async (): Promise<ExpenseTypeResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };

    const saveCache = async (items: string[]) => {
      try {
        await AsyncStorage.setItem(EXPENSE_TYPES_CACHE_KEY, JSON.stringify(items));
      } catch {
        // ignore cache errors
      }
    };

    const readCache = async (): Promise<string[] | null> => {
      try {
        const cached = await AsyncStorage.getItem(EXPENSE_TYPES_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
        }
      } catch {
        // ignore cache errors
      }
      return null;
    };

    // Try resource: Expense Claim Type
    if (BASE_URL) {
      try {
        const url = buildQuery(`${BASE_URL}/Expense%20Claim%20Type`, {
          fields: JSON.stringify(['name']),
          limit_page_length: 200,
        });
        const res = await requestJSON<{ data?: any[] }>(url, {
          method: 'GET',
          headers: await authHeaders(),
        });
        const items = (res?.data ?? []).map((r) => String(r?.name || '')).filter(Boolean);
        if (items.length) {
          await saveCache(items);
          return { ok: true, data: items };
        }
      } catch (err1: any) {
        console.warn('getExpenseTypes resource failed', err1?.message || err1);
      }
    }

    // Fallback to method
    try {
      const url = buildQuery(`${METHOD_URL}/frappe.client.get_list`, {
        doctype: 'Expense Claim Type',
        fields: JSON.stringify(['name']),
        limit_page_length: 200,
      });
      const res = await requestJSON<{ message?: any[] }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const items = (res?.message ?? []).map((r) => String(r?.name || '')).filter(Boolean);
      await saveCache(items);
      return { ok: true, data: items };
    } catch (err2: any) {
      console.warn('getExpenseTypes method GET failed, retrying with POST', err2?.message || err2);
      try {
        const resPost = await requestJSON<{ message?: any[] }>(`${METHOD_URL}/frappe.client.get_list`, {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({
            doctype: 'Expense Claim Type',
            fields: ['name'],
            limit_page_length: 200,
          }),
        });
        const items = (resPost?.message ?? []).map((r: any) => String(r?.name || '')).filter(Boolean);
        await saveCache(items);
        return { ok: true, data: items };
      } catch (err3: any) {
        console.error('getExpenseTypes method POST failed', err3?.message || err3);
        const cached = await readCache();
        if (cached && cached.length) {
          console.warn('Returning cached expense types due to failure.');
          return { ok: true, data: cached };
        }
        return { ok: false, message: err3?.message || 'Failed to load expense types' };
      }
    }
  } catch (error: any) {
    return { ok: false, message: error?.message || 'Unexpected error while fetching expense types' };
  }
};
