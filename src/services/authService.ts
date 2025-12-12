import { ERP_URL_METHOD } from '../config/env';

export const login = async (username: string, password: string) => {
  try {
    const url = `${ERP_URL_METHOD}/api/method/login`;
    console.log('Calling ERPNext login API at:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usr: username, pwd: password }),
    });

    if (!response.ok) {
      console.error('ERPNext login failed with status:', response.status);
      const text = await response.text();
      console.error('Response text:', text);
      return null;
    }

    const data = await response.json();
    console.log('ERPNext login response:', data);
    return data;

  } catch (error: any) {
    console.error('ERPNext login API error:', error.message || error);
    return null;
  }
};

