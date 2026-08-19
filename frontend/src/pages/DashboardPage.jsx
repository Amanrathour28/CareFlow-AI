import { useEffect, useState } from 'react';
import { dashboardApi } from '../api/services';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import {
  Users, FileText, CheckCircle, AlertCircle, Activity, TrendingUp
} from 'lucide-react';

const STATUS_COLORS = {
  'Pending': '#f59e0b',
  'Under Review': '#6366f1',
  'Missing Info': '#8b5cf6',
  'Approved': '#10b981',
  'Rejected': '#f43f5e',
};

const PRIORITY_COLORS = {
  'Low': '#10b981',
  'Medium': '#f59e0b',
  'High': '#f43f5e',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 12px' }}>
        <p style={{ color: '#f0f4ff', fontSize: 13 }}>{payload[0].name}: <strong>{payload[0].value}</strong></p>
      </div>
    );
  }
  return null;
};

function ScoreGauge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#f43f5e';
  const qualityClass = score >= 80 ? 'quality-high' : score >= 60 ? 'quality-medium' : 'quality-low';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 120, height: 120, borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', boxShadow: `0 0 30px ${color}33`
      }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', background: '#111827', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color }}>{score}</span>
          <span style={{ fontSize: 10, color: '#4b5563' }}>/ 100</span>
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color }}>
          {score >= 80 ? '✓ Excellent' : score >= 60 ? '⚠ Moderate' : '✗ Needs Work'}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Average Data Quality</div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.metrics()
      .then(res => setMetrics(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="loading-state" style={{ height: '60vh' }}>
      <div className="spinner" style={{ width: 32, height: 32 }} />
      <span>Loading dashboard metrics…</span>
    </div>
  );

  const stats = [
    { label: 'Total Patients', value: metrics?.total_patients ?? 0, icon: Users, color: 'indigo' },
    { label: 'Pending Referrals', value: metrics?.pending_referrals ?? 0, icon: FileText, color: 'amber' },
    { label: 'Approved Referrals', value: metrics?.approved_referrals ?? 0, icon: CheckCircle, color: 'emerald' },
    { label: 'Missing Info', value: metrics?.missing_info_referrals ?? 0, icon: AlertCircle, color: 'rose' },
    { label: 'High Priority Cases', value: metrics?.high_priority_referrals ?? 0, icon: Activity, color: 'violet' },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Operations Dashboard</h1>
          <p className="page-subtitle">Real-time referral intelligence and workflow metrics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Live</span>
        </div>
      </div>

      <div className="page-content">
        {/* Stat Cards */}
        <div className="stat-grid">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`stat-card ${color}`}>
              <div className="stat-icon-wrap"><Icon size={20} /></div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="charts-grid">
          {/* Referral Status Pie */}
          <div className="chart-card">
            <div className="chart-title">Referral Status Distribution</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={metrics?.status_distribution ?? []} cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                  dataKey="value" paddingAngle={3} label={({ name, value }) => value > 0 ? `${value}` : ''}>
                  {(metrics?.status_distribution ?? []).map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(val) => <span style={{ fontSize: 12, color: '#94a3b8' }}>{val}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Priority Bar Chart */}
          <div className="chart-card">
            <div className="chart-title">Referrals by Priority</div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={metrics?.priority_distribution ?? []} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {(metrics?.priority_distribution ?? []).map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom: Quality Score + Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
          {/* Quality Gauge */}
          <div className="chart-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScoreGauge score={Math.round(metrics?.average_data_quality_score ?? 100)} />
          </div>

          {/* Quick Summary */}
          <div className="chart-card">
            <div className="chart-title">Workflow Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
              {[
                { label: 'Referrals awaiting coordinator review', value: metrics?.pending_referrals + metrics?.missing_info_referrals, color: '#f59e0b' },
                { label: 'Referrals approved and closed', value: metrics?.approved_referrals, color: '#10b981' },
                { label: 'Active patients in system', value: metrics?.total_patients, color: '#6366f1' },
                { label: 'High-priority open cases', value: metrics?.high_priority_referrals, color: '#f43f5e' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color }}>{value ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
