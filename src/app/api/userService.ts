import { logApiError } from './warehouseService';

export interface LoginResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  accessToken: string;
  defaultPassword: boolean;
}

export interface UpdatePasswordPayload {
  password: string;
}

export const userService = {
  /**
   * Perform user login
   * @param email User's email address
   * @param password User's password
   * @returns Promise with login response
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await fetch('https://stock.hisense.com.gh/api/v1.0/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return await response.json();
    } catch (error) {
      logApiError('POST', '/auth', error);
      throw error;
    }
  },

  /**
   * Update user password
   * @param userId User's unique identifier
   * @param payload Password update payload
   * @param accessToken Authentication token
   * @returns Promise with update response
   */
  updatePassword: async (
    userId: number, 
    payload: UpdatePasswordPayload, 
    accessToken: string
  ): Promise<any> => {
    try {
      const response = await fetch(`https://stock.hisense.com.gh/api/v1.0/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password update failed');
      }

      return await response.json();
    } catch (error) {
      logApiError('PUT', `/users/${userId}`, error);
      throw error;
    }
  }
};
