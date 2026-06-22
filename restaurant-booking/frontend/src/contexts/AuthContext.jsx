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
  const [isAuthLoading, setIsAuthLoading] = useState(() => Boolean(tokenStore.getAccessToken()));
  const [error, setError] = useState('');
  const toast = useToast();

  // ── Rehydrate session on browser refresh ────────────────────────────────
  useEffect(() => {
    let ignore = false;

    const hydrateSession = async () => {
      if (!tokenStore.getAccessToken()) {
        setIsAuthLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/api/auth/me');
        if (ignore) return;
        tokenStore.setSession({ user: data });
        setUser(data);
      } catch {
        if (!ignore) setUser(null);
      } finally {
        if (!ignore) setIsAuthLoading(false);
      }
    };

    hydrateSession();
    return () => {
      ignore = true;
    };
  }, []);

  // ── Listen for session expiry from api.js interceptor ────────────────────
  useEffect(() => {
    const handleExpired = () => {
      setUser(null);
      setIsAuthLoading(false);
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
      isAuthLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      getHomePath: (role = user?.role) => roleHome[role] || '/',
    }),
    [error, isAuthLoading, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
