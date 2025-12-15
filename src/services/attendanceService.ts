import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

type AttendanceResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

const pick = (...values: (string | undefined | null)[]): string => {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
};

const BASE_URL = (pick(Config.ERP_URL_RESOURCE, process.env?.ERP_URL_RESOURCE) || '').replace(/\/$/, '');
const deriveMethodFromResource = (resourceUrl: string): string => {
  const clean = (resourceUrl || '').replace(/\/$/, '');
  if (!clean) return '';
  if (clean.endsWith('/api/resource')) {
    return clean.replace(/\/api\/resource$/, '/api/method');
  }
  return `${clean}/api/method`;
};
const METHOD_URL = (pick(Config.ERP_URL_METHOD, process.env?.ERP_URL_METHOD) || deriveMethodFromResource(BASE_URL)).replace(/\/$/, '');
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

const buildUrl = (path: string) => `${METHOD_URL}/${path.replace(/^\//, '')}`;

export const checkIn = async (
  employee: string,
  logType: 'IN' | 'OUT' | 'AUTO' = 'IN',
  coords?: { latitude?: number; longitude?: number }
): Promise<AttendanceResult> => {
  const emp = String(employee || '').trim();
  if (!emp) return { ok: false, message: 'Employee id is required' };

  try {
    const payload: Record<string, any> = {
      employee: emp,
      log_type: logType,
      device_id: 'mobile',
    };
    if (coords?.latitude != null && coords?.longitude != null) {
      payload.latitude = coords.latitude;
      payload.longitude = coords.longitude;
    }
    const methodPath = 'erpnext.hr.doctype.employee_checkin.employee_checkin.add_log_from_mobile';
    const res = await requestJSON<{ message?: any }>(buildUrl(methodPath), {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    });
    return { ok: true, data: (res as any)?.message ?? res };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Failed to check in' };
  }
};

export const checkOut = async (employee: string): Promise<AttendanceResult> => {
  return checkIn(employee, 'OUT');
};
