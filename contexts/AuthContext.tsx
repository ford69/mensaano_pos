import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import { API_URL } from '@/config/api';

const authLog = (label: string, details?: Record<string, unknown>) => {
  if (__DEV__) {
    console.log(`[Auth] ${label}`, details ?? '');
  }
};

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string, role?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetUsers: () => Promise<void>;
  debugUsers: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load token and user info on app start
    const load = async () => {
      authLog('Restoring session', { apiUrl: API_URL });
      try {
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedToken) {
          try {
            const meUrl = `${API_URL}/auth/me`;
            authLog('GET /auth/me', { url: meUrl });
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const res = await fetch(meUrl, {
              headers: { Authorization: `Bearer ${storedToken}` },
              signal: controller.signal,
            });

            clearTimeout(timeoutId);
            authLog('/auth/me response', {
              status: res.status,
              ok: res.ok,
              contentType: res.headers.get('content-type'),
            });

            if (res.ok) {
              const contentType = res.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                const userData = await res.json();
                authLog('Session restored', { username: userData.username, role: userData.role });
                setToken(storedToken);
                setUser({
                  id: String(userData.id),
                  username: userData.username,
                  email: userData.email ?? '',
                  role: userData.role,
                  createdAt: userData.createdAt ?? '',
                });
              } else {
                const text = await res.text();
                authLog('Session restore failed: non-JSON body', {
                  preview: text.substring(0, 200),
                });
                await AsyncStorage.removeItem('token');
              }
            } else {
              const text = await res.text().catch(() => '');
              authLog('Session restore failed: bad status', {
                status: res.status,
                preview: text.substring(0, 200),
              });
              await AsyncStorage.removeItem('token');
            }
          } catch (err: unknown) {
            const e = err as { name?: string; message?: string; cause?: unknown };
            authLog('Session restore error', {
              name: e?.name,
              message: e?.message ?? String(err),
              cause: e?.cause,
            });
            await AsyncStorage.removeItem('token');
          }
        } else {
          authLog('No stored token');
        }
      } catch (err: unknown) {
        const e = err as { name?: string; message?: string };
        authLog('Load error', { name: e?.name, message: e?.message ?? String(err) });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    const loginUrl = `${API_URL}/auth/login`;
    authLog('Login attempt', { url: loginUrl, username });
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        authLog('Login request timed out (10s)');
        controller.abort();
      }, 10000);

      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const contentType = res.headers.get('content-type');
      authLog('Login response', {
        status: res.status,
        ok: res.ok,
        contentType,
      });

      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        authLog('Login failed: non-JSON response', {
          status: res.status,
          contentType,
          preview: text.substring(0, 200),
        });
        setLoading(false);
        return false;
      }
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        authLog('Login success', { username: data.user?.username, role: data.user?.role });
        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        setUser({
          id: String(data.user.id),
          username: data.user.username,
          email: data.user.email ?? '',
          role: data.user.role,
          createdAt: data.user.createdAt ?? '',
        });
        setLoading(false);
        return true;
      }

      authLog('Login failed: bad credentials or missing token', {
        status: res.status,
        message: data?.message ?? data?.error,
        keys: data ? Object.keys(data) : [],
      });
      setLoading(false);
      return false;
    } catch (err: unknown) {
      const e = err as { name?: string; message?: string; cause?: unknown };
      authLog('Login network/error', {
        name: e?.name,
        message: e?.message ?? String(err),
        cause: e?.cause,
        url: loginUrl,
      });
      setLoading(false);
      return false;
    }
  };

  const register = async (username: string, email: string, password: string, role: string = 'waiter'): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      });
      setLoading(false);
      return res.ok;
    } catch (err) {
      console.error('Register error:', err);
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const resetUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/reset-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        console.log('Users reset successfully');
      }
    } catch (err) {
      console.error('Error resetting users:', err);
    }
  };

  const debugUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/debug-users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const users = await res.json();
        console.log('Debug users:', users);
      }
    } catch (err) {
      console.error('Error debugging users:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, resetUsers, debugUsers, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};