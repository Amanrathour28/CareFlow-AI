import { useState, useEffect } from 'react';
import { assignmentsApi, usersApi } from '../api/services';
import { X, UserCheck, ShieldCheck } from 'lucide-react';

export default function AssignmentModal({ patient, onClose, onSaved }) {
  const [doctors, setDoctors] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [doctor_id, setDoctorId] = useState(patient?.assigned_doctor_id || '');
  const [caregiver_id, setCaregiverId] = useState(patient?.assigned_caregiver_id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi.list().then(res => {
      const all = res.data || [];
      setDoctors(all.filter(u => u.role === 'Doctor'));
      setCaregivers(all.filter(u => u.role === 'Caregiver'));
    }).catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await assignmentsApi.assignPatient({
        patient_id: patient.id,
        assigned_doctor_id: doctor_id || null,
        assigned_caregiver_id: caregiver_id || null
      });
      onSaved();
      onClose();
    } catch (err) {
      setError('Assignment update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Resource Access Assignment</div>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 12 }}>{error}</div>}

        <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
          Assign clinical Doctor & Caregiver access for <strong>{patient.first_name} {patient.last_name}</strong>.
        </div>

        <form onSubmit={handleSave}>
          <div className="input-group">
            <label className="input-label">Assigned Attending Doctor</label>
            {loadingUsers ? (
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Loading doctors…</div>
            ) : (
              <select value={doctor_id} onChange={e => setDoctorId(e.target.value)}>
                <option value="">— None (Unassigned) —</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>Dr. {d.username} ({d.email})</option>
                ))}
              </select>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Assigned Caregiver</label>
            {loadingUsers ? (
              <div style={{ color: '#94a3b8', fontSize: 12 }}>Loading caregivers…</div>
            ) : (
              <select value={caregiver_id} onChange={e => setCaregiverId(e.target.value)}>
                <option value="">— None (Unassigned) —</option>
                {caregivers.map(c => (
                  <option key={c.id} value={c.id}>{c.username} ({c.email})</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || loadingUsers}>
              {loading ? 'Saving…' : 'Save Assignments'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
