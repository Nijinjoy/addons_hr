import { createApi, clearApi } from '../api/axiosInstance';
import { saveSession, clearSession } from './secureStorage';

// Central session handling
export const startSession = async (session: any) => {
createApi(session.companyUrl);
await saveSession(session);
};


export const endSession = async () => {
clearApi();
await clearSession();
};