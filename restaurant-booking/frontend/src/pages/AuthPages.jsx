import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';
import { useAuth } from '../contexts/authContextValue';
import { heroImages } from '../data/fallbackData';

function AuthShell({ mode, children }) {
  return (
    <main className="auth-page">
      <section className="auth-column">
        <div className="auth-wrap">
          <div className="auth-topline">
            <Link to="/" className="brand-link">
              Maison Edem
            </Link>
            <Link to={mode === 'login' ? '/register' : '/login'}>{mode === 'login' ? 'Register' : 'Login'}</Link>
          </div>
          {children}
        </div>
      </section>
      <section className="auth-image">
        <img src={heroImages.auth} alt="Fine dining table" />
        <div>
          <p className="eyebrow gold">Reservations profile</p>
          <h2>Your dining preferences, ready before you arrive.</h2>
          <p>Dietary notes, preferred table formats and tasting history become part of the hospitality flow.</p>
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const { login, getHomePath } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    try {
      const user = await login(form);
      navigate(getHomePath(user.role));
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AuthShell mode="login">
      <Toast message={message} />
      <div className="auth-panel">
        <p className="eyebrow gold">Welcome back</p>
        <h1>Return to the table</h1>
        <p>Sign in to manage reservations, staff service or floor operations.</p>
        <form className="auth-form" onSubmit={submit}>
          <input
            className="field"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          <button className="gold-button full" type="submit">
            Sign in
          </button>
        </form>
        <div className="auth-switch">
          New to Maison Edem? <Link to="/register">Create account</Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
    terms: false,
  });
  const [message, setMessage] = useState('');
  const { register, getHomePath } = useAuth();
  const navigate = useNavigate();

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) {
      setMessage('Passwords do not match');
      return;
    }
    if (!form.terms) {
      setMessage('Please accept the terms');
      return;
    }

    try {
      const user = await register({
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        password: form.password,
      });
      navigate(getHomePath(user.role));
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <AuthShell mode="register">
      <Toast message={message} />
      <div className="auth-panel">
        <p className="eyebrow gold">Create account</p>
        <h1>Join the table</h1>
        <p>Create an account to save reservation details, tasting notes and private dining preferences.</p>
        <form className="auth-form" onSubmit={submit}>
          <div className="two-fields">
            <input
              className="field"
              placeholder="Full name"
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
              required
            />
            <input
              className="field"
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <input
            className="field"
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <select className="field" defaultValue="">
            <option value="">Preferred occasion</option>
            <option>Private dinner</option>
            <option>Anniversary</option>
            <option>Business dinner</option>
            <option>Chef tasting</option>
          </select>
          <div className="two-fields">
            <input
              className="field"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
            <input
              className="field"
              type="password"
              placeholder="Confirm password"
              value={form.confirm}
              onChange={(event) => setForm({ ...form, confirm: event.target.value })}
              required
            />
          </div>
          <label className="terms-row">
            <input
              type="checkbox"
              checked={form.terms}
              onChange={(event) => setForm({ ...form, terms: event.target.checked })}
            />
            <span>I agree to receive reservation updates and accept the account terms.</span>
          </label>
          <button className="gold-button full" type="submit">
            Create account
          </button>
        </form>
        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
}
