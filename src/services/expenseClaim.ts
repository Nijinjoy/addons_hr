import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { resolveEmployeeIdForUser } from './leaves';

type ExpenseHistoryItem = {
  id: string;
  employee: string;
  amount: number;
  claimedAmount?: number;
  sanctionedAmount?: number;
  date: string;
  status: string;
  title?: string;
};

type ExpenseHistoryResult =
  | { ok: true; data: ExpenseHistoryItem[] }
  | { ok: false; message: string; status?: number; raw?: string };

const pick = (...values: (string | undefined | null)[]): string => {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
};

const BASE_URL = (pick(Config.ERP_URL_RESOURCE, process.env?.ERP_URL_RESOURCE) ||
  'https://addonsajith.frappe.cloud/api/resource').replace(/\/$/, '');

const deriveMethodFromResource = (resourceUrl: string): string => {
  const clean = (resourceUrl || '').replace(/\/$/, '');
  if (!clean) return '';
  if (clean.endsWith('/api/resource')) return clean.replace(/\/api\/resource$/, '/api/method');
  return `${clean}/api/method`;
};

const METHOD_URL = (pick(Config.ERP_URL_METHOD, process.env?.ERP_URL_METHOD) ||
  deriveMethodFromResource(BASE_URL) ||
  'https://addonsajith.frappe.cloud/api/method').replace(/\/$/, '');

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

const normalizeClaims = (rows: any[]): ExpenseHistoryItem[] => {
  return (rows || []).map((r, idx) => {
    const claimed = Number(r.total_claimed_amount ?? r.total ?? 0) || 0;
    const sanctioned = Number(r.total_sanctioned_amount ?? r.grand_total ?? 0) || 0;
    const amount = sanctioned || claimed;
    return {
      id: String(r.name || r.id || idx),
      employee: String(r.employee || ''),
      amount,
      claimedAmount: claimed,
      sanctionedAmount: sanctioned,
      date: String(r.posting_date || r.creation || ''),
      status: String(r.status || r.approval_status || ''),
      title: r.title || r.remarks || '',
    };
  });
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
        'title',
        'grand_total',
        'total',
      ]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeClaims(res?.data ?? []);
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
        'title',
        'grand_total',
        'total',
      ]),
      filters: JSON.stringify([['employee', '=', id]]),
      order_by: 'creation desc',
      limit_page_length: limit,
    });
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    return normalizeClaims(res?.message ?? []);
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
