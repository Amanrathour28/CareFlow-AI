import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function FinalCTA() {
  const { user } = useAuth();

  return (
    <section className="landing-section">
      <div className="final-cta-section">
        <div className="section-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <Sparkles size={14} /> Ready to Experience CareFlow AI?
        </div>
        <h2 className="section-title" style={{ fontSize: '3rem', marginBottom: 20 }}>
          Turn healthcare data into<br />
          <span className="gradient-text">intelligent action.</span>
        </h2>
        <p className="section-subtitle" style={{ maxWidth: 640, margin: '0 auto 36px auto' }}>
          Experience a unified approach to healthcare workflows with AI-assisted intelligence, automated prior authorizations, and real-time task management.
        </p>

        <div>
          <Link to={user ? "/dashboard" : "/register"} className="btn-landing-primary" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            {user ? "Launch Dashboard →" : "Launch CareFlow AI →"}
          </Link>
        </div>
      </div>
    </section>
  );
}
