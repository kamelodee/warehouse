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
      sessionStorage.setItem('accessToken', token);
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
      const sessionToken = sessionStorage.getItem('accessToken');
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
