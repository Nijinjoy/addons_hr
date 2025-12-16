import AsyncStorage from '@react-native-async-storage/async-storage';
import { resolveEmployeeIdForUser } from './leaves';
import { ERP_URL_METHOD, ERP_URL_RESOURCE, ERP_APIKEY, ERP_SECRET } from '../config/env';

type ProfileData = {
  fullName?: string;
  email?: string;
  userId?: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  company?: string;
  phone?: string;
  image?: string;
  initial?: string;
};

type ProfileResult =
  | { ok: true; data: ProfileData }
  | { ok: false; message: string; status?: number; raw?: string };

type FileUpload = { uri: string; name?: string; type?: string };

const BASE_URL = (ERP_URL_RESOURCE || '').replace(/\/$/, '');

const siteBase = () => {
  if (!BASE_URL) return '';
  if (BASE_URL.endsWith('/api/resource')) return BASE_URL.replace(/\/api\/resource$/, '');
  return BASE_URL;
};

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

const fetchEmployeeProfile = async (employeeId: string): Promise<Partial<ProfileData>> => {
  const fields = [
    'name',
    'employee_name',
    'user_id',
    'designation',
    'department',
    'company',
    'image',
    'cell_number',
    'personal_email',
    'company_email',
  ];

  // Try resource doc fetch
  if (BASE_URL) {
    try {
      const url = buildQuery(`${BASE_URL}/Employee/${encodeURIComponent(employeeId)}`, {
        fields: JSON.stringify(fields),
      });
      const res = await requestJSON<{ data?: any }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const d = (res as any)?.data ?? res;
      return {
        employeeId: d?.name || employeeId,
        fullName: d?.employee_name,
        userId: d?.user_id,
        designation: d?.designation,
        department: d?.department,
        company: d?.company,
        image: d?.image,
        phone: d?.cell_number,
        email: d?.company_email || d?.personal_email,
      };
    } catch (err) {
      console.warn('fetchEmployeeProfile resource failed', (err as any)?.message || err);
    }
  }

  // Fallback method get
  try {
    const res = await requestJSON<{ message?: any }>(`${METHOD_URL}/frappe.client.get`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        doctype: 'Employee',
        name: employeeId,
        fields,
      }),
    });
    const d = (res as any)?.message ?? res;
    return {
      employeeId: d?.name || employeeId,
      fullName: d?.employee_name,
      userId: d?.user_id,
      designation: d?.designation,
      department: d?.department,
      company: d?.company,
      image: d?.image,
      phone: d?.cell_number,
      email: d?.company_email || d?.personal_email,
    };
  } catch (err2) {
    console.warn('fetchEmployeeProfile method failed', (err2 as any)?.message || err2);
    return {};
  }
};

const fetchUserProfile = async (userId: string): Promise<Partial<ProfileData>> => {
  if (!userId) return {};
  const fields = ['name', 'full_name', 'email', 'user_image'];

  if (BASE_URL) {
    try {
      const url = buildQuery(`${BASE_URL}/User/${encodeURIComponent(userId)}`, {
        fields: JSON.stringify(fields),
      });
      const res = await requestJSON<{ data?: any }>(url, {
        method: 'GET',
        headers: await authHeaders(),
      });
      const d = (res as any)?.data ?? res;
      return {
        userId: d?.name || userId,
        fullName: d?.full_name,
        email: d?.email,
        image: d?.user_image,
      };
    } catch (err) {
      console.warn('fetchUserProfile resource failed', (err as any)?.message || err);
    }
  }

  try {
    const res = await requestJSON<{ message?: any }>(`${METHOD_URL}/frappe.client.get`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        doctype: 'User',
        name: userId,
        fields,
      }),
    });
    const d = (res as any)?.message ?? res;
    return {
      userId: d?.name || userId,
      fullName: d?.full_name,
      email: d?.email,
      image: d?.user_image,
    };
  } catch (err2) {
    console.warn('fetchUserProfile method failed', (err2 as any)?.message || err2);
    return {};
  }
};

