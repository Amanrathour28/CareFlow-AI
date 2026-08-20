import React, { useState, useEffect } from 'react';
import { documentsApi } from '../api/services';

export default function DocumentManager({ patientId, referralId }) {
  const [documents, setDocuments] = useState([]);
  const [documentType, setDocumentType] = useState('InsuranceCard');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    try {
      const res = await documentsApi.list({ patient_id: patientId, referral_id: referralId });
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  useEffect(() => {
    if (patientId || referralId) fetchDocs();
  }, [patientId, referralId]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !patientId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('patient_id', patientId);
    if (referralId) formData.append('referral_id', referralId);
    formData.append('document_type', documentType);
    formData.append('file', file);

    try {
      await documentsApi.upload(formData);
      setFile(null);
      fetchDocs();
    } catch (err) {
      console.error('Failed to upload document:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginTop: 16 }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>📎</span> Clinical & Insurance Document Attachments
      </h4>

      <form onSubmit={handleUpload} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
          style={{ background: '#0f172a', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem' }}
        >
          <option value="InsuranceCard">Insurance Card Copy</option>
          <option value="ClinicalNote">SOAP Clinical Progress Notes</option>
          <option value="ReferralForm">Referral Form</option>
          <option value="AuthDoc">Prior Auth Approval Document</option>
        </select>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ color: '#cbd5e1', fontSize: '0.85rem' }}
        />

        <button
          type="submit"
          disabled={!file || uploading}
          style={{
            background: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: file && !uploading ? 'pointer' : 'not-allowed'
          }}
        >
          {uploading ? 'Uploading...' : 'Upload Attachment'}
        </button>
      </form>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {documents.length === 0 ? (
          <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>No documents attached yet.</p>
        ) : (
          documents.map(doc => (
            <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30,41,59,0.5)', padding: '8px 12px', borderRadius: 6 }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f1f5f9' }}>{doc.file_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Type: {doc.document_type} | {(doc.file_size_bytes / 1024).toFixed(1)} KB</div>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: 4 }}>
                Attached
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
