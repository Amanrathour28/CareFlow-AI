import { Database, Brain, Workflow, ShieldCheck } from 'lucide-react';

const capabilities = [
  {
    icon: Database,
    title: "Data Intelligence",
    description: "Ingests and structures clinical, lab, and demographic data from multiple healthcare sources into a unified schema."
  },
  {
    icon: Brain,
    title: "AI Assistance",
    description: "Analyzes referrals against administrative completeness criteria, identifying missing prior authorizations instantly."
  },
  {
    icon: Workflow,
    title: "Workflow Automation",
    description: "Automatically generates follow-up tasks and routes missing information requests to care coordinators."
  },
  {
    icon: ShieldCheck,
    title: "Unified Records",
    description: "Maintains a single source of truth for patient history with full audit trail logging and RBAC access controls."
  }
];

export default function PlatformCapabilities() {
  return (
    <section id="platform" className="landing-section">
      <div className="section-header">
        <span className="section-tag">Core Capabilities</span>
        <h2 className="section-title">One intelligent layer for healthcare operations.</h2>
        <p className="section-subtitle">
          Designed to eliminate administrative bottlenecks, reduce referral friction, and improve prior authorization velocity.
        </p>
      </div>

      <div className="capabilities-grid">
        {capabilities.map((cap, index) => {
          const Icon = cap.icon;
          return (
            <div key={index} className="capability-card">
              <div className="cap-icon">
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>{cap.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{cap.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
