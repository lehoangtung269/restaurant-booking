import { useMemo, useState } from 'react';
import { api, getErrorMessage, tokenStore } from '../lib/api';
import { AuthContext } from './authContextValue';

const roleHome = {
  CUSTOMER: '/booking/tables',
  STAFF: '/staff',
  MANAGER: '/staff',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => tokenStore.getUser());
  const [error, setError] = useState('');

  const login = async (payload) => {
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
  };

  const register = async (payload) => {
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
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
  };

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
    [error, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
