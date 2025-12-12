import { AUTH_HEADER, ERP_URL_RESOURCE } from '../config/env';

export const getEmployeeProfile = async (employeeID: string) => {
  try {
    const response = await fetch(
      `${ERP_URL_RESOURCE}/Employee/${employeeID}`,
      {
        method: 'GET',
        headers: {
          Authorization: AUTH_HEADER,
          'Content-Type': 'application/json',
        },
      }
    );

    return await response.json();
  } catch (error) {
    console.error('Employee fetch error:', error);
    return null;
  }
};
