import { useEffect, useState } from 'react';
import { usersApi } from '../api/services';
import { ShieldCheck, UserPlus, X, Check, AlertCircle } from 'lucide-react';

const ROLES = ['Admin', 'Doctor', 'Caregiver'];

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  
  // Create form
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Doctor' });
  const [createLoading, setCreateLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await usersApi.list();
      setUsers(res.data || []);
    } catch (e) {
      setError('Could not load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await usersApi.update(userId, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('Failed to update user role.');
    }
  };

  const handleToggleActive = async (userObj) => {
    try {
      const updatedStatus = !userObj.is_active;
      await usersApi.update(userObj.id, { is_active: updatedStatus });
      setUsers(prev => prev.map(u => u.id === userObj.id ? { ...u, is_active: updatedStatus } : u));
    } catch (e) {
      alert('Failed to update active status.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      await usersApi.create(form);
      setShowCreate(false);
      fetchUsers();
    } catch (e) {
      alert(e.response?.data?.detail || 'Failed to create user');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage system accounts, assign RBAC roles & access authorization</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserPlus size={16} /> Create User Account
        </button>
      </div>

      <div className="page-content">
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">All System Users</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Admin role management & status controls</span>
          </div>

          {error && <div className="auth-error" style={{ margin: 16 }}>{error}</div>}

          {loading ? (
            <div className="loading-state"><div className="spinner" /><span>Loading user registry…</span></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>
                          {u.username[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, color: '#fff' }}>{u.username}</span>
                      </div>
                    </td>
                    <td style={{ color: '#94a3b8' }}>{u.email}</td>
                    <td>
                      <select 
                        value={u.role} 
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border-primary)' }}
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                        {u.is_active ? '✓ Active' : '✗ Deactivated'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className={`btn ${u.is_active ? 'btn-ghost' : 'btn-primary'}`} 
                        style={{ padding: '4px 10px', fontSize: 11 }}
                        onClick={() => handleToggleActive(u)}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create User Account</div>
              <button className="modal-close" onClick={() => setShowCreate(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="input-group">
                <label className="input-label">Username *</label>
                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="input-label">Gmail / Email Address *</label>
                <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="input-label">Password *</label>
                <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={createLoading}>
                  {createLoading ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
