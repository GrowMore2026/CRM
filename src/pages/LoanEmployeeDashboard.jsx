import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import AddNewLoanFile from './AddNewLoanFile';
import UpcomingHolidays from '../components/UpcomingHolidays';
import MarketingLeadsChart from '../components/MarketingLeadsChart';

const LoanEmployeeOverview = () => {
  const { currentUser, leads, dataLoading } = useApp();
  const myLeads = (leads || []).filter(l => l.createdBy === currentUser.id || l.managedBy === currentUser.id);
  const [loanFiles, setLoanFiles] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  useEffect(() => {
    fetchLoanFiles();
  }, [currentUser]);

  const fetchLoanFiles = async () => {
    if (!currentUser) return;
    try {
      setLoadingLoans(true);
      // Only fetch loans assigned to this employee
      const { data, error } = await supabase
        .from('loan_files')
        .select('*')
        .eq('createdBy', currentUser.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setLoanFiles(data || []);
    } catch (err) {
      console.error('Error fetching loan files:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Metrics for THIS employee
  const totalLoans = loanFiles.length;
  const pendingLoans = loanFiles.filter(l => l.status === 'CREATED' || l.status === 'Processing' || !l.status).length;
  const approvedLoans = loanFiles.filter(l => l.status === 'Cheque Handover').length;
  const rejectedLoans = loanFiles.filter(l => l.status === 'Rejected').length;

  // Chart 1: My Loan Pipeline (Status Pie Chart)
  const statusCounts = loanFiles.reduce((acc, curr) => {
    const st = curr.status || 'CREATED';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  // Recent 5 loans
  const recentLoans = loanFiles.slice(0, 5);

  if (dataLoading || loadingLoans) {
    return (
      <div className="dashboard-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-content" style={{ paddingBottom: '3rem' }}>
      
      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
            <FileText size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>My Total Files</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalLoans}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Pending Action</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{pendingLoans}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Approved</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{approvedLoans}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Rejected</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{rejectedLoans}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Recent Loans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>My Recent Applications</h3>
              <Link to="/loan-employee/clients" style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>View All →</Link>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              {recentLoans.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 0' }}>Client Name</th>
                      <th style={{ padding: '0.75rem 0' }}>Type</th>
                      <th style={{ padding: '0.75rem 0' }}>Amount</th>
                      <th style={{ padding: '0.75rem 0' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLoans.map(loan => (
                      <tr key={loan.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text-primary)', fontWeight: '600' }}>{loan.fullName || 'Unnamed'}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{loan.typeOfLoan || 'N/A'}</td>
                        <td style={{ padding: '0.75rem 0', color: 'var(--text-secondary)' }}>{loan.loanAmount ? `₹${Number(loan.loanAmount).toLocaleString()}` : 'N/A'}</td>
                        <td style={{ padding: '0.75rem 0' }}>
                          <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600', background: loan.status === 'Cheque Handover' ? 'rgba(16,185,129,0.1)' : loan.status === 'Rejected' ? 'rgba(239,68,68,0.1)' : 'rgba(14,165,233,0.1)', color: loan.status === 'Cheque Handover' ? '#10b981' : loan.status === 'Rejected' ? '#ef4444' : '#0ea5e9' }}>
                            {loan.status || 'CREATED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>You have no recent loan applications.</div>
              )}
            </div>
          </div>
          <MarketingLeadsChart leads={myLeads} />
        </div>

        {/* Right Column: Chart & Holidays */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>My Loan Pipeline</h3>
            <div style={{ height: '250px' }}>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <UpcomingHolidays />
          </div>

        </div>
      </div>
    </div>
  );
};

const LoanEmployeeDashboard = () => (
  <Routes>
    <Route path="/" element={<LoanEmployeeOverview />} />
    <Route path="/add-loan-file" element={<AddNewLoanFile buttonOverride="Register Loan File" successMessageOverride="Loan File Created Successfully!" />} />
  </Routes>
);

export default LoanEmployeeDashboard;
