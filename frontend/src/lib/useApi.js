import { useCallback, useEffect, useState } from 'react';

/**
 * A custom hook to execute async API calls with unified loading, data, and error state.
 *
 * @param {Function} apiFunc - Async function that returns the API response (must return a promise)
 * @param {boolean} [immediate=true] - Whether to run the API call immediately on mount
 */
export function useApi(apiFunc, immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState('');

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFunc(...args);
      // Support both axios response structure and direct data
      const result = response && typeof response === 'object' && 'data' in response ? response.data : response;
      setData(result);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An error occurred';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  useEffect(() => {
    if (immediate) {
      const timer = setTimeout(() => {
        execute().catch(() => {});
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [execute, immediate]);

  return {
    data,
    loading,
    error,
    setError,
    execute,
    setData,
  };
}
