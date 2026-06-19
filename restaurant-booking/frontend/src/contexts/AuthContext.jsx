import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, getErrorMessage, tokenStore } from '../lib/api';
import { AuthContext } from './authContextValue';
import { useToast } from './ToastContext';

const roleHome = {
  CUSTOMER: '/booking/tables',
  STAFF: '/staff',
  MANAGER: '/staff',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [error, setError] = useState('');
  const toast = useToast();

  // ── Listen for session expiry from api.js interceptor ────────────────────
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      toast.error('Your session has expired. Please sign in again.');
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [toast]);

  // ── Auth actions ──────────────────────────────────────────────────────────
  const login = useCallback(async (payload) => {
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', payload);
      tokenStore.setSession(data);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message, { cause: err });
    }
  }, []);

  const register = useCallback(async (payload) => {
    setError('');
    try {
      const { data } = await api.post('/api/auth/register', payload);
      tokenStore.setSession(data);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw new Error(message, { cause: err });
    }
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    toast.info('You have been signed out.');
  }, [toast]);

  const value = useMemo(
    () => ({
      user,
      error,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      getHomePath: (role = user?.role) => roleHome[role] || '/',
    }),
    [error, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
