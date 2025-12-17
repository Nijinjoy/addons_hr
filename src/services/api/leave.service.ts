import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApi } from './axiosInstance';
import {
  applyLeave as createLeaveApplication,
  computeLeaveBalances,
  fetchLeaveHistory,
  resolveEmployeeIdForUser,
  LeaveBalance,
  LeaveHistoryItem,
} from '../leaves';

const persistCompanyUrl = async (companyUrl?: string) => {
  const url = (companyUrl || '').trim();
  if (!url) return;
  try {
    await AsyncStorage.setItem('company_url', url);
  } catch {
    // ignore storage errors
  }
};

// Ensure axios base is set for the given company (stores URL for fetch-based helpers too)
const bootstrapCompany = async (companyUrl?: string) => {
  await persistCompanyUrl(companyUrl);
  await createApi(companyUrl);
};

export const getLeaveBalance = async (
  companyUrl: string,
  employee: string,
  leaveType?: string
): Promise<LeaveBalance[]> => {
  await bootstrapCompany(companyUrl);

  let employeeId = String(employee || '').trim();
  if (!employeeId) throw new Error('Employee id is required');

  // Attempt to resolve Employee doc name if an email/user id is provided
  const resolved = await resolveEmployeeIdForUser(employeeId);
  if (resolved) employeeId = resolved;

  const balances = await computeLeaveBalances(employeeId);
  return leaveType ? balances.filter((b) => b.leave_type === leaveType) : balances;
};

export type ApplyLeaveParams = {
  companyUrl: string;
  employee: string;
  leave_type: string;
  from_date: string; // YYYY-MM-DD
  to_date: string; // YYYY-MM-DD
  description?: string;
  company?: string;
};

export const applyLeave = async (params: ApplyLeaveParams) => {
  await bootstrapCompany(params.companyUrl);

  const employeeId = String(params.employee || '').trim();
  if (!employeeId) throw new Error('Employee id is required');

  return createLeaveApplication({
    employee: employeeId,
    leave_type: params.leave_type,
    from_date: params.from_date,
    to_date: params.to_date,
    description: params.description,
    company: params.company,
  });
};

export const getLeaveApplications = async (
  companyUrl: string,
  employee: string,
  limit: number = 50
): Promise<LeaveHistoryItem[]> => {
  await bootstrapCompany(companyUrl);

  let employeeId = String(employee || '').trim();
  if (!employeeId) throw new Error('Employee id is required');

  const resolved = await resolveEmployeeIdForUser(employeeId);
  if (resolved) employeeId = resolved;

  return fetchLeaveHistory(employeeId, limit);
};
