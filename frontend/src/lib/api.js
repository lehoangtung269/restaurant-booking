import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const ACCESS_TOKEN_KEY = 'maison_edem_access_token';
const REFRESH_TOKEN_KEY = 'maison_edem_refresh_token';
const USER_KEY = 'maison_edem_user';

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  setSession: ({ accessToken, refreshToken, user }) => {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: attach access token ─────────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: silent refresh on 401 ──────────────────────────────────────────
let refreshRequest = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Don't retry refresh calls or non-401 errors
    if (
      error.response?.status !== 401 ||
      original?._retry ||
      original?.url?.includes('/api/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    const refreshToken = tokenStore.getRefreshToken();
    if (!refreshToken) {
      tokenStore.clear();
      // Notify AuthContext that the session is gone
      window.dispatchEvent(new Event('auth:expired'));
      return Promise.reject(error);
    }

    original._retry = true;

    // Deduplicate concurrent refresh calls
    refreshRequest ||= axios
      .post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken })
      .then((res) => {
        tokenStore.setSession({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
        return res.data.accessToken;
      })
      .catch((refreshError) => {
        // Refresh itself failed (expired / revoked) → force logout
        tokenStore.clear();
        window.dispatchEvent(new Event('auth:expired'));
        return Promise.reject(refreshError);
      })
      .finally(() => {
        refreshRequest = null;
      });

    try {
      const newAccessToken = await refreshRequest;
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(original);
    } catch {
      return Promise.reject(error);
    }
  },
);

// ── Helpers ───────────────────────────────────────────────────────────────────
export const getErrorMessage = (error) => {
  const data = error?.response?.data;
  if (data?.errors?.length) return data.errors.map((item) => item.message).join(', ');
  return data?.message || error?.message || 'Unexpected error';
};
