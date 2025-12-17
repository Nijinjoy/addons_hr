import { createApi, getApi } from './axiosInstance';

export const login = async (companyUrl: string, email: string, password: string) => {
  const api = await createApi(companyUrl);

  await api.post('/login', {
    usr: email,
    pwd: password,
  });

  const userRes = await api.get(`/api/resource/User/${encodeURIComponent(email)}`);
  return userRes.data.data;
};

export const logout = async () => {
  const api = getApi();
  await api.post('/logout');
};
