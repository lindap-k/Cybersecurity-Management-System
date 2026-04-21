import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { api } from '@/lib/api';
import { storage } from '@/lib/storage';
import type { AuthUser } from '@/types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = storage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login({ email, password });
    storage.setToken(result.token);
    storage.setUser(result.user);
    setUser(result.user);
    return result.user;
  };

  const logout = () => {
    storage.clearToken();
    storage.clearUser();
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
