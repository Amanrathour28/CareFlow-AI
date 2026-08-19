import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Activity, ShieldCheck, Brain, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  const { user } = useAuth();

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="section-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={14} /> AI-Powered Referral Intelligence
        </div>
        <h1 className="hero-title">
          Healthcare workflows,<br />
          <span className="gradient-text">powered by intelligence.</span>
        </h1>
        <p className="hero-subtitle">
          CareFlow AI unifies fragmented healthcare data and transforms manual referrals into intelligent, AI-assisted workflows.
        </p>

        <div className="hero-ctas">
          <Link to={user ? "/dashboard" : "/register"} className="btn-landing-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            {user ? "Open Dashboard →" : "Get Started →"}
          </Link>
          <a href="#platform" className="btn-landing-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            Explore Platform
          </a>
        </div>

        <div style={{ display: 'flex', gap: 24, marginTop: 36, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} style={{ color: 'var(--cyan-accent)' }} /> HIPAA-Compliant Architecture
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={15} style={{ color: 'var(--cyan-accent)' }} /> Human-in-the-Loop AI
          </div>
        </div>
      </div>

      <div className="hero-preview-container">
        {/* Floating Badges */}
        <div className="floating-badge floating-badge-top">
          <Activity size={16} style={{ color: '#10b981' }} />
          <span>Real-time Data Quality: <strong>94%</strong></span>
        </div>

        <div className="floating-badge floating-badge-bottom">
          <ShieldCheck size={16} style={{ color: '#6366f1' }} />
          <span>Human Review Verified</span>
        </div>

        {/* Real Enterprise Preview Card */}
        <div className="hero-preview-card">
          <div className="hero-preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>CareFlow AI — Live Referral Intelligence</span>
            </div>
            <span className="badge badge-pending" style={{ fontSize: 10 }}>LIVE DEMO</span>
          </div>

          <div className="preview-metrics">
            <div className="metric-card">
              <div className="metric-value">12,481</div>
              <div className="metric-label">Unified Patients</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">142</div>
              <div className="metric-label">Active Referrals</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">94%</div>
              <div className="metric-label">Completeness</div>
            </div>
          </div>

          <div className="ai-scan-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                <Brain size={16} style={{ color: 'var(--primary-accent)' }} />
                Patient: Sarah Mitchell
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--cyan-accent)', fontWeight: 600 }}>AI Confidence: 91%</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Procedure: Total Knee Arthroplasty (CPT 27447)
            </div>

            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '82%' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <span>Completeness Score</span>
              <span>82 / 100</span>
            </div>

            <div style={{ marginTop: 12, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#fca5a5' }}>
              ⚠ Missing Documentation: <strong>Prior Authorization Form & Recent X-Ray Notes</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
