'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userService } from '@/app/api/userService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Check for existing access token on component mount
  useEffect(() => {
    const checkExistingToken = () => {
      const token = localStorage.getItem('accessToken');
      console.log('Login Page - Existing Token:', token);
      
      if (token) {
        // If token exists, redirect to dashboard
        router.push('/dashboard');
      }
    };

    checkExistingToken();
  }, []);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const response = await userService.login(email, password);

      if (response.defaultPassword) {
        localStorage.setItem('defaultPasswordUser', JSON.stringify({
          email: response.email,
          defaultPassword: true
        }));
        localStorage.setItem('user', JSON.stringify(response));
        
        router.push('/reset-password');
        return;
      }

      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        
        localStorage.setItem('user', JSON.stringify({
          id: response.id,
          email: response.email,
          name: response.name,
          role: response.role,
          defaultPassword: response.defaultPassword
        }));

        router.push('/dashboard');
      } else {
        throw new Error('No access token received');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <div className="flex justify-center mb-6">
          <img 
            src="/logo.jpg" 
            alt="Company Logo" 
            className="h-24 w-auto"
          />
        </div>
        <h2 className="text-2xl font-bold text-indigo-500 mb-6 text-center">Login</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@hisense.com"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
