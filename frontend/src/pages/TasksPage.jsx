import { useEffect, useState } from 'react';
import { tasksApi } from '../api/services';
import { ChevronRight, X } from 'lucide-react';

const STATUS_OPTIONS = ['', 'Pending', 'InProgress', 'Completed'];

function BadgeTaskStatus({ status }) {
  const map = { Pending: 'pending', InProgress: 'inprogress', Completed: 'completed' };
  return <span className={`badge badge-${map[status] || 'pending'}`}>{status}</span>;
}

function PatchModal({ task, onClose, onSaved }) {
  const [form, setForm] = useState({ status: task.status, notes: task.notes || '', priority: task.priority });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true); setError('');
    try {
      const res = await tasksApi.update(task.id, form);
      onSaved(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.detail || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Update Task</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <div className="input-group">
          <label className="input-label">Status</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['Pending', 'InProgress', 'Completed'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Priority</label>
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {['Low', 'Medium', 'High'].map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        <div className="input-group">
          <label className="input-label">Notes</label>
          <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Add coordinator notes…" />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      const res = await tasksApi.list(params);
      setTasks(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [page, statusFilter]);

  const handleSaved = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Follow-up Tasks</h1>
          <p className="page-subtitle">{total} tasks in system</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filter */}
        <div style={{ marginBottom: 20 }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 200 }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>

        <div className="table-card">
          <div className="table-header">
            <span className="table-title">Task Queue</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Click a task to update status</span>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /><span>Loading tasks…</span></div>
          ) : tasks.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No tasks found.</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Task ID</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Due Date</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.map(t => (
                  <tr key={t.id} onClick={() => setEditing(t)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4b5563' }}>{t.id.slice(0, 8)}…</td>
                    <td><BadgeTaskStatus status={t.status} /></td>
                    <td><span className={`badge badge-${(t.priority || 'medium').toLowerCase()}`}>{t.priority}</span></td>
                    <td>{new Date(t.due_date).toLocaleDateString()}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                    <td><ChevronRight size={14} style={{ color: '#4b5563' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > PAGE_SIZE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Page {page}</span>
            <button className="btn btn-ghost" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {editing && <PatchModal task={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
    </>
  );
}
