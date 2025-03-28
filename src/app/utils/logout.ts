import { useRouter } from 'next/navigation';

/**
 * Logout utility to clear user session and redirect to login
 * @returns Function to perform logout
 */
export const useLogout = () => {
  const router = useRouter();

  const logout = () => {
    try {
      // Clear all localStorage items related to user session
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      localStorage.removeItem('defaultPasswordUser');

      // Clear all sessionStorage items
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('defaultPasswordUser');

      // Log out message for debugging
      console.log('User logged out successfully');

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return logout;
};
