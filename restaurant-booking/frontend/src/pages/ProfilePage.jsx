import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { useAuth } from '../contexts/authContextValue';
import { api, getErrorMessage, tokenStore } from '../lib/api';
import { useApi } from '../lib/useApi';

export function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '' });
  const [message, setMessage] = useState('');

  const { loading } = useApi(
    useCallback(async () => {
      if (!isAuthenticated) return;
      const { data } = await api.get('/api/auth/me');
      setForm({ full_name: data.full_name || '', phone: data.phone || '' });
      tokenStore.setSession({ user: data });
    }, [isAuthenticated]),
    isAuthenticated
  );

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const { data } = await api.put('/api/auth/profile', form);
      tokenStore.setSession({ user: data });
      setMessage('Profile updated');
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      await api.patch('/api/auth/change-password', passwordForm);
      setPasswordForm({ current_password: '', new_password: '' });
      setMessage('Password changed');
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="content-section page-spacer">
        <div className="reserve-panel compact-panel">
          <div>
            <p className="eyebrow gold">Profile</p>
            <h1>Sign in required</h1>
            <p>Please login before editing your Maison Edem profile.</p>
          </div>
          <Link className="gold-button" to="/login">
            Login
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="profile-page">
        <section className="profile-shell">
          <div className="profile-heading">
            <div className="skeleton" style={{ height: '20px', width: '80px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '48px', width: '320px', marginBottom: '12px' }} />
            <div className="skeleton" style={{ height: '18px', width: '450px' }} />
          </div>
          <div className="profile-grid" style={{ marginTop: '32px' }}>
            <div className="profile-card skeleton" style={{ height: '320px', borderRadius: '18px' }} />
            <div className="profile-card skeleton" style={{ height: '320px', borderRadius: '18px' }} />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <Toast message={message} />
      <section className="profile-shell">
        <div className="profile-heading">
          <p className="eyebrow gold">Guest profile</p>
          <h1>Your Maison profile</h1>
          <p>Update the details used for reservation confirmations and staff contact.</p>
        </div>

        <div className="profile-grid">
          <form className="profile-card" onSubmit={saveProfile}>
            <div className="card-title-row">
              <div>
                <h2>Profile details</h2>
                <p>{user?.email}</p>
              </div>
              <span>{user?.role}</span>
            </div>
            <label>
              Full name
              <input
                className="field"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                required
              />
            </label>
            <label>
              Phone number
              <input
                className="field"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
              />
            </label>
            <button className="gold-button full" type="submit">
              Save profile
            </button>
          </form>

          <form className="profile-card" onSubmit={changePassword}>
            <div className="card-title-row">
              <div>
                <h2>Password</h2>
                <p>Use at least 6 characters.</p>
              </div>
            </div>
            <label>
              Current password
              <input
                className="field"
                type="password"
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })}
                required
              />
            </label>
            <label>
              New password
              <input
                className="field"
                type="password"
                value={passwordForm.new_password}
                onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })}
                required
              />
            </label>
            <button className="ghost-button full" type="submit">
              Change password
            </button>
          </form>

          <section className="profile-card">
            <div className="card-title-row">
              <div>
                <h2>Reservations</h2>
                <p>Booking codes, tables and pre-order dishes.</p>
              </div>
            </div>
            <Link className="gold-button full" to="/booking/history">
              View booking history
            </Link>
            <Link className="booking-secondary-link" to="/booking/tables">
              Create new reservation
            </Link>
          </section>
        </div>
      </section>
    </main>
  );
}
