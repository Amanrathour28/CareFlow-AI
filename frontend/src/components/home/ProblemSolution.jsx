import { ArrowRight, Layers, Database, FileSpreadsheet, Network } from 'lucide-react';

const sources = ["EHR Systems", "Lab Results", "Insurance Portals", "Fax & PDFs", "Pharmacy Records"];

export default function ProblemSolution() {
  return (
    <section className="landing-section" style={{ borderTop: '1px solid var(--border-glass)' }}>
      <div className="problem-solution-container">
        <div>
          <span className="section-tag" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.25)' }}>
            The Industry Challenge
          </span>
          <h2 className="section-title">Healthcare data is fragmented across legacy systems.</h2>
          <p className="section-subtitle" style={{ marginBottom: 24 }}>
            Administrative coordinators spend hours manually pulling patient details, insurance coverage, and clinical notes from disconnected portals—leading to delayed care and rejected referrals.
          </p>

          <div className="fragmented-nodes">
            {sources.map((src, i) => (
              <div key={i} className="fragmented-card">
                <FileSpreadsheet size={16} />
                <span>{src}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--cyan-accent)', fontWeight: 600, fontSize: '0.95rem' }}>
            <span>Connects into CareFlow AI</span>
            <ArrowRight size={18} />
          </div>
        </div>

        <div>
          <div className="unified-node-box">
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, var(--electric-blue), var(--primary-accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px auto', boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)'
            }}>
              <Network size={28} color="#fff" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: 10 }}>CareFlow AI Unified Engine</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Transform disconnected healthcare information into a unified, actionable intelligence view for clinical and administrative teams.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: 20, fontSize: '0.82rem', color: 'var(--cyan-accent)', border: '1px solid var(--border-glass)' }}>
              <Database size={14} /> Normalized PostgreSQL Schema
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
