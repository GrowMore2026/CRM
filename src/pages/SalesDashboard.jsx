import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { useApp } from '../context/AppProvider';
import { getClientBudgetAmount, getClientCompanyName, getClientServicesList, parseClientFeedback, getClientFeedbackText, getClientPanNumber, getClientGstNumber, getClientPaymentsList, getClientCreationDate } from '../utils/clientRow';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, UserCheck, Wallet, Target, Building2, Phone, Mail, FileText, Briefcase, Save, User, Search, CreditCard, Edit2, Trash2, CheckCircle, Clock, UserPlus, Upload, Download, X, Eye } from 'lucide-react';
import UpcomingHolidays from '../components/UpcomingHolidays';
import MarketingLeadsChart from '../components/MarketingLeadsChart';
import RawLeadsChart from '../components/RawLeadsChart';
import { ALL_SERVICES } from '../components/ServicePicker';
import AddNewClient from './AddNewClient';
// ─── Service Picker ───────────────────────────────────────────────────────────
const ServicePicker = ({ value = [], onChange, compact = false }) => {
  const [search, setSearch] = useState('');
  const filtered = ALL_SERVICES.filter(s => s.toLowerCase().includes(search.toLowerCase()));
  const toggle = (s) => onChange(value.includes(s) ? value.filter(x => x !== s) : [...value, s]);
  return (
    <div>
      {value.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.5rem' }}>
          {value.map(s => (
            <span key={s} onClick={() => toggle(s)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', fontWeight: '600', padding: '0.18rem 0.52rem', borderRadius: '9999px', background: 'rgba(99,102,241,0.18)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.4)', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.32)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.18)'}>
              {s} <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>✕</span>
            </span>
          ))}
        </div>
      )}
      <input
        type="text" placeholder="🔍 Search services…" value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ width: '100%', padding: '0.45rem 0.75rem', marginBottom: '0.4rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.28rem', maxHeight: compact ? '90px' : '120px', overflowY: 'auto', padding: '0.2rem 0' }}>
        {filtered.map(s => {
          const sel = value.includes(s);
          return (
            <span key={s} onClick={() => toggle(s)} style={{ fontSize: '0.7rem', fontWeight: '500', padding: '0.2rem 0.5rem', borderRadius: '9999px', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap', background: sel ? 'rgba(99,102,241,0.25)' : 'var(--bg-tertiary)', color: sel ? '#a5b4fc' : 'var(--text-secondary)', border: sel ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border-color)' }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-tertiary)'; }}>
              {sel ? '✓ ' : ''}{s}
            </span>
          );
        })}
        {filtered.length === 0 && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>No services match</span>}
      </div>
      {value.includes('Other') && (
        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Type custom service and press Enter..."
            style={{ flex: 1, padding: '0.45rem 0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none' }}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const custom = e.target.value.trim();
                if (custom && !value.includes(custom)) {
                  onChange([...value, custom]);
                }
                e.target.value = '';
              }
            }}
            onBlur={e => {
              const custom = e.target.value.trim();
              if (custom && !value.includes(custom)) {
                onChange([...value, custom]);
              }
              e.target.value = '';
            }}
          />
        </div>
      )}
    </div>
  );
};

const SalesLeadListCard = ({ list, leads, onViewLeads }) => {
  const listLeads = leads.filter(l => l.list_id === list.id);
  const total = listLeads.length;
  const callDone = listLeads.filter(l => l.status && l.status !== 'CREATED').length;
  const remaining = total - callDone;
  
  const isActive = list.is_active !== false;

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: 'var(--shadow-sm)' }}>
      
      {/* Top Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{list.name}</h3>
            <span style={{ background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: isActive ? 'var(--accent-primary)' : '#ef4444', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{list.description || list.name}</p>
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Created {new Date(list.created_at || new Date()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      {/* Stats & Actions Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.5rem' }}>
        
        {/* Stats */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--bg-tertiary)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Total:</span> <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{total.toLocaleString()}</span>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: '#3b82f6' }}>Remaining: {remaining.toLocaleString()}</span>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--accent-primary)' }}>Call Done: {callDone.toLocaleString()}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => onViewLeads(list.id)} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <Eye size={14} /> View Leads
          </button>
        </div>
      </div>
    </div>
  );
};

