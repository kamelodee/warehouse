'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { FaCar, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { useLogout } from '@/app/utils/logout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing user from local storage', error);
        }
      }
    }
  }, []);

  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    ...(user?.role !== 'WAREHOUSE_USER' ? [
      { 
        name: 'Users', 
        path: '/dashboard/users',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )
      },
      { 
        name: 'Products', 
        path: '/dashboard/products',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        )
      },
      { 
        name: 'Inventory', 
        path: '/dashboard/inventories',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      },
      { 
        name: 'Warehouses', 
        path: '/dashboard/warehouses',
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      },
      ...(user?.role !== 'WAREHOUSE_USER' ? [
        { 
          name: 'Vehicles', 
          path: '/dashboard/vehicles',
          icon: (
            <FaCar className="w-6 h-6" />
          )
        }
      ] : []),
    ] : []),
    { 
      name: 'Shipments', 
      path: '/dashboard/shipments',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      )
    },
  ];

  // Initialize logout function
  const logout = useLogout();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out shadow-xl`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 bg-indigo-600">
            <span className="text-xl font-bold text-white">Inventory Management System (IMS)</span>
            
            
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className={`${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="ml-3">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                console.log('Logout button clicked in layout');
                logout();
              }}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
            >
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`lg:pl-64 flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
        {/* Top navbar */}
        <nav className="bg-white shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 text-gray-500 rounded-md lg:hidden"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center">
                <div className="relative">
                <div className="relative">
              <button 
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="p-1 text-white hover:bg-indigo-600 bg-indigo-500 rounded-md flex items-center"
              >
                <FaUser className="w-6 h-6" />
              </button>
              
              {isUserDropdownOpen && user && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border rounded-md shadow-lg z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium text-gray-900">{user.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    
                    <button 
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <FaSignOutAlt className="mr-3 h-5 w-5 text-red-400" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
