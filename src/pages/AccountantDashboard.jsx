import { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { createPortal } from 'react-dom';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { Wallet, CreditCard, Target, Settings, Building2, Phone, Mail, FileText } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import { useApp } from '../context/AppProvider';
import { 
  getClientCompanyName, 
  getClientPanNumber, 
  getClientGstNumber, 
  getClientPaymentsList, 
  parseClientFeedback, 
  getClientBudgetAmount,
  getClientServicesList,
  getClientCreationDate,
  getClientTotalDealGst,
  getClientTotalDealWithGst,
  getClientFeedbackText
} from '../utils/clientRow';
import UpcomingHolidays from '../components/UpcomingHolidays';
import EmployeeData from './EmployeeData';

const AccountantOverview = () => {
  const { users, clients , setSelectedClient } = useApp();
  const [searchQ, setSearchQ] = useState('');
  const salesUsers = users.filter(u => u.role === 'sales' && (u.name || '').toLowerCase().includes(searchQ.toLowerCase()));
  const navigate = useNavigate();
  const totalDealValue = clients.reduce((sum, c) => sum + (getClientTotalDealWithGst(c) || (Number(c.totalDealAmount) || 0)), 0);
  const totalCollected = clients.reduce((sum, c) => sum + (Number(c.paymentAmount) || 0), 0);
  const totalOutstanding = Math.max(0, totalDealValue - totalCollected);

  const currentYear = new Date().getFullYear();
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, revenue: 0 }));
    
    clients.forEach(c => {
      const payments = getClientPaymentsList(c);
      payments.forEach(p => {
        if (p.amount > 0 && p.date) {
          const d = new Date(p.date);
          if (d.getFullYear() === currentYear) {
            data[d.getMonth()].revenue += Number(p.amount) || 0;
          }
        }
      });
    });
    return data;
  }, [clients, currentYear]);

  const pieData = [
    { name: 'Collected', value: totalCollected, color: '#10b981' },
    { name: 'Outstanding', value: totalOutstanding, color: '#f59e0b' }
  ];

  return (
    <div className="animate-fade-in">
      
      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.12)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Deal Value</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalDealValue.toLocaleString('en-IN')}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Collected</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalCollected.toLocaleString('en-IN')}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Outstanding</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalOutstanding.toLocaleString('en-IN')}</div>
        </div>

        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Total Clients</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{clients.length}</div>
        </div>
      </div>

      {/* ── Charts Section ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Revenue Trend Chart */}
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Revenue Trend ({currentYear})</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={val => `₹${val/1000}k`} />
                <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', background: 'var(--bg-primary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Distribution Pie Chart */}
        <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Collection Distribution</h3>
          <div style={{ width: '100%', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {totalDealValue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{ borderRadius: '8px', border: 'none', background: 'var(--bg-primary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: 'var(--text-muted)' }}>No financial data available.</div>
            )}
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <UpcomingHolidays />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginBottom: '2rem' }}>
        <SearchBar 
          value={searchQ} 
          onChange={e => setSearchQ(e.target.value)} 
          placeholder="Search employees…" 
          style={{ width: '300px', flex: 'none' }}
        />
      </div>

      {/* ── Sales Employee Performance ── */}
      {salesUsers.length > 0 ? (
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem' }}>Sales Revenue Performance</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
            {salesUsers.map(sales => {
              const salesClients = clients.filter(c => c.createdBy === sales.id || c.closer === sales.id || (c.managedBy === sales.id && !c.closer));
              
              const calcShare = (amount, c) => {
                const val = Number(amount) || 0;
                const closerId = c.closer || c.createdBy;
                if (c.createdBy === closerId) return val;
                if (c.createdBy === sales.id || closerId === sales.id) return val * 0.5;
                return 0;
              };

              const totalRevenue = salesClients.reduce((sum, c) => sum + calcShare(c.paymentAmount, c), 0);
              const dealValue = salesClients.reduce((sum, c) => sum + calcShare(c.totalDealAmount, c), 0);
              const progress = dealValue > 0 ? Math.min(100, Math.round((totalRevenue / dealValue) * 100)) : 0;

              return { sales, salesClients, totalRevenue, dealValue, progress };
            })
            .sort((a, b) => b.totalRevenue - a.totalRevenue || b.progress - a.progress)
            .map(({ sales, salesClients, totalRevenue, dealValue, progress }) => {
              return (
                <div key={sales.id} onClick={() => navigate(`clients?employee=${sales.id}`)} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {(sales.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{sales.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{salesClients.length} Clients</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Revenue Collected</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--text-primary)' }}>₹{totalRevenue.toLocaleString('en-IN')}</span>
                  </div>

                  {dealValue > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                        <span>Collection Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progress}%`, background: 'var(--text-secondary)', borderRadius: '999px' }} />
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: 'right' }}>
                        Target: ₹{dealValue.toLocaleString('en-IN')}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)' }}>
          No sales employees found.
        </div>
      )}
    </div>
  );
};

const AccountantEditModal = ({ editForm, setEditForm, onSave, onCancel, client, users }) => {
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div className="animate-fade-in" style={{ background: 'var(--bg-secondary)', width: '90%', maxWidth: '600px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-tertiary)' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)' }}>Accountant Access</h3>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          
          {client && (
            <div style={{ marginBottom: '1.5rem', padding: '1.2rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid rgba(99,102,241,0.1)', paddingBottom: '0.5rem' }}>{client.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>Phone:</strong> {client.phone || '—'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Email:</strong> {client.email || '—'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Lead Creator:</strong> {users?.find(u => u.id === client.createdBy)?.name || '—'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Lead Closer:</strong> {users?.find(u => u.id === client.closer)?.name || '—'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Admin Manager:</strong> {users?.find(u => u.id === client.managedBy)?.name || '—'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Payment Status:</strong> <span style={{ color: client.paymentStatus === 'Completed' ? '#10b981' : '#f59e0b', fontWeight: '600' }}>{client.paymentStatus || 'Pending'}</span></div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Created Date:</strong> {(getClientCreationDate(client) || client.created_at || client.timestamp) ? new Date(getClientCreationDate(client) || client.created_at || client.timestamp).toLocaleDateString('en-GB') : '—'}</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>Stage:</strong> {client.stage || '—'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--text-primary)' }}>Services:</strong> {getClientServicesList(client).join(', ') || '—'}</div>
              </div>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>PAN Number</label>
              <input className="form-control" placeholder="ABCDE1234F" style={{ width: '100%' }} value={editForm.panNumber || ''} onChange={e => setEditForm({...editForm, panNumber: e.target.value.toUpperCase()})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>GST Number</label>
              <input className="form-control" placeholder="22AAAAA0000A1Z5" style={{ width: '100%' }} value={editForm.gstNumber || ''} onChange={e => setEditForm({...editForm, gstNumber: e.target.value.toUpperCase()})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Total Deal (No GST)</label>
              <input className="form-control" type="number" placeholder="₹" style={{ width: '100%' }} value={editForm.totalDeal || ''} onChange={e => {
                const val = e.target.value;
                const budget = Number(val) || 0;
                const rate = Number(editForm.gstRate) || 18;
                const gst = Math.round(budget * (rate / 100));
                setEditForm({ ...editForm, totalDeal: val, totalDealGstAmount: gst > 0 ? String(gst) : '', totalDealWithGst: (budget + gst) > 0 ? String(budget + gst) : '' });
              }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>GST Rate (%)</label>
              <select className="form-control" style={{ width: '100%', padding: '0.4rem' }} value={editForm.gstRate} onChange={e => {
                const rate = Number(e.target.value);
                const budget = Number(editForm.totalDeal) || 0;
                const gst = Math.round(budget * (rate / 100));
                setEditForm({ ...editForm, gstRate: rate, totalDealGstAmount: gst > 0 ? String(gst) : '', totalDealWithGst: (budget + gst) > 0 ? String(budget + gst) : '' });
              }}>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Total With GST</label>
              <input className="form-control" type="number" placeholder="₹" style={{ width: '100%' }} value={editForm.totalDealWithGst || ''} onChange={e => setEditForm({...editForm, totalDealWithGst: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>GST Amount</label>
              <input className="form-control" type="number" placeholder="₹" style={{ width: '100%' }} value={editForm.totalDealGstAmount || ''} onChange={e => setEditForm({...editForm, totalDealGstAmount: e.target.value})} />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
              <label style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Installments / Payments</label>
              <button type="button" onClick={() => setEditForm(prev => ({ ...prev, payments: [...(prev.payments || []), { amount: '', date: '', verified: false }] }))} style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>+ Add Payment</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(editForm.payments || []).map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <input className="form-control" type="number" min="0" placeholder="₹ Amount" style={{ flex: 1, fontSize: '0.85rem' }} value={p.amount} onChange={e => { const newP = [...editForm.payments]; newP[i].amount = e.target.value; setEditForm({ ...editForm, payments: newP }); }} />
                  <input className="form-control" type="date" style={{ flex: 1, fontSize: '0.85rem' }} value={p.date} onChange={e => { const newP = [...editForm.payments]; newP[i].date = e.target.value; setEditForm({ ...editForm, payments: newP }); }} />
                  
                  <button type="button" onClick={() => { const newP = [...editForm.payments]; newP[i].verified = !newP[i].verified; setEditForm({ ...editForm, payments: newP }); }} style={{ background: p.verified ? 'rgba(16,185,129,0.1)' : 'transparent', color: p.verified ? '#10b981' : 'var(--text-muted)', border: p.verified ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '0.3rem 0.5rem', transition: 'all 0.2s', minWidth: '65px' }}>
                    {p.verified ? '✓ Ver' : 'Verify'}
                  </button>
                  <button type="button" onClick={() => { const newP = editForm.payments.filter((_, idx) => idx !== i); setEditForm({ ...editForm, payments: newP }); }} style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 0.2rem' }}>×</button>
                </div>
              ))}
              {(!editForm.payments || editForm.payments.length === 0) && (
                 <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No payments added.</div>
              )}
            </div>
          </div>

          <div>
             <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Internal Note (Optional)</label>
             <textarea className="form-control" rows={3} style={{ width: '100%', resize: 'vertical' }} value={editForm.note || ''} onChange={e => setEditForm({...editForm, note: e.target.value})} placeholder="Add any financial notes here..." />
          </div>

        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '1rem', background: 'var(--bg-tertiary)' }}>
          <button className="btn btn-secondary" style={{ flex: 1, padding: '0.8rem' }} onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1, padding: '0.8rem' }} onClick={onSave}>Save Changes</button>
        </div>

      </div>
    </div>,
    document.body
  );
};

const AccountantClients = () => {
  const { clients, users, updateClientDetails , setSelectedClient } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQ, setSearchQ] = useState('');
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({});

  const empId = searchParams.get('employee');

  const getClientFeedbackText = c => typeof c.feedback === 'string' ? c.feedback : (c.feedback?.note || '');
  const fmt = val => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  let displayClients = clients;
  if (empId) {
    displayClients = displayClients.filter(c => c.createdBy === empId || c.closer === empId || (c.managedBy === empId && !c.closer));
  }

  if (searchQ.trim()) {
    const q = searchQ.toLowerCase();
    displayClients = displayClients.filter(c => 
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (getClientCompanyName(c) || '').toLowerCase().includes(q)
    );
  }

  const startEdit = c => {
    const parsed = parseClientFeedback(c.feedback || '');
    let payments = getClientPaymentsList(c);
    if (payments.length === 0 && c.paymentAmount > 0) {
      payments = [{ amount: c.paymentAmount, date: c.paymentDate ? c.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0] }];
    }
    setEditForm({
      company: getClientCompanyName(c) || '',
      panNumber: getClientPanNumber(c) || '',
      gstNumber: getClientGstNumber(c) || '',
      totalDeal: c.totalDealAmount ?? getClientBudgetAmount(c) ?? '',
      payments: payments,
      note: parsed.note || '',
      service: parsed.services || [],
      totalDealGstAmount: parsed.totalDealGst || '',
      totalDealWithGst: parsed.totalDealWithGst || '',
      gstRate: parsed.totalDealGst && parsed.budget ? Math.round((parsed.totalDealGst / parsed.budget) * 100) : 18,
    });
    setEditingClient(c.id);
  };

  const saveEdit = clientId => {
    if (editForm.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(editForm.panNumber)) {
      alert('Invalid PAN Number format. It should be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    if (editForm.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(editForm.gstNumber)) {
      alert('Invalid GST Number format. It should be 15 characters (e.g. 22AAAAA0000A1Z5).');
      return;
    }

    const c = clients.find(cl => cl.id === clientId);
    const parts = [];
    if (editForm.company) parts.push(`[Company] ${editForm.company.trim()}`);
    const budget = Number(editForm.totalDeal) || 0;
    if (budget) parts.push(`[Budget ₹${budget}]`);
    const totalDealGst = Number(editForm.totalDealGstAmount) || 0;
    const totalDealWithGst = Number(editForm.totalDealWithGst) || 0;
    if (totalDealGst > 0) parts.push(`[Total Deal GST ₹${totalDealGst}]`);
    if (totalDealWithGst > 0) parts.push(`[Total Deal With GST ₹${totalDealWithGst}]`);
    if (editForm.panNumber) parts.push(`[PAN] ${editForm.panNumber.trim()}`);
    if (editForm.gstNumber) parts.push(`[GST] ${editForm.gstNumber.trim()}`);
    (editForm.payments || []).forEach(p => {
      if (p.amount && p.date) parts.push(`[Payment ₹${p.amount} on ${p.date}]${p.verified ? ' [Verified]' : ''}`);
    });
    const svc = (editForm.service || []).filter(Boolean);
    if (svc.length) parts.push(`[Services] ${svc.join('; ')}`);
    if (editForm.note) parts.push(editForm.note);

    const totalDeal = Number(editForm.totalDeal) || 0;
    const collected = (editForm.payments || []).filter(p => p.verified).reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    updateClientDetails(clientId, {
      feedback: parts.join('\n\n'),
      totalDealAmount: totalDeal,
      paymentAmount: collected,
      paymentStatus: collected >= totalDeal && totalDeal > 0 ? 'Completed' : 'Pending',
    });
    setEditingClient(null);
  };

  const togglePaymentVerification = (client, index) => {
    const parts = [];
    const company = getClientCompanyName(client);
    if (company) parts.push(`[Company] ${company.trim()}`);
    const budget = getClientBudgetAmount(client);
    if (budget) parts.push(`[Budget ₹${budget}]`);
    const panNumber = getClientPanNumber(client);
    if (panNumber) parts.push(`[PAN] ${panNumber.trim()}`);
    const gstNumber = getClientGstNumber(client);
    if (gstNumber) parts.push(`[GST] ${gstNumber.trim()}`);
    
    let newVerifiedCollected = 0;
    const payments = getClientPaymentsList(client);
    payments.forEach((p, i) => {
      const isVerified = i === index ? !p.verified : p.verified;
      if (p.amount && p.date) {
        parts.push(`[Payment ₹${p.amount} on ${p.date}]${isVerified ? ' [Verified]' : ''}`);
        if (isVerified) newVerifiedCollected += Number(p.amount);
      }
    });
    
    const services = getClientServicesList(client);
    if (services.length) parts.push(`[Services] ${services.join('; ')}`);
    
    const parsed = parseClientFeedback(getClientFeedbackText(client));
    if (parsed.note) parts.push(parsed.note);
    
    const totalDeal = Number(client.totalDealAmount) || 0;
    updateClientDetails(client.id, { 
      feedback: parts.join('\n\n'),
      paymentAmount: newVerifiedCollected,
      paymentStatus: newVerifiedCollected >= totalDeal && totalDeal > 0 ? 'Completed' : 'Pending'
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="text-h1" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '1rem' }}>
            Client Financials
            {empId && (
              <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ opacity: 0.5 }}>|</span>
                {users.find(u => u.id === empId)?.name || 'Employee'}
                <button 
                  onClick={() => setSearchParams({})} 
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '0.2rem 0.6rem', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  ✕ Clear
                </button>
              </span>
            )}
          </h1>
        </div>
        <SearchBar 
          value={searchQ} 
          onChange={e => setSearchQ(e.target.value)} 
          placeholder="Search by name, company, email…" 
          style={{ width: '300px', flex: 'none' }}
        />
      </div>

      {/* ── Payment Summary ── */}
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
            <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>{fmt(displayClients.reduce((acc, c) => acc + (Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0), 0))}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>{displayClients.length} active clients</p>
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
            <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>{fmt(displayClients.reduce((acc, c) => acc + (Number(c.paymentAmount) || 0), 0))}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>{displayClients.filter(c => { const t = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0; return t > 0 && (Number(c.paymentAmount)||0) >= t; }).length} fully paid</p>
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
            <p style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>{fmt(displayClients.reduce((acc, c) => acc + (Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0), 0) - displayClients.reduce((acc, c) => acc + (Number(c.paymentAmount) || 0), 0))}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>{displayClients.filter(c => { const t = Number(c.totalDealAmount ?? getClientBudgetAmount(c)) || 0; return t > 0 && (Number(c.paymentAmount)||0) < t; }).length} pending clients</p>
          </div>
        </div>
      </div>

      <div className="table-container" style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', whiteSpace: 'nowrap' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}><input type="checkbox" /></th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Actions</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Name</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total (No GST)</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>GST</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total (With GST)</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Collected</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Remaining</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Phone</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>City</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Service</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sales Rep</th>
              <th style={{ padding: '1rem', textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {displayClients.map(c => {
               const services = getClientServicesList(c);
               const creationDate = getClientCreationDate(c);
               const salesRep = users.find(u => u.id === c.createdBy)?.name || '—';
               const total = Number(c.totalDealAmount) || 0;
               const totalDealGst = getClientTotalDealGst(c);
               const totalDealWithGst = getClientTotalDealWithGst(c) || (total + totalDealGst);
               const collected = Number(c.paymentAmount) || 0;
               const remaining = totalDealWithGst - collected;
               const fullPaid = remaining <= 0 && totalDealWithGst > 0;
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
                          onClick={() => startEdit(c)}
                          title="Accountant Access"
                        >
                          ✏️
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '4px', ...statusStyle }}>{statusStr}</span>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{c.name}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{fmt(total)}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{fmt(totalDealGst)}</td>
                    <td style={{ padding: '1rem', fontWeight: '600', color: 'var(--text-primary)' }}>{fmt(totalDealWithGst)}</td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: '600' }}>{fmt(collected)}</td>
                    <td style={{ padding: '1rem', color: remaining <= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>{fmt(remaining)}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{c.city || '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{services.length > 0 ? services.join(', ') : '—'}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{salesRep}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{creationDate ? new Date(creationDate).toLocaleDateString('en-GB') : '—'}</td>
                  </tr>
               );
            })}
          </tbody>
        </table>
        {displayClients.length === 0 && (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No clients found.</div>
        )}
      </div>

      {editingClient && (
        <AccountantEditModal 
          editForm={editForm} 
          setEditForm={setEditForm} 
          onSave={() => saveEdit(editingClient)} 
          onCancel={() => setEditingClient(null)} 
          client={clients.find(c => c.id === editingClient)}
          users={users}
        />
      )}
    </div>
  );
};

const AccountantDashboard = () => {
  return (
    <Routes>
      <Route path="/" element={<AccountantOverview />} />
      <Route path="/clients" element={<AccountantClients />} />
      <Route path="/employee-data" element={<EmployeeData readOnly={true} />} />
    </Routes>
  );
};

export default AccountantDashboard;
