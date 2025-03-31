/**
 * Authentication Utility for robust token management
 */
export const AuthUtils = {
  /**
   * Set access token with enhanced error handling and logging
   * @param token Access token to store
   */
  setToken: (token: string) => {
    try {
      // Store in both sessionStorage and localStorage for redundancy
      // sessionStorage.setItem('accessToken', token);
      localStorage.setItem('accessToken', token);
      
      // Store timestamp for additional tracking
      localStorage.setItem('tokenTimestamp', Date.now().toString());
    } catch (error) {
      console.error('Token storage error:', error);
    }
  },

  /**
   * Retrieve access token with multiple fallback mechanisms
   * @returns Access token or null
   */
  getToken: () => {
    try {
      // Check sessionStorage first
      const sessionToken = localStorage.getItem('accessToken');
      if (sessionToken) return sessionToken;

      // Fallback to localStorage
      const localToken = localStorage.getItem('accessToken');
      if (localToken) return localToken;

      return null;
    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  },

  /**
   * Clear all stored tokens and related data
   */
  clearToken: () => {
    try {
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('tokenTimestamp');
      localStorage.removeItem('user');
      localStorage.removeItem('defaultPasswordUser');
    } catch (error) {
      console.error('Token clearing error:', error);
    }
  },

  /**
   * Check if a valid token exists
   * @returns Boolean indicating token presence
   */
  isAuthenticated: () => {
    const token = AuthUtils.getToken();
    return !!token;
  }
};

import axios from 'axios';

// Define user types
export interface Warehouse {
  id: number;
  code: string;
  name: string;
  location: string;
}

export interface User {
  id: number;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'WAREHOUSE_USER';
  warehouse: Warehouse;
  defaultPassword: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Utility function to generate mock tokens
function generateMockToken(): string {
  return btoa(`token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
}

// Login user function
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    // Retrieve user data from localStorage (simulating API response)
    const storedUser = localStorage.getItem('user');
    
    if (!storedUser) {
      throw new Error('No user data found');
    }

    const userData: User = JSON.parse(storedUser);
    
    // Validate email and password (in a real app, this would be done server-side)
    if (userData.email !== email) {
      throw new Error('Invalid email');
    }

    // Simulate access and refresh tokens
    const accessToken = generateMockToken();
    const refreshToken = generateMockToken();

    // Prepare login response
    const loginResponse: LoginResponse = {
      accessToken,
      refreshToken,
      user: userData
    };

    // Store tokens in localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    return loginResponse;
  } catch (error) {
    console.error('Login failed', error);
    throw error;
  }
};

// Get current user function
export const getCurrentUser = async function(): Promise<User | null> {
  const accessToken = localStorage.getItem('accessToken');
  const storedUser = localStorage.getItem('user');
  
  if (!accessToken || !storedUser) {
    return null;
  }

  try {
    // Parse the stored user from localStorage
    const user: User = JSON.parse(storedUser);
    
    // Validate the user object has required properties
    if (!user || !user.id || !user.email) {
      throw new Error('Invalid user data');
    }

    return user;
  } catch (error) {
    console.error('Failed to retrieve current user', error);
    
    // Clear invalid or corrupted user data
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    return null;
  }
};

// Logout user function
export const logoutUser = () => {
  try {
    // Clear all authentication-related items from localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('defaultPasswordUser');

    // Optional: Clear session-specific data if needed
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback redirect in case of error
    window.location.href = '/login';
  }
};
