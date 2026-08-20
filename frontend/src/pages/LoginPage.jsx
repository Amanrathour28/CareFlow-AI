import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';
import { Mail, Key, ShieldCheck, AlertCircle, Copy } from 'lucide-react';

function parseLoginError(err) {
  const detail = err.response?.data?.detail || '';
  const status = err.response?.status;
  if (status === 401 || detail.toLowerCase().includes('incorrect') || detail.toLowerCase().includes('password')) {
    return 'Incorrect username/email or password. Please try again.';
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

function validateEmailSyntax(input) {
  if (!input || !input.includes('@')) return '';
  const clean = input.trim().toLowerCase();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(clean)) return 'Invalid email format (e.g. name@gmail.com)';
  
  const domain = clean.split('@')[1];
  const typos = ['gmal.com', 'gmaill.com', 'gmai.com', 'gmil.com', 'gmial.com', 'gmal.co'];
  if (typos.includes(domain)) return `Did you mean @gmail.com? Please fix domain typo: ${domain}`;
  return '';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Login Option
  const [useOtpLogin, setUseOtpLogin] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const emailSyntaxError = validateEmailSyntax(form.username);

  // Standard Password Login
  const handleSubmitPassword = async (e) => {
    e.preventDefault();
    setError('');
    
    if (emailSyntaxError) {
      setError(emailSyntaxError);
      return;
    }

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

  // OTP Login Request
  const handleRequestOtpLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (emailSyntaxError || !form.username.includes('@')) {
      setError(emailSyntaxError || 'Please enter a valid Gmail ID to receive OTP.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp(form.username);
      setGeneratedOtp(res.data.otp);
      setOtpMessage(res.data.message || `Verification code sent to ${form.username}`);
      setOtpStep(true);
    } catch (err) {
      setError(parseLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Submit
  const handleVerifyOtpLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authApi.verifyOtp(form.username, otpCode);
      // Log in with credentials
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 500, height: 500, background: '#6366f1', top: -100, left: -100 }} />
      <div className="auth-bg-orb" style={{ width: 400, height: 400, background: '#06b6d4', bottom: -100, right: -100 }} />

      <div className="auth-card" style={{ maxWidth: 440 }}>
        <Link to="/" title="Go to CareFlow AI Homepage" style={{ textDecoration: 'none', color: 'inherit' }} className="auth-logo">
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
        </Link>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your CareFlow dashboard</p>

        {error && <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={15} />{error}</div>}

        {!otpStep ? (
          <form onSubmit={useOtpLogin ? handleRequestOtpLogin : handleSubmitPassword}>
            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Username or Gmail ID</span>
                {form.username.includes('@') && !emailSyntaxError && (
                  <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>✓ Valid Gmail</span>
                )}
              </label>
              <input
                type="text"
                placeholder="Enter your username or name@gmail.com"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={{ borderColor: emailSyntaxError ? '#f43f5e' : undefined }}
                required
              />
              {emailSyntaxError && (
                <div style={{ fontSize: 11, color: '#f43f5e', marginTop: 4 }}>⚠ {emailSyntaxError}</div>
              )}
            </div>

            {!useOtpLogin && (
              <div className="input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>Password</label>
                  <Link to="/forgot-password" style={{ color: 'var(--cyan-accent)', fontSize: 11, textDecoration: 'none', fontWeight: 500 }}>
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  style={{ marginTop: 4 }}
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading || !!emailSyntaxError}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : (useOtpLogin ? 'Send 6-Digit OTP →' : 'Sign in →')}
            </button>

            <div style={{ marginTop: 12, textAlign: 'center' }}>
              <button 
                type="button" 
                onClick={() => setUseOtpLogin(!useOtpLogin)} 
                style={{ background: 'none', border: 'none', color: 'var(--cyan-accent)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
              >
                {useOtpLogin ? '← Switch to Password Sign In' : '🔒 Sign in with Gmail OTP Verification instead'}
              </button>
            </div>
          </form>
        ) : (
          /* OTP Verification for Login */
          <form onSubmit={handleVerifyOtpLogin}>
            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>
                <Mail size={16} /> {otpMessage}
              </div>
              {generatedOtp && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.8)', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Security OTP Code:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'var(--cyan-accent)', letterSpacing: 2 }}>{generatedOtp}</span>
                  <button 
                    type="button" 
                    onClick={() => setOtpCode(generatedOtp)}
                    style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                  >
                    <Copy size={12} /> Auto-fill
                  </button>
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" placeholder="Enter password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
            </div>

            <div className="input-group">
              <label className="input-label">Enter 6-Digit OTP Code</label>
              <input 
                type="text" 
                maxLength={6}
                placeholder="e.g. 648291" 
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontFamily: 'monospace' }}
                required 
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setOtpStep(false)} disabled={loading}>
                ← Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading || otpCode.length !== 6}>
                {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Verifying...</> : 'Verify OTP & Open Dashboard →'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-divider"><span>New to CareFlow AI?</span></div>
        <Link to="/register" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
          Create an account
        </Link>
      </div>
    </div>
  );
}
