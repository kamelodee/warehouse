export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('accessToken');
  }
  return null;
};

export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('accessToken', token);
  }
};

export const removeAccessToken = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('accessToken');
  }
};
