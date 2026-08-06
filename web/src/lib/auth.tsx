import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { api, logout, getToken } from './api';

interface AuthCtx {
  authed: boolean;
  login: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState<boolean>(Boolean(getToken()));

  const login = useCallback(async (email: string, password: string) => {
    const d = await api.post<{ accessToken: string }>('/api/auth/login', { email, password });
    api.setToken(d.accessToken);
    localStorage.setItem('dtmx_token', d.accessToken);
    setAuthed(true);
  }, []);

  const signOut = useCallback(() => {
    logout();
    setAuthed(false);
  }, []);

  const value = useMemo(() => ({ authed, login, signOut }), [authed, login, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}