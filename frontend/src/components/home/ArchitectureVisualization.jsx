import { ArrowRight } from 'lucide-react';

const archNodes = [
  { step: "01", name: "Data Sources", detail: "EHR / Labs / Insurance" },
  { step: "02", name: "Data Intelligence", detail: "FastAPI + Pydantic" },
  { step: "03", name: "Unified Storage", detail: "PostgreSQL / Neon" },
  { step: "04", name: "AI Analysis", detail: "LLM Completeness Engine" },
  { step: "05", name: "Coordinator Action", detail: "Tasks & Prior Auth" },
];

export default function ArchitectureVisualization() {
  return (
    <section id="architecture" className="landing-section">
      <div className="section-header">
        <span className="section-tag">System Architecture</span>
        <h2 className="section-title">End-to-end data pipeline.</h2>
        <p className="section-subtitle">
          How data moves seamlessly from fragmented raw inputs to verified clinical workflows.
        </p>
      </div>

      <div className="architecture-container">
        <div className="arch-flow">
          {archNodes.map((node, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="arch-node">
                <div style={{ fontSize: '0.75rem', color: 'var(--cyan-accent)', fontWeight: 700, marginBottom: 4 }}>
                  STEP {node.step}
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                  {node.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                  {node.detail}
                </div>
              </div>
              {i < archNodes.length - 1 && (
                <div className="arch-arrow">
                  <ArrowRight size={18} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
