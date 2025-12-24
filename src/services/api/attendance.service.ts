import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMethodUrl, getResourceUrl, getApiKeySecret } from '../urlService';

type AttendanceResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

const logAttendanceResult = (label: string, result: AttendanceResult, meta?: Record<string, any>) => {
  const payload = meta ? { ...meta, result } : { result };
  console.log(`[attendance] ${label}:`, payload);
};

const logGeocode = (label: string, data: any) => {
  console.log(`[attendance][geocode] ${label}:`, data);
};
type CheckInParams = {
  companyUrl?: string;
  employee: string;
  logType?: 'IN' | 'OUT' | 'AUTO';
  coords?: { latitude?: number; longitude?: number };
  locationLabel?: string; // optional human-friendly label if available
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

const isValidCoord = (n?: number) => typeof n === 'number' && !Number.isNaN(n);
const reverseGeocodeLocation = async (coords?: { latitude?: number; longitude?: number }): Promise<string | undefined> => {
  if (!coords?.latitude && !coords?.longitude) return undefined;
  const lat = coords.latitude;
  const lon = coords.longitude;
  if (lat == null || lon == null) return undefined;

  const tryMapsCo = async () => {
    // OpenStreetMap-backed free endpoint
    const url = `https://geocode.maps.co/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'addons-hr-app/1.0 (reverse-geocode)' } });
    if (!res.ok) return undefined;
    const data: any = await res.json();
    const display = data?.display_name;
    if (display && typeof display === 'string') return display;
    return undefined;
  };

  const tryBigDataCloud = async () => {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lon)}&localityLanguage=en`;
    const res = await fetch(url, { headers: { 'User-Agent': 'addons-hr-app/1.0 (reverse-geocode)' } });
    if (!res.ok) return undefined;
    const data: any = await res.json();
    const parts = [data.city, data.locality, data.principalSubdivision, data.countryName]
      .map((p) => (p || '').trim())
      .filter(Boolean);
    const place = parts.join(', ');
    return place || data?.localityInfo?.informative?.[0]?.name || undefined;
  };

  const tryNominatim = async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=0`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'addons-hr-app/1.0 (reverse-geocode)' },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return undefined;
      const data: any = await res.json();
      const display = data?.display_name;
      if (display && typeof display === 'string') return display;
    } catch {
      clearTimeout(timeout);
    }
    return undefined;
  };

  // Try BigDataCloud first, then Nominatim
  return (await tryBigDataCloud()) || (await tryNominatim()) || (await tryMapsCo());
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
    const error: any = new Error(typeof msg === 'string' ? msg : 'Request failed');
    error.status = res.status;
    error.raw = text;
    throw error;
  }

  return (json as T) ?? (text as unknown as T);
};

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

const isMethodMissing = (err: any): boolean => {
  const msg = String(err?.message || err || '').toLowerCase();
  return (
    msg.includes('no module named') ||
    msg.includes('has no attribute') ||
    msg.includes('not found') ||
    msg.includes('failed to get method')
  );
};

const logMethodFailure = (path: string, err: any) => {
  const msg = err?.message || err;
  if (isMethodMissing(err)) {
    console.log(`checkIn method ${path} unavailable (${msg}); falling back`);
  } else {
    console.warn(`checkIn method ${path} failed`, msg);
  }
};

export const checkIn = async ({
  companyUrl,
  employee,
  logType = 'IN',
  coords,
  locationLabel,
}: CheckInParams): Promise<AttendanceResult> => {
  await persistCompanyUrl(companyUrl);

  const emp = String(employee || '').trim();
  if (!emp) return { ok: false, message: 'Employee id is required' };

  const payload: Record<string, any> = {
    employee: emp,
    log_type: logType,
  };
  if (coords?.latitude != null && coords?.longitude != null) {
    payload.latitude = coords.latitude;
    payload.longitude = coords.longitude;
  }
  const coordsString =
    payload.latitude != null && payload.longitude != null
      ? `${Number(payload.latitude).toFixed(6)},${Number(payload.longitude).toFixed(6)}`
      : undefined;
  const locationText = locationLabel || (await reverseGeocodeLocation(coords));
  logGeocode('initial', {
    coords,
    locationText,
  });
  const friendlyCoords = coordsString ? `Lat ${coordsString.split(',')[0]}, Lon ${coordsString.split(',')[1]}` : undefined;
  if (locationText) {
    payload.location = locationText;
    payload.mobile_id = locationText;
    payload.device_id = locationText;
  } else {
    payload.device_id = friendlyCoords || 'mobile';
    payload.mobile_id = friendlyCoords || undefined;
    payload.location = friendlyCoords || undefined;
  }

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
      const out: AttendanceResult = { ok: true, data: (res as any)?.message ?? res };
      logAttendanceResult('method success', out, { path });
      return out;
    } catch (err: any) {
      logMethodFailure(path, err);
      if (isMethodMissing(err)) {
        break;
      }
    }
  }

  try {
    const body = {
      employee: emp,
      log_type: logType,
      device_id: payload.device_id || coordsString || 'mobile',
      time: formatLocalTimestamp(new Date()),
      latitude: payload.latitude,
      longitude: payload.longitude,
      location: payload.location || coordsString,
      mobile_id: payload.mobile_id || coordsString,
    };
    const { baseResource } = await getBases();
    if (!baseResource) throw new Error('ERP base URL not configured');
    const resResource = await requestJSON<{ data?: any }>(`${baseResource}/Employee%20Checkin`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    const resData = (resResource as any)?.data ?? resResource;

    // Attempt to improve location with server-recorded coords (address only)
    const bestCoords = {
      latitude: resData?.latitude ?? payload.latitude,
      longitude: resData?.longitude ?? payload.longitude,
    };
    const betterLocation = await reverseGeocodeLocation(bestCoords);
    logGeocode('post-insert', { bestCoords, betterLocation });

    if (betterLocation && resData?.name && betterLocation !== resData?.location) {
      try {
        await requestJSON(`${baseResource}/Employee%20Checkin/${encodeURIComponent(resData.name)}`, {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({
            location: betterLocation,
            mobile_id: betterLocation,
            device_id: betterLocation,
          }),
        });
        resData.location = betterLocation;
        resData.mobile_id = betterLocation;
        resData.device_id = betterLocation;
      } catch (updateErr) {
        console.log('Failed to update check-in location after reverse geocode:', updateErr?.message || updateErr);
      }
    } else if (coordsString && resData?.name && (!resData?.location || resData?.location === 'mobile')) {
      try {
        const friendlyCoords = `Lat ${coordsString.split(',')[0]}, Lon ${coordsString.split(',')[1]}`;
        await requestJSON(`${baseResource}/Employee%20Checkin/${encodeURIComponent(resData.name)}`, {
          method: 'PUT',
          headers: await authHeaders(),
          body: JSON.stringify({
            location: friendlyCoords,
            mobile_id: friendlyCoords,
            device_id: friendlyCoords,
          }),
        });
        resData.location = friendlyCoords;
        resData.mobile_id = friendlyCoords;
        resData.device_id = friendlyCoords;
      } catch (updateErr) {
        console.log('Failed to update check-in location with coords:', updateErr?.message || updateErr);
      }
    }

    const out: AttendanceResult = { ok: true, data: resData };
    logAttendanceResult('resource success', out);
    return out;
  } catch (errRes: any) {
    console.error('checkIn resource fallback failed', errRes?.message || errRes);
    const out: AttendanceResult = { ok: false, message: errRes?.message || 'Failed to check in' };
    logAttendanceResult('resource failure', out);
    return out;
  }
};

export const checkOut = async (params: Omit<CheckInParams, 'logType'>): Promise<AttendanceResult> => {
  const result = await checkIn({ ...params, logType: 'OUT' });
  logAttendanceResult('checkout', result);
  return result;
};
