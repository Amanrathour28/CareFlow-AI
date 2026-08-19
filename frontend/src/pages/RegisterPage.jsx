import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Doctor', 'CareCoordinator', 'Admin'];

function parseRegisterError(err) {
  const detail = err.response?.data?.detail || '';
  const status = err.response?.status;
  if (status === 0 || err.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Please check your internet connection.';
  }
  if (typeof detail === 'string') {
    if (detail.includes('Username already registered')) return 'This username is already taken. Please choose a different one.';
    if (detail.includes('Email already registered')) return 'This email is already registered. Try signing in instead.';
    if (detail.includes('Invalid role')) return 'Please select a valid role from the dropdown.';
    if (detail) return detail;
  }
  if (status === 422) return 'Please fill in all required fields correctly (e.g. a valid email address).';
  return 'Registration failed. Please check your details and try again.';
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Doctor' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Register user
      await authApi.register(form);
      // 2. Immediately log in and open dashboard directly
      await login({ username: form.username, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setError(parseRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 500, height: 500, background: '#8b5cf6', top: -100, right: -100 }} />
      <div className="auth-bg-orb" style={{ width: 300, height: 300, background: '#06b6d4', bottom: -50, left: -50 }} />

      <div className="auth-card">
        <Link to="/" title="Go to CareFlow AI Homepage" style={{ textDecoration: 'none', color: 'inherit' }} className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏥</div>
            <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CareFlow AI</div>
          </div>
        </Link>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Join the CareFlow AI platform</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <input type="text" placeholder="Choose a unique username" value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input type="email" placeholder="you@hospital.org" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input type="password" placeholder="Create a strong password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {ROLES.map(r => <option key={r} value={r}>{r === 'CareCoordinator' ? 'Care Coordinator' : r}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Creating account...</> : 'Create account →'}
          </button>
        </form>

        <div className="auth-divider"><span>Already have an account?</span></div>
        <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Sign in</Link>
      </div>
    </div>
  );
}
