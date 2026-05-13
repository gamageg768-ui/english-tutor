'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface AuthUser { id: number; username: string; email: string; }
interface AuthCtx {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({
  user: null, token: null, isAuthenticated: false, isLoading: true,
  login: () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [token, setToken]     = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Absolute safety-net: never stay loading more than 1.5 s
    const timeout = setTimeout(() => setIsLoading(false), 1500);

    try {
      const t = localStorage.getItem('token');
      const u = localStorage.getItem('user');
      if (t && u) {
        setToken(t);
        setUser(JSON.parse(u));
      }
    } catch {
      // localStorage unavailable or data corrupt — treat as logged-out
      try { localStorage.clear(); } catch { /* ignore */ }
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  }, []);

  const login = (t: string, u: AuthUser) => {
    try {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    } catch { /* ignore storage errors */ }
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch { /* ignore */ }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
