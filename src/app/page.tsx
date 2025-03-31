'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { loginUser } from './utils/auth'; // Assuming you have an auth utility

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await loginUser(email, password);
      
      // Check if user has default password
      if (response.user.defaultPassword) {
        // Redirect to password reset page
        router.push('/reset-password');
        return;
      }

      // Normal login flow
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <nav className="bg-transparent p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-white text-2xl font-bold">Inventory Manager App</div>
          <div className="flex items-center space-x-4">
            <form onSubmit={handleLogin} className="flex items-center space-x-2">
              <input 
                type="email" 
                placeholder="Email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3 py-2 rounded-md text-sm"
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-2 rounded-md text-sm"
                required 
              />
              <button 
                type="submit"
                className="bg-white text-indigo-600 px-6 py-2 rounded-full font-semibold hover:bg-indigo-50 transition-colors duration-200"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </nav>

      {error && (
        <div className="text-center text-red-500 mt-4">
          {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-20 sm:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
                Inventory Manager App
              </h1>
              <p className="text-lg sm:text-xl text-white/90 mb-8">
                Streamline your inventory, manage products, and track users all in one place.
                Experience the future of inventory management today.
              </p>
              <div className="space-x-4">
                <Link
                  href="/login"
                  className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-indigo-50 transition-colors duration-200"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { title: 'Product Management', value: 'Easy tracking' },
                    { title: 'User Control', value: 'Role-based access' },
                    { title: 'Real-time Updates', value: 'Live monitoring' },
                    { title: 'Analytics', value: 'Smart insights' },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-xl p-4 backdrop-blur-lg"
                    >
                      <p className="text-white/60 text-sm">{stat.title}</p>
                      <p className="text-white font-semibold mt-1">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      
      </main>

      <footer className="bg-white/10 backdrop-blur-lg mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-white/70">
            <p> 2025 Inventory Manager App. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
