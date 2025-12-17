import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERP_URL_METHOD, ERP_URL_RESOURCE, ERP_APIKEY, ERP_SECRET } from '../config/env';

const clean = (value?: string | null): string => (value || '').trim().replace(/\/+$/, '');

const normalizeBase = (base?: string): string => {
  const trimmed = clean(base);
  if (!trimmed) return '';
  if (trimmed.endsWith('/api/method') || trimmed.endsWith('/api/resource')) return trimmed;
  return trimmed;
};

export const getMethodUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem('company_url');
    const base = normalizeBase(stored) || normalizeBase(ERP_URL_METHOD) || normalizeBase(ERP_URL_RESOURCE);
    if (!base) return '';
    if (base.endsWith('/api/method')) return base;
    if (base.endsWith('/api/resource')) return base.replace(/\/api\/resource$/, '/api/method');
    if (base.endsWith('/api')) return `${base}/method`;
    if (base.endsWith('/api/')) return `${base}method`;
    return `${base}/api/method`;
  } catch {
    const fallback = normalizeBase(ERP_URL_METHOD) || normalizeBase(ERP_URL_RESOURCE);
    if (!fallback) return '';
    if (fallback.endsWith('/api/method')) return fallback;
    if (fallback.endsWith('/api/resource')) return fallback.replace(/\/api\/resource$/, '/api/method');
    return `${fallback}/api/method`;
  }
};

export const getResourceUrl = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem('company_url');
    const base = normalizeBase(stored) || normalizeBase(ERP_URL_RESOURCE) || normalizeBase(ERP_URL_METHOD);
    if (!base) return '';
    if (base.endsWith('/api/resource')) return base;
    if (base.endsWith('/api/method')) return base.replace(/\/api\/method$/, '/api/resource');
    if (base.endsWith('/api')) return `${base}/resource`;
    if (base.endsWith('/api/')) return `${base}resource`;
    return `${base}/api/resource`;
  } catch {
    const fallback = normalizeBase(ERP_URL_RESOURCE) || normalizeBase(ERP_URL_METHOD);
    if (!fallback) return '';
    if (fallback.endsWith('/api/resource')) return fallback;
    if (fallback.endsWith('/api/method')) return fallback.replace(/\/api\/method$/, '/api/resource');
    return `${fallback}/api/resource`;
  }
};

export const getApiKeySecret = () => ({
  apiKey: clean(ERP_APIKEY),
  apiSecret: clean(ERP_SECRET),
});
