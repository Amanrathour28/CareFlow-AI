import { Code2, Server, Database, ShieldCheck, Cpu, Box } from 'lucide-react';

const techList = [
  { name: "React 19", role: "Frontend UI", icon: Code2 },
  { name: "FastAPI", role: "Python Backend API", icon: Server },
  { name: "PostgreSQL", role: "Relational Database", icon: Database },
  { name: "SQLAlchemy", role: "ORM & Migrations", icon: Cpu },
  { name: "REST APIs", role: "OpenAPI Specifications", icon: Server },
  { name: "AI / LLM Integration", role: "Workflow Analysis", icon: Cpu },
  { name: "JWT Auth", role: "Role-Based Security", icon: ShieldCheck },
  { name: "Vercel + Neon", role: "Serverless Deployment", icon: Box },
];

export default function TechnologyStack() {
  return (
    <section className="landing-section">
      <div className="section-header">
        <span className="section-tag">Engineering Stack</span>
        <h2 className="section-title">Built with a modern engineering stack.</h2>
        <p className="section-subtitle">
          Designed for performance, type safety, modular design, and seamless cloud scalability.
        </p>
      </div>

      <div className="tech-grid">
        {techList.map((t, idx) => {
          const Icon = t.icon;
          return (
            <div key={idx} className="tech-card">
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff' }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{t.role}</div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
