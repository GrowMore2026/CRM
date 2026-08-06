import React, { useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import OnlineBadge, { isUserOnline } from '../components/OnlineBadge';
import { Users, Mail, User } from 'lucide-react';

const AllEmployeeStatus = () => {
  const { users = [] } = useApp();

  const sortedUsers = useMemo(() => {
    return [...(users || [])].sort((a, b) => {
      const aOnline = isUserOnline(a);
      const bOnline = isUserOnline(b);
      
      // Sort online users first
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;
      
      // Secondary sort by name
      const nameA = String(a.name || '');
      const nameB = String(b.name || '');
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      


      {/* Cards Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {sortedUsers.map(user => {
            const online = isUserOnline(user);
            return (
              <div key={user.id} style={{ 
                background: 'var(--bg-primary)', 
                borderRadius: '1rem', 
                border: '1px solid var(--border-color)', 
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                transition: 'transform 0.2s, box-shadow 0.2s',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                cursor: 'default'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)'; }}
              >
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.2rem' }}>
                      {user.name && typeof user.name === 'string' ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{user.name || 'Unknown User'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>ID: {user.id}</div>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '0.4rem 0.75rem', 
                    borderRadius: '8px', 
                    fontSize: '0.75rem', 
                    fontWeight: '700',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    {String(user.role || 'User').replace('_', ' ')}
                  </div>
                </div>

                {user.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    <Mail size={14} color="var(--text-muted)" />
                    {user.email}
                  </div>
                )}
                
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: online ? 'rgba(16, 185, 129, 0.05)' : 'rgba(156, 163, 175, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', border: online ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(156, 163, 175, 0.2)' }}>
                    <OnlineBadge user={user} />
                    <span style={{ fontSize: '0.75rem', color: online ? '#10b981' : 'var(--text-muted)', fontWeight: '700', marginLeft: '4px' }}>
                      {online ? 'Active Now' : 'Offline'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
          
          {sortedUsers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users found.
            </div>
          )}
        </div>
    </div>
  );
};

export default AllEmployeeStatus;
