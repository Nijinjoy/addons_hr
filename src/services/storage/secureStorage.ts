import AsyncStorage from '@react-native-async-storage/async-storage';

// Lazy load encrypted storage to avoid undefined errors
let EncryptedStorage: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  EncryptedStorage = require('react-native-encrypted-storage');
} catch {
  EncryptedStorage = null;
}

const SESSION_KEY = 'ADDONS_SESSION';
const hasEncrypted =
  EncryptedStorage &&
  typeof EncryptedStorage.setItem === 'function' &&
  typeof EncryptedStorage.getItem === 'function' &&
  typeof EncryptedStorage.removeItem === 'function';

const setItem = async (key: string, value: string) => {
  if (hasEncrypted) return EncryptedStorage.setItem(key, value);
  return AsyncStorage.setItem(key, value);
};

const getItem = async (key: string) => {
  if (hasEncrypted) return EncryptedStorage.getItem(key);
  return AsyncStorage.getItem(key);
};

const removeItem = async (key: string) => {
  if (hasEncrypted) return EncryptedStorage.removeItem(key);
  return AsyncStorage.removeItem(key);
};

export const saveSession = async (data: any) => {
  await setItem(SESSION_KEY, JSON.stringify(data));
};

export const getSession = async () => {
  const session = await getItem(SESSION_KEY);
  return session ? JSON.parse(session) : null;
};

export const clearSession = async () => {
  await removeItem(SESSION_KEY);
};
