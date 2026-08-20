import React, { useState, useEffect } from 'react';
import { notificationsApi } from '../api/services';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.list();
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unread_count || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(30, 41, 59, 0.7)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#f8fafc',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.9rem'
        }}
      >
        <span>🔔</span>
        {unreadCount > 0 && (
          <span style={{
            background: '#ef4444',
            color: '#ffffff',
            borderRadius: '10px',
            padding: '2px 6px',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: '40px',
          width: 320,
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 12,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
          zIndex: 1000,
          padding: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <strong style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Notifications</strong>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unreadCount} unread</span>
          </div>

          <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {notifications.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', margin: '12px 0' }}>No notifications</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkRead(n.id)}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.12)',
                    borderLeft: n.is_read ? '3px solid transparent' : '3px solid #3b82f6',
                    cursor: n.is_read ? 'default' : 'pointer'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f1f5f9' }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{n.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
