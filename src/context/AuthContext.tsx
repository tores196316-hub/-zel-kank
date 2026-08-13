import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { authApi, getStoredToken, setStoredToken, ApiError } from '../lib/api';

const USER_CACHE_KEY = 'hizliyukle_cached_user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      localStorage.removeItem(USER_CACHE_KEY);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res && res.user) {
        setUser(res.user);
        try {
          localStorage.setItem(USER_CACHE_KEY, JSON.stringify(res.user));
        } catch {}
      } else {
        setStoredToken(null);
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      }
    } catch (err: any) {
      // ONLY clear token if the server definitively rejected the session (HTTP 401 / 403)
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        setStoredToken(null);
        localStorage.removeItem(USER_CACHE_KEY);
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = (token: string, userData: User) => {
    setStoredToken(token);
    setUser(userData);
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    } catch {}
    // Fetch detailed profile (plans, stats, quotas) in the background
    refreshUser();
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    setStoredToken(null);
    localStorage.removeItem(USER_CACHE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

