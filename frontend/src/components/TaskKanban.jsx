import React from 'react';

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: '#64748b' },
  { id: 'InProgress', label: 'In Progress', color: '#3b82f6' },
  { id: 'Blocked', label: 'Blocked', color: '#ef4444' },
  { id: 'Completed', label: 'Completed', color: '#10b981' }
];

export default function TaskKanban({ tasks = [], onUpdateStatus }) {
  const getTasksByStatus = (statusId) => {
    return tasks.filter(t => (t.status || 'TODO').toUpperCase() === statusId.toUpperCase() || (t.status === 'Pending' && statusId === 'TODO'));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '16px' }}>
      {COLUMNS.map(col => {
        const colTasks = getTasksByStatus(col.id);
        return (
          <div
            key={col.id}
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: '12px',
              minHeight: 350
            }}
          >
            <div style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
              borderBottom: `2px solid ${col.color}`,
              paddingBottom: 6
            }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9' }}>{col.label}</span>
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: 10, color: '#94a3b8' }}>
                {colTasks.length}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {colTasks.map(task => (
                <div
                  key={task.id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: 10
                  }}
                >
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}>
                    {task.title || `Task #${task.id.slice(0, 8)}`}
                  </div>
                  {task.notes && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 8 }}>
                      {task.notes}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{
                      color: task.priority === 'High' ? '#f87171' : '#fbbf24',
                      fontWeight: 600
                    }}>
                      {task.priority} Priority
                    </span>
                    <select
                      value={task.status}
                      onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                      style={{
                        background: '#0f172a',
                        color: '#cbd5e1',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: 4,
                        padding: '2px 4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="TODO">To Do</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Blocked">Blocked</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
