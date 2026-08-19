import { Brain, AlertTriangle, CheckCircle, ShieldAlert, Sparkles } from 'lucide-react';

export default function AIIntelligence() {
  return (
    <section id="ai-intelligence" className="landing-section">
      <div className="section-header">
        <span className="section-tag" style={{ background: 'rgba(139,92,246,0.12)', color: '#a78bfa', borderColor: 'rgba(139,92,246,0.3)' }}>
          <Sparkles size={13} style={{ display: 'inline', marginRight: 4 }} /> AI Copilot
        </span>
        <h2 className="section-title">More than automation.<br />Intelligent workflow assistance.</h2>
        <p className="section-subtitle">
          Our specialized LLM integration flags incomplete diagnostic codes, missing insurance pre-authorization documents, and highlights high-priority cases before human review.
        </p>
      </div>

      <div className="ai-showcase-container">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Brain size={24} style={{ color: 'var(--primary-accent)' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>Referral AI Intelligence Inspection</h3>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border-glass)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Completeness Score</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>82 / 100</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: '82%' }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              Detected Missing Information
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} /> Insurance Member ID Missing
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} /> Recent Clinical Notes (Last 6 Months)
              </div>
            </div>
          </div>

          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', padding: 14, borderRadius: 10, fontSize: '0.85rem', color: '#e0e7ff', marginBottom: 16 }}>
            <strong>Recommendation:</strong> Request missing clinical notes from referring provider before submitting to payer portal.
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span>LLM Model Confidence: <strong style={{ color: 'var(--cyan-accent)' }}>91%</strong></span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981' }}><CheckCircle size={14} /> Human Review Required</span>
          </div>
        </div>

        {/* Workflow Diagram */}
        <div style={{ borderLeft: '1px solid var(--border-glass)', paddingLeft: 40, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>Human-in-the-Loop Safeguards</h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            CareFlow AI is engineered to assist administrative workflows and reduce burden on staff. It does not replace medical judgment.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { title: "Referral Submission", sub: "Data received from provider portal" },
              { title: "AI Analysis", sub: "ICD-10 check & document completeness scan" },
              { title: "Workflow Recommendation", sub: "Action items generated for coordinator" },
              { title: "Human Coordinator Review", sub: "Final approval by verified medical staff" },
            ].map((node, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-glass)' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{node.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{node.sub}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 14px', borderRadius: 8, fontSize: '0.78rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldAlert size={16} /> Administrative workflow assistance only. Not for autonomous clinical decision-making.
          </div>
        </div>
      </div>
    </section>
  );
}
