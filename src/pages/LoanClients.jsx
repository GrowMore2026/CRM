import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { FileText, X, Search } from 'lucide-react';
import { useApp } from '../context/AppProvider';

const LoanClients = ({ filterStatus }) => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const statusFilter = searchParams.get('status');
  const activeStatusFilter = filterStatus || statusFilter;

  const { users, currentUser } = useApp();
  const [loanFiles, setLoanFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [viewingLoan, setViewingLoan] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [uiStatusFilter, setUiStatusFilter] = useState('');
  const [selectedFilterEmployee, setSelectedFilterEmployee] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 25;
  
  const loanEmployees = users.filter(u => u.role === 'loan_employee');

  const isEmployee = currentUser?.role === 'loan_employee';
  const isAccountant = currentUser?.role === 'accountant';
  const isAccountantOrAdmin = currentUser?.role === 'accountant' || currentUser?.role === 'superadmin';
  const isReadOnly = (loan) => isEmployee && loan?.status === 'Rejected';

  const handleAssign = async () => {
    if (!selectedEmployee) return alert("Please select a loan employee first");
    if (selectedLeads.length === 0) return alert("Please select at least one client");
    
    try {
      const { error } = await supabase
        .from('loan_files')
        .update({ createdBy: selectedEmployee })
        .in('id', selectedLeads);
        
      if (error) throw error;
      
      setLoanFiles(loanFiles.map(l => 
        selectedLeads.includes(l.id) ? { ...l, createdBy: selectedEmployee } : l
      ));
      setSelectedLeads([]);
      setSuccessMessage("Clients successfully shared!");
    } catch (err) {
      console.error('Error assigning clients:', err);
      alert('Failed to share: ' + err.message);
    }
  };

  const filteredLoans = loanFiles.filter(loan => {
    const effectiveFilter = uiStatusFilter || activeStatusFilter;
    if (effectiveFilter && loan.status !== effectiveFilter) return false;
    if (!effectiveFilter && !isAccountant && (loan.status === 'Rejected' || loan.status === 'Cheque Handover')) return false;
    if (!isEmployee && selectedFilterEmployee && loan.createdBy !== selectedFilterEmployee) return false;
    
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (loan.fullName && loan.fullName.toLowerCase().includes(term)) ||
      (loan.mobileNumber && loan.mobileNumber.toLowerCase().includes(term)) ||
      (loan.city && loan.city.toLowerCase().includes(term)) ||
      (loan.typeOfLoan && loan.typeOfLoan.toLowerCase().includes(term))
    );
  });

  const parseDsaDetails = (notes) => {
    if (!notes || !notes.includes('DSA Partner Details:')) return null;
    try {
      const lines = notes.split('\n');
      const nameLine = lines.find(l => l.includes('- Name:'));
      const numberLine = lines.find(l => l.includes('- Number:'));
      const locLine = lines.find(l => l.includes('- Location:'));
      return {
        name: nameLine ? nameLine.split('- Name:')[1].trim() : '',
        number: numberLine ? numberLine.split('- Number:')[1].trim() : '',
        location: locLine ? locLine.split('- Location:')[1].trim() : ''
      };
    } catch (e) {
      return null;
    }
  };

  const parseReferralDetails = (notes) => {
    if (!notes || !notes.includes('Referral Details:')) return null;
    try {
      const lines = notes.split('\n');
      const ref1NameLine = lines.find(l => l.includes('Referral 1 Name:'));
      const ref1NumLine = lines.find(l => l.includes('Referral 1 Number:'));
      const ref2NameLine = lines.find(l => l.includes('Referral 2 Name:'));
      const ref2NumLine = lines.find(l => l.includes('Referral 2 Number:'));
      return {
        ref1Name: ref1NameLine ? ref1NameLine.split('Referral 1 Name:')[1].trim() : '',
        ref1Number: ref1NumLine ? ref1NumLine.split('Referral 1 Number:')[1].trim() : '',
        ref2Name: ref2NameLine ? ref2NameLine.split('Referral 2 Name:')[1].trim() : '',
        ref2Number: ref2NumLine ? ref2NumLine.split('Referral 2 Number:')[1].trim() : ''
      };
    } catch (e) {
      return null;
    }
  };

  const parseBankerDetails = (notes) => {
    if (!notes || !notes.includes('Banker Details:')) return null;
    try {
      const lines = notes.split('\n');
      const nameLine = lines.find(l => l.includes('Banker Name:'));
      const phoneLine = lines.find(l => l.includes('Banker Phone:'));
      return {
        name: nameLine ? nameLine.split('Banker Name:')[1].trim() : '',
        phone: phoneLine ? phoneLine.split('Banker Phone:')[1].trim() : ''
      };
    } catch (e) {
      return null;
    }
  };

  const inputStyle = { padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: isEmployee ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: isEmployee ? 'var(--text-muted)' : 'var(--text-primary)', width: '150px', fontSize: '0.85rem' };

  useEffect(() => {
    fetchLoanFiles();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, uiStatusFilter, selectedFilterEmployee, activeStatusFilter]);

  const fetchLoanFiles = async () => {
    try {
      setLoading(true);
      let query = supabase.from('loan_files').select('*');
      
      if (currentUser?.role === 'loan_employee') {
        query = query.eq('createdBy', currentUser.id);
      } else if (currentUser?.role === 'accountant') {
        query = query.eq('status', 'Cheque Handover');
      }
      
      const { data, error } = await query.order('createdAt', { ascending: false });

      if (error) throw error;
      setLoanFiles(data || []);
    } catch (err) {
      console.error('Error fetching loan files:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedLeads(filteredLoans.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const toggleSelect = (id) => {
    if (selectedLeads.includes(id)) {
      setSelectedLeads(selectedLeads.filter(l => l !== id));
    } else {
      setSelectedLeads([...selectedLeads, id]);
    }
  };

  const getSalesUserName = (userId) => {
    const u = users.find(user => user.id === userId);
    return u ? u.name : 'Unassigned';
  };

  const getFormatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const deleteLoanFile = async (id) => {
    setConfirmDialog({
      message: 'Are you sure you want to permanently delete this loan file?',
      confirmText: 'Yes, Delete',
      onConfirm: async () => {
        try {
          const { error } = await supabase.from('loan_files').delete().eq('id', id);
          if (error) throw error;
          setLoanFiles(loanFiles.filter(l => l.id !== id));
          setSelectedLeads(selectedLeads.filter(l => l !== id));
        } catch (err) {
          console.error('Error deleting loan file:', err);
          alert('Failed to delete: ' + err.message);
        }
      }
    });
  };

  const exportToCSV = () => {
    if (!filteredLoans || filteredLoans.length === 0) return alert("No data to export");

    const headers = [
      'Lead Source', 'Status', 'Full Name', 'Mobile Number', 'Alt Mobile', 'City', 'Loan Type', 
      'Loan Purpose', 'PAN', 'Age', 'Employment Type', 'Occupation', 'Employer', 
      'Monthly Income', 'Property Value', 'Loan Amount', 'Down Payment', 'Total EMI', 'Created Date', 'Sales Rep', 'Login Date', 'Cheque Handover Date'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [headers.join(',')];

    for (const loan of filteredLoans) {
      const row = [
        escapeCsv(loan.source || 'Open'),
        escapeCsv(loan.status || 'CREATED'),
        escapeCsv(loan.fullName),
        escapeCsv(loan.mobileNumber),
        escapeCsv(loan.alternateMobile),
        escapeCsv(loan.city),
        escapeCsv(loan.typeOfLoan),
        escapeCsv(loan.loanPurpose),
        escapeCsv(loan.panCardNumber),
        escapeCsv(loan.age),
        escapeCsv(loan.employmentType),
        escapeCsv(loan.occupation),
        escapeCsv(loan.employer),
        escapeCsv(loan.monthlyIncome),
        escapeCsv(loan.propertyValue),
        escapeCsv(loan.loanAmount),
        escapeCsv(loan.downPayment),
        escapeCsv(loan.totalEmi),
        escapeCsv(getFormatDate(loan.createdAt)),
        escapeCsv(loan.createdBy ? getSalesUserName(loan.createdBy) : 'Unassigned'),
        escapeCsv(loan.loginDate ? getFormatDate(loan.loginDate) : '-'),
        escapeCsv(loan.chequeHandoverDate ? getFormatDate(loan.chequeHandoverDate) : '-')
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Loan_Clients_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalPages = Math.ceil(filteredLoans.length / ITEMS_PER_PAGE) || 1;
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredLoans.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>


      {error && (
        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.3)' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search leads..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '9999px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', width: '100%', fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s' }}
            />
          </div>
          {!isEmployee && (
            <select
              value={uiStatusFilter}
              onChange={e => setUiStatusFilter(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '9999px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <option value="">All Statuses</option>
              <option value="Basic Details">Basic Details</option>
              <option value="Documentation">Documentation</option>
              <option value="Login Process">Login Process</option>
              <option value="Login With Technical Legal">Login With Technical Legal</option>
              <option value="PD">PD</option>
              <option value="Query">Query</option>
              <option value="Query Solve">Query Solve</option>
              <option value="Sanction">Sanction</option>
              <option value="Agreement">Agreement</option>
              <option value="Disbursement">Disbursement</option>
              <option value="PD status clear">PD status clear</option>
              <option value="Cheque Handover">Cheque Handover</option>
              <option value="Rejected">Rejected</option>
            </select>
          )}

          {!isEmployee && (
            <select
              value={selectedFilterEmployee}
              onChange={e => setSelectedFilterEmployee(e.target.value)}
              style={{ padding: '0.6rem 1rem', borderRadius: '9999px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
            >
              <option value="">All Employees</option>
              {loanEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          )}

          <button 
            onClick={exportToCSV}
            style={{ padding: '0.6rem 1.2rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <FileText size={18} /> Export CSV
          </button>
        </div>
        
        {(!isEmployee && selectedLeads.length > 0) && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select 
              value={selectedEmployee} 
              onChange={e => setSelectedEmployee(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
            >
              <option value="">Select Employee...</option>
              {loanEmployees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
            <button 
              onClick={handleAssign}
              style={{ padding: '0.5rem 1rem', background: 'var(--accent-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
            >
              Share Selected
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading loan files...
        </div>
      ) : filteredLoans.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          No loan files found matching your search.
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <th style={{ padding: '1rem', width: '40px' }}>
                  <input type="checkbox" checked={selectedLeads.length > 0 && selectedLeads.length === filteredLoans.length} onChange={handleSelectAll} style={{ cursor: 'pointer' }} />
                </th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Phone</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>City</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Service</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loan Amount</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Sales Rep</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Login Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Cheque Handover</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(loan => (
                <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>
                    <input type="checkbox" checked={selectedLeads.includes(loan.id)} onChange={() => toggleSelect(loan.id)} style={{ cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '1rem' }}><span style={{ padding: '0.2rem 0.6rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>{loan.status || 'CREATED'}</span></td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: '600' }}>{loan.fullName || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{loan.mobileNumber || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{loan.city || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{loan.typeOfLoan || '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{loan.loanAmount ? `₹${Number(loan.loanAmount).toLocaleString('en-IN')}` : '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)', fontSize: '0.8rem' }}>{loan.createdBy ? getSalesUserName(loan.createdBy) : 'Unassigned'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{loan.loginDate ? getFormatDate(loan.loginDate) : '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{loan.chequeHandoverDate ? getFormatDate(loan.chequeHandoverDate) : '-'}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{getFormatDate(loan.createdAt)}</td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => { setViewingLoan(loan); setEditForm({ ...loan }); }} style={{ background: 'transparent', color: 'var(--accent-primary)', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: '0.2s', padding: '0.5rem' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title={isReadOnly(loan) ? "View Loan Details" : "Edit Loan Details"}>
                        {isReadOnly(loan) ? '👁️' : '✏️'}
                      </button>
                      {!isEmployee && !isAccountant && (
                        <>
                          <button onClick={() => { setSelectedLeads([loan.id]); window.scrollTo({ top: 0, behavior: 'smooth' }); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: '0.2s', padding: '0.5rem' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Share / Assign">
                            ↪️
                          </button>
                          <button onClick={() => deleteLoanFile(loan.id)} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '1rem', transition: '0.2s', padding: '0.5rem' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'} title="Delete Loan File">
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {filteredLoans.length > ITEMS_PER_PAGE && (
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-tertiary)', borderTop: '1px solid var(--border-color)', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                Showing <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{indexOfFirstItem + 1}</span> to <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{Math.min(indexOfLastItem, filteredLoans.length)}</span> of <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{filteredLoans.length}</span> files
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1} 
                  style={{ 
                    padding: '0.5rem 1.2rem', 
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
                    background: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '9999px', 
                    color: 'var(--text-primary)', 
                    opacity: currentPage === 1 ? 0.5 : 1,
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxShadow: currentPage === 1 ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => { if (currentPage > 1) { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { if (currentPage > 1) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  ← Previous
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage >= totalPages} 
                  style={{ 
                    padding: '0.5rem 1.2rem', 
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', 
                    background: currentPage >= totalPages ? 'transparent' : 'var(--bg-secondary)', 
                    border: '1px solid var(--border-color)', 
                    borderRadius: '9999px', 
                    color: 'var(--text-primary)', 
                    opacity: currentPage >= totalPages ? 0.5 : 1,
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                    boxShadow: currentPage >= totalPages ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={e => { if (currentPage < totalPages) { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { if (currentPage < totalPages) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewingLoan && editForm && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setViewingLoan(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)' }}>
            <button onClick={() => setViewingLoan(null)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem' }}>
              <X size={24} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '700' }}>{viewingLoan.fullName}</h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {viewingLoan.id.slice(0, 8)}...</span>
            </div>
            
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontWeight: '600' }}>Status:</span>
                <select 
                  value={editForm.status} 
                  onChange={e => setEditForm({...editForm, status: e.target.value})}
                  disabled={(isReadOnly(viewingLoan) || isAccountant)}
                  style={{ padding: '0.3rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: '600' }}
                >
                  <option value="Basic Details">Basic Details</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Login Process">Login Process</option>
                  <option value="Login With Technical Legal">Login With Technical Legal</option>
                  <option value="PD">PD</option>
                  <option value="Query">Query</option>
                  <option value="Query Solve">Query Solve</option>
                  <option value="Sanction">Sanction</option>
                  <option value="Agreement">Agreement</option>
                  <option value="Disbursement">Disbursement</option>
                  <option value="PD status clear">PD status clear</option>
                  <option value="Cheque Handover">Cheque Handover</option>
                </select>
              </div>
              <span><span style={{ fontWeight: '600' }}>Date:</span> {getFormatDate(viewingLoan.createdAt)}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              {/* Basic & Property */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Basic & Property</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Lead Source:</span> <input type="text" value={editForm.source || ''} onChange={e => setEditForm({...editForm, source: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  {editForm.source === 'DSA' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>↳ DSA Name:</span> <input type="text" value={editForm.dsaName || (parseDsaDetails(editForm.notes)?.name) || ''} onChange={e => setEditForm({...editForm, dsaName: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>↳ DSA Number:</span> <input type="text" value={editForm.dsaNumber || (parseDsaDetails(editForm.notes)?.number) || ''} onChange={e => setEditForm({...editForm, dsaNumber: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', paddingLeft: '1rem' }}>↳ DSA Location:</span> <input type="text" value={editForm.dsaLocation || (parseDsaDetails(editForm.notes)?.location) || ''} onChange={e => setEditForm({...editForm, dsaLocation: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                    </>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Loan Type:</span> <input type="text" value={editForm.typeOfLoan || ''} onChange={e => setEditForm({...editForm, typeOfLoan: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Purpose:</span> <input type="text" value={editForm.loanPurpose || ''} onChange={e => setEditForm({...editForm, loanPurpose: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>PAN Number:</span> <input type="text" value={editForm.panCardNumber || ''} onChange={e => setEditForm({...editForm, panCardNumber: e.target.value.toUpperCase()})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <input type="text" value={editForm.mobileNumber || ''} onChange={e => setEditForm({...editForm, mobileNumber: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Alt Mobile:</span> <input type="text" value={editForm.alternateMobile || ''} onChange={e => setEditForm({...editForm, alternateMobile: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  
                  {/* Referral 1 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Ref 1 Name:</span> <input type="text" value={editForm.referral1Name || (parseReferralDetails(editForm.notes)?.ref1Name) || ''} onChange={e => setEditForm({...editForm, referral1Name: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Ref 1 Phone:</span> <input type="tel" value={editForm.referral1Number || (parseReferralDetails(editForm.notes)?.ref1Number) || ''} onChange={e => setEditForm({...editForm, referral1Number: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  
                  {/* Referral 2 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Ref 2 Name:</span> <input type="text" value={editForm.referral2Name || (parseReferralDetails(editForm.notes)?.ref2Name) || ''} onChange={e => setEditForm({...editForm, referral2Name: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Ref 2 Phone:</span> <input type="tel" value={editForm.referral2Number || (parseReferralDetails(editForm.notes)?.ref2Number) || ''} onChange={e => setEditForm({...editForm, referral2Number: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>City:</span> <input type="text" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Age:</span> <input type="number" value={editForm.age || ''} onChange={e => setEditForm({...editForm, age: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Property Type:</span> <input type="text" value={editForm.propertyType || ''} onChange={e => setEditForm({...editForm, propertyType: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Prop. Location:</span> <input type="text" value={editForm.propertyLocation || ''} onChange={e => setEditForm({...editForm, propertyLocation: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Login Date:</span> <input type="date" value={editForm.loginDate || ''} onChange={e => setEditForm({...editForm, loginDate: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Cheque Handover:</span> <input type="date" value={editForm.chequeHandoverDate || ''} onChange={e => setEditForm({...editForm, chequeHandoverDate: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  
                  {/* Banker */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Banker Name:</span> <input type="text" value={editForm.bankerName || (parseBankerDetails(editForm.notes)?.name) || ''} onChange={e => setEditForm({...editForm, bankerName: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Banker Phone:</span> <input type="tel" value={editForm.bankerPhone || (parseBankerDetails(editForm.notes)?.phone) || ''} onChange={e => setEditForm({...editForm, bankerPhone: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                </div>
              </div>

              {/* Financial & Employment */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Financials</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Employment:</span> <input type="text" value={editForm.employmentType || ''} onChange={e => setEditForm({...editForm, employmentType: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Occupation:</span> <input type="text" value={editForm.occupation || ''} onChange={e => setEditForm({...editForm, occupation: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Employer:</span> <input type="text" value={editForm.employer || ''} onChange={e => setEditForm({...editForm, employer: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Monthly Income:</span> <input type="number" value={editForm.monthlyIncome || ''} onChange={e => setEditForm({...editForm, monthlyIncome: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Prop Value:</span> <input type="number" value={editForm.propertyValue || ''} onChange={e => setEditForm({...editForm, propertyValue: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Loan Amount:</span> <input type="number" value={editForm.loanAmount || ''} onChange={e => setEditForm({...editForm, loanAmount: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Down Pymt:</span> <input type="number" value={editForm.downPayment || ''} onChange={e => setEditForm({...editForm, downPayment: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)' }}>Total EMI:</span> <input type="number" value={editForm.totalEmi || ''} onChange={e => setEditForm({...editForm, totalEmi: e.target.value})} style={inputStyle} disabled={isEmployee || isAccountant} /></div>
                </div>
              </div>

              {/* Documents */}
              <div style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Documents Submitted</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.9rem' }}>
                  
                  {/* Income Documents */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.5rem' }}>Income Documents</div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>PAN & Aadhaar:</span> <input type="checkbox" checked={editForm.docPanAadhaar || false} onChange={e => setEditForm({...editForm, docPanAadhaar: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Salary Slips (6 months):</span> <input type="checkbox" checked={editForm.docSalarySlips || false} onChange={e => setEditForm({...editForm, docSalarySlips: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Bank Statement (12m):</span> <input type="checkbox" checked={editForm.docBankStatement || false} onChange={e => setEditForm({...editForm, docBankStatement: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>ITR (3 Years):</span> <input type="checkbox" checked={editForm.docItr || false} onChange={e => setEditForm({...editForm, docItr: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Business Financials:</span> <input type="checkbox" checked={editForm.docBusinessFinancials || false} onChange={e => setEditForm({...editForm, docBusinessFinancials: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                  </div>
                  
                  {/* Property Documents */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginTop: '0.5rem' }}>Property Documents</div>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Agreement to Sell:</span> <input type="checkbox" checked={editForm.docAgreementToSell || false} onChange={e => setEditForm({...editForm, docAgreementToSell: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Sale Deed:</span> <input type="checkbox" checked={editForm.docSaleDeed || false} onChange={e => setEditForm({...editForm, docSaleDeed: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Builder Agreement:</span> <input type="checkbox" checked={editForm.docBuilderAgreement || false} onChange={e => setEditForm({...editForm, docBuilderAgreement: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>Approved Plan:</span> <input type="checkbox" checked={editForm.docApprovedPlan || false} onChange={e => setEditForm({...editForm, docApprovedPlan: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: (isReadOnly(viewingLoan) || isAccountant) ? 'default' : 'pointer' }}><span style={{ color: 'var(--text-muted)' }}>OC/CC:</span> <input type="checkbox" checked={editForm.docOcCc || false} onChange={e => setEditForm({...editForm, docOcCc: e.target.checked})} disabled={(isReadOnly(viewingLoan) || isAccountant)} /></label>
                  </div>
                </div>
              </div>

              {/* Accountant / Super Admin Financials */}
              {isAccountantOrAdmin && (
                <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Internal Financials</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Bank Name:</span> <input type="text" value={editForm.bankName || ''} onChange={e => setEditForm({...editForm, bankName: e.target.value})} style={inputStyle} disabled={isReadOnly(viewingLoan)} placeholder="Enter Bank Name" /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Bank Side Total Amount:</span> <input type="number" value={editForm.bankSideAmount || ''} onChange={e => { const val = parseFloat(e.target.value) || 0; const tds = e.target.value ? (val * 0.02).toFixed(2) : ''; const netPay = e.target.value ? (val - parseFloat(tds)).toFixed(2) : ''; setEditForm({...editForm, bankSideAmount: e.target.value, tdsAmount: tds, netPayableAmount: netPay}); }} style={inputStyle} disabled={isReadOnly(viewingLoan)} placeholder="0.00" /></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>TDS Percentage (%):</span> <input type="text" value="2%" style={{...inputStyle, background: 'var(--bg-tertiary)', color: 'var(--text-muted)'}} disabled /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>TDS Amount:</span> <input type="number" value={editForm.tdsAmount || ''} onChange={e => setEditForm({...editForm, tdsAmount: e.target.value})} style={inputStyle} disabled={isReadOnly(viewingLoan)} placeholder="0.00" /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Net Payable (After TDS):</span> <input type="number" value={editForm.netPayableAmount || ''} onChange={e => setEditForm({...editForm, netPayableAmount: e.target.value})} style={{...inputStyle, fontWeight: 'bold'}} disabled={isReadOnly(viewingLoan)} placeholder="0.00" /></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}><span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>Customer Side Amount:</span> <input type="number" value={editForm.customerSideAmount || ''} onChange={e => setEditForm({...editForm, customerSideAmount: e.target.value})} style={inputStyle} disabled={isReadOnly(viewingLoan)} placeholder="0.00" /></div>
                    </div>
                  </div>
                </div>
              )}

            </div>


            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              {!isReadOnly(viewingLoan) && !isAccountant && (
                <button 
                  onClick={() => {
                    setConfirmDialog({
                      message: 'Are you sure you want to reject this file?',
                      confirmText: 'Yes, Reject',
                      onConfirm: async () => {
                        setSaving(true);
                        try {
                          const { error } = await supabase.from('loan_files').update({ ...editForm, status: 'Rejected' }).eq('id', editForm.id);
                          if (error) throw error;
                          setLoanFiles(loanFiles.map(l => l.id === editForm.id ? { ...editForm, status: 'Rejected' } : l));
                          setViewingLoan(null);
                        } catch (err) {
                          alert('Error rejecting: ' + err.message);
                        } finally {
                          setSaving(false);
                        }
                      }
                    });
                  }} 
                  disabled={saving}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  Reject File
                </button>
              )}
              <button onClick={() => setViewingLoan(null)} style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer' }}>{isReadOnly(viewingLoan) ? 'Close' : 'Cancel'}</button>
              {!isReadOnly(viewingLoan) && (
                <button 
                  onClick={async () => {
                    setSaving(true);
                    try {
                      const { error } = await supabase.from('loan_files').update(editForm).eq('id', editForm.id);
                      if (error) throw error;
                      setLoanFiles(loanFiles.map(l => l.id === editForm.id ? { ...editForm } : l));
                      setViewingLoan(null);
                    } catch (err) {
                      alert('Error saving: ' + err.message);
                    } finally {
                      setSaving(false);
                    }
                  }} 
                  disabled={saving}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: '600', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {successMessage && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setSuccessMessage('')} />
          <div className="animate-fade-in" style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <span style={{ fontSize: '1.5rem' }}>✅</span>
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '700' }}>Success</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage('')}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: 'white', fontWeight: '600', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              OK
            </button>
          </div>
        </div>,
        document.body
      )}

      {confirmDialog && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }} onClick={() => setConfirmDialog(null)} />
          <div style={{ position: 'relative', background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              <X size={24} color="#ef4444" />
            </div>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: '700' }}>Confirm Action</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.5' }}>{confirmDialog.message}</p>
            <div style={{ display: 'flex', gap: '1rem', justifyItems: 'stretch' }}>
              <button 
                onClick={() => setConfirmDialog(null)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', fontWeight: '600', cursor: 'pointer', transition: '0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: '600', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                {confirmDialog.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default LoanClients;
