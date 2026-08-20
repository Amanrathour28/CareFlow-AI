import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/services';
import { User, Shield, Mail, Key, CheckCircle, AlertCircle, Copy, X, Lock } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('change'); // 'change' or 'forgot'
  
  // Direct Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // In-App Forgot Password State (via OTP)
  const [otpStep, setOtpStep] = useState(1);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !user) return null;

  const role = user.role || 'Caregiver';
  const roleBadgeColor = role === 'Admin' ? '#f59e0b' : role === 'Doctor' ? '#6366f1' : '#10b981';

  // Handle direct password change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please check and re-type.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setSuccess(res.data.message || 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP request for forgotten password
  const handleRequestOtp = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await authApi.forgotPasswordSendOtp(user.email || user.username);
      setGeneratedOtp(res.data.otp);
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP to your email.');
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP password reset
  const handleResetWithOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.forgotPasswordReset(user.email, otpCode, forgotNewPassword);
      setSuccess(res.data.message || 'Password reset successfully!');
      setOtpStep(1);
      setGeneratedOtp('');
      setOtpCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to reset password. Check OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(10, 15, 29, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1.5rem'
    }}>
      <div style={{
        background: '#0f172a', border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 16, maxWidth: 540, width: '100%', maxHeight: '92vh',
        overflowY: 'auto', padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${roleBadgeColor}, #06b6d4)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: '#fff', fontSize: 16
            }}>
              {user.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                My Profile & Security
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Manage profile credentials and security settings
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Profile Details Card */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12, padding: '14px 16px', marginBottom: '1.5rem',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Username</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginTop: 2 }}>{user.username}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>System Role</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${roleBadgeColor}20`, border: `1px solid ${roleBadgeColor}50`,
              color: roleBadgeColor, padding: '2px 8px', borderRadius: 6,
              fontSize: 12, fontWeight: 700, marginTop: 2
            }}>
              <Shield size={12} /> {role}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>Email Address</div>
            <div style={{ fontSize: 13, color: '#cbd5e1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Mail size={13} style={{ color: '#06b6d4' }} /> {user.email || 'None registered'}
            </div>
          </div>
        </div>

        {/* Password Management Section */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8, marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('change'); setError(''); setSuccess(''); }}
              style={{
                background: activeTab === 'change' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                border: activeTab === 'change' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                color: activeTab === 'change' ? '#a5b4fc' : '#94a3b8',
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              🔒 Change Password
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('forgot'); setError(''); setSuccess(''); }}
              style={{
                background: activeTab === 'forgot' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                border: activeTab === 'forgot' ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid transparent',
                color: activeTab === 'forgot' ? '#67e8f9' : '#94a3b8',
                padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}
            >
              🔑 Forgot Password (OTP Reset)
            </button>
          </div>

          {error && (
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertCircle size={15} /> {error}
            </div>
          )}

          {success && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399', padding: '10px 14px', borderRadius: 8, fontSize: 13,
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12
            }}>
              <CheckCircle size={16} /> {success}
            </div>
          )}

          {/* TAB 1: Direct Password Change */}
          {activeTab === 'change' && (
            <form onSubmit={handleChangePassword}>
              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label">Current Password (optional)</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="input-group" style={{ marginBottom: 12 }}>
                <label className="input-label">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password (min. 6 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="input-group" style={{ marginBottom: 16 }}>
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-type new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || !newPassword}>
                  {loading ? 'Updating...' : 'Update Password →'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Forgot Password via OTP */}
          {activeTab === 'forgot' && (
            <div>
              {otpStep === 1 ? (
                <div>
                  <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5, marginBottom: 14 }}>
                    Forgot your password? We will generate and send a secure 6-digit OTP to your registered Gmail address <b>({user.email})</b> to reset your password.
                  </p>

                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="btn btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                    disabled={loading}
                  >
                    {loading ? 'Sending OTP Code...' : 'Send 6-Digit OTP to My Email →'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetWithOtp}>
                  <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#a5b4fc', fontSize: 12 }}>
                      <Mail size={14} /> Verification code sent to {user.email}
                    </div>
                    {generatedOtp && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15,23,42,0.8)', padding: '6px 10px', borderRadius: 6, marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Security OTP:</span>
                        <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 800, color: 'var(--cyan-accent)', letterSpacing: 2 }}>{generatedOtp}</span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(generatedOtp)}
                          style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11 }}
                        >
                          <Copy size={11} /> Auto-fill
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label className="input-label">Enter 6-Digit OTP</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="e.g. 748392"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      style={{ textAlign: 'center', fontSize: 18, letterSpacing: 3, fontFamily: 'monospace' }}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 10 }}>
                    <label className="input-label">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group" style={{ marginBottom: 14 }}>
                    <label className="input-label">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-ghost" onClick={() => setOtpStep(1)}>
                      ← Back
                    </button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={loading || otpCode.length !== 6}>
                      {loading ? 'Resetting...' : 'Confirm Reset Password →'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
