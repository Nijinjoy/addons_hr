
export const validateEmail = (email: string): string => {
  if (!email.trim()) return 'Email is required';

  // Check email format
  const emailRegex = /^[^\s@]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email.trim())) return 'Invalid email id';

  // Check domain
  const domain = email.split('@')[1];
  if (domain.toLowerCase() !== 'addon-s.com') return 'Email must be @addon-s.com';

  return '';
};

export const validatePassword = (password: string): string => {
  if (!password.trim()) return 'Password is required';

  const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,}$/;
  if (!passwordRegex.test(password)) return 'Password must be at least 6 characters and contain letters and numbers';

  return '';
};

export const validateLogin = (email: string, password: string) => {
  return {
    email: validateEmail(email),
    password: validatePassword(password),
  };
};
