import { ERP_URL_RESOURCE } from '../config/env';

const BASE_URL = (ERP_URL_RESOURCE || '').replace(/\/$/, '');

export const getEmployeeProfile = async (employeeID: string) => {
  try {
    const response = await fetch(`${BASE_URL}/Employee/${employeeID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await response.json();
  } catch (error) {
    console.error('Employee fetch error:', error);
    return null;
  }
};
