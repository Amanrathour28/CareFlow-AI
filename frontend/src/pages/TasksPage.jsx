import { useEffect, useState } from 'react';
import { tasksApi, referralsApi } from '../api/services';
import { Plus, X, ChevronRight, AlertCircle, LayoutGrid, List } from 'lucide-react';
import TaskKanban from '../components/TaskKanban';

const STATUS_OPTIONS = ['', 'Pending', 'InProgress', 'Completed'];

function parseApiError(err) {
  const detail = err.response?.data?.detail;
  const status = err.response?.status;
  if (err.code === 'ERR_NETWORK') return 'Cannot reach the server. Check your internet connection.';
  if (status === 403) return 'You do not have permission to perform this action.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 422) {
    if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
    return 'Please fill in all required fields correctly.';
  }
  if (typeof detail === 'string' && detail) return detail;
  return 'Something went wrong. Please try again.';
}

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
      setError(parseApiError(e));
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
        {error && <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><AlertCircle size={14} />{error}</div>}
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

function CreateTaskModal({ onClose, onSaved }) {
  const [referrals, setReferrals] = useState([]);
  const [loadingReferrals, setLoadingReferrals] = useState(true);
  const [form, setForm] = useState({
    referral_id: '',
    priority: 'Medium',
    due_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // 7 days from now
    status: 'Pending',
    notes: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    referralsApi.list({ page: 1, size: 100 }).then(res => {
      setReferrals(res.data.items || []);
    }).catch(() => {
      setError('Could not load referrals. Please ensure at least one referral exists.');
    }).finally(() => setLoadingReferrals(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.referral_id) { setError('Please select a referral to link this task to.'); return; }
    setLoading(true);
    try {
      await tasksApi.create(form);
      onSaved();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create Follow-up Task</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><AlertCircle size={14} />{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Link to Referral *</label>
            {loadingReferrals ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading referrals…</div>
            ) : referrals.length === 0 ? (
              <div style={{ color: '#f43f5e', fontSize: 13 }}>No referrals found. Please create a referral first.</div>
            ) : (
              <select value={form.referral_id} onChange={e => setForm({ ...form, referral_id: e.target.value })} required>
                <option value="">— Select a Referral —</option>
                {referrals.map(r => (
                  <option key={r.id} value={r.id}>{r.diagnosis_code} — {r.requested_procedure.slice(0, 40)}… [{r.status}]</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Priority</label>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Due Date *</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Task Notes</label>
            <textarea rows={3} value={form.notes} placeholder="e.g. Collect clinical notes from Dr. Smith, submit to BlueCross portal…"
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || loadingReferrals || referrals.length === 0}>
              {loading ? 'Creating…' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const PAGE_SIZE = 20;

  const fetchTasks = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = { page, size: PAGE_SIZE };
      if (statusFilter) params.status = statusFilter;
      const res = await tasksApi.list(params);
      setTasks(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setLoadError(parseApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [page, statusFilter]);

  const handleSaved = (updated) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const handleKanbanStatusUpdate = async (taskId, newStatus) => {
    try {
      const res = await tasksApi.update(taskId, { status: newStatus });
      handleSaved(res.data);
    } catch (err) {
      alert(parseApiError(err));
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Follow-up Tasks</h1>
          <p className="page-subtitle">{total} tasks in system</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.7)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                background: viewMode === 'kanban' ? '#3b82f6' : 'transparent',
                color: viewMode === 'kanban' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <LayoutGrid size={14} /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#fff' : '#94a3b8',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 6,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <List size={14} /> Table View
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> New Task
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ marginBottom: 20 }}>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} style={{ width: 200 }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
        </div>

        {loadError && (
          <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 16 }}>
            <AlertCircle size={14} />{loadError}
          </div>
        )}

        {loading ? (
          <div className="loading-state"><div className="spinner" /><span>Loading tasks…</span></div>
        ) : tasks.length === 0 && !loadError ? (
          <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">No tasks found. Click "New Task" to create a follow-up task.</div></div>
        ) : viewMode === 'kanban' ? (
          <TaskKanban tasks={tasks} onUpdateStatus={handleKanbanStatusUpdate} />
        ) : (
          <div className="table-card">
            <div className="table-header">
              <span className="table-title">Task Queue</span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Click a task to update its status</span>
            </div>

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
          </div>
        )}

        {total > PAGE_SIZE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
            <button className="btn btn-ghost" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {editing && <PatchModal task={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchTasks(); }} />}
    </>
  );
}
