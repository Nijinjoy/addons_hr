import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  computeLeaveBalances,
  resolveEmployeeIdForUser,
  fetchLeaveHistory,
  LeaveHistoryItem,
} from './leaves';

type LeaveBalanceParams = {
  employee: string;
  leaveType?: string;
  date?: string; // ISO date, defaults to today
};

type LeaveBalanceResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

type LeaveHistoryParams = {
  employee: string;
  limit?: number;
};

type LeaveHistoryResult =
  | { ok: true; data: LeaveHistoryItem[] }
  | { ok: false; message: string; status?: number; raw?: string };

type ApplyLeaveInput = {
  employee: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  reason?: string;
};

type ApplyLeaveResult =
  | { ok: true; data: any }
  | { ok: false; message: string; status?: number; raw?: string };

// Simple memoization to avoid back-to-back identical calls
let lastKey = '';
let lastValue: LeaveBalanceResult | null = null;

export const getLeaveBalance = async (params: LeaveBalanceParams): Promise<LeaveBalanceResult> => {
  const { employee, leaveType, date = new Date().toISOString().slice(0, 10) } = params;
  const rawEmployee = String(employee || '').trim();
  const cacheKey = `${rawEmployee}::${leaveType || 'all'}::${date}`;

  if (lastKey === cacheKey && lastValue) {
    return lastValue;
  }

  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      const result: LeaveBalanceResult = { ok: false, message: 'No active session. Please log in.' };
      lastKey = cacheKey;
      lastValue = result;
      return result;
    }

    if (!rawEmployee) {
      const result: LeaveBalanceResult = { ok: false, message: 'Employee id not found. Please log in.' };
      lastKey = cacheKey;
      lastValue = result;
      return result;
    }

    let employeeId = rawEmployee;
    const employeeCacheKey = `employee_id_for_${encodeURIComponent(rawEmployee)}`;
    try {
      const cachedId = await AsyncStorage.getItem(employeeCacheKey);
      if (cachedId) employeeId = cachedId;
    } catch {
      // ignore storage errors
    }

    // Use robust balances aggregator from services/leaves (uses API key auth with multiple fallbacks)
    let balances = await computeLeaveBalances(employeeId);

    // If we used the login user id (email) and got nothing, try resolving Employee doc name
    if (balances.length === 0 && employeeId === rawEmployee) {
      const resolved = await resolveEmployeeIdForUser(rawEmployee);
      if (resolved) {
        employeeId = resolved;
        try {
          await AsyncStorage.setItem(employeeCacheKey, resolved);
        } catch {
          // ignore storage errors
        }
        balances = await computeLeaveBalances(employeeId);
      }
    }

    const filtered = leaveType ? balances.filter((b) => b.leave_type === leaveType) : balances;
    const result: LeaveBalanceResult = { ok: true, data: filtered };
    lastKey = cacheKey;
    lastValue = result;
    return result;
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching leave balance';
    console.log('Leave balance error:', message);
    const result: LeaveBalanceResult = { ok: false, message };
    lastKey = cacheKey;
    lastValue = result;
    return result;
  }
};

export const getLeaveHistory = async (params: LeaveHistoryParams): Promise<LeaveHistoryResult> => {
  const { employee, limit = 50 } = params;
  const rawEmployee = String(employee || '').trim();

  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) {
      return { ok: false, message: 'No active session. Please log in.' };
    }

    if (!rawEmployee) {
      return { ok: false, message: 'Employee id not found. Please log in.' };
    }

    let employeeId = rawEmployee;
    const employeeCacheKey = `employee_id_for_${encodeURIComponent(rawEmployee)}`;
    try {
      const cachedId = await AsyncStorage.getItem(employeeCacheKey);
      if (cachedId) employeeId = cachedId;
    } catch {
      // ignore storage errors
    }

    let history = await fetchLeaveHistory(employeeId, limit);
    if (history.length === 0 && employeeId === rawEmployee) {
      const resolved = await resolveEmployeeIdForUser(rawEmployee);
      if (resolved) {
        employeeId = resolved;
        try {
          await AsyncStorage.setItem(employeeCacheKey, resolved);
        } catch {
          // ignore storage errors
        }
        history = await fetchLeaveHistory(employeeId, limit);
      }
    }

    return { ok: true, data: history };
  } catch (error: any) {
    const message = error?.message || 'Unexpected error while fetching leave history';
    console.log('Leave history error:', message);
    return { ok: false, message };
  }
};

export const applyLeave = async (input: ApplyLeaveInput): Promise<ApplyLeaveResult> => {
  const rawEmployee = String(input.employee || '').trim();
  if (!rawEmployee) return { ok: false, message: 'Employee id is required.' };
  if (!input.leave_type) return { ok: false, message: 'Leave type is required.' };
  if (!input.from_date || !input.to_date) return { ok: false, message: 'From and To dates are required.' };

  try {
    const sid = await AsyncStorage.getItem('sid');
    if (!sid) return { ok: false, message: 'No active session. Please log in.' };

    const payload: Record<string, any> = {
      employee: rawEmployee,
      leave_type: input.leave_type,
      from_date: input.from_date,
      to_date: input.to_date,
    };
    if (input.reason) {
      payload.reason = input.reason;
      payload.description = input.reason;
    }

    const res = await fetch(`https://addonsajith.frappe.cloud/api/resource/Leave Application`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `sid=${sid}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }

    if (!res.ok) {
      const message =
        json?.message || json?.exception || json?._server_messages || `Request failed with status ${res.status}`;
      return { ok: false, message: typeof message === 'string' ? message : 'Failed to apply leave', raw: text };
    }

    return { ok: true, data: json?.data ?? json ?? true };
  } catch (error: any) {
    return { ok: false, message: error?.message || 'Unexpected error while applying leave' };
  }
};
