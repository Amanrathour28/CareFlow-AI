import { useEffect, useState } from 'react';
import { auditApi } from '../api/services';
import { ShieldCheck, Clock, Activity, FileText } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditApi.list()
      .then(res => setLogs(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Security & Operations Audit Trail</h1>
          <p className="page-subtitle">Immutable log of security-sensitive events, logins, and authorization decisions</p>
        </div>
      </div>

      <div className="page-content">
        <div className="table-card">
          <div className="table-header">
            <span className="table-title">System Audit Log Events</span>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Admin access only</span>
          </div>

          {loading ? (
            <div className="loading-state"><div className="spinner" /><span>Loading audit trail…</span></div>
          ) : logs.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🛡️</div><div className="empty-state-text">No audit logs recorded yet.</div></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Resource Type</th>
                  <th>Resource ID</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-pending" style={{ fontFamily: 'monospace' }}>
                        {log.action}
                      </span>
                    </td>
                    <td><span style={{ color: '#06b6d4', fontWeight: 500 }}>{log.resource_type}</span></td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#4b5563' }}>
                      {log.resource_id ? `${log.resource_id.slice(0, 8)}…` : '—'}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: '#6366f1' }}>
                      {log.user_id ? `${log.user_id.slice(0, 8)}…` : 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
