import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContextValue';

/**
 * PrivateRoute — Protects routes that require authentication.
 *
 * @param {string[]} [roles]  - If provided, only allows users with a role in this list.
 * @param {string}   [redirectTo] - URL to redirect to if insufficient permissions (default: '/')
 *
 * If not logged in:  redirect → /login?returnTo=<current-path>
 * If wrong role:     redirect → redirectTo (default '/')
 */
export function PrivateRoute({ children, roles, redirectTo = '/' }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

/**
 * StaffRoute — Protects routes for STAFF + MANAGER only.
 * If not logged in → redirect /staff/login
 * If not STAFF/MANAGER → redirect /
 */
export function StaffRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/staff/login?returnTo=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!['STAFF', 'MANAGER'].includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
