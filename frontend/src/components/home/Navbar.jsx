import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="landing-navbar">
      <div className="landing-nav-container">
        <Link to="/" className="brand-logo">
          <div className="brand-icon">🏥</div>
          <span>CareFlow AI</span>
        </Link>

        <ul className="nav-links">
          <li><a href="#platform">Platform</a></li>
          <li><a href="#workflow">How It Works</a></li>
          <li><a href="#ai-intelligence">AI Intelligence</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#architecture">Architecture</a></li>
        </ul>

        <div className="nav-actions">
          {user ? (
            <Link to="/dashboard" className="btn-landing-primary">
              <LayoutDashboard size={16} />
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-landing-secondary">
                Sign In
              </Link>
              <Link to="/register" className="btn-landing-primary">
                Get Started <ArrowRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
