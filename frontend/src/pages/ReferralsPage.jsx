import { useEffect, useState } from 'react';
import { referralsApi } from '../api/services';
import { Search, Plus, X, Loader2, Brain, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'Pending', 'UnderReview', 'MissingInfo', 'Approved', 'Rejected'];
const PRIORITY_OPTIONS = ['', 'Low', 'Medium', 'High'];

function BadgeStatus({ status }) {
  const map = { Pending: 'pending', UnderReview: 'underreview', MissingInfo: 'missinginfo', Approved: 'approved', Rejected: 'rejected' };
  return <span className={`badge badge-${map[status] || 'pending'}`}>{status}</span>;
}

function BadgePriority({ priority }) {
  return <span className={`badge badge-${(priority || 'medium').toLowerCase()}`}>{priority}</span>;
}

function AIPanel({ analysis }) {
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
            <div key={i} className="ai-issue-item">
              <div className="ai-issue-dot error" />
              {item}
            </div>
          ))}
        </div>
      )}

      {analysis.potential_issues?.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Potential Issues</div>
          {analysis.potential_issues.map((item, i) => (
            <div key={i} className="ai-issue-item">
              <div className="ai-issue-dot warning" />
              {item}
            </div>
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

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await referralsApi.analyze(referral.id);
      setAnalysis(res.data);
    } catch (e) {
      console.error(e);
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

        <AIPanel analysis={analysis} />
      </div>
    </div>
  );
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filters, setFilters] = useState({ status: '', priority: '', page: 1, size: 20 });

  const fetchReferrals = async () => {
    setLoading(true);
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReferrals(); }, [filters]);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Referral Management</h1>
          <p className="page-subtitle">{total} referrals in system</p>
        </div>
      </div>

      <div className="page-content">
        {/* Filters */}
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

          {loading ? (
            <div className="loading-state"><div className="spinner" /><span>Loading referrals…</span></div>
          ) : referrals.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📋</div><div className="empty-state-text">No referrals found matching your filters.</div></div>
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

        {/* Pagination */}
        {total > filters.size && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button className="btn btn-ghost" disabled={filters.page === 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Page {filters.page} of {Math.ceil(total / filters.size)}</span>
            <button className="btn btn-ghost" disabled={filters.page >= Math.ceil(total / filters.size)} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
          </div>
        )}
      </div>

      {selected && <ReferralDetailModal referral={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
