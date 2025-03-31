import { logApiError } from './warehouseService';

export interface LoginResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  accessToken: string;
  defaultPassword: boolean;
  user: {
    email: string;
    defaultPassword: boolean;
  };
}

export interface UpdatePasswordPayload {
  password: string;
}

/**
 * Perform user login
 * @param email User's email address
 * @param password User's password
 * @returns Promise with login response
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
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

    const loginResponse = await response.json();
    
    // Ensure user object is included in the response
    return {
      ...loginResponse,
      user: {
        email: loginResponse.email,
        defaultPassword: loginResponse.defaultPassword
      }
    };
  } catch (error) {
    logApiError('POST', '/auth', error);
    throw error;
  }
}

export const userService = {
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
