import { Users, FileText, Activity, Brain, CheckSquare, ShieldCheck } from 'lucide-react';

export default function FeatureGrid() {
  return (
    <section id="features" className="landing-section">
      <div className="section-header">
        <span className="section-tag">Feature Set</span>
        <h2 className="section-title">Built for full-stack precision.</h2>
        <p className="section-subtitle">
          Explore the modular architecture powering CareFlow AI's healthcare intelligence.
        </p>
      </div>

      <div className="bento-grid">
        {/* Card 1: Large */}
        <div className="bento-card bento-large">
          <div>
            <div className="cap-icon"><Users size={22} /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Unified Patient Records</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Consolidate demographics, active medications, lab results, and historical diagnostic codes into a singular normalized view.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 14, fontSize: '0.8rem', color: 'var(--cyan-accent)' }}>
            ✓ Includes automated duplicate patient detection & data quality scoring.
          </div>
        </div>

        {/* Card 2 */}
        <div className="bento-card">
          <div>
            <div className="cap-icon"><FileText size={22} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Intelligent Referrals</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Track referrals through Pending, Under Review, Approved, and Rejected states with priority indicators.
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bento-card">
          <div>
            <div className="cap-icon"><Activity size={22} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Data Quality Engine</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Real-time validation flags malformed ICD-10 codes, missing NPI provider numbers, and incomplete fields.
            </p>
          </div>
        </div>

        {/* Card 4: Large */}
        <div className="bento-card bento-large">
          <div>
            <div className="cap-icon"><Brain size={22} /></div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>AI Workflow Intelligence</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
              Generates administrative summary reports and actionable prior authorization recommendations directly in the portal.
            </p>
          </div>
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 10, padding: 14, fontSize: '0.8rem', color: '#c7d2fe' }}>
            ⚡ Powered by FastAPI background services & OpenAI / LLM integration endpoints.
          </div>
        </div>

        {/* Card 5 */}
        <div className="bento-card">
          <div>
            <div className="cap-icon"><CheckSquare size={22} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Follow-up Tasks</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Assign tasks to care coordinators with due dates, priority levels, and progress tracking.
            </p>
          </div>
        </div>

        {/* Card 6 */}
        <div className="bento-card">
          <div>
            <div className="cap-icon"><ShieldCheck size={22} /></div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>Audit Trail & RBAC</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Role-based authorization (Admin, CareCoordinator, Doctor) with comprehensive activity logging.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
