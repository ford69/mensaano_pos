import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';

// const API_URL = 'http://localhost:3001/api'; // Updated to match your backend port
const API_URL = 'https://api.mensaanogh.com/api'; // Updated to production backend URL


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
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Try to fetch user info from backend using token
        try {
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            await AsyncStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error('Error loading user:', err);
          await AsyncStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        await AsyncStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLoading(false);
        return true;
      } else {
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Login error:', err);
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