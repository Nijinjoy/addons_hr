import EncryptedStorage from 'react-native-encrypted-storage';


const SESSION_KEY = 'ADDONS_SESSION';


export const saveSession = async (data: any) => {
await EncryptedStorage.setItem(SESSION_KEY, JSON.stringify(data));
};


export const getSession = async () => {
const session = await EncryptedStorage.getItem(SESSION_KEY);
return session ? JSON.parse(session) : null;
};


export const clearSession = async () => {
await EncryptedStorage.removeItem(SESSION_KEY);
};