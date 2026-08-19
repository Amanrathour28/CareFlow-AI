import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, CheckSquare, LogOut, Activity, UserCheck, ShieldCheck
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user ? `${user.username?.[0] ?? '?'}`.toUpperCase() : '?';
  const role = user?.role || 'Caregiver';

  // Dynamic Navigation Items based on RBAC Role
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/patients', label: role === 'Admin' ? 'All Patients' : role === 'Doctor' ? 'My Patients' : 'Assigned Patients', icon: Users },
    { to: '/referrals', label: 'Referrals', icon: FileText },
    { to: '/tasks', label: role === 'Admin' ? 'All Tasks' : 'My Tasks', icon: CheckSquare },
  ];

  if (role === 'Admin') {
    navItems.push(
      { to: '/users', label: 'User Management', icon: UserCheck },
      { to: '/audit-logs', label: 'Audit Logs', icon: ShieldCheck }
    );
  }

  const roleBadgeColor = role === 'Admin' ? '#f59e0b' : role === 'Doctor' ? '#6366f1' : '#10b981';

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

        <div className="nav-section-label" style={{ marginTop: 24 }}>Authorization</div>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94a3b8' }}>
            <ShieldCheck size={14} style={{ color: roleBadgeColor }} />
            <span>RBAC Protected</span>
            <div style={{ marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%', background: roleBadgeColor }} />
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="user-avatar" style={{ background: roleBadgeColor }}>{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.username ?? 'User'}</div>
            <div className="user-role" style={{ color: roleBadgeColor, fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {role}
            </div>
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
