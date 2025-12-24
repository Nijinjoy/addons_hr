import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMethodUrl, getResourceUrl, getApiKeySecret } from './urlService';

type AttendanceResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };
type AttendanceLog = {
  name: string;
  employee: string;
  log_type?: string;
  time?: string;
  device_id?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
  attendance_date?: string;
  in_time?: string;
  out_time?: string;
  shift?: string;
  shift_type?: string;
};
type AttendanceListResult =
  | { ok: true; data: AttendanceLog[] }
  | { ok: false; message: string; status?: number; raw?: string };

const getBases = async () => {
  const baseResource = (await getResourceUrl()) || '';
  const baseMethod = (await getMethodUrl()) || '';
  return { baseResource, baseMethod };
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

const normalizeAttendanceLogs = (rows: any[]): AttendanceLog[] => {
  return (rows || []).map((row) => ({
    name: String(row?.name || ''),
    employee: String(row?.employee || ''),
    log_type: row?.log_type,
  time: row?.time || row?.timestamp || row?.creation,
  attendance_date: row?.attendance_date,
  in_time: row?.in_time,
  out_time: row?.out_time,
  device_id: row?.device_id,
  latitude: typeof row?.latitude === 'number' ? row.latitude : undefined,
  longitude: typeof row?.longitude === 'number' ? row.longitude : undefined,
  status: row?.status || row?.shift_status || row?.att_status,
  shift: row?.shift || row?.shift_type,
  shift_type: row?.shift_type,
}));
};

export const getAttendanceLogs = async (
  employee: string,
  limit: number = 50
): Promise<AttendanceListResult> => {
  const emp = String(employee || '').trim();
  if (!emp) return { ok: false, message: 'Employee id is required' };

  // Try Attendance DocType for richer data (status/in/out)
  try {
    const { baseResource } = await getBases();
    if (!baseResource) throw new Error('ERP base URL not configured');
    const url =
      baseResource +
      '/Attendance?' +
      new URLSearchParams({
        fields: JSON.stringify([
          'name',
          'employee',
          'status',
          'attendance_date',
          'in_time',
          'out_time',
          'shift',
          'shift_type',
          'device_id',
        ]),
        filters: JSON.stringify([['employee', '=', emp]]),
        order_by: 'attendance_date desc',
        limit_page_length: String(limit),
      }).toString();
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    console.log('Attendance logs (Attendance Doc) response:', res);
    const data = normalizeAttendanceLogs(res?.data ?? []);
    if (data.length) return { ok: true, data };
  } catch (err: any) {
    console.warn('getAttendanceLogs Attendance resource failed', err?.message || err);
  }

  // Method fallback for Attendance
  try {
    const { baseMethod } = await getBases();
    if (!baseMethod) throw new Error('ERP base URL not configured');
    const url =
      baseMethod +
      '/frappe.client.get_list?' +
      new URLSearchParams({
        doctype: 'Attendance',
        fields: JSON.stringify([
          'name',
          'employee',
          'status',
          'attendance_date',
          'in_time',
          'out_time',
          'shift',
          'shift_type',
          'device_id',
        ]),
        filters: JSON.stringify([['employee', '=', emp]]),
        order_by: 'attendance_date desc',
        limit_page_length: String(limit),
      }).toString();
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    console.log('Attendance logs (Attendance Doc) method response:', res);
    const data = normalizeAttendanceLogs(res?.message ?? []);
    if (data.length) return { ok: true, data };
  } catch (err: any) {
    console.warn('getAttendanceLogs Attendance method failed', err?.message || err);
  }

  // Resource path first
  try {
    const { baseResource } = await getBases();
    if (!baseResource) throw new Error('ERP base URL not configured');
    const url =
      baseResource +
      '/Employee%20Checkin?' +
      new URLSearchParams({
        fields: JSON.stringify(['name', 'employee', 'log_type', 'time', 'device_id']),
        filters: JSON.stringify([['employee', '=', emp]]),
        order_by: 'time desc',
        limit_page_length: String(limit),
      }).toString();
    const res = await requestJSON<{ data?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    console.log('Attendance logs resource response:', res);
    const data = normalizeAttendanceLogs(res?.data ?? []);
    if (data.length) return { ok: true, data };
  } catch (err: any) {
    console.warn('getAttendanceLogs resource failed', err?.message || err);
  }

  // Method fallback
  try {
    const { baseMethod } = await getBases();
    if (!baseMethod) throw new Error('ERP base URL not configured');
    const url =
      baseMethod +
      '/frappe.client.get_list?' +
      new URLSearchParams({
        doctype: 'Employee Checkin',
        fields: JSON.stringify(['name', 'employee', 'log_type', 'time', 'device_id']),
        filters: JSON.stringify([['employee', '=', emp]]),
        order_by: 'time desc',
        limit_page_length: String(limit),
      }).toString();
    const res = await requestJSON<{ message?: any[] }>(url, {
      method: 'GET',
      headers: await authHeaders(),
    });
    console.log('Attendance logs method response:', res);
  const data = normalizeAttendanceLogs(res?.message ?? []);
    return { ok: true, data };
  } catch (err: any) {
    const message = err?.message || 'Failed to fetch attendance logs';
    console.error('getAttendanceLogs method failed', message);
    return { ok: false, message };
  }
};
