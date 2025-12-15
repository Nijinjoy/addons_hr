// config/env.ts
import Config from 'react-native-config';
import { Buffer } from 'buffer';

const DEFAULT_URL_METHOD = 'https://addonsajith.frappe.cloud/api/method';
const DEFAULT_URL_RESOURCE = 'https://addonsajith.frappe.cloud/api/resource';

const pick = (...values: (string | undefined | null)[]): string => {
  for (const v of values) {
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return '';
};

// Polyfill Buffer globally if needed (only once in your project entry point, e.g., index.js)
// import { Buffer } from 'buffer';
// global.Buffer = global.Buffer || Buffer;

export const ERP_APIKEY = pick(Config.ERP_APIKEY, process.env?.ERP_APIKEY);
export const ERP_SECRET = pick(Config.ERP_SECRET, process.env?.ERP_SECRET);
export const ERP_URL_RESOURCE = pick(Config.ERP_URL_RESOURCE, process.env?.ERP_URL_RESOURCE, DEFAULT_URL_RESOURCE);
export const ERP_URL_METHOD = pick(Config.ERP_URL_METHOD, process.env?.ERP_URL_METHOD, DEFAULT_URL_METHOD);

// Create Basic Auth header safely
export const AUTH_HEADER =
  ERP_APIKEY && ERP_SECRET
    ? 'Basic ' + Buffer.from(`${ERP_APIKEY}:${ERP_SECRET}`).toString('base64')
    : '';

console.log('ENV CONFIG loaded — ERP_URL_METHOD:', ERP_URL_METHOD || '❌ missing');
console.log('AUTH_HEADER generated:', AUTH_HEADER ? '✅' : '❌');
