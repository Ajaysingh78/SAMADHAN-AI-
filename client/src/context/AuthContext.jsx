import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('samadhanX_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on app boot
  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem('samadhanX_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/auth/me');
        if (response?.success && response?.data?.user) {
          setUser(response.data.user);
          setToken(storedToken);
        } else {
          // Token invalid or user not found
          localStorage.removeItem('samadhanX_token');
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        // Token expired or revoked
        localStorage.removeItem('samadhanX_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = async (username, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      if (response?.success && response?.data) {
        const { token: receivedToken, user: receivedUser } = response.data;
        localStorage.setItem('samadhanX_token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true, user: receivedUser };
      }
      throw new Error(response?.error?.message || 'Authentication failed');
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await apiClient.post('/auth/logout', {});
      }
    } catch (err) {
      console.warn('Backend logout notification warning:', err.message);
    } finally {
      localStorage.removeItem('samadhanX_token');
      setToken(null);
      setUser(null);
    }
  };

  const hasRole = (...allowedRoles) => {
    if (!user || !user.role) return false;
    return allowedRoles.includes(user.role);
  };

  const hasBureauAccess = (targetBureau) => {
    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SENIOR_OFFICIAL') return true;
    return user.primaryBureau === targetBureau;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        logout,
        hasRole,
        hasBureauAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
