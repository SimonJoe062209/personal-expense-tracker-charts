import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { useToast } from './ToastContext';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isDemo?: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBackendConnected: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('moneta_auth_user') : null;
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('moneta_auth_token') : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const { showToast } = useToast();

  // Check backend health & verify token on mount
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      try {
        const health = await apiService.checkHealth();
        if (health && health.status === 'online') {
          if (isMounted) setIsBackendConnected(true);
        }

        const savedToken = localStorage.getItem('moneta_auth_token');
        if (savedToken) {
          try {
            const currentUser = await apiService.getMe();
            if (isMounted) {
              setUser(currentUser);
              localStorage.setItem('moneta_auth_user', JSON.stringify(currentUser));
            }
          } catch {
            // Token expired or invalid
            if (isMounted) {
              setUser(null);
              setToken(null);
              localStorage.removeItem('moneta_auth_token');
              localStorage.removeItem('moneta_auth_user');
            }
          }
        }
      } catch (err) {
        console.warn('[Auth] Backend API unreachable, operating in local mode:', err);
        if (isMounted) setIsBackendConnected(false);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    verifyAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const data = await apiService.login(email, password);
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('moneta_auth_token', data.token);
        localStorage.setItem('moneta_auth_user', JSON.stringify(data.user));
        setIsBackendConnected(true);
        showToast(`Welcome back, ${data.user.name}!`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Login failed', 'error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      setIsLoading(true);
      try {
        const data = await apiService.register(name, email, password);
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('moneta_auth_token', data.token);
        localStorage.setItem('moneta_auth_user', JSON.stringify(data.user));
        setIsBackendConnected(true);
        showToast(`Account created! Welcome to Moneta, ${data.user.name}.`, 'success');
      } catch (err: any) {
        showToast(err.message || 'Registration failed', 'error');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  const demoLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiService.demoLogin();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('moneta_auth_token', data.token);
      localStorage.setItem('moneta_auth_user', JSON.stringify(data.user));
      setIsBackendConnected(true);
      showToast('Logged in to MongoDB Demo Account (Rohan Sharma)', 'success');
    } catch (err: any) {
      showToast(err.message || 'Demo login failed', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('moneta_auth_token');
    localStorage.removeItem('moneta_auth_user');
    showToast('Signed out successfully', 'info');
  }, [showToast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        isBackendConnected,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
