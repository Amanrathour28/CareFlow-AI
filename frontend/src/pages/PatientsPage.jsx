import { useEffect, useState } from 'react';
import { patientsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Search, ChevronRight, X, ShieldCheck, Pill, FlaskConical, Plus, Trash2 } from 'lucide-react';

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
              {patient.first_name?.[0] || ''}{patient.last_name?.[0] || ''}
            </div>
            <div>
              <div className="modal-title">{patient.first_name} {patient.last_name}</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{patient.email} · DOB: {patient.date_of_birth}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
          {/* Insurance */}
          {ins && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6366f1', marginBottom: 8 }}>
                <ShieldCheck size={14} /> Insurance Coverage
              </div>
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: '#94a3b8' }}>Provider:</span> {ins.insurance_provider}</div>
                <div><span style={{ color: '#94a3b8' }}>Policy #:</span> {ins.policy_number}</div>
                <div><span style={{ color: '#94a3b8' }}>Plan:</span> {ins.plan_type}</div>
                <div><span style={{ color: '#94a3b8' }}>Status:</span> <span style={{ color: ins.status === 'Active' ? '#10b981' : '#f43f5e' }}>{ins.status}</span></div>
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
            <div style={{ marginBottom: 16 }}>
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
    </div>
  );
}

function AddPatientModal({ onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('demographics');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demographics
  const [demo, setDemo] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'Male',
    phone: '',
    email: '',
    address: '',
    medical_history_summary: '',
  });

  // Insurance
  const [hasInsurance, setHasInsurance] = useState(false);
  const [ins, setIns] = useState({
    insurance_provider: '',
    policy_number: '',
    group_number: '',
    plan_type: 'PPO',
    status: 'Active',
  });

  // Medications list
  const [meds, setMeds] = useState([]);
  // Laboratory results list
  const [labs, setLabs] = useState([]);

  // Helpers for list manipulation
  const addMedication = () => {
    setMeds([...meds, { drug_name: '', dosage: '', frequency: '', status: 'Active', prescribed_date: new Date().toISOString().split('T')[0] }]);
  };

  const removeMedication = (index) => {
    setMeds(meds.filter((_, i) => i !== index));
  };

  const updateMed = (index, key, val) => {
    const updated = [...meds];
    updated[index][key] = val;
    setMeds(updated);
  };

  const addLab = () => {
    setLabs([...labs, { test_name: '', test_value: '', unit: '', reference_range: '', status: 'Normal', test_date: new Date().toISOString().split('T')[0] }]);
  };

  const removeLab = (index) => {
    setLabs(labs.filter((_, i) => i !== index));
  };

  const updateLab = (index, key, val) => {
    const updated = [...labs];
    updated[index][key] = val;
    setLabs(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        ...demo,
        insurance: hasInsurance ? ins : null,
        medications: meds,
        laboratory_results: labs
      };

      await patientsApi.create(payload);
      onSave();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to create patient. Please check all fields.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Register New Patient File</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

        {/* Tab Headers */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--border-primary)', marginBottom: 16, paddingBottom: 8 }}>
          <button 
            type="button" 
            className={`btn ${activeTab === 'demographics' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => setActiveTab('demographics')}>
            1. Demographics
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === 'insurance' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => setActiveTab('insurance')}>
            2. Insurance
          </button>
          <button 
            type="button" 
            className={`btn ${activeTab === 'clinical' ? 'btn-primary' : 'btn-ghost'}`} 
            style={{ padding: '6px 12px', fontSize: 12 }}
            onClick={() => setActiveTab('clinical')}>
            3. Clinical Data ({meds.length} Meds, {labs.length} Labs)
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: 4 }}>
          {/* TAB 1: Demographics */}
          {activeTab === 'demographics' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">First Name *</label>
                  <input type="text" value={demo.first_name} onChange={e => setDemo({...demo, first_name: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Last Name *</label>
                  <input type="text" value={demo.last_name} onChange={e => setDemo({...demo, last_name: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Date of Birth *</label>
                  <input type="date" value={demo.date_of_birth} onChange={e => setDemo({...demo, date_of_birth: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Gender *</label>
                  <select value={demo.gender} onChange={e => setDemo({...demo, gender: e.target.value})}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-group">
                  <label className="input-label">Email Address *</label>
                  <input type="email" value={demo.email} onChange={e => setDemo({...demo, email: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number *</label>
                  <input type="text" value={demo.phone} onChange={e => setDemo({...demo, phone: e.target.value})} required />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Home Address</label>
                <input type="text" value={demo.address} onChange={e => setDemo({...demo, address: e.target.value})} />
              </div>

              <div className="input-group">
                <label className="input-label">Clinical Medical History Summary</label>
                <textarea rows={3} placeholder="Diagnoses, history, prior treatments..." value={demo.medical_history_summary} onChange={e => setDemo({...demo, medical_history_summary: e.target.value})} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('insurance')}>Next: Insurance &rarr;</button>
              </div>
            </div>
          )}

          {/* TAB 2: Insurance */}
          {activeTab === 'insurance' && (
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>
                <input type="checkbox" checked={hasInsurance} onChange={e => setHasInsurance(e.target.checked)} />
                <span>Patient has active Insurance Coverage</span>
              </label>

              {hasInsurance && (
                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-primary)', borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Insurance Provider *</label>
                      <input type="text" value={ins.insurance_provider} onChange={e => setIns({...ins, insurance_provider: e.target.value})} required={hasInsurance} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Policy Number *</label>
                      <input type="text" value={ins.policy_number} onChange={e => setIns({...ins, policy_number: e.target.value})} required={hasInsurance} />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    <div className="input-group">
                      <label className="input-label">Group Number</label>
                      <input type="text" value={ins.group_number} onChange={e => setIns({...ins, group_number: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Plan Type</label>
                      <select value={ins.plan_type} onChange={e => setIns({...ins, plan_type: e.target.value})}>
                        <option value="PPO">PPO</option>
                        <option value="HMO">HMO</option>
                        <option value="EPO">EPO</option>
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Coverage Status</label>
                      <select value={ins.status} onChange={e => setIns({...ins, status: e.target.value})}>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('demographics')}>&larr; Back</button>
                <button type="button" className="btn btn-primary" onClick={() => setActiveTab('clinical')}>Next: Clinical Data &rarr;</button>
              </div>
            </div>
          )}

          {/* TAB 3: Medications and Labs */}
          {activeTab === 'clinical' && (
            <div>
              {/* Medications Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pill size={14} /> Active Medications
                  </span>
                  <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={addMedication}>
                    <Plus size={12} /> Add Med
                  </button>
                </div>

                {meds.length === 0 ? (
                  <div style={{ padding: 12, border: '1px dashed var(--border-primary)', borderRadius: 8, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    No active medications recorded.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {meds.map((m, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, alignItems: 'center', background: 'rgba(139,92,246,0.03)', border: '1px solid rgba(139,92,246,0.1)', borderRadius: 8, padding: 8 }}>
                        <input type="text" placeholder="Drug Name" value={m.drug_name} onChange={e => updateMed(idx, 'drug_name', e.target.value)} required style={{ fontSize: 12, padding: 6 }} />
                        <input type="text" placeholder="Dosage" value={m.dosage} onChange={e => updateMed(idx, 'dosage', e.target.value)} required style={{ fontSize: 12, padding: 6 }} />
                        <input type="text" placeholder="Frequency" value={m.frequency} onChange={e => updateMed(idx, 'frequency', e.target.value)} required style={{ fontSize: 12, padding: 6 }} />
                        <input type="date" value={m.prescribed_date} onChange={e => updateMed(idx, 'prescribed_date', e.target.value)} required style={{ fontSize: 12, padding: 6 }} />
                        <button type="button" style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }} onClick={() => removeMedication(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Labs Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#06b6d4', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FlaskConical size={14} /> Lab Diagnostic Results
                  </span>
                  <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: 11 }} onClick={addLab}>
                    <Plus size={12} /> Add Lab
                  </button>
                </div>

                {labs.length === 0 ? (
                  <div style={{ padding: 12, border: '1px dashed var(--border-primary)', borderRadius: 8, textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                    No laboratory/diagnostic reports recorded.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {labs.map((l, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 1fr auto', gap: 6, alignItems: 'center', background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)', borderRadius: 8, padding: 8 }}>
                        <input type="text" placeholder="Test" value={l.test_name} onChange={e => updateLab(idx, 'test_name', e.target.value)} required style={{ fontSize: 11, padding: 5 }} />
                        <input type="text" placeholder="Value" value={l.test_value} onChange={e => updateLab(idx, 'test_value', e.target.value)} required style={{ fontSize: 11, padding: 5 }} />
                        <input type="text" placeholder="Unit" value={l.unit} onChange={e => updateLab(idx, 'unit', e.target.value)} required style={{ fontSize: 11, padding: 5 }} />
                        <input type="text" placeholder="Ref Range" value={l.reference_range} onChange={e => updateLab(idx, 'reference_range', e.target.value)} required style={{ fontSize: 11, padding: 5 }} />
                        <input type="date" value={l.test_date} onChange={e => updateLab(idx, 'test_date', e.target.value)} required style={{ fontSize: 11, padding: 5 }} />
                        <button type="button" style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer' }} onClick={() => removeLab(idx)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-primary)', paddingTop: 16 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setActiveTab('insurance')}>&larr; Back</button>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Registering...' : 'Register Patient'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default function PatientsPage() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const PAGE_SIZE = 20;

  // Verify write permission
  const canWrite = user?.role === 'Admin' || user?.role === 'CareCoordinator';

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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Patient Records</h1>
          <p className="page-subtitle">{total} patients in system</p>
        </div>
        {canWrite && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Add Patient
          </button>
        )}
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
                          {p.first_name?.[0] || ''}{p.last_name?.[0] || ''}
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
            <button className="btn btn-ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>&larr; Prev</button>
            <span style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' }}>Page {page} of {Math.ceil(total / PAGE_SIZE)}</span>
            <button className="btn btn-ghost" disabled={page >= Math.ceil(total / PAGE_SIZE)} onClick={() => setPage(p => p + 1)}>Next &rarr;</button>
          </div>
        )}
      </div>

      {selected && <PatientDetailModal patient={selected} onClose={() => setSelected(null)} />}
      {showAddModal && <AddPatientModal onClose={() => setShowAddModal(false)} onSave={() => { setShowAddModal(false); fetchPatients(); }} />}
    </>
  );
}
