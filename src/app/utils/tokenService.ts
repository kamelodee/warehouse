export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem('accessToken');
  }
  return null;
};

export const setAccessToken = (token: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem('accessToken', token);
  }
};

export const removeAccessToken = (): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('accessToken');
  }
};

export const isClientSide = (): boolean => {
  return typeof window !== 'undefined';
};
