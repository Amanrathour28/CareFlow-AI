import { useEffect, useState } from 'react';
import { patientsApi } from '../api/services';
import { Search, ChevronRight, X, ShieldCheck, Pill, FlaskConical } from 'lucide-react';

function QualityBar({ score }) {
  const cls = score >= 80 ? 'quality-high' : score >= 60 ? 'quality-medium' : 'quality-low';
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: '#94a3b8' }}>Data Quality</span>
        <span style={{ color, fontWeight: 600 }}>{score}/100</span>
      </div>
      <div className="quality-bar">
        <div className={`quality-fill ${cls}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function PatientDetailModal({ patient, onClose }) {
  const ins = patient.insurance;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
              {patient.first_name[0]}{patient.last_name[0]}
            </div>
            <div>
              <div className="modal-title">{patient.first_name} {patient.last_name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{patient.email} · DOB: {patient.date_of_birth}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Insurance */}
        {ins && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>
              <ShieldCheck size={14} /> Insurance Coverage
            </div>
            <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
              <div><span style={{ color: '#4b5563' }}>Provider:</span> {ins.insurance_provider}</div>
              <div><span style={{ color: '#4b5563' }}>Policy #:</span> {ins.policy_number}</div>
              <div><span style={{ color: '#4b5563' }}>Plan:</span> {ins.plan_type}</div>
              <div><span style={{ color: '#4b5563' }}>Status:</span> <span style={{ color: ins.status === 'Active' ? '#10b981' : '#f43f5e' }}>{ins.status}</span></div>
            </div>
          </div>
        )}

        {/* Medications */}
        {patient.medications?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#8b5cf6', marginBottom: 8 }}>
              <Pill size={14} /> Active Medications
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {patient.medications.map(m => (
                <div key={m.id} style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, padding: '8px 14px', fontSize: 13 }}>
                  <strong>{m.drug_name}</strong> — {m.dosage} · {m.frequency}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Labs */}
        {patient.laboratory_results?.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#06b6d4', marginBottom: 8 }}>
              <FlaskConical size={14} /> Lab Results
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {patient.laboratory_results.map(l => (
                <div key={l.id} style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 8, padding: '8px 14px', fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{l.test_name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f0f4ff' }}>{l.test_value} {l.unit}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medical history */}
        {patient.medical_history_summary && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>Medical History</div>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, background: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: '10px 14px' }}>{patient.medical_history_summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const params = { page, size: PAGE_SIZE };
      if (search.trim()) params.search = search.trim();
      const res = await patientsApi.list(params);
      setPatients(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, [page, search]);

  const openDetail = async (patient) => {
    try {
      const res = await patientsApi.get(patient.id);
      setSelected(res.data);
    } catch (e) { setSelected(patient); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Patient Records</h1>
          <p className="page-subtitle">{total} patients in system</p>
        </div>
      </div>

      <div className="page-content">
        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ paddingLeft: 36 }}
          />
        </div>

        <div className="table-card">
          <div className="table-header">
            <span className="table-title">All Patients</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Click to view unified profile</span>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /><span>Loading patients…</span></div>
          ) : patients.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">👤</div><div className="empty-state-text">No patients found.</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Date of Birth</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Insurance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr key={p.id} onClick={() => openDetail(p)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                          {p.first_name[0]}{p.last_name[0]}
                        </div>
                        <div>
                          <div style={{ color: '#f0f4ff', fontWeight: 500, fontSize: 13 }}>{p.first_name} {p.last_name}</div>
                          <div style={{ fontSize: 11, color: '#4b5563' }}>{p.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.date_of_birth}</td>
                    <td>{p.gender}</td>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>{p.phone}</td>
                    <td>{p.insurance ? <span style={{ color: '#10b981', fontSize: 12 }}>✓ Insured</span> : <span style={{ color: '#f43f5e', fontSize: 12 }}>✗ None</span>}</td>
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
            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
            <button className="btn btn-ghost" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>

      {selected && <PatientDetailModal patient={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
