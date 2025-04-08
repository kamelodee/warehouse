'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export function withAuth<P extends object>(WrappedComponent: React.ComponentType<P>) {
  return function AuthWrapper(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      // Check for access token only on client-side
      const checkAuthentication = () => {
        // Ensure we're in browser environment
        if (typeof window !== 'undefined') {
          const accessToken = localStorage.getItem('accessToken');
          console.log('WithAuth - Access Token:', accessToken);
          
          if (!accessToken) {
            // Redirect to login if no access token
            router.push('/login');
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
          
          // Always stop loading
          setIsLoading(false);
        }
      };

      // Check authentication immediately and on mount
      checkAuthentication();
    }, [router]);

    // Render loading state while checking authentication
    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    // If not authenticated, render nothing (redirect already happened)
    if (!isAuthenticated) {
      return null;
    }

    // Render wrapped component once authenticated
    return <WrappedComponent {...props} />;
  };
}
