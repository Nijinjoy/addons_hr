import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosInstance } from 'axios';
import { getApiKeySecret } from '../urlService';

let api: AxiosInstance | null = null;
let apiBase: string | null = null;

const normalizeBase = (base?: string): string => {
  const trimmed = (base || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.endsWith('/api/method') || trimmed.endsWith('/api/resource')) return trimmed;
  if (trimmed.endsWith('/api')) return `${trimmed}/method`;
  if (trimmed.endsWith('/api/')) return `${trimmed}method`;
  return `${trimmed}/api/method`;
};

const resolveBaseUrl = async (companyUrl?: string): Promise<string> => {
  const direct = normalizeBase(companyUrl);
  if (direct) return direct;

  try {
    const stored = normalizeBase(await AsyncStorage.getItem('company_url'));
    if (stored) return stored;
  } catch {
  }

  return '';
};

export const createApi = async (companyUrl?: string): Promise<AxiosInstance> => {
  const baseURL = await resolveBaseUrl(companyUrl);
  if (!baseURL) throw new Error('Company URL is not configured. Please log in again.');

  if (api && apiBase === baseURL) return api;

  apiBase = baseURL;
  api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  api.interceptors.request.use(async (config) => {
    const headers = (config.headers = config.headers || {});

    const { apiKey, apiSecret } = getApiKeySecret();
    if (apiKey && apiSecret && !headers.Authorization) {
      headers.Authorization = `token ${apiKey}:${apiSecret}`;
    }

    try {
      const sid = await AsyncStorage.getItem('sid');
      if (sid && !headers.Cookie) {
        headers.Cookie = `sid=${sid}`;
      }
    } catch {
      // ignore storage errors
    }

    return config;
  });

  return api;
};

export const getApi = (): AxiosInstance => {
  if (!api) throw new Error('API not initialized. Call createApi first.');
  return api;
};

export const ensureApi = async (companyUrl?: string): Promise<AxiosInstance> => {
  if (api) return api;
  return createApi(companyUrl);
};

export const clearApi = () => {
  api = null;
  apiBase = null;
};