const SalesOverview = () => {
  const { clients, leads, rawLeads, currentUser , setSelectedClient } = useApp();
  const navigate = useNavigate();
  
  const myClientsAll = clients.filter(c => c.createdBy === currentUser.id || c.closer === currentUser.id || (c.managedBy === currentUser.id && !c.closer));
  const myLeads = leads.filter(l => l.createdBy === currentUser.id || l.managedBy === currentUser.id);
  
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth()); // 0-11, or -1 for All Time

  const myClients = myClientsAll.filter(c => {
    if (summaryMonth === -1) return true;
    const dateStr = getClientCreationDate(c) || c.created_at || c.timestamp;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    return d.getMonth() === summaryMonth && d.getFullYear() === new Date().getFullYear();
  });
  
  const calcShare = (amount, c) => {
    const val = Number(amount) || 0;
    const closerId = c.closer || c.createdBy;
    if (c.createdBy === closerId) return val; // 100% if they did both
    if (c.createdBy === currentUser.id || closerId === currentUser.id) return val * 0.5; // 50% split
    return 0;
  };

  const paidClients = myClients.filter(c => c.paymentStatus === 'Completed');
  const totalPayment = myClients.reduce((s, c) => s + calcShare(c.totalDealAmount ?? getClientBudgetAmount(c), c), 0);
  const collectedPayment = myClients.reduce((s, c) => s + calcShare(c.paymentAmount, c), 0);
  const remainingPayment = totalPayment - collectedPayment;
  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  const collectedPct = totalPayment > 0 ? Math.round((collectedPayment / totalPayment) * 100) : 0;
  const remainingPct = 100 - collectedPct;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = (collectedPct * circumference) / 100;

  const clientPaidPct = myClients.length > 0 ? Math.round((paidClients.length / myClients.length) * 100) : 0;
  const clientRemainingPct = 100 - clientPaidPct;
  const clientStrokeDash = (clientPaidPct * circumference) / 100;

  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(false);
    const t = setTimeout(() => setAnimate(true), 150);
    return () => clearTimeout(t);
  }, [strokeDash, clientStrokeDash]);

  const statCard = (label, value, icon, color, bgLight) => (
    <div className="card" onClick={() => navigate('/sales/clients')} style={{ cursor: 'pointer', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.5rem', background: bgLight, borderRadius: '0.5rem', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</h3>
      </div>
      <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>{value}</p>
    </div>
  );

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    const data = months.map(m => ({ name: m, amount: 0 }));
    
    myClientsAll.forEach(c => {
      const clientPayments = getClientPaymentsList(c);
      clientPayments.forEach(p => {
        if (p.amount > 0 && p.date) {
          const d = new Date(p.date);
          if (d.getFullYear() === currentYear) {
            const m = d.getMonth();
            data[m].amount += calcShare(p.amount, c);
          }
        }
      });
    });
    
    return data;
  }, [myClientsAll, currentUser.id]);

  const dailyChartData = useMemo(() => {
    const targetMonth = summaryMonth === -1 ? new Date().getMonth() : summaryMonth;
    const targetYear = new Date().getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      name: `${i + 1}`,
      amount: 0
    }));

    myClientsAll.forEach(c => {
      const clientPayments = getClientPaymentsList(c);
      clientPayments.forEach(p => {
        if (p.amount > 0 && p.date) {
          const d = new Date(p.date);
          if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
            const day = d.getDate();
            data[day - 1].amount += calcShare(p.amount, c);
          }
        }
      });
    });

    return data;
  }, [summaryMonth, myClientsAll, currentUser.id]);

  const myRawLeads = useMemo(() => {
    return (rawLeads || []).filter(l => l.claimed_by === currentUser.id && l.status && l.status !== 'PENDING' && l.status !== 'UNASSIGNED');
  }, [rawLeads, currentUser.id]);

  const RAW_LEAD_COLORS = {
    'Interested': '#10b981',
    'Call Back': '#3b82f6',
    'Not Interested': '#ef4444',
    'Wrong Number': '#f59e0b',
    'Invalid': '#6b7280',
    'DND': '#8b5cf6',
    'Busy': '#eab308',
    'Not Pickup': '#f43f5e'
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.75rem', boxShadow: 'var(--shadow-md)' }}>
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</p>
          <p style={{ margin: 0, color: 'var(--accent-primary)', fontWeight: '700' }}>
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1rem' }}>



      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px 300px', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* ── Revenue Overview Chart ── */}
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Revenue Overview</h2>
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
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
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

        {/* ── Payment History Donut ── */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Payment Summary</h3>
            <select
              value={summaryMonth}
              onChange={(e) => setSummaryMonth(Number(e.target.value))}
              style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                padding: '0.25rem 0.5rem',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value={-1}>All Time</option>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                <option key={m} value={i}>{m} {new Date().getFullYear()}</option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', flex: 1, justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: '160px', height: '160px' }}>
              <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                {/* Remaining track */}
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f87171" strokeWidth="14" />
                {/* Collected track */}
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#10b981" strokeWidth="14" 
                        strokeDasharray={`${animate ? strokeDash : 0} ${circumference}`} 
                        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
                        strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-primary)' }}>{fmt(totalPayment)}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Collected</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(collectedPayment)}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({collectedPct}%)</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171' }}></div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Remaining</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{fmt(remainingPayment)}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({remainingPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Client Summary Donut ── */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' }}>
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
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)' }}>{myClients.length}</span>
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
                  <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-primary)' }}>{myClients.length - paidClients.length}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({clientRemainingPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* ── Holidays ── */}
        <div style={{ minWidth: 0 }}>
          <UpcomingHolidays />
        </div>

        {/* ── Daily Payment Chart ── */}
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Daily Payment</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Day-wise payments for selected month</p>
            </div>
          </div>
          <div style={{ width: '100%', height: '160px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmountDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={5} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-tertiary)' }} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountDaily)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Leads Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <RawLeadsChart rawLeads={myRawLeads} />
        <MarketingLeadsChart leads={myLeads} />
      </div>
    </div>
  );
};

// ─── My Clients ───────────────────────────────────────────────────────────────
const MyClients = ({ isLeads = false }) => {
  const { clients, leads, leadLists, users, addClient, addLead, currentUser, removeClient, removeLead, updateClientDetails, updateLeadDetails, setSelectedClient } = useApp();
  const [selectedLeadListId, setSelectedLeadListId] = useState(null);
  const baseClients = clients.filter(c => c.createdBy === currentUser.id || c.closer === currentUser.id || (c.managedBy === currentUser.id && !c.closer));
  const myClients = baseClients.filter(c => {
    const collected = Number(c.paymentAmount) || 0;
    return collected > 0;
  });
  const myLeads = leads.filter(l => l.createdBy === currentUser.id || l.managedBy === currentUser.id);
  const myLeadLists = isLeads ? (leadLists || []).filter(list => {
    return leads.some(l => l.list_id === list.id && l.managedBy === currentUser.id);
  }) : [];
  const activeList = isLeads 
    ? (selectedLeadListId ? myLeads.filter(l => l.list_id === selectedLeadListId) : myLeads)
    : myClients;
  const otherEmployees = users.filter(u => u.id !== currentUser.id && u.role === 'sales');

  const [formData, setFormData] = useState({ name: '', email: '', phone: '', service: [], company: '', budget: '', collectedPayment: '', interested: true, feedback: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', company: '', service: [], budget: '', interested: true, note: '', collectedPayment: '', totalDeal: '', panNumber: '', gstNumber: '', payments: [], status: 'CREATED', notes: '' });
  const [editingClient, setEditingClient] = useState(null);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const startEdit = (c) => {
    setEditingClient(c.id);
    const parsed = parseClientFeedback(getClientFeedbackText(c));
    let payments = getClientPaymentsList(c);
    if (payments.length === 0 && c.paymentAmount > 0) {
      payments = [{ amount: c.paymentAmount, date: c.paymentDate ? c.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0] }];
    }
    setEditForm({
      name: c.name, email: c.email, phone: c.phone || '',
      city: c.city || (c.dynamic_data?.city) || '',
      state: c.state || (c.dynamic_data?.state) || '',
      company: getClientCompanyName(c) || '', service: getClientServicesList(c) || [], type_of_service: c.type_of_service || c.dynamic_data?.service || c.dynamic_data?.type_of_service || '',
      budget: getClientBudgetAmount(c) || '', interested: c.interested, note: parsed.note || '',
      totalDeal: c.totalDealAmount ?? getClientBudgetAmount(c) ?? '',
      collectedPayment: c.paymentAmount ?? 0,
      panNumber: parsed.panNumber || '',
      gstNumber: parsed.gstNumber || '',
      payments: payments,
      status: c.status || 'CREATED',
      notes: c.notes || c.dynamic_data?.notes || '',
      dynamic_data: c.dynamic_data || {},
    });
  };

  const saveEdit = (clientId) => {
    if (editForm.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(editForm.panNumber)) {
      alert('Invalid PAN Number format. It should be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    if (editForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(editForm.gstNumber)) {
      alert('Invalid GST Number format. It should be 15 characters (e.g. 22AAAAA0000A1Z5).');
      return;
    }
    const parts = [];
    if (editForm.company) parts.push(`[Company] ${editForm.company.trim()}`);
    if (editForm.budget) parts.push(`[Budget ₹${editForm.budget}]`);
    if (editForm.panNumber) parts.push(`[PAN] ${editForm.panNumber.trim()}`);
    if (editForm.gstNumber) parts.push(`[GST] ${editForm.gstNumber.trim()}`);
    (editForm.payments || []).forEach(p => {
      if (p.amount && p.date) parts.push(`[Payment ₹${p.amount} on ${p.date}]${p.verified ? ' [Verified]' : ''}`);
    });
    const svc = (editForm.service || []).filter(Boolean);
    if (svc.length) parts.push(`[Services] ${svc.join('; ')}`);
    if (editForm.note) parts.push(editForm.note);

    const totalDeal = Number(editForm.totalDeal) || 0;
    const collected = (editForm.payments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    if (isLeads) {
      updateLeadDetails(clientId, {
        name: editForm.name, email: editForm.email, phone: editForm.phone,
        city: editForm.city, state: editForm.state,
        interested: editForm.interested, company: editForm.company,
        service: svc, type_of_service: editForm.type_of_service,
        budget: Number(editForm.budget) || 0,
        score: Number(editForm.totalDeal) || 0, // Reusing totalDeal for score in leads edit form temporarily
        status: editForm.status,
        notes: editForm.notes,
        dynamic_data: editForm.dynamic_data
      });
    } else {
      updateClientDetails(clientId, {
        name: editForm.name, email: editForm.email, phone: editForm.phone,
        city: editForm.city, state: editForm.state,
        interested: editForm.interested, feedback: parts.join('\n\n'),
        service: svc,
        totalDealAmount: totalDeal, paymentAmount: collected,
        paymentStatus: (totalDeal - collected) <= 0 && totalDeal > 0 ? 'Completed' : 'Pending',
      });
    }
    setEditingClient(null);
  };

  const handleAddClient = (e) => {
    e.preventDefault();
    const totalDeal = Number(formData.budget) || 0;
    const collected = Number(formData.collectedPayment) || 0;
    addClient({
      ...formData,
      name: formData.company || formData.email,
      interested: true,
      feedback: '',
      createdBy: currentUser.id,
      managedBy: currentUser.id,
      totalDealAmount: totalDeal,
      paymentAmount: collected,
      paymentStatus: collected >= totalDeal && totalDeal > 0 ? 'Completed' : 'Pending',
    });
    setFormData({ name: '', email: '', phone: '', service: [], company: '', budget: '', collectedPayment: '', interested: true, feedback: '' });
  };

  const handleDownloadDemoCSV = () => {
    const csvContent = "Date,Lead Name,Source,Owner,Phone,Email Address\n2024-10-25,John Doe,Facebook Ads,Alex,9876543210,john@example.com";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "demo_leads_import.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        alert("CSV format invalid or empty. Please ensure it has headers and data.");
        return;
      }
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const newClients = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj = {};
        headers.forEach((h, i) => {
          obj[h] = values[i] ? values[i].trim() : '';
        });
        return obj;
      });

      let count = 0;
      newClients.forEach(c => {
          const name = c['lead name'] || c.name || c['lead_name'];
          if (!name) return;
          const budget = Number(c.budget) || 0;
          if (isLeads) {
            addLead({
              name: name,
              email: c['email address'] || c.email || c['email_address'] || '',
              phone: c.phone || '',
              source: c.source || 'CSV Import',
              company: '',
              service: ['Other'],
              budget: budget,
              createdBy: currentUser?.id,
              managedBy: currentUser?.id
            });
          } else {
            addClient({
              name: name,
              email: c['email address'] || c.email || c['email_address'] || '',
              phone: c.phone || '',
              company: c.company || '',
              service: ['Other'],
              budget: budget,
              collectedPayment: 0,
              totalDealAmount: budget,
              paymentAmount: 0,
              paymentStatus: 'Pending',
              interested: true,
              feedback: 'Imported via CSV',
              createdBy: currentUser?.id,
              managedBy: currentUser?.id
            });
          }
        count++;
      });
      alert(`Imported ${count} leads successfully!`);
      e.target.value = '';
    };
    reader.readAsText(file);
  };



  // Payment summary totals
  const calcShare = (amount, c) => {
    const val = Number(amount) || 0;
    const closerId = c.closer || c.createdBy;
    if (c.createdBy === closerId) return val; // 100% if they did both
    if (c.createdBy === currentUser.id || closerId === currentUser.id) return val * 0.5; // 50% split
    return 0;
  };

  const paidList = myClients.filter(c => c.paymentStatus === 'Completed');
  // Use totalDealAmount (same as card) — fall back to budget metadata if not set
  const sumTotal = myClients.reduce((s, c) => s + calcShare(c.totalDealAmount ?? getClientBudgetAmount(c), c), 0);
  // Sum collected from ALL clients (not just fully-paid ones — partial payments count too)
  const sumCol = myClients.reduce((s, c) => s + calcShare(c.paymentAmount, c), 0);
  const sumRem = sumTotal - sumCol;
  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  const PALETTE = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316'];

  // Search & Tab Filter
  const getClientCreationDate = (c) => {
    if (c.created_at) return new Date(c.created_at);
    if (c.createdAt) return new Date(c.createdAt);
    const fb = getClientFeedbackText(c) || '';
    const match = fb.match(/\[Created on (\d{4}-\d{2}-\d{2})\]/);
    if (match) return new Date(match[1]);
    return new Date(0); // fallback
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'INTERESTED': return { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: 'rgba(16, 185, 129, 0.3)' };
      case 'NOT_INTERESTED': return { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' };
      case 'CALLBACK': return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' };
      case 'CONTACTED': return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
      case 'DND':
      case 'CUT_CALL': return { bg: 'rgba(107, 114, 128, 0.15)', color: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' };
      default: return { bg: 'var(--bg-primary)', color: 'var(--text-muted)', border: 'var(--border-color)' };
    }
  };

  const filteredByTab = activeList.filter(c => {
    if (activeTab === 'all') return true;
    
    const total = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0;
    const collected = Number(c.paymentAmount) || 0;
    const remaining = total - collected;
    
    if (activeTab === 'today') {
      const createdStr = getClientCreationDate(c);
      if (!createdStr) return false;
      const created = new Date(createdStr);
      const today = new Date();
      return created.getDate() === today.getDate() &&
             created.getMonth() === today.getMonth() &&
             created.getFullYear() === today.getFullYear();
    }
    if (activeTab === 'new') {
      const createdStr = getClientCreationDate(c);
      if (!createdStr) return false;
      const created = new Date(createdStr);
      const diffTime = Math.abs(new Date() - created);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }
    if (activeTab === 'paid') return remaining <= 0 && total > 0;
    if (activeTab === 'remaining') return remaining > 0;
    
    return true;
  });

  let displayClients = filteredByTab;
  if (statusFilter) {
    displayClients = displayClients.filter(c => (c.status || 'CREATED') === statusFilter);
  }
  if (searchQ.trim()) {
    displayClients = displayClients.filter(c => {
      const q = searchQ.toLowerCase();
      return (
        (c.name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (getClientCompanyName(c) || '').toLowerCase().includes(q)
      );
    });
  }

  return (
    <div className="animate-fade-in">
      
      {/* ── Payment Summary ── */}
      {!isLeads && (
        <div className="grid grid-cols-3 gap-5" style={{ marginBottom: '3rem' }}>
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s' }}
             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(96, 165, 250, 0.15)'; e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.4)'; }}
             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', zIndex: 1 }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Total Payment</h3>
            <div style={{ background: 'rgba(96, 165, 250, 0.12)', padding: '0.6rem', borderRadius: '12px', color: '#60a5fa' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>{fmt(sumTotal)}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>{myClients.length} active clients</p>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s' }}
             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(16, 185, 129, 0.15)'; e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)'; }}
             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', zIndex: 1 }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Collected</h3>
            <div style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '0.6rem', borderRadius: '12px', color: '#10b981' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>{fmt(sumCol)}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>{paidList.length} fully paid</p>
          </div>
        </div>

        <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '1.25rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s, box-shadow 0.3s, border-color 0.3s' }}
             onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
             onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', zIndex: 1 }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0, fontWeight: '700' }}>Remaining</h3>
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', padding: '0.6rem', borderRadius: '12px', color: '#ef4444' }}>
              <Target size={20} />
            </div>
          </div>
          <div style={{ zIndex: 1 }}>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>{fmt(sumRem)}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>{myClients.length - paidList.length} pending clients</p>
          </div>
        </div>
        </div>
      )}

      {/* ── Client Card Grid & Filters ── */}
      {isLeads && !selectedLeadListId ? (
        <div style={{ marginTop: '1rem' }}>
          {myLeadLists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
              <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
              <p style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-primary)' }}>No Lead Lists Assigned</p>
              <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>You don't have any marketing lead lists assigned to you yet.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {myLeadLists.map(list => (
                <SalesLeadListCard key={list.id} list={list} leads={leads} onViewLeads={setSelectedLeadListId} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {isLeads && selectedLeadListId && (
            <div style={{ marginBottom: '1rem' }}>
              <button 
                onClick={() => setSelectedLeadListId(null)} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: '600' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                ← Back to Lead Lists
              </button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {!isLeads && (
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-primary)' }}><Users size={24} color="var(--accent-primary)" /> My Client List <span style={{ fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.6rem', borderRadius: '999px', border: '1px solid var(--border-color)', fontWeight: '700', color: 'var(--text-secondary)' }}>{displayClients.length}</span></h2>
          )}
          {/* Removed CSV import options as requested */}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', width: '100%', maxWidth: '600px', justifyContent: 'flex-end' }}>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '0.6rem 1rem', borderRadius: '9999px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', flexShrink: 0 }}
          >
            <option value="">All Statuses</option>
            {isLeads ? (
              <>
                <option value="CREATED">Created</option>
                <option value="INTRO">Intro</option>
                <option value="INTERESTED">Interested</option>
                <option value="NOT_INTERESTED">Not Interested</option>
                <option value="CALLBACK">Callback</option>
                <option value="CONTACTED">Contacted</option>
                <option value="NOT_PICK_UP">Not Pick Up</option>
                <option value="CUT_CALL">Cut Call</option>
                <option value="DND">DND</option>
                <option value="Voice Mail">Voice Mail</option>
                <option value="Switch Off">Switch Off</option>
              </>
            ) : (
              <>
                <option value="CREATED">Created</option>
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </>
            )}
          </select>
          <div style={{ flex: 1 }}>
            <SearchBar 
              value={searchQ} 
              onChange={e => setSearchQ(e.target.value)} 
              placeholder="Search by name, email, phone, company…"
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.4rem', WebkitOverflowScrolling: 'touch' }}>
        {(isLeads ? [
          { id: 'all', label: 'All Leads' },
          { id: 'today', label: 'Today Leads' },
          { id: 'new', label: 'New Leads (7 Days)' }
        ] : [
          { id: 'all', label: 'All Clients' },
          { id: 'today', label: 'Today Clients' },
          { id: 'new', label: 'New Clients (7 Days)' },
          { id: 'paid', label: 'Fully Paid' },
          { id: 'remaining', label: 'Remaining Payment' }
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.5rem 1.2rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
              boxShadow: activeTab === tab.id ? '0 4px 12px rgba(99, 102, 241, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
              border: activeTab === tab.id ? '1px solid transparent' : '1px solid var(--border-color)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {displayClients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '2px dashed var(--border-color)' }}>
          <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
          <p style={{ fontWeight: '700', fontSize: '1.2rem', color: 'var(--text-primary)' }}>{searchQ ? 'No clients match your search' : 'No clients yet'}</p>
          <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>{searchQ ? 'Try checking for typos or using different keywords.' : 'Add your first client using the "Add New Client" page.'}</p>
        </div>
      ) : isLeads ? (
        <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '1rem', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: '600', borderBottom: '1px solid var(--border-color)' }}>
                {currentUser?.role !== 'sales' && <th style={{ padding: '1rem 1.2rem' }}><input type="checkbox" style={{ cursor: 'pointer' }} /></th>}
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Name</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Company</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Phone</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Email</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>City</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>State</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Service</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Status</th>
                {currentUser?.role !== 'sales' && <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Sales Rep</th>}
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Sales Notes</th>
                <th style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>Date</th>
                <th style={{ padding: '1rem 1.2rem', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayClients.map(c => {
                let services = getClientServicesList(c);
                if (services.length === 0 && (c.type_of_service || c.dynamic_data?.service || c.dynamic_data?.type_of_service)) {
                  services = [c.type_of_service || c.dynamic_data?.service || c.dynamic_data?.type_of_service];
                }
                const serviceName = services.length > 0 ? services[0] : '-';
                const salesRep = c.managedBy ? (users.find(u => u.id === c.managedBy)?.name || c.managedBy) : 'Unassigned';
                const dateCreated = c.created_at ? new Date(c.created_at).toLocaleDateString('en-GB').replace(/\//g, '-') : '-';
                const cCity = c.city || (c.dynamic_data?.city) || '-';
                const cState = c.state || (c.dynamic_data?.state) || '-';
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s ease', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} onClick={() => startEdit(c)}>
                    {currentUser?.role !== 'sales' && <td style={{ padding: '1rem 1.2rem' }} onClick={e => e.stopPropagation()}><input type="checkbox" style={{ cursor: 'pointer' }} /></td>}
                    <td style={{ padding: '1rem 1.2rem', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{c.name || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.company || c.dynamic_data?.company || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.phone || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.email || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{cCity}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{cState}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{serviceName}</td>
                    <td style={{ padding: '1rem 1.2rem', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const s = c.status || 'CREATED';
                        const st = getStatusStyle(s);
                        return (
                          <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '0.3rem 0.6rem', borderRadius: '4px', background: st.bg, color: st.color, border: `1px solid ${st.border}`, letterSpacing: '0.05em' }}>
                            {s}
                          </span>
                        );
                      })()}
                    </td>
                    {currentUser?.role !== 'sales' && <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{salesRep}</td>}
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.notes || c.dynamic_data?.notes || '-'}</td>
                    <td style={{ padding: '1rem 1.2rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{dateCreated}</td>
                    <td style={{ padding: '1rem 1.2rem', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {currentUser?.role === 'superadmin' ? (
                        <button onClick={e => { e.stopPropagation(); removeLead(c.id); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                      ) : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {displayClients.map(c => {
            const total = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0;
            const collected = Number(c.paymentAmount) || 0;
            const remaining = total - collected;
            const pct = total > 0 ? Math.min(100, Math.round((collected / total) * 100)) : 0;
            const fullPaid = remaining <= 0 && total > 0;
            let services = getClientServicesList(c);
            if (services.length === 0 && (c.type_of_service || c.dynamic_data?.service || c.dynamic_data?.type_of_service)) {
              services = [c.type_of_service || c.dynamic_data?.service || c.dynamic_data?.type_of_service];
            }
            const displayName = c.name || c.phone || c.email || '?';
            const ac = PALETTE[displayName.charCodeAt(0) % PALETTE.length];
            const initials = displayName === '?' ? '?' : displayName.split(/[\s_-]+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

            return (
              <div key={c.id} onClick={() => startEdit(c)} style={{
                cursor: 'pointer',
                background: 'var(--bg-secondary)', 
                borderRadius: '1.25rem', 
                border: fullPaid ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)', 
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.2rem',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'; }}>
                
                {/* Header: Profile */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', minWidth: 0 }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `linear-gradient(135deg, ${ac}, ${ac}cc)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.1rem', fontWeight: '800', flexShrink: 0 }}>{initials}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name || c.phone || c.email || 'Unknown Client'}</h3>
                    {services.length > 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle size={12} color="var(--accent-primary)"/> {services[0]}{services.length > 1 ? ` +${services.length - 1}` : ''}</div>
                    ) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No services</div>
                    )}
                  </div>
                </div>

                {/* Body: Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '1rem 0', borderTop: '1px dashed var(--border-color)', borderBottom: '1px dashed var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Phone size={14} style={{ color: 'var(--accent-primary)' }}/> {c.phone || '-'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Mail size={14} style={{ color: 'var(--accent-primary)' }}/> {c.email || '-'}
                  </div>
                </div>

                {/* Footer: Financials */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)' }}>PAYMENT PROGRESS</span>
                    {fullPaid ? <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><CheckCircle size={12}/> FULLY PAID</span> : <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--accent-primary)' }}>{pct}%</span>}
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: fullPaid ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '700', marginTop: '0.25rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>₹{collected.toLocaleString('en-IN')} <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: '600' }}>received</span></span>
                    <span style={{ color: 'var(--text-primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </>
      )}

      {/* Edit Modal (Popup) */}
      {editingClient && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backdropFilter: 'blur(4px)' }} onClick={() => setEditingClient(null)}>
          <div style={{ background: 'var(--bg-primary)', borderRadius: '1.5rem', width: '100%', maxWidth: '600px', boxShadow: 'var(--shadow-xl)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Edit2 size={18} color="var(--accent-primary)"/> Edit {isLeads ? 'Lead' : 'Client'}</h3>
              <button onClick={() => setEditingClient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>
            
            {/* Modal Body */}
            {isLeads ? (
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Name</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Company (Optional)</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} placeholder="Company Name" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Email</label>
                    <input className="form-control" type="email" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email Address" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Phone</label>
                    <input className="form-control" type="tel" maxLength="10" pattern="\d{10}" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Phone Number" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>City</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>State</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} placeholder="State" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Service</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.type_of_service || editForm.dynamic_data?.service || editForm.dynamic_data?.type_of_service || ''} onChange={e => setEditForm({ ...editForm, type_of_service: e.target.value })} placeholder="Service" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Status</label>
                    <select className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem' }} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                      <option value="CREATED">CREATED</option>
                      <option value="NOT_PICK_UP">not pick up</option>
                      <option value="INTRO">intro</option>
                      <option value="CALLBACK">call back</option>
                      <option value="INTERESTED">intretsed</option>
                      <option value="NOT_INTERESTED">not intrested</option>
                      <option value="LANGUAGE_ISSUE">language issue</option>
                      <option value="CONNECTIVITY_ISSUE">connectivity issue</option>
                      <option value="DND">DND</option>
                      <option value="VOICE_MAIL">Voice Mail</option>
                      <option value="SWITCH_OFF">Switch Off</option>
                    </select>
                  </div>
                </div>

                {Object.keys(editForm.dynamic_data || {}).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    {Object.keys(editForm.dynamic_data).map(key => {
                      if (['company', 'city', 'state', 'notes', 'service', 'type_of_service'].includes(key.toLowerCase())) return null;
                      return (
                        <div key={key}>
                          <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block', textTransform: 'capitalize' }}>{key}</label>
                          <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.dynamic_data[key] || ''} onChange={e => setEditForm({ ...editForm, dynamic_data: { ...editForm.dynamic_data, [key]: e.target.value } })} placeholder={key} />
                        </div>
                      );
                    })}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Sales Notes</label>
                  <textarea className="form-control" style={{ fontSize: '0.9rem', padding: '0.6rem', minHeight: '80px', resize: 'vertical' }} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} placeholder="Record notes about the lead..." />
                </div>
              </div>
            ) : (
              <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Name</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Full Name" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Company (Optional)</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.company} onChange={e => setEditForm({ ...editForm, company: e.target.value })} placeholder="Company Name" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Email</label>
                    <input className="form-control" type="email" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email Address" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Phone</label>
                    <input className="form-control" type="tel" maxLength="10" pattern="\d{10}" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="Phone Number" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>City</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>State</label>
                    <input className="form-control" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} placeholder="State" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>PAN Number</label>
                    <input className="form-control" type="text" maxLength="10" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.panNumber} onChange={e => setEditForm({ ...editForm, panNumber: e.target.value.toUpperCase() })} placeholder="PAN" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>GST Number</label>
                    <input className="form-control" type="text" maxLength="15" style={{ fontSize: '0.9rem', padding: '0.5rem', opacity: currentUser?.role === 'sales' ? 0.7 : 1 }} disabled={currentUser?.role === 'sales'} value={editForm.gstNumber} onChange={e => setEditForm({ ...editForm, gstNumber: e.target.value.toUpperCase() })} placeholder="GST" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.3rem', display: 'block' }}>Services</label>
                  <div style={{ opacity: currentUser?.role === 'sales' ? 0.7 : 1, pointerEvents: currentUser?.role === 'sales' ? 'none' : 'auto' }}>
                    <ServicePicker compact={true} value={editForm.service || []} onChange={v => setEditForm({ ...editForm, service: v })} />
                  </div>
                </div>

                {(() => {
                  const total = Number(editForm.totalDeal) || 0;
                  const collected = (editForm.payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
                  const remaining = total - collected;
                  const isSales = currentUser?.role === 'sales';
                  const canAddPayment = !isSales || remaining > 0;

                  return (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Payments {isSales && remaining <= 0 && <span style={{color: '#10b981', marginLeft: '0.5rem'}}>(Fully Paid)</span>}</span>
                        {canAddPayment && (
                          <button type="button" onClick={() => setEditForm(prev => ({ ...prev, payments: [...(prev.payments || []), { amount: '', date: '' }] }))} style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>+ Add</button>
                        )}
                      </label>
                      
                      <div style={{ marginBottom: '0.8rem' }}>
                        <label style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.2rem', display: 'block' }}>Total Deal Amount ₹</label>
                        <input className="form-control" type="number" disabled={isSales} style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem', opacity: isSales ? 0.7 : 1, cursor: isSales ? 'not-allowed' : 'text' }} value={editForm.totalDeal} onChange={e => !isSales && setEditForm({ ...editForm, totalDeal: e.target.value })} title={isSales ? "Total amount cannot be changed by sales" : ""} />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(editForm.payments || []).map((p, i) => {
                          const isExisting = editingClient.payments && i < editingClient.payments.length;
                          const readOnly = isSales && isExisting;
                          return (
                            <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input className="form-control" type="number" min="0" placeholder="Amount ₹" disabled={readOnly} style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.6rem', opacity: readOnly ? 0.7 : 1, cursor: readOnly ? 'not-allowed' : 'text' }} value={p.amount} onChange={e => { const newP = [...editForm.payments]; newP[i].amount = e.target.value; setEditForm({ ...editForm, payments: newP }); }} />
                              <input className="form-control" type="date" disabled={readOnly} style={{ flex: 1, fontSize: '0.85rem', padding: '0.4rem 0.6rem', opacity: readOnly ? 0.7 : 1, cursor: readOnly ? 'not-allowed' : 'text' }} value={p.date} onChange={e => { const newP = [...editForm.payments]; newP[i].date = e.target.value; setEditForm({ ...editForm, payments: newP }); }} />
                              {!readOnly && (
                                <button type="button" onClick={() => { const newP = editForm.payments.filter((_, idx) => idx !== i); setEditForm({ ...editForm, payments: newP }); }} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.2rem' }}>×</button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div>
                {currentUser.role === 'superadmin' && (
                  <button className="btn btn-danger" onClick={() => { isLeads ? removeLead(editingClient) : removeClient(editingClient); setEditingClient(null); }} style={{ padding: '0.5rem 1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }}><Trash2 size={16}/> Delete</button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <button className="btn btn-secondary" onClick={() => setEditingClient(null)} style={{ padding: '0.5rem 1.5rem', fontWeight: '600' }}>Cancel</button>
                <button className="btn btn-primary" onClick={() => saveEdit(editingClient)} style={{ padding: '0.5rem 1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Save size={16}/> Save Changes</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ─── Router ───────────────────────────────────────────────────────────────────
const SalesDashboard = () => (
  <Routes>
    <Route path="/" element={<SalesOverview />} />
    <Route path="/add-client" element={<AddNewClient />} />
    <Route path="/clients" element={<MyClients />} />
    <Route path="/leads" element={<MyClients isLeads={true} />} />
  </Routes>
);

export { MyClients as SalesMyClients };
export default SalesDashboard;
