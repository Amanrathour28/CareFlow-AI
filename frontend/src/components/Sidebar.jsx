import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, CheckSquare, LogOut, Activity
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/referrals', label: 'Referrals', icon: FileText },
  { to: '/tasks', label: 'Tasks', icon: CheckSquare },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.username?.[0] ?? '?'}`.toUpperCase() : '?';

  return (
    <aside className="sidebar">
      <Link to="/dashboard" className="sidebar-logo" title="CareFlow AI Dashboard" style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}>
        <div className="logo-mark">
          <div className="logo-icon">🏥</div>
          <div>
            <div className="logo-text">CareFlow AI</div>
            <div className="logo-sub">Healthcare Intelligence</div>
          </div>
        </div>
      </Link>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            <Icon className="nav-icon" />
            {label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 24 }}>System</div>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#4b5563' }}>
            <Activity size={14} style={{ color: '#10b981' }} />
            <span>API Online</span>
            <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.username ?? 'User'}</div>
            <div className="user-role">{user?.role ?? 'Unknown'}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', display: 'flex', alignItems: 'center' }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
