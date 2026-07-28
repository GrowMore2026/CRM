import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { getClientPaymentsList, getClientCompanyName, getClientBudgetAmount } from '../utils/clientRow';
import { Wallet, Search, Calendar, User, Building, ExternalLink, ArrowDownRight, IndianRupee, Download } from 'lucide-react';
import SearchBar from '../components/SearchBar';

const PaymentHistory = () => {
  const { clients, users, currentUser } = useApp();
  const [searchQ, setSearchQ] = useState('');
  
  const currentY = new Date().getFullYear();
  const currentM = new Date().getMonth();
  const [selectedYear, setSelectedYear] = useState(currentY);
  const [selectedMonth, setSelectedMonth] = useState(currentM); // 0-11, or 'all'

  // Extract all payments from all visible clients
  const allPayments = useMemo(() => {
    // If the user is Sales, they should probably only see their own clients' payments
    // If Admin/Accountant, they see all
    const visibleClients = clients.filter(c => {
      if (currentUser?.role === 'admin' || currentUser?.role === 'accountant' || currentUser?.role === 'superadmin') return true;
      return c.createdBy === currentUser.id || c.closer === currentUser.id;
    });

    const payments = [];

    visibleClients.forEach(c => {
      const clientPayments = getClientPaymentsList(c);
      const company = getClientCompanyName(c);
      const leadGenerator = users.find(u => u.id === c.createdBy)?.name || 'Unknown';
      const closer = users.find(u => u.id === c.closer)?.name || leadGenerator;
      const totalDeal = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0;
      const totalCollected = Number(c.paymentAmount) || 0;
      const remainingPayment = totalDeal - totalCollected;

      clientPayments.forEach(p => {
        if (p.amount > 0 && p.date) {
          payments.push({
            id: `${c.id}-${p.date}-${p.amount}-${Math.random()}`,
            clientId: c.id,
            clientName: c.name,
            company: company,
            amount: Number(p.amount),
            date: new Date(p.date),
            dateStr: p.date,
            leadGenerator,
            closer,
            totalDeal,
            totalCollected,
            remainingPayment
          });
        }
      });
    });

    // Sort descending by date
    return payments.sort((a, b) => b.date - a.date);
  }, [clients, users, currentUser]);

  // Apply filters
  const filteredPayments = useMemo(() => {
    return allPayments.filter(p => {
      // Year filter
      if (selectedYear !== 'all' && p.date.getFullYear() !== Number(selectedYear)) {
        return false;
      }
      // Month filter
      if (selectedMonth !== 'all' && p.date.getMonth() !== Number(selectedMonth)) {
        return false;
      }

      // Search query
      if (searchQ.trim()) {
        const q = searchQ.toLowerCase();
        return (
          p.clientName?.toLowerCase().includes(q) ||
          p.company?.toLowerCase().includes(q) ||
          p.leadGenerator?.toLowerCase().includes(q) ||
          p.closer?.toLowerCase().includes(q) ||
          p.amount.toString().includes(q)
        );
      }

      return true;
    });
  }, [allPayments, searchQ, selectedYear, selectedMonth]);

  const totalFilteredAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  const downloadCSV = () => {
    const headers = ['Date', 'Client Name', 'Lead Generator Name', 'Closer Name', 'Collected Amount', 'Remaining Amount', 'Full Amount'];
    const rows = filteredPayments.map(p => [
      p.date.toLocaleDateString('en-GB'),
      `"${p.clientName.replace(/"/g, '""')}"`,
      `"${p.leadGenerator.replace(/"/g, '""')}"`,
      `"${p.closer.replace(/"/g, '""')}"`,
      p.amount,
      p.remainingPayment,
      p.totalDeal
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Payment_History_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>

      {/* ── Summary & Filters ── */}
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', marginBottom: '2rem', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
          
          <div style={{ display: 'flex', gap: '2rem' }}>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Received</p>
              <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {fmt(totalFilteredAmount)}
              </p>
            </div>
            <div style={{ width: '1px', background: 'var(--border-color)' }}></div>
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Transactions</p>
              <p style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {filteredPayments.length}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
            <SearchBar 
              value={searchQ} 
              onChange={e => setSearchQ(e.target.value)} 
              placeholder="Search payments..." 
              style={{ minWidth: '250px', flex: 'none' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                className="form-control" 
                value={selectedMonth} 
                onChange={e => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ borderRadius: '999px', background: 'var(--bg-tertiary)', minWidth: '120px' }}
              >
                <option value="all">All Months</option>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select 
                className="form-control" 
                value={selectedYear} 
                onChange={e => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                style={{ borderRadius: '999px', background: 'var(--bg-tertiary)', minWidth: '100px' }}
              >
                <option value="all">All Years</option>
                {[currentY, currentY - 1, currentY - 2, currentY - 3].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button
              onClick={downloadCSV}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '999px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.2)'; }}
            >
              <Download size={16} />
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Personnel</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deal Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Transaction</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                        <Calendar size={16} color="var(--text-muted)" />
                        {p.date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.clientName}</div>
                      {p.company && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                          <Building size={12} /> {p.company}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div><strong style={{ color: 'var(--text-primary)' }}>Lead:</strong> {p.leadGenerator}</div>
                        <div style={{ marginTop: '0.25rem' }}><strong style={{ color: 'var(--text-primary)' }}>Closer:</strong> {p.closer}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <div><strong style={{ color: 'var(--text-primary)' }}>Total:</strong> ₹{p.totalDeal.toLocaleString('en-IN')}</div>
                        <div style={{ marginTop: '0.25rem' }}><strong style={{ color: 'var(--success)' }}>Paid:</strong> ₹{p.totalCollected.toLocaleString('en-IN')}</div>
                        <div style={{ marginTop: '0.25rem' }}><strong style={{ color: 'var(--danger)' }}>Due:</strong> ₹{p.remainingPayment.toLocaleString('en-IN')}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem', fontSize: '1.1rem' }}>
                        <IndianRupee size={16} />
                        {p.amount.toLocaleString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>This Payment</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '50%' }}>
                        <Search size={32} style={{ opacity: 0.5 }} />
                      </div>
                      <div>
                        <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>No payments found</p>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>Try adjusting your filters or search query.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
