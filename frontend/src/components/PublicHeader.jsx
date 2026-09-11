import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Bell, CheckCheck, Menu, UserCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/authContextValue';
import { api } from '../lib/api';

const nav = [
  { label: 'Home', to: '/' },
  { label: 'Story', to: '/#story' },
  { label: 'Menu', to: '/menu' },
  { label: 'Reserve', to: '/booking/tables' },
  { label: 'History', to: '/booking/history' },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, getHomePath } = useAuth();
  const showNotifications = user?.role === 'CUSTOMER';

  const loadNotifications = useCallback(async () => {
    const [itemsRes, countRes] = await Promise.all([
      api.get('/api/notifications'),
      api.get('/api/notifications/unread-count'),
    ]);
    setNotifications(itemsRes.data);
    setUnreadCount(Number(countRes.data.count) || 0);
  }, []);

  useEffect(() => {
    let ignore = false;

    if (!showNotifications) {
      Promise.resolve().then(() => {
        if (!ignore) {
          setNotifications([]);
          setUnreadCount(0);
        }
      });
      return () => {
        ignore = true;
      };
    }

    Promise.all([
      api.get('/api/notifications'),
      api.get('/api/notifications/unread-count'),
    ])
      .then(([itemsRes, countRes]) => {
        if (!ignore) {
          setNotifications(itemsRes.data);
          setUnreadCount(Number(countRes.data.count) || 0);
        }
      })
      .catch(() => {});
    return () => {
      ignore = true;
    };
  }, [showNotifications]);

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  const toggleNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    setProfileOpen(false);
    if (nextOpen) {
      await loadNotifications().catch(() => {});
    }
  };

  const markNotificationRead = async (notification) => {
    if (notification.is_read) return;
    await api.patch(`/api/notifications/${notification.id}/read`);
    setNotifications((cur) =>
      cur.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item)),
    );
    setUnreadCount((cur) => Math.max(0, cur - 1));
  };

  const markAllRead = async () => {
    await api.patch('/api/notifications/read-all');
    setNotifications((cur) => cur.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <header className="public-header">
      <div className="public-header__inner">
        <Link to="/" className="brand-link">
          Maison Edem
        </Link>

        <nav className="public-nav">
          {nav.map((item) =>
            item.to.includes('#') ? (
              <a key={item.label} className="nav-line" href={item.to}>
                {item.label}
              </a>
            ) : (
              <NavLink key={item.label} className="nav-line" to={item.to}>
                {item.label}
              </NavLink>
            ),
          )}
          {user ? (
            <NavLink className="nav-line" to={getHomePath()}>
              Account
            </NavLink>
          ) : (
            <NavLink className="nav-line" to="/login">
              Login
            </NavLink>
          )}
        </nav>

        <div className="header-actions">
          <Link to="/booking/tables" className="pill-cta desktop-only">
            Book a table
          </Link>

          {user && (
            <>
              {showNotifications && (
                <div className="notification-menu-wrap">
                  <button
                    className="notification-trigger"
                    type="button"
                    aria-label="Open notifications"
                    aria-expanded={notificationsOpen}
                    onClick={toggleNotifications}
                  >
                    <Bell size={22} />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </button>
                  {notificationsOpen && (
                    <div className="notification-dropdown">
                      <div className="notification-head">
                        <strong>Thông báo</strong>
                        <button type="button" onClick={markAllRead} disabled={!unreadCount}>
                          <CheckCheck size={14} />
                          Đọc tất cả
                        </button>
                      </div>
                      <div className="notification-list">
                        {notifications.length ? (
                          notifications.slice(0, 8).map((notification) => (
                            <button
                              className={`notification-item ${notification.is_read ? '' : 'unread'}`}
                              key={notification.id}
                              type="button"
                              onClick={() => markNotificationRead(notification)}
                            >
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                            </button>
                          ))
                        ) : (
                          <p>Chưa có thông báo.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {user && (
            <div className="profile-menu-wrap">
              <button
                className="profile-trigger"
                type="button"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                onClick={() => setProfileOpen((value) => !value)}
              >
                <UserCircle size={24} />
              </button>
              {profileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-summary">
                    <strong>{user.full_name || 'Maison guest'}</strong>
                    <span>{user.role}</span>
                  </div>
                  <Link to="/profile" onClick={() => setProfileOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/booking/history" onClick={() => setProfileOpen(false)}>
                    Booking history
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="mobile-menu-button" type="button" onClick={() => setOpen((value) => !value)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="mobile-menu">
          {nav.map((item) => (
            <Link key={item.label} to={item.to.replace('/#', '/')} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link to={user ? getHomePath() : '/login'} onClick={() => setOpen(false)}>
            {user ? 'Account' : 'Login'}
          </Link>
          {user && (
            <>
              <Link to="/profile" onClick={() => setOpen(false)}>
                Profile
              </Link>
              <button
                className="mobile-logout"
                type="button"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
}