export const getProfileDetails = async (): Promise<ProfileResult> => {
  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };

    const storedEmployee = (await AsyncStorage.getItem('employee_id')) || '';
    const storedUser = (await AsyncStorage.getItem('user_id')) || '';

    let employeeId = storedEmployee.trim();
    let userId = storedUser.trim();

    if (!employeeId && userId) {
      const resolved = await resolveEmployeeIdForUser(userId);
      if (resolved) {
        employeeId = resolved;
        try {
          await AsyncStorage.setItem('employee_id', resolved);
        } catch {
          // ignore cache failure
        }
      }
    }

    const employeeProfile = employeeId ? await fetchEmployeeProfile(employeeId) : {};
    const userProfile = userId ? await fetchUserProfile(userId) : {};

    const deriveInitial = (name?: string) => {
      if (!name) return '';
      const trimmed = String(name).trim();
      return trimmed ? trimmed.charAt(0).toUpperCase() : '';
    };

    const data: ProfileData = {
      employeeId: employeeProfile.employeeId || employeeId || userProfile.employeeId,
      userId: userProfile.userId || employeeProfile.userId || userId,
      fullName: employeeProfile.fullName || userProfile.fullName,
      email: userProfile.email || employeeProfile.email,
      designation: employeeProfile.designation,
      department: employeeProfile.department,
      company: employeeProfile.company,
      phone: employeeProfile.phone,
      image: employeeProfile.image || userProfile.image,
      initial:
        deriveInitial(employeeProfile.fullName) ||
        deriveInitial(userProfile.fullName) ||
        deriveInitial(userId || employeeId),
    };

    // Normalize image to absolute URL if relative
    if (data.image && data.image.startsWith('/')) {
      const base = siteBase();
      data.image = base ? `${base}${data.image}` : data.image;
    }

    console.log('profileService: resolved profile data', data);
    return { ok: true, data };
  } catch (error: any) {
    console.log('profileService: error fetching profile', error?.message || error);
    return { ok: false, message: error?.message || 'Failed to load profile' };
  }
};

export const setUserImage = async (imageUrl: string): Promise<ProfileResult> => {
  try {
    const userId = (await AsyncStorage.getItem('user_id')) || '';
    if (!userId) return { ok: false, message: 'User id not found. Please log in.' };

    const res = await requestJSON<{ message?: any }>(`${METHOD_URL}/frappe.client.set_value`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        doctype: 'User',
        name: userId,
        fieldname: 'user_image',
        value: imageUrl || '',
      }),
    });
    const message = (res as any)?.message ?? res;
    const savedImage = typeof message === 'object' ? message?.user_image ?? imageUrl : imageUrl;

    try {
      if (imageUrl) await AsyncStorage.setItem('user_image', savedImage);
      else await AsyncStorage.removeItem('user_image');
    } catch {
      // ignore cache failure
    }

    // Return updated profile snapshot
    const current = await getProfileDetails();
    if (current.ok) {
      return { ok: true, data: { ...current.data, image: savedImage } };
    }
    return { ok: true, data: { image: savedImage } as ProfileData };
  } catch (error: any) {
    console.log('profileService: error setting user image', error?.message || error);
    return { ok: false, message: error?.message || 'Failed to update profile image' };
  }
};

export const uploadProfileImage = async (file: FileUpload): Promise<ProfileResult> => {
  try {
    const userId = (await AsyncStorage.getItem('user_id')) || '';
    if (!userId) return { ok: false, message: 'User id not found. Please log in.' };
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };

    const form = new FormData();
    form.append('file', {
      uri: file.uri,
      name: file.name || 'profile.jpg',
      type: file.type || 'image/jpeg',
    } as any);
    form.append('is_private', '0');

    const res = await fetch(`${METHOD_URL}/upload_file`, {
      method: 'POST',
      headers: {
        Cookie: `sid=${sid}`,
      },
      body: form,
    });
    const raw = await res.text();
    let json: any = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const msg = json?.message || json?.exception || raw || 'Upload failed';
      return { ok: false, message: msg, status: res.status, raw };
    }
    const fileUrl = json?.message?.file_url || json?.message?.file?.file_url || json?.message?.file || json?.file_url;
    const absoluteUrl =
      fileUrl && fileUrl.startsWith('/') && siteBase() ? `${siteBase()}${fileUrl}` : fileUrl;

    if (!fileUrl) {
      return { ok: false, message: 'Upload succeeded but no file URL returned' };
    }

    const setRes = await setUserImage(absoluteUrl || fileUrl);
    if (!setRes.ok) return setRes;
    return { ok: true, data: { ...(setRes.data || {}), image: absoluteUrl || fileUrl } };
  } catch (error: any) {
    console.log('profileService: upload profile image error', error?.message || error);
    return { ok: false, message: error?.message || 'Failed to upload profile image' };
  }
};

export const deleteProfileImage = async (): Promise<ProfileResult> => {
  return setUserImage('');
};

export type { ProfileData, ProfileResult };
