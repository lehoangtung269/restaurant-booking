import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/authContextValue';

/**
 * PrivateRoute — Bảo vệ route yêu cầu đăng nhập.
 *
 * @param {string[]} [roles]  - Nếu có, chỉ cho phép user có role trong danh sách.
 * @param {string}   [redirectTo] - URL để redirect nếu không đủ quyền (mặc định: '/')
 *
 * Nếu chưa đăng nhập:  redirect → /login?returnTo=<current-path>
 * Nếu sai role:        redirect → redirectTo (mặc định '/')
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
 * StaffRoute — Bảo vệ route chỉ dành cho STAFF + MANAGER.
 * Nếu chưa đăng nhập → redirect /staff/login
 * Nếu không phải STAFF/MANAGER → redirect /
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
