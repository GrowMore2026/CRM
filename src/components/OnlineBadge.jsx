import React from 'react';

export const isUserOnline = (user) => {
  if (!user || !user.is_online || !user.last_active) return false;
  const lastActive = new Date(user.last_active);
  const now = new Date();
  const diffMinutes = (now - lastActive) / (1000 * 60);
  return diffMinutes < 5;
};

const OnlineBadge = ({ user }) => {
  if (!user) return null;

  const online = isUserOnline(user);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: online ? '#10b981' : '#9ca3af',
          boxShadow: online ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
        }}
        title={online ? 'Online' : 'Offline'}
      />
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        {online ? 'Online' : 'Offline'}
      </span>
    </div>
  );
};

export default OnlineBadge;
