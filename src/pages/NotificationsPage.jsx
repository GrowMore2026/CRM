import React from 'react';
import { useApp } from '../context/AppProvider';
import { Bell, Trash2, CheckCircle, Clock } from 'lucide-react';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date() - date) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' minutes ago';
  if (Math.floor(seconds) <= 10) return 'Just now';
  return Math.floor(seconds) + ' seconds ago';
};

const NotificationsPage = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead, deleteNotification } = useApp();

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="page-container animate-fade-in" style={{ padding: '0 1rem' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        {notifications?.length > 0 && (
          <button 
            className="btn btn-secondary" 
            onClick={markAllNotificationsRead}
            disabled={unreadCount === 0}
            style={{ opacity: unreadCount === 0 ? 0.6 : 1 }}
          >
            <CheckCircle size={18} />
            Mark all as read
          </button>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        {notifications?.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Bell size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <p>You don't have any notifications yet.</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {notifications.map((notif) => (
              <li 
                key={notif.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start',
                  padding: '1.25rem', 
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: notif.isRead ? 'transparent' : 'var(--bg-tertiary)',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ 
                  backgroundColor: notif.isRead ? 'var(--bg-secondary)' : 'var(--accent-light)', 
                  color: notif.isRead ? 'var(--text-muted)' : 'var(--accent-primary)',
                  padding: '0.5rem', 
                  borderRadius: '50%',
                  marginRight: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bell size={20} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    margin: '0 0 0.25rem', 
                    color: 'var(--text-primary)',
                    fontWeight: notif.isRead ? 400 : 600
                  }}>
                    {notif.message}
                  </p>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.8rem', 
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <Clock size={12} />
                    {timeAgo(notif.createdAt)}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', opacity: 0.7 }}>
                  {!notif.isRead && (
                    <button 
                      onClick={() => markNotificationRead(notif.id)}
                      title="Mark as read"
                      style={{ 
                        background: 'transparent', border: 'none', cursor: 'pointer', 
                        color: 'var(--accent-primary)', padding: '0.25rem' 
                      }}
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    title="Delete notification"
                    style={{ 
                      background: 'transparent', border: 'none', cursor: 'pointer', 
                      color: 'var(--danger)', padding: '0.25rem' 
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
