import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/services';
import { Mail, Key, ShieldCheck, AlertCircle, Copy, CheckCircle, ArrowLeft, Lock } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = enter email/username, 2 = enter OTP & new password, 3 = success
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1: Send Reset OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!usernameOrEmail.trim()) {
      setError('Please enter your registered username or Gmail address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordSendOtp(usernameOrEmail.trim());
      setTargetEmail(res.data.email);
      setGeneratedOtp(res.data.otp);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request password reset OTP. Please check your username or email.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please check and retype.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordReset(targetEmail, otpCode, newPassword);
      setSuccessMsg(res.data.message || 'Your password has been successfully reset!');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Please check your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-orb" style={{ width: 500, height: 500, background: '#6366f1', top: -100, left: -100 }} />
      <div className="auth-bg-orb" style={{ width: 400, height: 400, background: '#06b6d4', bottom: -100, right: -100 }} />

      <div className="auth-card" style={{ maxWidth: 460 }}>
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

        <h1 className="auth-title" style={{ marginTop: 8 }}>Account Recovery</h1>
        <p className="auth-subtitle">
          {step === 1 && "Enter your username or email to receive a 6-digit reset OTP"}
          {step === 2 && `Enter the verification code sent to ${targetEmail}`}
          {step === 3 && "Password updated successfully!"}
        </p>

        {error && (
          <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* STEP 1: Enter Username or Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="input-group">
              <label className="input-label">Registered Username or Gmail</label>
              <input
                type="text"
                placeholder="e.g. admin_demo or dr.house@careflow.ai"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 8 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Sending Reset OTP...</> : 'Send 6-Digit OTP Code →'}
            </button>

            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Link to="/login" style={{ color: 'var(--cyan-accent)', fontSize: 12, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft size={13} /> Back to Sign In
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: Enter OTP & Set New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>
                <Mail size={16} /> Security Code Sent to {targetEmail}
              </div>
              {generatedOtp && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.8)', padding: '8px 12px', borderRadius: 8, marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Reset OTP Code:</span>
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
              <label className="input-label">Enter 6-Digit OTP Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. 849201"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4, fontFamily: 'monospace' }}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">New Password</label>
              <input
                type="password"
                placeholder="Enter new password (min. 6 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input
                type="password"
                placeholder="Re-type new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={loading}>
                ← Back
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading || otpCode.length !== 6 || !newPassword}>
                {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Resetting...</> : 'Set New Password →'}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Success Confirmation */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 16px auto', color: '#10b981'
            }}>
              <CheckCircle size={32} />
            </div>

            <h3 style={{ fontSize: 18, color: '#f8fafc', marginBottom: 8 }}>Password Reset Complete!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.5, marginBottom: 20 }}>
              {successMsg} You can now log into your CareFlow AI dashboard with your new credentials.
            </p>

            <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Sign In to CareFlow AI →
            </button>
          </div>
        )}

        <div className="auth-divider"><span>Need assistance?</span></div>
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          CareFlow AI Dual-Factor OTP Recovery Engine &copy; 2026
        </div>
      </div>
    </div>
  );
}
