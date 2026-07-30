import React, { useState } from 'react';
import { useApp } from '../context/AppProvider';

const LoanCalledLeads = () => {
  const { currentUser, loanRawLeads, users, loanCampaigns } = useApp();
  const [statusFilter, setStatusFilter] = useState('');
  const [salesRepFilter, setSalesRepFilter] = useState('');

  const isEmployee = currentUser?.role === 'loan_employee';
  
  const processedLeads = (loanRawLeads || []).filter(lead => {
    if (lead.status === 'UNASSIGNED' || lead.status === 'PENDING' || !lead.status) return false;
    if (isEmployee && lead.claimed_by !== currentUser.id) return false;
    return true;
  });

  const filteredLeads = processedLeads.filter(lead => {
    if (statusFilter && lead.status !== statusFilter) return false;
    if (salesRepFilter && lead.claimed_by !== salesRepFilter) return false;
    return true;
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Loan Called Leads</h2>
          <p style={{ color: 'var(--text-secondary)' }}>View your processed loan leads and their statuses.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', minWidth: '150px' }}
        >
          <option value="">All Statuses</option>
          <option value="Interested">Interested</option>
          <option value="Call Back">Call Back</option>
          <option value="Not Interested">Not Interested</option>
          <option value="Wrong Number">Wrong Number</option>
          <option value="Invalid">Invalid Details</option>
        </select>

        {!isEmployee && (
          <select
            value={salesRepFilter}
            onChange={(e) => setSalesRepFilter(e.target.value)}
            style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', minWidth: '150px' }}
          >
            <option value="">All Employees</option>
            {users?.filter(u => u.role === 'loan_employee' || u.role === 'loan_admin').map(user => (
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
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>First Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Last Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Phone</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Amount</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Payment Date</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
              {!isEmployee && <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Employee</th>}
              <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date Processed</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={isEmployee ? 8 : 9} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No called leads found.
                </td>
              </tr>
            ) : (
              filteredLeads.map(lead => (
                <tr key={lead.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>
                    {loanCampaigns?.find(c => c.id === lead.campaign_id)?.name || '-'}
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{lead.first_name || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.last_name || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.number || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.amount ? `₹${lead.amount}` : '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{lead.payment_date || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: lead.status === 'Interested' || lead.status === 'Call Back' ? '#dcfce7' : '#fee2e2', color: lead.status === 'Interested' || lead.status === 'Call Back' ? '#166534' : '#991b1b', border: `1px solid ${lead.status === 'Interested' || lead.status === 'Call Back' ? '#bbf7d0' : '#fecaca'}` }}>
                      {lead.status || 'UNKNOWN'}
                    </span>
                  </td>
                  {!isEmployee && (
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                      {users?.find(u => u.id === lead.claimed_by)?.name || 'Unknown'}
                    </td>
                  )}
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                    {lead.claimed_at ? new Date(lead.claimed_at).toLocaleDateString() : '-'}
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

export default LoanCalledLeads;
