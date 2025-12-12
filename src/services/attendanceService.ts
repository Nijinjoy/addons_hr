import { AUTH_HEADER, ERP_URL_METHOD } from '../config/env';

export const loginService = async (email: string, password: string) => {
  try {
    const url = `${ERP_URL_METHOD}/login`;
    console.log('loginService calling URL:', url);
    console.log('loginService headers:', { Authorization: AUTH_HEADER });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: AUTH_HEADER,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        usr: email,
        pwd: password,
      }),
    });

    const data = await response.json();

    return data;
  } catch (error: any) {
    console.error('Login API error:', error.message || error);
    return null;
  }
};
