import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="footer-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="brand-icon" style={{ width: 32, height: 32, fontSize: 16 }}>🏥</div>
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>CareFlow AI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Healthcare Intelligence Platform</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          <a href="#platform" style={{ color: 'inherit', textDecoration: 'none' }}>Platform</a>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <a href="#architecture" style={{ color: 'inherit', textDecoration: 'none' }}>Architecture</a>
          <a href="https://github.com/Amanrathour28/CareFlow-AI" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>GitHub Repo</a>
        </div>

        <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
          Built as a Full Stack & AI Engineering Portfolio Project
        </div>
      </div>
    </footer>
  );
}
