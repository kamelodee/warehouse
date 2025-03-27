import axios, { AxiosError } from 'axios';
import { z } from 'zod';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Input validation schemas
const EmailSchema = z.string().email('Invalid email address');
const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()]/, 'Password must contain at least one special character');

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    role: string;
    defaultPassword: boolean;
  };
}

export async function resetPassword(email: string, newPassword: string, accessToken?: string) {
  // Validate inputs
  try {
    EmailSchema.parse(email);
    PasswordSchema.parse(newPassword);
  } catch (validationError) {
    if (validationError instanceof z.ZodError) {
      throw new Error(validationError.errors[0].message);
    }
    throw new Error('Invalid input');
  }

  try {
    const response = await axios.post(`${API_URL}/api/reset-password/`, {
      email,
      new_password: newPassword
    }, {
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` })
      }
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      // Handle specific error responses from the backend
      if (error.response) {
        switch (error.response.status) {
          case 400:
            throw new Error('Invalid email or password');
          case 404:
            throw new Error('User not found');
          case 500:
            throw new Error('Server error. Please try again later.');
          default:
            throw new Error(error.response.data?.detail || 'Password reset failed');
        }
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      }
    }
    throw new Error('An unexpected error occurred');
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    EmailSchema.parse(email);
    // Removed password validation here
    const response = await axios.post<LoginResponse>(`${API_URL}/api/login/`, {
      email,
      password
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response) {
        switch (error.response.status) {
          case 400:
            throw new Error('Invalid credentials');
          case 401:
            throw new Error('Unauthorized');
          default:
            throw new Error(error.response.data?.detail || 'Login failed');
        }
      }
    }
    throw new Error('An unexpected error occurred');
  }
}
