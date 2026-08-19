import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(244, 63, 94, 0.3)',
        borderRadius: 16,
        padding: '40px',
        maxWidth: 480,
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 30px rgba(244,63,94,0.1)'
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          background: 'rgba(244, 63, 94, 0.12)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#f43f5e', margin: '0 auto 20px auto'
        }}>
          <ShieldAlert size={32} />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: 12 }}>
          403 — Access Restricted
        </h1>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 28 }}>
          You don't have permission to access this administrative area or perform this operation under your current account role.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/dashboard" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <LayoutDashboard size={16} /> Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
