import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMethodUrl, getResourceUrl, getApiKeySecret } from './urlService';

type AttendanceResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

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

// Format as YYYY-MM-DD HH:mm:ss (naive, no timezone) to avoid offset-aware comparisons on server
const formatLocalTimestamp = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    ' ' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes()) +
    ':' +
    pad(d.getSeconds())
  );
};

const tryMethod = async (path: string, payload: Record<string, any>) => {
  const { baseMethod } = await getBases();
  if (!baseMethod) throw new Error('ERP base URL not configured');
  const url = `${baseMethod}/` + path.replace(/^\//, '');
  return requestJSON<{ message?: any }>(url, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  });
};

export const checkIn = async (
  employee: string,
  logType: 'IN' | 'OUT' | 'AUTO' = 'IN',
  coords?: { latitude?: number; longitude?: number }
): Promise<AttendanceResult> => {
  const emp = String(employee || '').trim();
  if (!emp) return { ok: false, message: 'Employee id is required' };

  const payload: Record<string, any> = {
    employee: emp,
    log_type: logType,
    device_id: 'mobile',
  };
  if (coords?.latitude != null && coords?.longitude != null) {
    payload.latitude = coords.latitude;
    payload.longitude = coords.longitude;
  }

  // Try known method paths (HRMS first, then ERPNext)
  const methodPaths = [
    'hrms.hr.doctype.employee_checkin.employee_checkin.add_log_from_mobile',
    'hrms.hr.doctype.employee_checkin.employee_checkin.add_log',
    'hrms.hr.api.employee_checkin.add_log_from_mobile',
    'erpnext.hr.doctype.employee_checkin.employee_checkin.add_log_from_mobile',
    'erpnext.hr.doctype.employee_checkin.employee_checkin.add_log',
  ];

  for (const path of methodPaths) {
    try {
      const res = await tryMethod(path, payload);
      return { ok: true, data: (res as any)?.message ?? res };
    } catch (err: any) {
      console.warn(`checkIn method ${path} failed`, err?.message || err);
    }
  }

  // Fallback: direct insert via resource API
  try {
    const body = {
      employee: emp,
      log_type: logType,
      device_id: 'mobile',
      time: formatLocalTimestamp(new Date()),
      latitude: payload.latitude,
      longitude: payload.longitude,
    };
    console.log('checkIn resource payload:', body);
    const { baseResource } = await getBases();
    if (!baseResource) throw new Error('ERP base URL not configured');
    const resResource = await requestJSON<{ data?: any }>(`${baseResource}/Employee%20Checkin`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    return { ok: true, data: (resResource as any)?.data ?? resResource };
  } catch (errRes: any) {
    console.error('checkIn resource fallback failed', errRes?.message || errRes);
    return { ok: false, message: errRes?.message || 'Failed to check in' };
  }
};

export const checkOut = async (employee: string): Promise<AttendanceResult> => {
  return checkIn(employee, 'OUT');
};
