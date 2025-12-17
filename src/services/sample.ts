import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMethodUrl } from './urlService';

type LoginResult =
  | { ok: true; data: any; cookies?: Record<string, string> }
  | { ok: false; status?: number; message: string; raw?: string; cookies?: Record<string, string> };

const parseServerMessages = (payload: any): string | undefined => {
  try {
    const messages = payload?._server_messages ? JSON.parse(payload._server_messages) : [];
    if (messages.length) {
      const parsed = JSON.parse(messages[0]);
      return parsed?.message;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

export const login = async (username: string, password: string, companyUrl?: string): Promise<LoginResult> => {
  try {
    const methodBase = companyUrl ? companyUrl.trim() : await getMethodUrl();
    if (!methodBase) {
      const message = 'ERP method URL is not configured. Please provide a company URL.';
      console.error(message);
      return { ok: false, message };
    }
    const normalizedBase = methodBase.endsWith('/api/method')
      ? methodBase
      : methodBase.endsWith('/api/resource')
      ? methodBase.replace(/\/api\/resource$/, '/api/method')
      : methodBase.endsWith('/api')
      ? `${methodBase}/method`
      : methodBase.endsWith('/api/')
      ? `${methodBase}method`
      : `${methodBase.replace(/\/+$/, '')}/api/method`;

    const url = `${normalizedBase}/login`;
    console.log('Calling ERPNext login API at:', url);
    console.log('Login payload (sanitized):', { username, pwdLength: password?.length || 0 });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usr: username, pwd: password }),
    });

    const rawText = await response.text();
    console.log('ERPNext login raw response text:', rawText);
    console.log('ERPNext login response status:', response.status);
    console.log('ERPNext login response headers:', Object.fromEntries(response.headers.entries?.() || []));

    const setCookieHeader = response.headers?.get?.('set-cookie') || '';
    const cookies = extractCookies(setCookieHeader);

    let parsed: any = null;
    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const serverMessage = parseServerMessages(parsed);
      console.error('ERPNext login failed with status:', response.status);
      return {
        ok: false,
        status: response.status,
        message: serverMessage || parsed?.message || parsed?.exception || 'Login failed',
        raw: rawText,
        cookies,
      };
    }

    console.log('ERPNext login response JSON:', parsed);
    return { ok: true, data: parsed, cookies };
  } catch (error: any) {
    console.error('ERPNext login API error:', error.message || error);
    return { ok: false, message: error.message || 'Unexpected error' };
  }
};

const extractCookies = (setCookieHeader: string): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!setCookieHeader) return result;

  const regex = /(?:^|,)\s*([^=;]+)=([^;]+)/g;
  let match;
  while ((match = regex.exec(setCookieHeader)) !== null) {
    const key = match[1]?.trim();
    const value = match[2]?.trim();
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
};

export const logout = async (): Promise<{ ok: boolean; message?: string }> => {
  try {
    try {
      const base = (await getMethodUrl()) || '';
      if (base) {
        await fetch(`${base}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      }
    } catch (err: any) {
      console.warn('logout API call failed (continuing with local logout):', err?.message || err);
    }

    try {
      await AsyncStorage.multiRemove(['sid', 'full_name', 'user_id', 'user_image', 'employee_id']);
    } catch (err2) {
      console.warn('Error clearing storage during logout:', err2);
    }

    return { ok: true };
  } catch (error: any) {
    console.error('logout error:', error?.message || error);
    return { ok: false, message: error?.message || 'Failed to logout' };
  }
};

  const handleLogin = async () => {
    if (loading) return;
    setLoginError('');
    setCompanyUrlError('');
    const urlError = validateCompanyUrl(companyUrl);
    if (urlError) {
      setCompanyUrlError(urlError);
      return;
    }

    try {
      await AsyncStorage.setItem('company_url', companyUrl.trim());
    } catch {
      // ignore storage errors
    }

    const errors = validateLogin(email, password);
    setEmailError(errors.email);
    setPasswordError(errors.password);
    if (errors.email || errors.password) return;

    try {
      setLoading(true);
      console.log('LoginScreen: attempting login with email', email);
      const response = await authLogin(email, password, companyUrl);
      console.log('LoginScreen response:', response);

      if (!response.ok) {
        const message = response.message || 'Unable to login. Please check your credentials and try again.';
        setLoginError(message);
        Alert.alert('Login Failed', message);
      } else {
        const cookies = response.cookies || {};
        const toStore: [string, string][] = [];
        if (cookies.sid) toStore.push(['sid', cookies.sid]);
        if (cookies.full_name) toStore.push(['full_name', cookies.full_name]);
        if (cookies.user_id) toStore.push(['user_id', decodeURIComponent(cookies.user_id)]);
        if (cookies.user_image) toStore.push(['user_image', cookies.user_image]);

        if (toStore.length) {
          try {
            await AsyncStorage.multiSet(toStore);
            console.log('Stored login cookies:', toStore.map(([k, v]) => ({ key: k, length: v.length })));
          } catch (storageError) {
            console.log('Error storing login cookies:', storageError);
          }
        }
        try {
          const userKey = decodeURIComponent(cookies.user_id || email);
          const employeeId = await resolveEmployeeIdForUser(userKey);
          if (employeeId) {
            const employeePairs: [string, string][] = [
              ['employee_id', employeeId],
              [`employee_id_for_${encodeURIComponent(userKey)}`, employeeId],
            ];
            await AsyncStorage.multiSet(employeePairs);
            console.log('Stored employee id:', employeePairs);
          } else {
            console.log('No employee id resolved for user:', userKey);
          }
        } catch (err) {
          console.log('Failed to resolve employee id after login:', err);
        }
        try {
          const employeeId = (await AsyncStorage.getItem('employee_id')) || '';
          if (employeeId) {
            const checkInRes = await checkIn(employeeId, 'IN');
            console.log('Login check-in response:', checkInRes);
            await AsyncStorage.setItem('last_checkin_response', JSON.stringify(checkInRes));
          } else {
            console.log('No employee id available for immediate check-in after login');
          }
        } catch (checkErr: any) {
          console.log('Immediate check-in after login failed:', checkErr?.message || checkErr);
        }

        // Reset to root dashboard after login
        navigation.getParent()?.reset({
          index: 0,
          routes: [{ name: 'Dashboard' as never }],
        });
      }
    } catch (error) {
      console.log('Login error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };