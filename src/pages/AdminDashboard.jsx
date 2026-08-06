import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { UserPlus, Shield, TrendingUp, Building2, Phone } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';
import { supabase } from '../supabaseClient';
import SearchBar from '../components/SearchBar';
import EmployeeData from './EmployeeData';
import AllEmployeeStatus from './AllEmployeeStatus';
import AllClientsAdmin from '../components/AllClientsAdmin';
import AllTasksAdmin from '../components/AllTasksAdmin';
import { DigitalMarketingLeads, DigitalMarketingLeadListView } from './DigitalMarketingDashboard';
import { getClientServicesList, getClientCompanyName, getClientFeedbackText, parseClientFeedback, getClientPaymentsList, getClientCreationDate } from '../utils/clientRow';
import UpcomingHolidays from '../components/UpcomingHolidays';
import AddNewClient from './AddNewClient';
import AddNewLoanFile from './AddNewLoanFile';

// AdminOverview: stats pulled from ALL connected tables
const AdminOverview = ({ readOnly }) => {
  const { users, tasks, clients, currentUser, setSelectedClient, leads, leadLists, rawLeads, loanRawLeads } = useApp();
  const navigate = useNavigate();
  const [searchEmp, setSearchEmp] = useState('');
  const [animate, setAnimate] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(-1);
  const [selectedRawLeadEmployee, setSelectedRawLeadEmployee] = useState('');
  const [selectedLoanRawLeadEmployee, setSelectedLoanRawLeadEmployee] = useState('');

  const [loanFiles, setLoanFiles] = useState([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  useEffect(() => {
    setAnimate(true);
    if (readOnly) {
      fetchLoanFiles();
    }
  }, [readOnly]);

  const fetchLoanFiles = async () => {
    try {
      setLoadingLoans(true);
      const { data, error } = await supabase.from('loan_files').select('*');
      if (error) throw error;
      setLoanFiles(data || []);
    } catch (err) {
      console.error('Error fetching loan files:', err);
    } finally {
      setLoadingLoans(false);
    }
  };

  const salesUsers = users.filter(u => u.role === 'sales');
  
  const latestClients = useMemo(() => {
    return [...clients]
      .sort((a, b) => {
        const dateA = new Date(getClientCreationDate(a) || 0);
        const dateB = new Date(getClientCreationDate(b) || 0);
        return dateB - dateA;
      })
      .slice(0, 10);
  }, [clients]);
  const pendingTasks = tasks.filter(t => t.status === 'Pending');
  const doneTasks = tasks.filter(t => t.status === 'Completed');

  // Admin sees only their assigned clients; superadmin sees all
  const visibleClients = readOnly ? clients : clients.filter(c => c.managedBy === currentUser?.id);

  const latestAssignedClients = useMemo(() => {
    return [...visibleClients]
      .sort((a, b) => {
        const dateA = new Date(getClientCreationDate(a) || 0);
        const dateB = new Date(getClientCreationDate(b) || 0);
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [visibleClients]);
  const paidClients = visibleClients.filter(c => c.paymentStatus === 'Completed');
  const pendingClients = visibleClients.filter(c => c.paymentStatus !== 'Completed');
  const totalRevenue = visibleClients.reduce((s, c) => s + (Number(c.paymentAmount) || 0), 0);
  const clientsCompleted = visibleClients.filter(c => c.stage === '5. Done Application');

  // ── New Admin Data Metrics ──
  const adminClientChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ name: m, clients: 0 }));

    visibleClients.forEach(c => {
      const dateVal = getClientCreationDate(c);
      if (dateVal) {
        const d = new Date(dateVal);
        if (d.getFullYear() === currentYear) {
          data[d.getMonth()].clients += 1;
        }
      } else {
        // Fallback for older data without creation date
        data[0].clients += 1;
      }
    });
    return data;
  }, [visibleClients]);

  const adminStageChartData = useMemo(() => {
    const counts = {};
    visibleClients.forEach(c => {
      let stg = c.stage || '1. Welcome Mail';
      stg = stg.replace(/^\d+\.\s*/, ''); // strip leading numbers like "1. "
      counts[stg] = (counts[stg] || 0) + 1;
    });
    const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e'];
    return Object.keys(counts).map((k, i) => ({ 
      name: k, 
      value: counts[k],
      color: PIE_COLORS[i % PIE_COLORS.length]
    })).sort((a,b) => b.value - a.value);
  }, [visibleClients]);

  const circumference = 2 * Math.PI * 60;
  const clientPaidPct = visibleClients.length > 0 ? Math.round((paidClients.length / visibleClients.length) * 100) : 0;
  const clientRemainingPct = visibleClients.length > 0 ? (100 - clientPaidPct) : 0;
  const clientStrokeDash = (clientPaidPct / 100) * circumference;

  const basePath = readOnly ? '/superadmin' : '/admin';

  const stat = (label, value, color, linkTo) => (
    <div
      className="card"
      onClick={() => navigate(linkTo)}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <h3 className="text-h3" style={{ color: 'var(--text-secondary)' }}>{label}</h3>
      <p style={{ fontSize: '2.5rem', fontWeight: '700', color: color || 'inherit' }}>{value}</p>
    </div>
  );

  // ── Pipeline stages ───────────────────────────────────────────────────────

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: 700 }}>
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  const CountTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{label || payload[0].name}</p>
          <p style={{ margin: 0, color: payload[0].payload?.color || 'var(--accent-primary)', fontWeight: 700 }}>
            {payload[0].value} Clients
          </p>
        </div>
      );
    }
    return null;
  };

  const StackedBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)', minWidth: '150px' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>{label}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {payload.filter(p => p.value > 0).map((entry, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: entry.color, fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }}></span>
                  {entry.name}
                </span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ name: m, amount: 0 }));

    visibleClients.forEach(c => {
      const clientPayments = getClientPaymentsList(c);
      clientPayments.forEach(p => {
        if (p.amount > 0 && p.date) {
          const d = new Date(p.date);
          if (d.getFullYear() === currentYear) {
            const m = d.getMonth();
            data[m].amount += Number(p.amount) || 0;
          }
        }
      });
    });

    return data;
  }, [visibleClients]);

  const userChartData = useMemo(() => {
    return [
      { name: 'Super Admin', count: users.filter(u => u.role === 'superadmin').length, color: 'var(--accent-primary)' },
      { name: 'Admin', count: users.filter(u => u.role === 'admin').length, color: '#f59e0b' },
      { name: 'Sales', count: users.filter(u => u.role === 'sales').length, color: '#0ea5e9' },
      { name: 'Accountant', count: users.filter(u => u.role === 'accountant').length, color: '#8b5cf6' },
      { name: 'Digital Mkt', count: users.filter(u => u.role === 'digital_marketing').length, color: '#ec4899' },
      { name: 'Loan Emp', count: users.filter(u => u.role === 'loan_employee').length, color: '#10b981' },
      { name: 'Loan Admin', count: users.filter(u => u.role === 'loan_admin').length, color: '#14b8a6' },
    ];
  }, [users]);

  const dailyChartData = useMemo(() => {
    const targetMonth = summaryMonth === -1 ? new Date().getMonth() : summaryMonth;
    const targetYear = new Date().getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`,
      amount: 0
    }));

    visibleClients.forEach(c => {
      const clientPayments = getClientPaymentsList(c);
      clientPayments.forEach(p => {
        if (p.amount > 0 && p.date) {
          const d = new Date(p.date);
          if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
            data[d.getDate() - 1].amount += Number(p.amount) || 0;
          }
        }
      });
    });

    return data;
  }, [visibleClients, summaryMonth]);

  const employeeWiseData = useMemo(() => {
    const targetMonth = summaryMonth === -1 ? new Date().getMonth() : summaryMonth;
    const targetYear = new Date().getFullYear();

    return salesUsers.map(emp => {
      let monthRev = 0;

      visibleClients.forEach(c => {
        const isEmployeeClient = c.createdBy === emp.id || c.closer === emp.id || (c.managedBy === emp.id && !c.closer);

        if (isEmployeeClient) {
          const clientPayments = getClientPaymentsList(c);
          let empPaymentsThisMonth = 0;

          clientPayments.forEach(p => {
            if (p.amount > 0 && p.date) {
              const d = new Date(p.date);
              if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
                empPaymentsThisMonth += Number(p.amount) || 0;
              }
            }
          });

          if (empPaymentsThisMonth > 0) {
            const calcShare = (amount) => {
              const val = Number(amount) || 0;
              const closerId = c.closer || c.createdBy;
              if (c.createdBy === closerId) return val;
              if (c.createdBy === emp.id || closerId === emp.id) return val * 0.5;
              return 0;
            };
            monthRev += calcShare(empPaymentsThisMonth);
          }
        }
      });

      return {
        name: (emp.name || 'Unknown').split(' ')[0],
        monthRevenue: monthRev
      };
    }).filter(emp => emp.monthRevenue > 0).sort((a, b) => b.monthRevenue - a.monthRevenue).slice(0, 5);
  }, [visibleClients, salesUsers, summaryMonth]);

  const STAGES = [
    { key: '1. Welcome Mail', label: 'Welcome Mail', icon: '📧', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)' },
    { key: '2. Document Stage / DSC In Process', label: 'Document Stage', icon: '📄', color: '#7dd3fc', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.35)' },
    { key: '3. Pitch Deck', label: 'Pitch Deck', icon: '📊', color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
    { key: '4. Application', label: 'Application', icon: '📝', color: '#fdba74', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
    { key: '5. Done Application', label: 'Done', icon: '✅', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
  ];

  const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

  // New clients = assigned to admin but no stage started yet
  const newClients = visibleClients.filter(c => !c.stage || c.stage === '');
  // Pipeline clients = clients that have a stage set
  const pipelineClients = visibleClients.filter(c => c.stage && c.stage !== '');

  const pipelineChartData = useMemo(() => {
    return STAGES.map(stage => {
      let count = 0;
      pipelineClients.forEach(c => {
        const services = getClientServicesList(c) || [];
        if (services.length === 0) {
          const specificStage = c.stage || '1. Welcome Mail';
          if (specificStage === stage.key) count++;
        } else {
          services.forEach(s => {
            const specificStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
            if (specificStage === stage.key) count++;
          });
        }
      });
      return { name: stage.label, count, color: stage.color };
    });
  }, [pipelineClients]);

  // ── Loan Department Metrics (Super Admin Only) ──
  const loanMetrics = useMemo(() => {
    if (!readOnly || loanFiles.length === 0) return null;
    
    const approvedLoans = loanFiles.filter(l => l.status === 'Cheque Handover');
    const rejectedLoans = loanFiles.filter(l => l.status === 'Rejected');
    const activeLoans = loanFiles.filter(l => l.status !== 'Cheque Handover' && l.status !== 'Rejected');
    
    const totalDisbursed = approvedLoans.reduce((sum, l) => sum + (Number(l.loanAmount) || 0), 0);
    const approvalRate = (approvedLoans.length + rejectedLoans.length) > 0 
      ? Math.round((approvedLoans.length / (approvedLoans.length + rejectedLoans.length)) * 100)
      : 0;
      
    // Pipeline data
    const statusCounts = loanFiles.reduce((acc, curr) => {
      const st = curr.status || 'CREATED';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
    const loanPipelineData = Object.keys(statusCounts).map(key => ({ name: key, count: statusCounts[key] })).sort((a, b) => b.count - a.count);

    // Employee Leaderboard
    const loanEmployees = users.filter(u => u.role === 'loan_employee' || u.role === 'loan_admin');
    const employeeData = loanEmployees.map(emp => {
      const assigned = loanFiles.filter(l => l.createdBy === emp.id);
      return {
        name: emp.name,
        assigned: assigned.length,
        approved: assigned.filter(l => l.status === 'Cheque Handover').length,
        rejected: assigned.filter(l => l.status === 'Rejected').length
      };
    }).sort((a, b) => b.approved - a.approved).slice(0, 5);

    // Type Distribution
    const typeCounts = loanFiles.reduce((acc, curr) => {
      const type = curr.typeOfLoan || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const typeData = Object.keys(typeCounts).map(key => ({ name: key, value: typeCounts[key] }));

    return { totalDisbursed, activeLoans: activeLoans.length, approvalRate, loanPipelineData, employeeData, typeData };
  }, [loanFiles, readOnly, users]);

  // ── Digital Marketing Metrics (Super Admin Only) ──
  const dmMetrics = useMemo(() => {
    if (!readOnly || !leads || !leadLists) return null;
    
    const activeLists = leadLists.filter(l => l.is_active !== false);
    const totalLeads = leads.length;
    const totalLists = leadLists.length;
    
    // Status counts
    const statusCounts = leads.reduce((acc, curr) => {
      const st = curr.status || 'CREATED';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});
    
    // Lead List/Campaign performance summary table data
    const listSummary = leadLists.map(list => {
      const listLeads = leads.filter(l => l.list_id === list.id);
      const listTotal = listLeads.length;
      const listCallDone = listLeads.filter(l => l.status && l.status !== 'CREATED').length;
      const listRemaining = listTotal - listCallDone;
      const listActive = list.is_active !== false;
      const assignedUserIds = [...new Set(listLeads.map(l => l.managedBy).filter(Boolean))];
      const assignedUserNames = assignedUserIds.map(id => users.find(user => user.id === id)?.name || 'Unknown').join(', ');
      
      return {
        id: list.id,
        name: list.name,
        total: listTotal,
        callDone: listCallDone,
        remaining: listRemaining,
        isActive: listActive,
        assignedTo: assignedUserNames || 'Unassigned'
      };
    });

    const leadPipelineData = Object.keys(statusCounts).map(key => ({ name: key, count: statusCounts[key] })).sort((a, b) => b.count - a.count);

    return { totalLeads, totalLists, activeListsCount: activeLists.length, listSummary, leadPipelineData };
  }, [leads, leadLists, readOnly, users]);

  // ── Raw Leads Metrics (Super Admin Only) ──
  const rawLeadMetrics = useMemo(() => {
    if (!readOnly || !rawLeads) return null;
    
    const totalRawLeads = rawLeads.length;
    
    // Status counts
    const statusCounts = rawLeads.reduce((acc, curr) => {
      const st = curr.status || 'PENDING';
      if (st !== 'PENDING' && st !== 'UNASSIGNED') {
         acc[st] = (acc[st] || 0) + 1;
      }
      return acc;
    }, {});
    
    const rawLeadChartData = Object.keys(statusCounts).map(key => ({ name: key, count: statusCounts[key] })).sort((a, b) => b.count - a.count);

    // Employee counts
    const empDataMap = rawLeads.reduce((acc, curr) => {
      if (curr.claimed_by) {
        if (!acc[curr.claimed_by]) acc[curr.claimed_by] = { total: 0, statuses: {} };
        acc[curr.claimed_by].total += 1;
        
        const st = curr.status || 'PENDING';
        acc[curr.claimed_by].statuses[st] = (acc[curr.claimed_by].statuses[st] || 0) + 1;
      }
      return acc;
    }, {});
    
    const employeeRawLeadsDataAll = Object.keys(empDataMap)
      .map(id => {
        const u = users.find(x => x.id === id);
        const data = empDataMap[id];
        return { 
          id,
          name: u ? u.name : 'Unknown', 
          total: data.total,
          Interested: data.statuses['Interested'] || 0,
          'Call Back': data.statuses['Call Back'] || 0,
          'Not Interested': data.statuses['Not Interested'] || 0,
          'Wrong Number': data.statuses['Wrong Number'] || 0,
          Invalid: data.statuses['Invalid'] || 0,
          DND: data.statuses['DND'] || 0,
          Busy: data.statuses['Busy'] || 0,
          'Not Pickup': data.statuses['Not Pickup'] || 0,
          PENDING: data.statuses['PENDING'] || 0,
        };
      })
      .sort((a, b) => b.total - a.total);
      
    const employeeRawLeadsData = selectedRawLeadEmployee
      ? employeeRawLeadsDataAll.filter(emp => emp.id === selectedRawLeadEmployee)
      : employeeRawLeadsDataAll.slice(0, 5); // top 5 employees

    const followupLeadsCount = rawLeads.filter(l => l.status === 'Call Back').length;
    const pendingLeadsCount = rawLeads.filter(l => !l.status || l.status === 'PENDING').length;
    const processedLeadsCount = rawLeads.filter(l => l.status && l.status !== 'PENDING' && l.status !== 'UNASSIGNED').length;
    const remainingLeadsCount = totalRawLeads - processedLeadsCount;

    return { totalRawLeads, followupLeadsCount, pendingLeadsCount, remainingLeadsCount, rawLeadChartData, employeeRawLeadsData, employeeRawLeadsDataAll };
  }, [rawLeads, readOnly, users, selectedRawLeadEmployee]);

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>

      {/* ── Status Cards & Widgets (Admin Only) ── */}
      {!readOnly && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            <UpcomingHolidays />

            {/* ── Client Summary Donut ── */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, marginBottom: '0.25rem' }}>Client Summary</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Payment status distribution</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Remaining track */}
                    <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f59e0b" strokeWidth="14" />
                    {/* Paid track */}
                    <circle 
                      cx="80" 
                      cy="80" 
                      r="60" 
                      fill="transparent" 
                      stroke="var(--success)" 
                      strokeWidth="14" 
                      strokeDasharray={circumference} 
                      strokeDashoffset={circumference - clientStrokeDash} 
                      strokeLinecap="round" 
                      style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} 
                    />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{visibleClients.length}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Total</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-around', width: '100%', padding: '0 1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paid</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{paidClients.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>{pendingClients.length}</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Stage Chart */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0, marginBottom: '0.25rem' }}>Pipeline Stages</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Client distribution across stages</p>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={adminStageChartData} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" stroke="none">
                      {adminStageChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CountTooltip />} cursor={{ fill: 'transparent' }} />
                    <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-primary)', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}


      {/* ── Charts Grid ── */}
      {readOnly && (
        <>
          {/* ROW 1: Revenue and Daily Payments */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* ── Revenue Overview Chart ── */}

            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center' }}>
                    Revenue Overview
                    <span style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', background: 'var(--accent-primary)', color: '#fff', borderRadius: '1rem', fontSize: '0.9rem' }}>
                      Total: ₹{totalRevenue.toLocaleString('en-IN')}
                    </span>
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Track your revenue growth this year</p>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-tertiary)', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {new Date().getFullYear()}
                </div>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} dy={10} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="amount" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Daily Payment Chart ── */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center' }}>
                    Daily Payment
                    <span style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', background: '#10b981', color: '#fff', borderRadius: '1rem', fontSize: '0.9rem' }}>
                      Total: ₹{dailyChartData.reduce((s, i) => s + i.amount, 0).toLocaleString('en-IN')}
                    </span>
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Day-wise payments for selected month</p>
                </div>
                <select
                  value={summaryMonth}
                  onChange={(e) => setSummaryMonth(Number(e.target.value))}
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value={-1}>Current Month</option>
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                    <option key={m} value={i}>{m} {new Date().getFullYear()}</option>
                  ))}
                </select>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmountDaily" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={5} interval={0} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-tertiary)' }} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountDaily)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* ── Client Summary Donut (25%) ── */}
            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '2rem' }}>Client Summary</h3>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'center' }}>
                <div style={{ position: 'relative', width: '160px', height: '160px' }}>
                  <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                    {/* Remaining track */}
                    <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f87171" strokeWidth="14" />
                    {/* Collected track */}
                    <circle cx="80" cy="80" r="60" fill="transparent" stroke="#10b981" strokeWidth="14"
                      strokeDasharray={`${animate ? clientStrokeDash : 0} ${circumference}`}
                      style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                      strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{visibleClients.length}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Paid</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{paidClients.length}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({clientPaidPct}%)</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }}></div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Remaining</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{visibleClients.length - paidClients.length}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({clientRemainingPct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Upcoming Holidays (25%) ── */}
            <div style={{ minWidth: 0 }}>
              <UpcomingHolidays />
            </div>

            {/* ── User Breakdown Chart (50%) ── */}
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center' }}>
                    User Breakdown
                    <span style={{ marginLeft: '1rem', padding: '0.25rem 0.75rem', background: 'var(--accent-primary)', color: '#fff', borderRadius: '1rem', fontSize: '0.9rem' }}>
                      Total: {users.length}
                    </span>
                  </h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Distribution of roles among all users</p>
                </div>
              </div>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} interval={0} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--bg-tertiary)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                              <p style={{ margin: 0, color: payload[0].payload.color, fontWeight: 700 }}>
                                {payload[0].value} Users
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {userChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ── MSME Recently Added Clients ── */}
          {readOnly && (
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>MSME Recently Added Clients</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Showing latest 10 clients datewise</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem', width: '50px' }}>Edit</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Client Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Company</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Services</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Deal Value</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Sales Rep</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestClients.map(c => {
                      const date = getClientCreationDate(c);
                      const services = getClientServicesList(c);
                      const salesRep = users.find(u => u.id === c.createdBy)?.name || 'Unassigned';
                      const parsed = parseClientFeedback(getClientFeedbackText(c));
                      const dealVal = parsed.totalDealWithGst || Number(c.totalDealAmount) || 0;
                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                          <td style={{ padding: '0.75rem 1rem' }}>
                            <button 
                              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }} 
                              onClick={() => setSelectedClient(c)}
                              title="Edit Client"
                            >
                              ✏️
                            </button>
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{date ? new Date(date).toLocaleDateString('en-GB') : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{getClientCompanyName(c) || '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{services.length > 0 ? services.join(', ') : '—'}</td>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>₹{dealVal.toLocaleString('en-IN')}</td>
                          <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{salesRep}</td>
                        </tr>
                      );
                    })}
                    {latestClients.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No clients found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Side-by-Side Charts (Monthly Top 5 & Pipeline) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>

            {/* ── Employee-wise Monthly Revenue Chart ── */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={20} color="#10b981" /> Monthly Top 5 employees
              </h2>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={employeeWiseData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                    <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                    <Tooltip
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      cursor={{ fill: 'var(--bg-tertiary)' }}
                      formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Bar dataKey="monthRevenue" name="Current Month Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Pipeline Distribution Chart ── */}
            <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Pipeline Distribution</h3>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} interval={0} />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--bg-tertiary)' }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                              <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                              <p style={{ margin: 0, color: payload[0].payload.color, fontWeight: 700 }}>
                                {payload[0].value} Services
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {pipelineChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ── Loan Department Performance ── */}
          {loanMetrics && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: '3rem 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Loan Department Performance
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Disbursed (Approved)</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{loanMetrics.totalDisbursed.toLocaleString('en-IN')}</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                    <Shield size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Active Loan Files</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{loanMetrics.activeLoans}</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0ea5e9' }}>
                    <UserPlus size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Overall Approval Rate</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{loanMetrics.approvalRate}%</h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Company-Wide Loan Pipeline</h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={loanMetrics.loanPipelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" opacity={0.5} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={180} />
                        <Tooltip
                          cursor={{ fill: 'var(--bg-tertiary)' }}
                          contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {loanMetrics.loanPipelineData.map((entry, index) => {
                            let fillColor = PALETTE[index % PALETTE.length];
                            if (entry.name === 'Cheque Handover') fillColor = '#10b981'; // Green
                            else if (entry.name === 'Rejected') fillColor = '#ef4444'; // Red
                            else if (entry.name === 'Basic Details') fillColor = '#8b5cf6'; // Purple
                            return <Cell key={`cell-${index}`} fill={fillColor} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Loan Type Distribution</h3>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={loanMetrics.typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" nameKey="name">
                          {loanMetrics.typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['var(--accent-primary)', '#0ea5e9', '#10b981', '#f59e0b'][index % 4]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Top Loan Performers</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loanMetrics.employeeData.map((emp, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: i !== loanMetrics.employeeData.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{emp.name}</p>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned: {emp.assigned} files</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ color: '#10b981', fontWeight: '800', fontSize: '1.1rem' }}>{emp.approved}</span>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Approved</p>
                        </div>
                      </div>
                    ))}
                    {loanMetrics.employeeData.length === 0 && (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '2rem' }}>No data available</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Digital Marketing Performance ── */}
          {dmMetrics && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: '3rem 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Digital Marketing Performance
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Leads Imported</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{dmMetrics.totalLeads.toLocaleString()}</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <Shield size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Campaigns / Lists</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{dmMetrics.totalLists} ({dmMetrics.activeListsCount} Active)</h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Campaign Summary Table */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Lead Campaign Performance</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
                          <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Campaign Name</th>
                          <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                          <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Total Leads</th>
                          <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Completed</th>
                          <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Remaining</th>
                          <th style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Assigned Sales Reps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dmMetrics.listSummary.slice(0, 10).map((list) => (
                          <tr key={list.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '0.75rem', color: 'var(--text-primary)', fontWeight: '600' }}>{list.name}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.5rem', borderRadius: '4px', background: list.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: list.isActive ? '#10b981' : '#ef4444' }}>
                                {list.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>{list.total}</td>
                            <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: '600' }}>{list.callDone}</td>
                            <td style={{ padding: '0.75rem', color: '#f59e0b', fontWeight: '600' }}>{list.remaining}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{list.assignedTo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Lead Status Breakdown Chart */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Lead Status Distribution</h3>
                  <div style={{ width: '100%', height: '450px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dmMetrics.leadPipelineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" opacity={0.5} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={110} tickFormatter={(val) => val ? val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : ''} />
                        <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]}>
                          {dmMetrics.leadPipelineData.map((entry, index) => {
                            const CHART_COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#d946ef', '#84cc16'];
                            return <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Raw Leads Performance ── */}
          {rawLeadMetrics && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: '3rem 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Raw Leads Performance
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Raw Leads</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{rawLeadMetrics.totalRawLeads.toLocaleString()}</h3>
                  </div>
                </div>


                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Remaining Leads</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{rawLeadMetrics.remainingLeadsCount.toLocaleString()}</h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Raw Lead Status Breakdown Chart */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0' }}>Raw Lead Status Distribution</h3>
                  <div style={{ width: '100%', height: '450px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rawLeadMetrics.rawLeadChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" opacity={0.5} />
                        <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                        <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={110} tickFormatter={(val) => val ? val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : ''} />
                        <Tooltip cursor={{ fill: 'var(--bg-tertiary)' }} contentStyle={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]}>
                          {rawLeadMetrics.rawLeadChartData.map((entry, index) => {
                            const CHART_COLORS = ['#6366f1', '#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#0ea5e9', '#d946ef', '#84cc16'];
                            return <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Employee-wise Raw Leads Chart */}
                <div className="card" style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      {selectedRawLeadEmployee ? 'Employee Raw Leads' : 'Top 5 Employees (Raw Leads)'}
                    </h3>
                    <select
                      value={selectedRawLeadEmployee}
                      onChange={(e) => setSelectedRawLeadEmployee(e.target.value)}
                      style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.4rem 0.8rem', outline: 'none' }}
                    >
                      <option value="">Top 5 Employees</option>
                      {rawLeadMetrics.employeeRawLeadsDataAll.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '100%', height: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rawLeadMetrics.employeeRawLeadsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                        <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                        <Tooltip
                          content={<StackedBarTooltip />}
                          cursor={{ fill: 'var(--bg-tertiary)' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="Interested" stackId="a" fill="#10b981" />
                        <Bar dataKey="Call Back" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="Not Interested" stackId="a" fill="#ef4444" />
                        <Bar dataKey="Wrong Number" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="Invalid" stackId="a" fill="#6b7280" />
                        <Bar dataKey="DND" stackId="a" fill="#8b5cf6" />
                        <Bar dataKey="Busy" stackId="a" fill="#eab308" />
                        <Bar dataKey="Not Pickup" stackId="a" fill="#f43f5e" />
                        <Bar dataKey="PENDING" stackId="a" fill="#94a3b8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}

        </>
      )}


      {/* ── Last 5 Assigned Clients ── */}
      {!readOnly && (
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Last 5 Assigned Clients</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>Showing your latest 5 clients</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem', width: '50px' }}>Edit</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Client Name</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Services</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Deal Value</th>
                </tr>
              </thead>
              <tbody>
                {latestAssignedClients.map(c => {
                  const date = getClientCreationDate(c);
                  const services = getClientServicesList(c);
                  const parsed = parseClientFeedback(getClientFeedbackText(c));
                  const dealVal = parsed.totalDealWithGst || Number(c.totalDealAmount) || 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }} 
                          onClick={() => setSelectedClient(c)}
                          title="Edit Client"
                        >
                          ✏️
                        </button>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{date ? new Date(date).toLocaleDateString('en-GB') : '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{getClientCompanyName(c) || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>{services.length > 0 ? services.join(', ') : '—'}</td>
                      <td style={{ padding: '0.75rem 1rem', fontWeight: '600', color: 'var(--text-primary)' }}>₹{dealVal.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
                {latestAssignedClients.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No clients found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}




    </div>
  );
};

// ── Role config ───────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  superadmin: { label: 'Super Admin', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.35)', icon: '👑' },
  admin: { label: 'Admin', color: '#fb923c', bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.35)', icon: '🛡️' },
  sales: { label: 'Sales', color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.35)', icon: '💼' },
  accountant: { label: 'Accountant', color: '#60a5fa', bg: 'rgba(96,165,recharts-layer recharts-inactive-bar250,0.12)', border: 'rgba(96,165,250,0.35)', icon: '💰' },
  digital_marketing: { label: 'Digital Marketing', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', icon: '📈' },
  loan_employee: { label: 'Loan Employee', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', icon: '📝' },
  loan_admin: { label: 'Loan Admin', color: '#14b8a6', bg: 'rgba(20,184,166,0.12)', border: 'rgba(20,184,166,0.35)', icon: '🏛️' },
};
const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

// ── Confirm Delete Modal ──────────────────────────────────────────────────────
const UserDeleteModal = ({ userName, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '2rem', maxWidth: '360px', width: '90%', boxShadow: '0 24px 60px rgba(0,0,0,0.5)', textAlign: 'center' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗑️</div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem' }}>Delete User?</h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        Permanently delete <strong style={{ color: 'var(--text-primary)' }}>{userName}</strong>? This cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="btn btn-secondary" style={{ minWidth: '90px' }} onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" style={{ minWidth: '90px' }} onClick={onConfirm}>Yes, Delete</button>
      </div>
    </div>
  </div>
);

// ── Edit User Modal ───────────────────────────────────────────────────────────
const UserEditModal = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    id: user.id || '',
    name: user.name || '',
    password: user.password || '',
    role: user.role || 'sales',
    email: user.email || '',
    phone: user.phone || '',
    birthdate: user.birthdate ? user.birthdate.substring(0, 10) : '',
    createdAt: user.createdAt ? user.createdAt.substring(0, 10) : ''
  });

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Edit User Details</h3>
        
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Full Name</label>
            <input className="form-control" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>User ID (Read Only)</label>
            <input className="form-control" value={formData.id} readOnly style={{ width: '100%', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Password</label>
            <input className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Role</label>
            <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ width: '100%' }}>
              <option value="sales">Sales (Caller)</option>
              <option value="accountant">Accountant</option>
              <option value="digital_marketing">Digital Marketing</option>
              <option value="loan_employee">Loan Employee</option>
              <option value="loan_admin">Loan Admin</option>
              <option value="superadmin">Super Admin</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Email</label>
            <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Phone Number</label>
            <input type="tel" className="form-control" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Birthdate</label>
            <input type="date" className="form-control" value={formData.birthdate} onChange={e => setFormData({ ...formData, birthdate: e.target.value })} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Joined Date</label>
            <input type="date" className="form-control" value={formData.createdAt} onChange={e => setFormData({ ...formData, createdAt: e.target.value })} style={{ width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onSave(formData)}>Save Changes</button>
        </div>
      </div>
    </div>
  );
};


// ── ManageUsers ───────────────────────────────────────────────────────────────
export const ManageUsers = ({ roleFilter, readOnly, canManageUsers, allowedRolesToCreate }) => {
  const { users, addUser, updateUser, removeUser, currentUser, setSelectedClient } = useApp();
  const [formData, setFormData] = useState({ id: '', name: '', password: '', role: allowedRolesToCreate ? allowedRolesToCreate[0] : 'sales', email: '', phone: '', birthdate: '', createdAt: new Date().toISOString().substring(0, 10) });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [editPwdId, setEditPwdId] = useState(null);
  const [editPwdVal, setEditPwdVal] = useState('');
  const [editDateId, setEditDateId] = useState(null);
  const [editDateVal, setEditDateVal] = useState('');
  const [confirmId, setConfirmId] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [searchAdmin, setSearchAdmin] = useState('');
  const [searchAccountant, setSearchAccountant] = useState('');
  const [searchDM, setSearchDM] = useState('');
  const [searchSales, setSearchSales] = useState('');
  const [searchLoanEmp, setSearchLoanEmp] = useState('');
  const [searchLoanAdmin, setSearchLoanAdmin] = useState('');

  const userChartData = useMemo(() => {
    const data = [
      { id: 'superadmin', name: 'Super Admin', count: users.filter(u => u.role === 'superadmin').length, color: 'var(--accent-primary)' },
      { id: 'admin', name: 'Admin', count: users.filter(u => u.role === 'admin').length, color: '#f59e0b' },
      { id: 'sales', name: 'Sales', count: users.filter(u => u.role === 'sales').length, color: '#0ea5e9' },
      { id: 'accountant', name: 'Accountant', count: users.filter(u => u.role === 'accountant').length, color: '#8b5cf6' },
      { id: 'digital_marketing', name: 'Digital Mkt', count: users.filter(u => u.role === 'digital_marketing').length, color: '#ec4899' },
      { id: 'loan_employee', name: 'Loan Emp', count: users.filter(u => u.role === 'loan_employee').length, color: '#10b981' },
      { id: 'loan_admin', name: 'Loan Admin', count: users.filter(u => u.role === 'loan_admin').length, color: '#14b8a6' },
    ];
    if (roleFilter) {
      if (Array.isArray(roleFilter)) {
        return data.filter(d => roleFilter.includes(d.id));
      }
      return data.filter(d => d.id === roleFilter);
    }
    return data;
  }, [users, roleFilter]);

  const allowEdit = !readOnly || canManageUsers;
  const visibleUsers = readOnly ? users : users.filter(u => u.role !== 'superadmin');
  const filteredUsers = roleFilter ? visibleUsers.filter(u => Array.isArray(roleFilter) ? roleFilter.includes(u.role) : u.role === roleFilter) : visibleUsers;

  const searchedUsers = filteredUsers.filter(u =>
    (u.name || '').toLowerCase().includes(searchQ.toLowerCase()) ||
    (u.id || '').toLowerCase().includes(searchQ.toLowerCase())
  );

  let title = 'Manage Users';
  if (Array.isArray(roleFilter)) title = 'Loan Employees & Admins';
  else if (roleFilter === 'sales') title = 'Sales Employees';
  else if (roleFilter === 'accountant') title = 'Accountant Employees';
  else if (roleFilter === 'digital_marketing') title = 'Digital Marketing Employees';
  else if (roleFilter === 'admin') title = 'Admin Employees';
  else if (roleFilter === 'loan_admin') title = 'Loan Admin Employees';
  else if (roleFilter === 'loan_employee') title = 'Loan Employees';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (addUser(formData)) {
      setMsg({ type: 'success', text: '✓ User created successfully!' });
      setFormData({ id: '', name: '', password: '', role: allowedRolesToCreate ? allowedRolesToCreate[0] : 'sales', email: '', phone: '', birthdate: '', createdAt: new Date().toISOString().substring(0, 10) });
    } else {
      setMsg({ type: 'error', text: '✕ User ID already exists!' });
    }
    setTimeout(() => setMsg({ type: '', text: '' }), 3000);
  };

  const savePassword = (userId) => {
    if (editPwdVal.trim()) updateUser(userId, { password: editPwdVal.trim() });
    setEditPwdId(null);
    setEditPwdVal('');
  };

  const saveDate = (userId) => {
    if (editDateVal) updateUser(userId, { createdAt: new Date(editDateVal).toISOString() });
    setEditDateId(null);
    setEditDateVal('');
  };

  const handleSaveUser = (updatedData) => {
    updateUser(updatedData.id, { 
      name: updatedData.name, 
      password: updatedData.password, 
      role: updatedData.role,
      email: updatedData.email,
      phone: updatedData.phone,
      birthdate: updatedData.birthdate ? new Date(updatedData.birthdate).toISOString() : undefined,
      createdAt: updatedData.createdAt ? new Date(updatedData.createdAt).toISOString() : undefined 
    });
    setSelectedUserForEdit(null);
  };

  const confirmUser = users.find(u => u.id === confirmId);

  const renderUserTable = (usersToRender) => (
    <div className="table-responsive" style={{ background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
      <table className="table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
          <tr>
            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User ID</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Joined Date</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Password</th>
            <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {usersToRender.map(u => {
            const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.sales;
            const ac = PALETTE[(u.name || '?').charCodeAt(0) % PALETTE.length];
            const initials = (u.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const isSelf = u.id === currentUser?.id;
            
            return (
              <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: `${ac}1a`, color: ac, border: `1px solid ${ac}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {u.name}
                        {isSelf && <span style={{ fontSize: '0.55rem', fontWeight: '700', color: '#60a5fa', background: 'rgba(96,165,250,0.12)', padding: '0.1rem 0.38rem', borderRadius: '9999px', border: '1px solid rgba(96,165,250,0.3)' }}>YOU</span>}
                      </div>
                      <span style={{ fontSize: '0.7rem', fontWeight: '600', padding: '0.15rem 0.45rem', borderRadius: '9999px', background: rc.bg, color: rc.color, border: `1px solid ${rc.border}`, display: 'inline-block', marginTop: '0.2rem' }}>
                        {rc.icon} {rc.label}
                      </span>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{u.id}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Unknown'}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>{'•'.repeat(Math.min(u.password?.length || 8, 10))}</td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {allowEdit && !isSelf ? (
                    <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0', opacity: 0.8, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8} title="Edit User" onClick={() => setSelectedUserForEdit(u)}>
                        ✏️
                      </button>
                      <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: '0', opacity: 0.8, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.8} title="Delete User" onClick={() => setConfirmId(u.id)}>
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isSelf ? '🔒' : '—'}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="animate-fade-in">
      {confirmId && confirmUser && createPortal(
        <UserDeleteModal
          userName={confirmUser.name}
          onConfirm={() => { removeUser(confirmId); setConfirmId(null); }}
          onCancel={() => setConfirmId(null)}
        />,
        document.body
      )}

      {selectedUserForEdit && createPortal(
        <UserEditModal
          user={selectedUserForEdit}
          onSave={handleSaveUser}
          onCancel={() => setSelectedUserForEdit(null)}
        />,
        document.body
      )}



      {/* ── Top Layout (Form + Chart) ── */}
      {( !roleFilter || allowedRolesToCreate ) && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Add New User form */}
          {allowEdit ? (
            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
              <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Add New User</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Create a new account for an employee</p>
              </div>

              {msg.text && (
                <div style={{ padding: '0.65rem 1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: '600', background: msg.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', color: msg.type === 'success' ? '#34d399' : '#f87171', border: `1px solid ${msg.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}` }}>
                  {msg.text}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div className="grid grid-cols-2 gap-4 mb-4" style={{ flex: 1 }}>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>User ID</label>
                    <input className="form-control" placeholder="e.g. emp001" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} required style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Full Name</label>
                    <input className="form-control" placeholder="e.g. Rahul Sharma" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Password</label>
                    <input className="form-control" placeholder="Set a password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Role</label>
                    <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }}>
                      {(!allowedRolesToCreate || allowedRolesToCreate.includes('sales')) && <option value="sales">Sales Employee</option>}
                      {(!allowedRolesToCreate || allowedRolesToCreate.includes('admin')) && <option value="admin">Admin</option>}
                      {(!allowedRolesToCreate || allowedRolesToCreate.includes('accountant')) && <option value="accountant">Accountant</option>}
                      {(!allowedRolesToCreate || allowedRolesToCreate.includes('digital_marketing')) && <option value="digital_marketing">Digital Marketing</option>}
                      {(!allowedRolesToCreate || allowedRolesToCreate.includes('loan_employee')) && <option value="loan_employee">Loan Employee</option>}
                      {(!allowedRolesToCreate || allowedRolesToCreate.includes('loan_admin')) && <option value="loan_admin">Loan Admin</option>}
                    </select>
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Email</label>
                    <input type="email" className="form-control" placeholder="user@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Phone Number</label>
                    <input type="tel" className="form-control" placeholder="Phone Number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Joining Date</label>
                    <input type="date" className="form-control" value={formData.createdAt} onChange={e => setFormData({ ...formData, createdAt: e.target.value })} style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                  <div className="form-group mb-0">
                    <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '0.35rem' }}>Birthdate</label>
                    <input type="date" className="form-control" value={formData.birthdate} onChange={e => setFormData({ ...formData, birthdate: e.target.value })} style={{ padding: '0.55rem 0.75rem', fontSize: '0.9rem' }} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full mt-auto" style={{ padding: '0.75rem', fontWeight: '600', fontSize: '0.95rem' }}>Create User</button>
              </form>
            </div>
          ) : (
            <div></div> // Empty placeholder if not editable
          )}

          {/* User Breakdown Chart */}
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '1.5rem', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>User Breakdown</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>Distribution of roles among all users</p>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: '700', padding: '0.35rem 0.85rem', borderRadius: '999px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Total: {userChartData.reduce((acc, curr) => acc + curr.count, 0)}</span>
            </div>
            <div style={{ flex: 1, minHeight: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} dy={10} interval={0} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--text-muted)' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-tertiary)' }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                            <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</p>
                            <p style={{ margin: 0, color: payload[0].payload.color, fontWeight: 700 }}>
                              {payload[0].value} Users
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {userChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ── User Cards Grid ── */}
      {roleFilter ? (
        // Specific role page (e.g., Sales)
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>{title}</h2>
            <SearchBar
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder={`Search ${title}...`}
              style={{ width: '300px' }}
            />
          </div>
          {searchedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
              <p style={{ fontWeight: '600' }}>No users found matching "{searchQ}"</p>
              {searchQ && (
                <button className="btn btn-secondary" onClick={() => setSearchQ('')} style={{ marginTop: '1rem' }}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            renderUserTable(searchedUsers)
          )}
        </div>
      ) : (
        // Combined page
        <>
          {searchedUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
              <p style={{ fontWeight: '600' }}>No users found matching "{searchQ}"</p>
              {searchQ && (
                <button className="btn btn-secondary" onClick={() => setSearchQ('')} style={{ marginTop: '1rem' }}>
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {searchedUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🛡️</span> Admin Employees
                    </h3>
                    <SearchBar
                      value={searchAdmin}
                      onChange={e => setSearchAdmin(e.target.value)}
                      placeholder="Search Admin..."
                      style={{ width: '220px', flex: 'none' }}
                    />
                  </div>
                  {renderUserTable(searchedUsers.filter(u => u.role === 'admin' || u.role === 'superadmin').filter(u => !searchAdmin || u.name.toLowerCase().includes(searchAdmin.toLowerCase()) || u.id.toLowerCase().includes(searchAdmin.toLowerCase())))}
                </div>
              )}
              {searchedUsers.filter(u => u.role === 'accountant').length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>💰</span> Accountant Employees
                    </h3>
                    <SearchBar
                      value={searchAccountant}
                      onChange={e => setSearchAccountant(e.target.value)}
                      placeholder="Search Accountant..."
                      style={{ width: '220px', flex: 'none' }}
                    />
                  </div>
                  {renderUserTable(searchedUsers.filter(u => u.role === 'accountant').filter(u => !searchAccountant || u.name.toLowerCase().includes(searchAccountant.toLowerCase()) || u.id.toLowerCase().includes(searchAccountant.toLowerCase())))}
                </div>
              )}
              {searchedUsers.filter(u => u.role === 'digital_marketing').length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📈</span> Digital Marketing Employees
                    </h3>
                    <SearchBar
                      value={searchDM}
                      onChange={e => setSearchDM(e.target.value)}
                      placeholder="Search Digital Marketing..."
                      style={{ width: '220px', flex: 'none' }}
                    />
                  </div>
                  {renderUserTable(searchedUsers.filter(u => u.role === 'digital_marketing').filter(u => !searchDM || u.name.toLowerCase().includes(searchDM.toLowerCase()) || u.id.toLowerCase().includes(searchDM.toLowerCase())))}
                </div>
              )}
              {searchedUsers.filter(u => u.role === 'sales').length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>💼</span> Sales Employees
                    </h3>
                    <SearchBar
                      value={searchSales}
                      onChange={e => setSearchSales(e.target.value)}
                      placeholder="Search Sales..."
                      style={{ width: '220px', flex: 'none' }}
                    />
                  </div>
                  {renderUserTable(searchedUsers.filter(u => u.role === 'sales').filter(u => !searchSales || u.name.toLowerCase().includes(searchSales.toLowerCase()) || u.id.toLowerCase().includes(searchSales.toLowerCase())))}
                </div>
              )}
              {searchedUsers.filter(u => u.role === 'loan_admin').length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🏛️</span> Loan Admin Employees
                    </h3>
                    <SearchBar
                      value={searchLoanAdmin}
                      onChange={e => setSearchLoanAdmin(e.target.value)}
                      placeholder="Search Loan Admin..."
                      style={{ width: '220px', flex: 'none' }}
                    />
                  </div>
                  {renderUserTable(searchedUsers.filter(u => u.role === 'loan_admin').filter(u => !searchLoanAdmin || u.name.toLowerCase().includes(searchLoanAdmin.toLowerCase()) || u.id.toLowerCase().includes(searchLoanAdmin.toLowerCase())))}
                </div>
              )}
              {searchedUsers.filter(u => u.role === 'loan_employee').length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>📝</span> Loan Employees
                    </h3>
                    <SearchBar
                      value={searchLoanEmp}
                      onChange={e => setSearchLoanEmp(e.target.value)}
                      placeholder="Search Loan Employee..."
                      style={{ width: '220px', flex: 'none' }}
                    />
                  </div>
                  {renderUserTable(searchedUsers.filter(u => u.role === 'loan_employee').filter(u => !searchLoanEmp || u.name.toLowerCase().includes(searchLoanEmp.toLowerCase()) || u.id.toLowerCase().includes(searchLoanEmp.toLowerCase())))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};


// ── Pipeline stage config (shared) ───────────────────────────────────────────
const PIPELINE_STAGES = [
  { key: '1. Welcome Mail', label: 'Welcome Mail', icon: '📧', color: '#a5b4fc', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)' },
  { key: '2. Document Stage / DSC In Process', label: 'Document Stage', icon: '📄', color: '#7dd3fc', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.35)' },
  { key: '3. Pitch Deck', label: 'Pitch Deck', icon: '📊', color: '#fcd34d', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)' },
  { key: '4. Application', label: 'Application', icon: '📝', color: '#fdba74', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)' },
  { key: '5. Done Application', label: 'Done', icon: '✅', color: '#6ee7b7', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)' },
];

// Admin's own clients — filtered to managedBy === currentUser.id, optionally by ?stage= param
const MyClientsAdmin = () => {
  const { clients, currentUser, setSelectedClient, users } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const stageParam = searchParams.get('stage');

  const baseClients = clients.filter(c => c.managedBy === currentUser?.id);

  const filteredClients = baseClients.filter(c => {
    if (!stageParam) return true;
    const services = getClientServicesList(c) || [];
    if (services.length === 0) {
      const specificStage = c.stage || '1. Welcome Mail';
      return specificStage === stageParam;
    }
    let hasStage = false;
    services.forEach(s => {
      const specificStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
      if (specificStage === stageParam) hasStage = true;
    });
    return hasStage;
  });

  const title = 'My Clients';

  const setStage = (key) => {
    if (key === stageParam) {
      // clicking active stage clears the filter
      setSearchParams({});
    } else {
      setSearchParams({ stage: key });
    }
  };

  return (
    <div className="animate-fade-in">
      {/* ── Pipeline filter bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Pipeline Overview</h2>
        <button
          onClick={() => navigate('../completed')}
          style={{ fontSize: '0.75rem', padding: '0.4rem 0.9rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer', fontWeight: '600', transition: 'filter 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
          onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
        >
          <span>✅</span> Completed Documents
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {PIPELINE_STAGES.map(stage => {
          let count = 0;
          baseClients.forEach(c => {
            const services = getClientServicesList(c) || [];
            if (services.length === 0) {
              const specificStage = c.stage || '1. Welcome Mail';
              if (specificStage === stage.key) count++;
            } else {
              services.forEach(s => {
                const specificStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                if (specificStage === stage.key) count++;
              });
            }
          });
          return (
            <div
              key={stage.key}
              onClick={() => setStage(stage.key)}
              className="card stat-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                cursor: 'pointer',
                border: stageParam === stage.key ? `1px solid ${stage.color}` : '1px solid var(--border-color)',
                boxShadow: stageParam === stage.key ? `0 4px 12px ${stage.color}20` : 'var(--shadow-sm)',
                transform: stageParam === stage.key ? 'translateY(-2px)' : 'none',
                background: stageParam === stage.key ? `${stage.color}08` : 'var(--bg-secondary)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ padding: '0.6rem', background: `${stage.color}15`, color: stage.color, borderRadius: '12px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                  {stage.icon}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>{stage.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.7rem', fontWeight: '800', color: 'var(--text-primary)' }}>{count}</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>services</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Client list ── */}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {filteredClients.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            No clients match this filter.
          </div>
        ) : filteredClients.map(c => {
          const company = getClientCompanyName(c);
          const services = getClientServicesList(c);
          const creatorName = (id) => users.find(u => u.id === id)?.name || 'Sales';
          const closerName = c.closer ? (users.find(u => u.id === c.closer)?.name || 'Sales') : null;
          const total = Number(c.totalDealAmount) || 0;
          const collected = Number(c.paymentAmount) || 0;
          const pct = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
          const cInitials = (c.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div 
              key={c.id} 
              className="card" 
              onClick={() => setSelectedClient(c)}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                  {cInitials}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.name}</div>
                  {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                </div>
              </div>

              {company && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={14} color="var(--accent-primary)" /> {company}</div>}
              {c.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="var(--accent-primary)" /> {c.phone}</div>}

              {services.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Services:</div>
                  {services.map(s => {
                    const sStageKey = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                    const stgInfo = PIPELINE_STAGES.find(ps => ps.key === sStageKey) || { label: sStageKey };
                    return (
                      <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                        <span style={{ color: 'var(--text-primary)' }}>{s}</span>
                        <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{stgInfo.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Stage: </span>
                  <strong style={{ color: 'var(--text-primary)' }}>{c.stage || 'Not Started'}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                {c.createdBy && <span>Lead: {creatorName(c.createdBy)}</span>}
                {closerName && <span>Closer: {closerName}</span>}
              </div>

              {(total > 0 || collected > 0) && (
                <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Collected: ₹{collected.toLocaleString('en-IN')}</span>
                    <strong style={{ color: 'var(--text-primary)' }}>Total: ₹{total.toLocaleString('en-IN')}</strong>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: '999px' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};


// Superadmin All System Clients
const SuperAdminAllClients = ({ readOnly }) => {
  const { clients, setSelectedClient, users } = useApp();
  const [searchQ, setSearchQ] = useState('');

  let displayClients = clients;
  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    displayClients = displayClients.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (getClientCompanyName(c) || '').toLowerCase().includes(q)
    );
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 className="text-h1" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
          Complete Client List
        </h1>
        <div style={{ width: '300px' }}>
          <SearchBar
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            placeholder="Search clients..."
          />
        </div>
      </div>

      <div className="table-container" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}><input type="checkbox" /></th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>ACTIONS</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>STATUS</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>NAME</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>PHONE</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>CITY</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>SERVICE</th>
            </tr>
          </thead>
          <tbody>
            {displayClients.map(c => {
               const services = getClientServicesList(c);
               
               const total = Number(c.totalDealAmount) || 0;
               const collected = Number(c.paymentAmount) || 0;
               const remaining = total - collected;
               const fullPaid = remaining <= 0 && total > 0;
               const statusStr = fullPaid ? 'Completed' : 'Pending';
               const statusStyle = fullPaid 
                 ? { color: '#10b981', background: 'rgba(16,185,129,0.1)' } 
                 : { color: '#f59e0b', background: 'rgba(245,158,11,0.1)' };

               return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', background: 'transparent' }} className="table-row-hover">
                    <td style={{ padding: '1rem' }}><input type="checkbox" /></td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        <button 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }} 
                          onClick={() => setSelectedClient(c)}
                          title="Edit Client"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', ...statusStyle }}>{statusStr}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{getClientCompanyName(c) || c.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.city || '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{services.length > 0 ? services.join(', ') : '—'}</td>
                  </tr>
               );
            })}
          </tbody>
        </table>
        {displayClients.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No clients found.</div>
        )}
      </div>
    </div>
  );
};

// Superadmin Filter By Stage (Pipeline)
const SuperAdminPipelineClients = ({ readOnly }) => {
  const { clients, setSelectedClient } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage');

  const title = stageParam
    ? `${PIPELINE_STAGES.find(s => s.key === stageParam)?.label || stageParam} — Clients`
    : 'Pipeline Clients';

  const setStage = (key) => {
    setSearchParams(stageParam === key ? {} : { stage: key });
  };

  return (
    <div className="animate-fade-in">
      {/* ── Pipeline filter bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0 }}>Filter by Stage</h2>
        {stageParam && (
          <button
            onClick={() => setSearchParams({})}
            style={{ fontSize: '0.75rem', padding: '0.28rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '9999px', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ✕ Clear filter
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {PIPELINE_STAGES.map(stage => {
          let count = 0;
          clients.forEach(c => {
            const services = getClientServicesList(c) || [];
            if (services.length === 0) {
              const specificStage = c.stage || '1. Welcome Mail';
              if (specificStage === stage.key) count++;
            } else {
              services.forEach(s => {
                const specificStage = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                if (specificStage === stage.key) count++;
              });
            }
          });
          const isActive = stageParam === stage.key;
          return (
            <div
              key={stage.key}
              onClick={() => setStage(stage.key)}
              style={{
                background: isActive ? stage.bg : 'var(--bg-secondary)',
                border: `2px solid ${isActive ? stage.color : stage.border}`,
                borderRadius: 'var(--radius-xl)',
                padding: '0.75rem 0.8rem',
                cursor: 'pointer',
                transition: 'all 0.18s',
                boxShadow: isActive ? `0 0 0 3px ${stage.color}22` : 'none',
                transform: isActive ? 'translateY(-2px)' : 'none',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = stage.bg; e.currentTarget.style.borderColor = stage.color; } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'var(--bg-secondary)'; e.currentTarget.style.borderColor = stage.border; } }}
            >
              <div style={{ fontSize: '1.2rem', marginBottom: '0.2rem' }}>{stage.icon}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: stage.color, lineHeight: 1.3, marginBottom: '0.3rem' }}>{stage.label}</div>
              <div style={{ fontSize: '1.3rem', fontWeight: '800', color: isActive ? stage.color : 'var(--text-primary)' }}>{count}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>service{count !== 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>

      {/* ── Client list ── */}
      <AllClientsAdmin
        preFilteredClients={clients}
        stageFilter={stageParam}
        processFilter={!stageParam ? 'Under Process' : null}
        titleOverride={title}
        readOnly={false}
      />
    </div>
  );
};

// ── New Clients Page (Superadmin) ────────────────────────────────────────────
// Shows clients created by sales that haven't been assigned to an admin yet
const NewClientsPage = () => {
  const { clients, users, assignClientToAdmin, setSelectedClient } = useApp();
  const navigate = useNavigate();
  const [assignMap, setAssignMap] = useState({});  // clientId -> selected adminId
  const [assigned, setAssigned] = useState({});  // clientId -> true (just assigned)
  const [searchQ, setSearchQ] = useState('');

  const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];
  const adminUsers = users.filter(u => u.role === 'admin');
  const adminIds = new Set(adminUsers.map(u => u.id));

  // New clients = managedBy is NOT an admin (still with the sales person who created them)
  const newClients = clients.filter(c => !adminIds.has(c.managedBy));

  const displayClients = searchQ.trim()
    ? newClients.filter(c => {
      const q = searchQ.toLowerCase();
      return (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q);
    })
    : newClients;

  const handleAssign = (clientId) => {
    const adminId = assignMap[clientId];
    if (!adminId) return;
    assignClientToAdmin(clientId, adminId);
    setAssigned(prev => ({ ...prev, [clientId]: true }));
    setAssignMap(prev => ({ ...prev, [clientId]: '' }));
    // Remove toast after 3s
    setTimeout(() => setAssigned(prev => { const n = { ...prev }; delete n[clientId]; return n; }), 3000);
  };

  const creatorName = (id) => users.find(u => u.id === id)?.name || 'Sales';

  return (
    <div className="animate-fade-in">


      {/* Search */}
      <div style={{ marginBottom: '1.25rem' }}>
        <SearchBar
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search by name, email, phone…"
          style={{ maxWidth: '420px', flex: 'none' }}
        />
      </div>

      {displayClients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--bg-secondary)', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
          <p style={{ fontWeight: '600', fontSize: '1rem' }}>{searchQ ? 'No clients match your search' : 'All clients are assigned!'}</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>{searchQ ? '' : 'Every client has been assigned to an admin.'}</p>
          <button onClick={() => navigate('/superadmin/clients')} style={{ marginTop: '1rem', fontSize: '0.8rem', padding: '0.4rem 1rem', background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '9999px', cursor: 'pointer' }}>View All Clients →</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: '1rem' }}>
          {displayClients.map(c => {
            const initials = (c.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
            const total = Number(c.totalDealAmount) || 0;
            const collected = Number(c.paymentAmount) || 0;
            const pct = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
            const justAssigned = assigned[c.id];

            const company = getClientCompanyName(c);
            const services = getClientServicesList(c);
            const stage = c.stage || '';
            const leadName = c.createdBy ? (users.find(u => u.id === c.createdBy)?.name || 'Sales') : '';
            const closerName = c.closer ? (users.find(u => u.id === c.closer)?.name || '') : '';

            return (
              <div key={c.id} className="card" onClick={() => setSelectedClient(c)} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.5rem', border: `1px solid ${justAssigned ? 'rgba(16,185,129,0.5)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)' }}>
                {/* Just-assigned toast */}
                {justAssigned && (
                  <div style={{ background: 'var(--success-light)', padding: '0.45rem 0.85rem', fontSize: '0.76rem', color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: 'var(--radius-sm)', margin: '-0.25rem 0 0.25rem 0' }}>
                    ✅ Assigned successfully — moving to pipeline
                  </div>
                )}

                {/* Avatar + Name + Email */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.name}</div>
                    {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                  </div>
                </div>

                {/* Company */}
                {company && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={14} color="var(--accent-primary)" /> {company}</div>}

                {/* Phone */}
                {c.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="var(--accent-primary)" /> {c.phone}</div>}

                {/* Stage */}
                {stage && (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stage: </span>
                    <strong style={{ color: 'var(--text-primary)' }}>{stage}</strong>
                  </div>
                )}

                {/* Services */}
                {services.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Services:</div>
                    {services.map(s => {
                      const sStageKey = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                      return (
                        <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{s}</span>
                          <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{sStageKey}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No services assigned</div>
                )}

                {/* Lead & Closer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {leadName && <span>Lead: {leadName}</span>}
                  {closerName && <span>Closer: {closerName}</span>}
                </div>

                {/* Assign section */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
                  <select onClick={e => e.stopPropagation()} value={assignMap[c.id] || ''}
                    onChange={e => setAssignMap(prev => ({ ...prev, [c.id]: e.target.value }))}
                    style={{ flex: 1, padding: '0.4rem 0.6rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value="">Select Admin…</option>
                    {adminUsers.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAssign(c.id); }}
                    disabled={!assignMap[c.id]}
                    style={{ padding: '0.4rem 0.9rem', background: assignMap[c.id] ? 'var(--accent-primary)' : 'var(--bg-tertiary)', color: assignMap[c.id] ? 'white' : 'var(--text-muted)', border: 'none', borderRadius: 'var(--radius-md)', cursor: assignMap[c.id] ? 'pointer' : 'not-allowed', fontSize: '0.8rem', fontWeight: '700', transition: 'var(--transition)', whiteSpace: 'nowrap' }}
                  >
                    Assign →
                  </button>
                </div>

                {/* Footer: Collected & Total */}
                {(total > 0 || collected > 0) && (
                  <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Collected: ₹{collected.toLocaleString('en-IN')}</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Total: ₹{total.toLocaleString('en-IN')}</strong>
                    </div>
                    <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: '999px' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
// ── Admin Clients Page (Superadmin) ──────────────────────────────────
const AdminClientsPage = () => {
  const { users, clients, setSelectedClient } = useApp();
  const admins = users.filter(u => u.role === 'admin');
  const [selectedAdminId, setSelectedAdminId] = useState(admins.length > 0 ? admins[0].id : null);
  const [selectedStage, setSelectedStage] = useState('All');

  const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

  const selectedAdmin = admins.find(a => a.id === selectedAdminId);
  const baseAdminClients = selectedAdmin ? clients.filter(c => c.managedBy === selectedAdmin.id) : [];
  const adminClients = selectedStage === 'All'
    ? baseAdminClients
    : baseAdminClients.filter(c => c.stage === selectedStage || (c.service_stages && Object.values(c.service_stages).includes(selectedStage)));

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="text-h1" style={{ margin: 0 }}>Admin Workloads</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.25rem' }}>Select an admin below to view and manage their assigned clients.</p>
      </div>

      {/* 3 Boxes (Top level Admins) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {admins.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No admins found</div>
        ) : admins.map(admin => {
          const isSelected = selectedAdminId === admin.id;
          const count = clients.filter(c => c.managedBy === admin.id).length;

          return (
            <div
              key={admin.id}
              onClick={() => setSelectedAdminId(admin.id)}
              className="card"
              style={{
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                transition: 'none'
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-primary)' }}>{admin.name}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {count} Assigned Client{count !== 1 ? 's' : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Admin Clients Container */}
      {selectedAdmin ? (
        <div>
          <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{selectedAdmin.name}'s Clients</h2>
              {selectedAdmin.email && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedAdmin.email}</div>}
            </div>

            {/* Filters */}
            <div className="custom-scrollbar" style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
              <button onClick={() => setSelectedStage('All')} className={selectedStage === 'All' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                All Stages
              </button>
              {PIPELINE_STAGES.map(ps => (
                <button key={ps.key} onClick={() => setSelectedStage(ps.key)} className={selectedStage === ps.key ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                  {ps.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
            {adminClients.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                No clients match this filter.
              </div>
            ) : adminClients.map(c => {
              const company = getClientCompanyName(c);
              const services = getClientServicesList(c);
              const { note, panNumber, gstNumber } = parseClientFeedback(getClientFeedbackText(c));
              const creatorName = (id) => users.find(u => u.id === id)?.name || 'Sales';
              const closerName = c.closer ? (users.find(u => u.id === c.closer)?.name || 'Sales') : null;
              const total = Number(c.totalDealAmount) || 0;
              const collected = Number(c.paymentAmount) || 0;
              const pct = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
              const ac = PALETTE[(c.name || '?').charCodeAt(0) % PALETTE.length];
              const cInitials = (c.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              const stageColor = c.stage ? (PIPELINE_STAGES.find(p => p.key === c.stage)?.color || '#10b981') : '#6366f1';

              return (
                <div key={c.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--accent-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.9rem', flexShrink: 0 }}>
                      {cInitials}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{c.name}</div>
                      {c.email && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                    </div>
                  </div>

                  {company && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Building2 size={14} color="var(--accent-primary)" /> {company}</div>}
                  {c.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}><Phone size={14} color="var(--accent-primary)" /> {c.phone}</div>}

                  {services.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-muted)' }}>Services:</div>
                      {services.map(s => {
                        const sStageKey = (c.service_stages && c.service_stages[s]) || c.stage || '1. Welcome Mail';
                        const stgInfo = PIPELINE_STAGES.find(ps => ps.key === sStageKey) || { label: sStageKey };
                        return (
                          <div key={s} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                            <span style={{ color: 'var(--text-primary)' }}>{s}</span>
                            <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{stgInfo.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Stage: </span>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.stage || 'Not Started'}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                    {c.createdBy && <span>Lead: {creatorName(c.createdBy)}</span>}
                    {closerName && <span>Closer: {closerName}</span>}
                  </div>

                  {(total > 0 || collected > 0) && (
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Collected: ₹{collected.toLocaleString('en-IN')}</span>
                        <strong style={{ color: 'var(--text-primary)' }}>Total: ₹{total.toLocaleString('en-IN')}</strong>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-secondary)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-primary)', borderRadius: '999px' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
          Please select an admin from the boxes above.
        </div>
      )}
    </div>
  );
};

const EmployeeOverviewPage = ({ readOnly }) => {
  const { users, clients, setSelectedClient } = useApp();
  const navigate = useNavigate();
  const [searchEmp, setSearchEmp] = useState('');
  const basePath = readOnly ? '/superadmin' : '/admin';

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <button onClick={() => navigate(-1)} style={{ padding: '0.4rem 0.8rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600' }}>← Back</button>
        <h1 className="text-h1" style={{ margin: 0 }}>All Employees Overview</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <SearchBar
          value={searchEmp}
          onChange={e => setSearchEmp(e.target.value)}
          placeholder="Search employee..."
          style={{ width: '300px', flex: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {users
          .filter(u => u.role !== 'superadmin' && u.role !== 'accountant' && u.role !== 'digital_marketing')
          .filter(u => (u.name || '').toLowerCase().includes(searchEmp.toLowerCase()))
          .map(emp => {
            const empClients = clients.filter(c => c.createdBy === emp.id || c.closer === emp.id || c.managedBy === emp.id);
            const calcShare = (amount, c) => {
              const val = Number(amount) || 0;
              const closerId = c.closer || c.createdBy;
              if (c.createdBy === closerId) return val;
              if (c.createdBy === emp.id || closerId === emp.id) return val * 0.5;
              return 0;
            };
            const totalRevenue = empClients.reduce((sum, c) => sum + calcShare(c.paymentAmount, c), 0);
            const dealValue = empClients.reduce((sum, c) => sum + calcShare(c.totalDealAmount, c), 0);
            const progress = dealValue > 0 ? Math.min(100, Math.round((totalRevenue / dealValue) * 100)) : 0;
            return { emp, empClients, totalRevenue, dealValue, progress };
          })
          .sort((a, b) => b.totalRevenue - a.totalRevenue || b.progress - a.progress)
          .map(({ emp, empClients, totalRevenue, dealValue, progress }) => {
            return (
              <div key={emp.id}
                onClick={() => navigate(`${basePath}/employee-clients/${emp.id}`)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {(emp.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text-primary)' }}>{emp.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.role.toUpperCase()} • {empClients.length} Clients</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Revenue Collected</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
                </div>

                {dealValue > 0 && (
                  <div style={{ marginTop: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>Collection Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #34d399, #10b981)', borderRadius: '999px' }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
                      Target: ₹{dealValue.toLocaleString('en-IN')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

const EmployeeClientsPage = ({ readOnly }) => {
  const { id } = useParams();
  const { clients, users, setSelectedClient } = useApp();

  const employee = users.find(u => u.id === id);
  if (!employee) return <div style={{ padding: '2rem', textAlign: 'center' }}>Employee not found</div>;

  const employeeClients = clients.filter(c =>
    c.createdBy === id || c.closer === id || c.managedBy === id
  );

  return (
    <div className="animate-fade-in">
      <AllClientsAdmin
        preFilteredClients={employeeClients}
        readOnly={readOnly}
        titleOverride={`${employee.name}'s Clients`}
      />
    </div>
  );
};

const AdminDashboard = ({ readOnly, canManageUsers }) => (
  <Routes>
    <Route path="/" element={<AdminOverview readOnly={readOnly} />} />
    <Route path="/add-client" element={<AddNewClient />} />
    <Route path="/add-loan-file" element={<AddNewLoanFile buttonOverride="Register Loan File" successMessageOverride="Loan File Created Successfully!" />} />
    {/* Admin: My Clients */}
    {!readOnly && <Route path="/clients" element={<MyClientsAdmin />} />}
    {readOnly && (
      <>
        <Route path="/admin-clients" element={<AdminClientsPage />} />
        <Route path="/new-clients" element={<NewClientsPage />} />
        <Route path="/users" element={<ManageUsers readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/users/admin" element={<ManageUsers roleFilter="admin" readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/users/sales" element={<ManageUsers roleFilter="sales" readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/users/accountant" element={<ManageUsers roleFilter="accountant" readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/users/digital-marketing" element={<ManageUsers roleFilter="digital_marketing" readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/users/loan-admin" element={<ManageUsers roleFilter="loan_admin" readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/users/loan-employee" element={<ManageUsers roleFilter="loan_employee" readOnly={readOnly} canManageUsers={canManageUsers} />} />
        <Route path="/clients" element={<SuperAdminAllClients readOnly={readOnly} />} />
        <Route path="/pipeline" element={<SuperAdminPipelineClients readOnly={readOnly} />} />
        <Route path="/employees" element={<EmployeeOverviewPage readOnly={readOnly} />} />
        <Route path="/employee-clients/:id" element={<EmployeeClientsPage readOnly={readOnly} />} />
        <Route path="/employee-data" element={<EmployeeData readOnly={readOnly} />} />
        <Route path="/employee-status" element={<AllEmployeeStatus />} />
        <Route path="/leads" element={<DigitalMarketingLeads />} />
        <Route path="/leads/:listId" element={<DigitalMarketingLeadListView />} />

      </>
    )}
    <Route path="/clients/paid" element={<AllClientsAdmin paymentFilter="Completed" readOnly={readOnly} />} />
    <Route path="/clients/pending" element={<AllClientsAdmin paymentFilter="Pending" readOnly={readOnly} />} />
    <Route path="/clients/under-process" element={<AllClientsAdmin processFilter="Under Process" readOnly={readOnly} />} />
    <Route path="/clients/completed-process" element={<AllClientsAdmin processFilter="Completed" readOnly={readOnly} />} />
    <Route path="/completed" element={<AllClientsAdmin processFilter="Completed" readOnly={readOnly} titleOverride="Completed Documents" />} />
  </Routes>
);

export default AdminDashboard;
