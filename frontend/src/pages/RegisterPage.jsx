import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, Key, CheckCircle, AlertCircle, Copy } from 'lucide-react';

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
  if (status === 422) return 'Please fill in all required fields correctly (e.g. a valid Gmail address).';
  return 'Registration failed. Please check your details and try again.';
}

function validateGmail(email) {
  if (!email) return '';
  const clean = email.trim().toLowerCase();
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!regex.test(clean)) return 'Invalid email format (e.g. yourname@gmail.com)';
  
  const domain = clean.split('@')[1];
  const typos = ['gmal.com', 'gmaill.com', 'gmai.com', 'gmil.com', 'gmial.com', 'gmal.co'];
  if (typos.includes(domain)) return `Did you mean @gmail.com? Please fix domain typo: ${domain}`;
  return '';
}

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  // Form states
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Doctor' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification states
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const emailValidationError = validateGmail(form.email);

  // Step 1: Request OTP for Gmail ID
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setOtpError('');

    if (emailValidationError) {
      setError(emailValidationError);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp(form.email);
      setGeneratedOtp(res.data.otp);
      setOtpMessage(res.data.message || `Verification code sent to ${form.email}`);
      setOtpStep(true);
    } catch (err) {
      setError(parseRegisterError(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete account creation + auto login
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);

    try {
      // 1. Verify OTP with backend
      await authApi.verifyOtp(form.email, otpCode);

      // 2. Register account
      await authApi.register(form);

      // 3. Immediately sign in and open dashboard directly
      await login({ username: form.username, password: form.password });
      navigate('/dashboard');
    } catch (err) {
      setOtpError(err.response?.data?.detail || 'OTP verification failed. Please check the code and try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 500, height: 500, background: '#8b5cf6', top: -100, right: -100 }} />
      <div className="auth-bg-orb" style={{ width: 300, height: 300, background: '#06b6d4', bottom: -50, left: -50 }} />

      <div className="auth-card" style={{ maxWidth: 460 }}>
        <Link to="/" title="Go to CareFlow AI Homepage" style={{ textDecoration: 'none', color: 'inherit' }} className="auth-logo">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🏥</div>
            <div style={{ fontSize: 20, fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>CareFlow AI</div>
          </div>
        </Link>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Gmail OTP Verification & Identity Authorization</p>

        {error && <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={15} />{error}</div>}

        {!otpStep ? (
          /* STEP 1: Registration Credentials Form */
          <form onSubmit={handleRequestOtp}>
            <div className="input-group">
              <label className="input-label">Username</label>
              <input type="text" placeholder="Choose a unique username" value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gmail ID / Email *</span>
                {form.email && !emailValidationError && <span style={{ color: '#10b981', fontSize: 11, fontWeight: 600 }}>✓ Valid Gmail</span>}
              </label>
              <input 
                type="email" 
                placeholder="yourname@gmail.com" 
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} 
                style={{ borderColor: emailValidationError ? '#f43f5e' : undefined }}
                required 
              />
              {emailValidationError && (
                <div style={{ fontSize: 11, color: '#f43f5e', marginTop: 4 }}>⚠ {emailValidationError}</div>
              )}
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading || !!emailValidationError}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Validating Gmail & Sending OTP...</> : 'Send 6-Digit Gmail OTP →'}
            </button>
          </form>
        ) : (
          /* STEP 2: 6-Digit OTP Verification Modal/Step */
          <form onSubmit={handleVerifyOtpAndRegister}>
            {/* Live Notification Badge with Generated Code */}
            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                <Mail size={16} /> {otpMessage}
              </div>
              {generatedOtp && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.8)', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Security OTP Code:</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, color: 'var(--cyan-accent)', letterSpacing: 2 }}>{generatedOtp}</span>
                  <button 
                    type="button" 
                    onClick={() => setOtpCode(generatedOtp)}
                    title="Auto-fill code"
                    style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                  >
                    <Copy size={12} /> Auto-fill
                  </button>
                </div>
              )}
            </div>

            {otpError && <div className="auth-error" style={{ marginBottom: 12 }}>⚠ {otpError}</div>}

            <div className="input-group">
              <label className="input-label">Enter 6-Digit Verification Code</label>
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
              <button type="button" className="btn btn-ghost" onClick={() => setOtpStep(false)} disabled={otpLoading}>
                ← Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={otpLoading || otpCode.length !== 6}>
                {otpLoading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Verifying OTP...</> : 'Verify & Open Dashboard →'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-divider"><span>Already have an account?</span></div>
        <Link to="/login" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>Sign in</Link>
      </div>
    </div>
  );
}
