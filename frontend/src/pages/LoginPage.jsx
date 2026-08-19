import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Maps raw backend error strings to friendly, specific messages
function parseLoginError(err) {
  const detail = err.response?.data?.detail || '';
  const status = err.response?.status;
  if (status === 401 || detail.toLowerCase().includes('incorrect') || detail.toLowerCase().includes('password')) {
    return 'Incorrect username or password. Please try again.';
  }
  if (status === 400 && detail.toLowerCase().includes('inactive')) {
    return 'Your account is inactive. Please contact your administrator.';
  }
  if (status === 0 || err.code === 'ERR_NETWORK') {
    return 'Cannot reach the server. Please check your internet connection.';
  }
  if (detail) return detail;
  return 'Sign in failed. Please try again.';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(parseLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background orbs */}
      <div className="auth-bg-orb" style={{ width: 500, height: 500, background: '#6366f1', top: -100, left: -100 }} />
      <div className="auth-bg-orb" style={{ width: 400, height: 400, background: '#06b6d4', bottom: -100, right: -100 }} />

      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, boxShadow: '0 0 30px rgba(99,102,241,0.4)'
            }}>🏥</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CareFlow AI</div>
              <div style={{ fontSize: 10, color: '#4b5563', letterSpacing: 1, textTransform: 'uppercase' }}>Healthcare Intelligence</div>
            </div>
          </div>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your CareFlow dashboard</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username or Email</label>
            <input
              type="text"
              placeholder="Enter your username or email"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : 'Sign in →'}
          </button>
        </form>

        <div className="auth-divider"><span>New to CareFlow AI?</span></div>
        <Link to="/register" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          Create an account
        </Link>
      </div>
    </div>
  );
}
