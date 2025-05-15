'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/api/userService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await login(email, password);

      // Detailed logging of the entire response
      console.log('Full login response:', JSON.stringify(response, null, 2));
      
      // Check for default password first
    

      // Ensure access token exists
      if (response.accessToken) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('defaultPasswordUser', JSON.stringify({
            email: response.user.email,
            defaultPassword: response.user.defaultPassword
          }));
          window.localStorage.setItem('accessToken', response.accessToken);
          window.localStorage.setItem('user', JSON.stringify(response.user));
        }

        if (response.user.defaultPassword === true) {
          router.push('/reset-password');
          return;
        } else {
          router.push('/dashboard');
        }
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login.');
      console.error(err);
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
        <form onSubmit={handleLogin}>
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
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white flex items-center justify-center`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
