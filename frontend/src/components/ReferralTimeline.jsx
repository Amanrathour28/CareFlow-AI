import React from 'react';

export default function ReferralTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '12px 0' }}>
        No status transitions recorded yet.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '10px 0' }}>
      {timeline.map((event, idx) => (
        <div key={event.id || idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: '#3b82f6',
            marginTop: 6,
            boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)'
          }} />
          <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '8px 12px', borderRadius: 8, flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#94a3b8' }}>
              <span>{event.previous_status ? `${event.previous_status} ➔ ${event.new_status}` : event.new_status}</span>
              <span>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            {event.notes && (
              <div style={{ fontSize: '0.85rem', color: '#f1f5f9', marginTop: 4 }}>
                {event.notes}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
