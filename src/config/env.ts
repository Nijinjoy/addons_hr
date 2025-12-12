// config/env.ts
import Config from 'react-native-config';
import { Buffer } from 'buffer';

// Polyfill Buffer globally if needed (only once in your project entry point, e.g., index.js)
// import { Buffer } from 'buffer';
// global.Buffer = global.Buffer || Buffer;

export const ERP_APIKEY = Config.ERP_APIKEY || '';
export const ERP_SECRET = Config.ERP_SECRET || '';
export const ERP_URL_RESOURCE = Config.ERP_URL_RESOURCE || '';
export const ERP_URL_METHOD = Config.ERP_URL_METHOD || '';

// Create Basic Auth header safely
export const AUTH_HEADER =
  ERP_APIKEY && ERP_SECRET
    ? 'Basic ' + Buffer.from(`${ERP_APIKEY}:${ERP_SECRET}`).toString('base64')
    : '';

console.log('ENV CONFIG loaded — ERP_URL_METHOD:', ERP_URL_METHOD);
console.log('AUTH_HEADER generated:', AUTH_HEADER ? '✅' : '❌');
