import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { supabase } from '../supabaseClient';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { FileText, Users, XCircle, Clock, CheckCircle } from 'lucide-react';
import AddNewLoanFile from './AddNewLoanFile';
import UpcomingHolidays from '../components/UpcomingHolidays';
import MarketingLeadsChart from '../components/MarketingLeadsChart';

const LoanAdminOverview = ({ hideHolidays }) => {
  const { currentUser, users, leads, dataLoading } = useApp();
  const myLeads = (leads || []).filter(l => l.createdBy === currentUser.id || l.managedBy === currentUser.id);
  const [loanFiles, setLoanFiles] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(true);

  useEffect(() => {
    fetchLoanFiles();
  }, []);

  const fetchLoanFiles = async () => {
    try {
      setLoadingLoans(true);
      const { data, error } = await supabase
        .from('loan_files')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setLoanFiles(data || []);
    } catch (err) {
      console.error('Error fetching loan files:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  // Metrics
  const loanEmployees = users.filter(u => u.role === 'loan_employee');
  const totalLoans = loanFiles.length;
  const pendingLoans = loanFiles.filter(l => l.status === 'CREATED' || l.status === 'Processing' || !l.status).length;
  const approvedLoans = loanFiles.filter(l => l.status === 'Cheque Handover').length;
  const rejectedLoans = loanFiles.filter(l => l.status === 'Rejected').length;

  // Chart 1: Loan Status Pie Chart
  const statusCounts = loanFiles.reduce((acc, curr) => {
    const st = curr.status || 'CREATED';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.keys(statusCounts).map(key => ({ name: key, value: statusCounts[key] }));
  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#6366f1'];
  
  const STATUS_COLORS = {
    'Pending': '#f59e0b', // orange
    'Sanction': '#3b82f6', // blue
    'Cheque Handover': '#10b981', // green
    'Rejected': '#ef4444', // red
    'Documentation': '#0ea5e9',
    'Disbursement': '#8b5cf6',
    'Query': '#f97316',
    'Query Solve': '#14b8a6',
    'Login Process': '#ec4899',
    'Login With Technical Legal': '#6366f1',
    'CREATED': '#94a3b8'
  };

  // Chart 2: Loan Types Bar Chart
  const typeCounts = loanFiles.reduce((acc, curr) => {
    const type = curr.typeOfLoan || 'Unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  const typeData = Object.keys(typeCounts).map(key => ({ name: key, count: typeCounts[key] })).sort((a, b) => b.count - a.count);

  // Recent 5 loans
  const recentLoans = loanFiles.slice(0, 5);

  // Employee workload
  const workload = loanEmployees.map(emp => {
    return {
      name: emp.name,
      count: loanFiles.filter(l => l.createdBy === emp.id).length
    };
  }).sort((a, b) => b.count - a.count);

  const topPerformers = workload.slice(0, 5);

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
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Loans</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalLoans}</h3>
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
            <Clock size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Pending</p>
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

        <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Loan Employees</p>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{loanEmployees.length}</h3>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <MarketingLeadsChart leads={myLeads} />
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Loan Status Breakdown</h3>
          <div style={{ height: '300px' }}>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={5} dataKey="value" nameKey="name">
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Top 5 Performers</h3>
          <div style={{ height: '300px' }}>
            {topPerformers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPerformers} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Loan Types Row */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Loan Types</h3>
          <div style={{ height: '300px' }}>
            {typeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border-color)" opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} width={120} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No data available</div>
            )}
          </div>
        </div>
      </div>

      {/* Tables & Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Recent Applications</h3>
              <Link to={currentUser.role === 'superadmin' ? '/superadmin/loan-clients' : '/loan-admin/clients'} style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>View All →</Link>
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
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No recent loans found.</div>
              )}
            </div>
          </div>
          
          {!hideHolidays && (
            <div style={{ flex: 1 }}>
              <UpcomingHolidays />
            </div>
          )}
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, marginBottom: '1.25rem', fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>Employee Workload</h3>
          {workload.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {workload.map((emp, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '0.8rem' }}>
                      {emp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{emp.name}</span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {emp.count} files
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No employees found.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const LoanAdminDashboard = ({ hideHolidays }) => (
  <Routes>
    <Route path="/" element={<LoanAdminOverview hideHolidays={hideHolidays} />} />
    <Route path="/add-loan-file" element={<AddNewLoanFile buttonOverride="Register Loan File" successMessageOverride="Loan File Created Successfully!" />} />
  </Routes>
);

export default LoanAdminDashboard;
