import { getResourceUrl } from './urlService';

export const getEmployeeProfile = async (employeeID: string) => {
  try {
    const baseResource = (await getResourceUrl()) || '';
    if (!baseResource) throw new Error('ERP base URL not configured');

    const response = await fetch(`${baseResource}/Employee/${employeeID}`, {
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
