import axios from 'axios';
import { LoginResponse, User } from '../utils/auth';

// Define the login service interface
interface LoginService {
  login(email: string, password: string): Promise<LoginResponse>;
  logout(): void;
}

// Implement the login service
class AuthLoginService implements LoginService {
  private apiBaseUrl: string;

  constructor() {
    // Use environment variable for API base URL
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.warehouse.com';
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Make API call to login endpoint
      const response = await axios.post<LoginResponse>(`${this.apiBaseUrl}/auth/login`, {
        email,
        password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Validate response
      if (!response.data || !response.data.user) {
        throw new Error('Invalid login response');
      }

      // Store user data and tokens
      this.storeLoginData(response.data);

      return response.data;
    } catch (error) {
      // Handle different types of errors
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          switch (error.response.status) {
            case 401:
              throw new Error('Invalid credentials');
            case 403:
              throw new Error('Access denied');
            case 404:
              throw new Error('User not found');
            default:
              throw new Error('Login failed. Please try again.');
          }
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error('No response from server. Please check your connection.');
        }
      }

      // Rethrow original error if not an axios error
      throw error;
    }
  }

  logout(): void {
    // Clear user data and tokens from storage
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('defaultPasswordUser');

    // Redirect to login page
    window.location.href = '/login';
  }

  private storeLoginData(loginResponse: LoginResponse): void {
    // Validate and store user data
    const userToStore = {
      id: loginResponse.user.id,
      email: loginResponse.user.email,
      firstName: loginResponse.user.firstName,
      lastName: loginResponse.user.lastName,
      phoneNumber: loginResponse.user.phoneNumber,
      role: loginResponse.user.role,
      warehouse: loginResponse.user.warehouse ? {
        id: loginResponse.user.warehouse.id,
        code: loginResponse.user.warehouse.code,
        name: loginResponse.user.warehouse.name,
        location: loginResponse.user.warehouse.location
      } : null,
      defaultPassword: loginResponse.user.defaultPassword || false
    };

    // Store data in localStorage
    localStorage.setItem('user', JSON.stringify(userToStore));
    localStorage.setItem('accessToken', loginResponse.accessToken);
    localStorage.setItem('refreshToken', loginResponse.refreshToken);

    // Set default password flag if applicable
    if (loginResponse.user.defaultPassword) {
      localStorage.setItem('defaultPasswordUser', 'true');
    }
  }
}

// Export a singleton instance of the login service
export const loginService = new AuthLoginService();
