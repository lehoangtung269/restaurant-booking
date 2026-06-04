import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, UserCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/authContextValue';

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
  const { user, logout, getHomePath } = useAuth();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
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
