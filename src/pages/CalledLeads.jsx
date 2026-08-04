import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';
import { Search } from 'lucide-react';

const CalledLeads = () => {
  const { currentUser, rawLeads, users, campaigns } = useApp();
  const [statusFilter, setStatusFilter] = useState('');
  const [salesRepFilter, setSalesRepFilter] = useState('');

  // Filter out UNASSIGNED and PENDING leads.
  // If the user is a sales rep, only show their own called leads.
  // If they are an admin, show all called leads.
  const isSales = currentUser?.role === 'sales';
  
  const processedLeads = (rawLeads || []).filter(lead => {
    if (lead.status === 'UNASSIGNED' || lead.status === 'PENDING' || !lead.status) return false;
    if (isSales && lead.claimed_by !== currentUser.id) return false;
    return true;
  });

  const filteredLeads = processedLeads.filter(lead => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (salesRepFilter && lead.claimed_by !== salesRepFilter) return false;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header removed as requested */}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          <option value="not pick up">not pick up</option>
          <option value="intro">intro</option>
          <option value="call back">call back</option>
          <option value="intretsed">intretsed</option>
          <option value="not intrested">not intrested</option>
          <option value="language issue">language issue</option>
          <option value="connectivity issue">connectivity issue</option>
          <option value="DND">DND</option>
          <option value="Voice Mail">Voice Mail</option>
          <option value="Switch Off">Switch Off</option>
        </select>

        {!isSales && (
          <select
            value={salesRepFilter}
            onChange={(e) => setSalesRepFilter(e.target.value)}
            style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', minWidth: '150px' }}
          >
            <option value="">All Sales Reps</option>
            {users?.filter(u => u.role === 'sales').map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Campaign</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Company</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Phone</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Email</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>State</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              {!isSales && <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Sales Rep</th>}
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date Processed</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={isSales ? 8 : 9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No called leads found.
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {campaigns?.find(c => c.id === lead.campaign_id)?.name || '-'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{lead.company_name || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.director_name || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.phone || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.email || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.state || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: lead.status === 'Interested' || lead.status === 'Call Back' ? '#dcfce7' : '#fee2e2', color: lead.status === 'Interested' || lead.status === 'Call Back' ? '#166534' : '#991b1b', border: `1px solid ${lead.status === 'Interested' || lead.status === 'Call Back' ? '#bbf7d0' : '#fecaca'}` }}>
                      {lead.status || 'UNKNOWN'}
                    </span>
                  </td>
                  {!isSales && (
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>
                      {lead.claimed_by ? (users?.find(u => u.id === lead.claimed_by)?.name || 'Unknown') : '-'}
                    </td>
                  )}
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                    {new Date(lead.claimed_at || lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CalledLeads;
