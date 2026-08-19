import { Download, GitMerge, Brain, CheckSquare } from 'lucide-react';

const steps = [
  {
    num: "01",
    icon: Download,
    title: "Ingest Data",
    desc: "Collect demographic, referral request, insurance, and medical history from multiple sources."
  },
  {
    num: "02",
    icon: GitMerge,
    title: "Unify Records",
    desc: "Cleanse, deduplicate, and assemble a 360-degree patient view with data quality metrics."
  },
  {
    num: "03",
    icon: Brain,
    title: "Analyze Intelligence",
    desc: "AI identifies missing clinical documentation, predicts prior auth obstacles, and calculates confidence."
  },
  {
    num: "04",
    icon: CheckSquare,
    title: "Take Action",
    desc: "Automatically assign follow-up tasks to care coordinators with full audit logging."
  }
];

export default function Workflow() {
  return (
    <section id="workflow" className="landing-section">
      <div className="section-header">
        <span className="section-tag">How It Works</span>
        <h2 className="section-title">Automated intelligence in four simple steps.</h2>
        <p className="section-subtitle">
          From incoming referral submission to final coordinator review—CareFlow AI simplifies every phase.
        </p>
      </div>

      <div className="workflow-grid">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div key={idx} className="workflow-card">
              <div className="step-number">{step.num}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Icon size={20} style={{ color: 'var(--cyan-accent)' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{step.title}</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{step.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
