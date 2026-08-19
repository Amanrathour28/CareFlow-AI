import { useEffect, useState } from 'react';
import { referralsApi, patientsApi } from '../api/services';
import { Plus, X, Loader2, Brain, ChevronRight, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = ['', 'Pending', 'UnderReview', 'MissingInfo', 'Approved', 'Rejected'];
const PRIORITY_OPTIONS = ['', 'Low', 'Medium', 'High'];

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

function BadgeStatus({ status }) {
  const map = { Pending: 'pending', UnderReview: 'underreview', MissingInfo: 'missinginfo', Approved: 'approved', Rejected: 'rejected' };
  return <span className={`badge badge-${map[status] || 'pending'}`}>{status}</span>;
}

function BadgePriority({ priority }) {
  return <span className={`badge badge-${(priority || 'medium').toLowerCase()}`}>{priority}</span>;
}

function AIPanel({ analysis, error }) {
  if (error) return <div className="auth-error" style={{ marginTop: 8 }}>{error}</div>;
  if (!analysis) return null;
  return (
    <div className="ai-panel">
      <div className="ai-panel-header">
        <Brain size={16} style={{ color: '#6366f1' }} />
        <span className="ai-panel-title">AI Analysis — {analysis.completeness_score}/100 completeness</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>Confidence: {Math.round(analysis.confidence * 100)}%</span>
      </div>
      {analysis.missing_information?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Missing Information</div>
          {analysis.missing_information.map((item, i) => (
            <div key={i} className="ai-issue-item"><div className="ai-issue-dot error" />{item}</div>
          ))}
        </div>
      )}
      {analysis.potential_issues?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Potential Issues</div>
          {analysis.potential_issues.map((item, i) => (
            <div key={i} className="ai-issue-item"><div className="ai-issue-dot warning" />{item}</div>
          ))}
        </div>
      )}
      <div style={{ background: 'rgba(99,102,241,0.08)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recommendation</div>
        <div style={{ fontSize: 13, color: '#f0f4ff' }}>{analysis.recommendation}</div>
      </div>
      <div className="ai-disclaimer">⚠ {analysis.disclaimer}</div>
    </div>
  );
}

function ReferralDetailModal({ referral, onClose }) {
  const [analysis, setAnalysis] = useState(referral?.ai_analysis || null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiError, setAiError] = useState('');

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAiError('');
    try {
      const res = await referralsApi.analyze(referral.id);
      setAnalysis(res.data);
    } catch (e) {
      setAiError(parseApiError(e));
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Referral Detail</span>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div style={{ maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            {[
              ['Diagnosis Code', referral.diagnosis_code],
              ['Status', <BadgeStatus status={referral.status} />],
              ['Priority', <BadgePriority priority={referral.priority} />],
              ['Insurance Provider', referral.insurance_provider],
              ['Requested Procedure', referral.requested_procedure],
              ['Created', new Date(referral.created_at).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button className="btn btn-primary" onClick={runAnalysis} disabled={analyzing} style={{ gap: 6 }}>
              {analyzing ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Analyzing…</> : <><Brain size={14} /> Run AI Analysis</>}
            </button>
          </div>
          <AIPanel analysis={analysis} error={aiError} />
        </div>
      </div>
    </div>
  );
}

function CreateReferralModal({ onClose, onSaved }) {
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [form, setForm] = useState({
    patient_id: '',
    provider_id: '',
    diagnosis_code: '',
    diagnosis_description: '',
    requested_procedure: '',
    insurance_provider: '',
    priority: 'Medium',
    status: 'Pending',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    patientsApi.list({ page: 1, size: 100 }).then(res => {
      setPatients(res.data.items || []);
    }).catch(() => {
      setError('Could not load patient list. Please refresh and try again.');
    }).finally(() => setLoadingPatients(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.patient_id) { setError('Please select a patient.'); return; }
    if (!form.provider_id.trim()) { setError('Please enter a Provider ID (UUID). You can find it in your provider directory.'); return; }
    setLoading(true);
    try {
      await referralsApi.create({ ...form, provider_id: form.provider_id.trim() });
      onSaved();
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">New Referral Request</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        {error && (
          <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertCircle size={14} />{error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ maxHeight: '65vh', overflowY: 'auto', paddingRight: 4 }}>
          <div className="input-group">
            <label className="input-label">Patient *</label>
            {loadingPatients ? (
              <div style={{ color: '#94a3b8', fontSize: 13 }}>Loading patients…</div>
            ) : patients.length === 0 ? (
              <div style={{ color: '#f43f5e', fontSize: 13 }}>No patients found. Please register a patient first.</div>
            ) : (
              <select value={form.patient_id} onChange={e => setForm({ ...form, patient_id: e.target.value })} required>
                <option value="">— Select a Patient —</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.email})</option>
                ))}
              </select>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Provider ID (UUID) *</label>
            <input type="text" placeholder="e.g. 3f1b8a2d-..." value={form.provider_id}
              onChange={e => setForm({ ...form, provider_id: e.target.value })} required />
            <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>Enter the UUID of the receiving specialist/provider from your provider directory.</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="input-group">
              <label className="input-label">Diagnosis Code (ICD-10) *</label>
              <input type="text" placeholder="e.g. M17.11" value={form.diagnosis_code}
                onChange={e => setForm({ ...form, diagnosis_code: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Insurance Provider *</label>
              <input type="text" placeholder="e.g. BlueCross" value={form.insurance_provider}
                onChange={e => setForm({ ...form, insurance_provider: e.target.value })} required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Diagnosis Description *</label>
            <input type="text" placeholder="e.g. Primary osteoarthritis, right knee" value={form.diagnosis_description}
              onChange={e => setForm({ ...form, diagnosis_description: e.target.value })} required />
          </div>

          <div className="input-group">
            <label className="input-label">Requested Procedure *</label>
            <input type="text" placeholder="e.g. Total knee arthroplasty (CPT 27447)" value={form.requested_procedure}
              onChange={e => setForm({ ...form, requested_procedure: e.target.value })} required />
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
              <label className="input-label">Initial Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="Pending">Pending</option>
                <option value="UnderReview">Under Review</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-primary)', paddingTop: 16, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || loadingPatients || patients.length === 0}>
              {loading ? 'Submitting…' : 'Submit Referral'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [selected, setSelected] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1, size: 20 });

  const fetchReferrals = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      params.page = filters.page;
      params.size = filters.size;
      const res = await referralsApi.list(params);
      setReferrals(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setLoadError(parseApiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReferrals(); }, [filters]);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Referral Management</h1>
          <p className="page-subtitle">{total} referrals in system</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> New Referral
        </button>
      </div>

      <div className="page-content">
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })} style={{ width: 180 }}>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          <select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value, page: 1 })} style={{ width: 160 }}>
            {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p || 'All Priorities'}</option>)}
          </select>
        </div>

        <div className="table-card">
          <div className="table-header">
            <span className="table-title">All Referrals</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Click a row to view details & run AI analysis</span>
          </div>

          {loadError && (
            <div className="auth-error" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 16 }}>
              <AlertCircle size={14} />{loadError}
            </div>
          )}

          {loading ? (
            <div className="loading-state"><div className="spinner" /><span>Loading referrals…</span></div>
          ) : referrals.length === 0 && !loadError ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No referrals found. Click "New Referral" to create one.</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Diagnosis Code</th>
                  <th>Procedure</th>
                  <th>Insurance</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {referrals.map(ref => (
                  <tr key={ref.id} onClick={() => setSelected(ref)} style={{ cursor: 'pointer' }}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>{ref.diagnosis_code}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ref.requested_procedure}</td>
                    <td>{ref.insurance_provider}</td>
                    <td><BadgeStatus status={ref.status} /></td>
                    <td><BadgePriority priority={ref.priority} /></td>
                    <td>{new Date(ref.created_at).toLocaleDateString()}</td>
                    <td><ChevronRight size={14} style={{ color: '#4b5563' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {total > filters.size && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Page {filters.page} of {Math.ceil(total / filters.size)}</span>
            <button className="btn btn-ghost" disabled={filters.page >= Math.ceil(total / filters.size)} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>

      {selected && <ReferralDetailModal referral={selected} onClose={() => setSelected(null)} />}
      {showCreate && <CreateReferralModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); fetchReferrals(); }} />}
    </>
  );
}
