import { useState, useMemo } from 'react';
import { useApp } from '../context/AppProvider';
import { Download, Users, Wallet, Target, Search, TrendingUp, Briefcase } from 'lucide-react';
import { isUserOnline } from '../components/OnlineBadge';
import { getClientBudgetAmount, getClientCompanyName, getClientServicesList, getClientTotalDealGst, getClientTotalDealWithGst } from '../utils/clientRow';
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const getClientCreationDate = (c) => {
  if (c.created_at) return new Date(c.created_at);
  if (c.createdAt) return new Date(c.createdAt);
  const fb = c.client_feedback || c.feedback || '';
  const match = fb.match(/\[Created on (\d{4}-\d{2}-\d{2})\]/);
  if (match) return new Date(match[1]);
  return new Date();
};

const EmployeeData = ({ readOnly }) => {
  const { clients, users } = useApp();
  
  // Filter for sales employees only
  const targetEmployees = users.filter(u => u.role === 'sales');
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(
    targetEmployees.length > 0 ? targetEmployees[0].id : null
  );

  const selectedEmployee = targetEmployees.find(u => u.id === selectedEmployeeId);

  // Filter clients for the selected employee
  const employeeClients = useMemo(() => {
    if (!selectedEmployeeId) return [];
    return clients.filter(c => 
      c.createdBy === selectedEmployeeId || 
      c.closer === selectedEmployeeId || 
      (c.managedBy === selectedEmployeeId && !c.closer)
    );
  }, [clients, selectedEmployeeId]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    let totalRevenue = 0;
    let monthRevenue = 0;
    let monthClientsCount = 0;

    employeeClients.forEach(c => {
      // Logic from SalesDashboard for calculating share
      const calcShare = (amount) => {
        const val = Number(amount) || 0;
        const closerId = c.closer || c.createdBy;
        if (c.createdBy === closerId) return val;
        if (c.createdBy === selectedEmployeeId || closerId === selectedEmployeeId) return val * 0.5;
        return 0;
      };

      const collected = calcShare(c.paymentAmount);
      totalRevenue += collected;

      const createdDate = getClientCreationDate(c);
      if (createdDate && createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
        monthClientsCount++;
        monthRevenue += collected; 
      }
    });

    return {
      totalClients: employeeClients.length,
      monthClientsCount,
      totalRevenue,
      monthRevenue
    };
  }, [employeeClients, selectedEmployeeId]);

  const chartData = useMemo(() => {
    const dataMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Helper to get month key
    const getMonthKey = (d) => `${months[d.getMonth()]} ${d.getFullYear()}`;

    // Collect all data into a raw map by iterating over ALL clients to get company-wide totals too
    clients.forEach(c => {
      let assignedDate = getClientCreationDate(c);
      if (assignedDate) {
        const key = getMonthKey(assignedDate);
        if (!dataMap[key]) {
          dataMap[key] = { timestamp: new Date(assignedDate.getFullYear(), assignedDate.getMonth(), 1).getTime(), name: key, revenue: 0, companyRevenue: 0, employeeClients: 0, companyClients: 0 };
        }
        
        // Count for company
        dataMap[key].companyClients += 1;
        dataMap[key].companyRevenue += (Number(c.paymentAmount) || 0);

        // Check if client belongs to the selected employee
        const isEmployeeClient = c.createdBy === selectedEmployeeId || c.closer === selectedEmployeeId || (c.managedBy === selectedEmployeeId && !c.closer);
        
        if (isEmployeeClient) {
          dataMap[key].employeeClients += 1;
          
          const calcShare = (amount) => {
            const val = Number(amount) || 0;
            const closerId = c.closer || c.createdBy;
            if (c.createdBy === closerId) return val;
            if (c.createdBy === selectedEmployeeId || closerId === selectedEmployeeId) return val * 0.5;
            return 0;
          };
          
          dataMap[key].revenue += calcShare(c.paymentAmount);
        }
      }
    });

    // If no data, return default 6 months
    if (Object.keys(dataMap).length === 0) {
      const defaultMap = {};
      const d = new Date();
      for (let i = 5; i >= 0; i--) {
        let m = d.getMonth() - i;
        let y = d.getFullYear();
        if (m < 0) {
          m += 12;
          y -= 1;
        }
        defaultMap[`${months[m]} ${y}`] = { name: `${months[m]}`, revenue: 0, companyRevenue: 0, employeeClients: 0, companyClients: 0 };
      }
      return Object.values(defaultMap);
    }

    // Sort the collected data by timestamp
    const sortedData = Object.values(dataMap).sort((a, b) => a.timestamp - b.timestamp);
    
    // Fill in missing months between the earliest and latest
    if (sortedData.length > 0) {
      const filledData = [];
      let current = new Date(sortedData[0].timestamp);
      
      // Ensure we show at least the last 6 months even if data is older
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0,0,0,0);
      
      if (current > sixMonthsAgo) {
         current = sixMonthsAgo;
      }

      const endLimit = new Date(); // up to this month
      endLimit.setDate(1);
      endLimit.setHours(0,0,0,0);
      
      const targetEnd = new Date(sortedData[sortedData.length - 1].timestamp);
      const finalEnd = targetEnd > endLimit ? targetEnd : endLimit;

      while (current <= finalEnd) {
        const key = getMonthKey(current);
        if (dataMap[key]) {
          filledData.push(dataMap[key]);
        } else {
          filledData.push({ timestamp: current.getTime(), name: key, revenue: 0, companyRevenue: 0, employeeClients: 0, companyClients: 0 });
        }
        current.setMonth(current.getMonth() + 1);
      }
      return filledData;
    }

    return sortedData;
  }, [clients, selectedEmployeeId]);

  const employeeWiseData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return targetEmployees.map(emp => {
      let monthRev = 0;
      let totalRev = 0;
      
      clients.forEach(c => {
        const isEmployeeClient = c.createdBy === emp.id || c.closer === emp.id || (c.managedBy === emp.id && !c.closer);
        if (isEmployeeClient) {
          const calcShare = (amount) => {
            const val = Number(amount) || 0;
            const closerId = c.closer || c.createdBy;
            if (c.createdBy === closerId) return val;
            if (c.createdBy === emp.id || closerId === emp.id) return val * 0.5;
            return 0;
          };
          
          const rev = calcShare(c.paymentAmount);
          totalRev += rev;
          
          const createdDate = getClientCreationDate(c);
          if (createdDate && createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear) {
            monthRev += rev;
          }
        }
      });
      
      return {
        name: (emp.name || 'Unknown').split(' ')[0],
        monthRevenue: monthRev,
        totalRevenue: totalRev
      };
    }).filter(emp => emp.monthRevenue > 0).sort((a, b) => b.monthRevenue - a.monthRevenue).slice(0, 10);
  }, [clients, targetEmployees]);

  const fmt = n => `₹${n.toLocaleString('en-IN')}`;

  const downloadCSV = () => {
    if (employeeClients.length === 0) {
      alert("No clients to export.");
      return;
    }

    const headers = ['Client Name', 'Company Name', 'Email', 'Phone', 'Services', 'Total Deal (No GST)', 'GST Amount', 'Total Deal (With GST)', 'Collected Amount', 'Pending Amount', 'Status', 'Creation Date'];
    
    const rows = employeeClients.map(c => {
      const company = getClientCompanyName(c) || '';
      const services = (getClientServicesList(c) || []).join('; ');
      const totalDeal = c.totalDealAmount ?? getClientBudgetAmount(c) ?? 0;
      const totalDealGst = getClientTotalDealGst(c);
      const totalDealWithGst = getClientTotalDealWithGst(c) || (totalDeal + totalDealGst);
      const collected = c.paymentAmount ?? 0;
      const pendingAmount = Math.max(0, totalDealWithGst - collected);
      const status = c.paymentStatus || 'Pending';
      const createdDate = getClientCreationDate(c);
      
      return [
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${company.replace(/"/g, '""')}"`,
        `"${(c.email || '').replace(/"/g, '""')}"`,
        `"${(c.phone || '').replace(/"/g, '""')}"`,
        `"${services.replace(/"/g, '""')}"`,
        totalDeal,
        totalDealGst,
        totalDealWithGst,
        collected,
        pendingAmount,
        `"${status}"`,
        `"${createdDate ? (typeof createdDate.toISOString === 'function' ? createdDate.toISOString().split('T')[0] : new Date(createdDate).toISOString().split('T')[0]) : ''}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedEmployee?.name || 'employee'}_clients.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* Header Section */}
      <div style={{ 
        padding: '1rem 0',
        marginBottom: '2rem',
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center',
        width: 'fit-content'
      }}>
          <div style={{ position: 'relative' }}>
            <Users size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
            <select
              value={selectedEmployeeId || ''}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              style={{
                padding: '0.85rem 1rem 0.85rem 3rem',
                borderRadius: '1rem',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '240px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.2s ease',
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(99, 102, 241, 0.2)'}
            >
              {targetEmployees.length === 0 ? (
                <option value="" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>No employees found</option>
              ) : (
                targetEmployees.map(emp => (
                  <option key={emp.id} value={emp.id} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>{emp.name} ({emp.role})</option>
                ))
              )}
            </select>
          </div>

          <button 
            onClick={downloadCSV}
            style={{ 
              padding: '0.85rem 1.5rem', 
              borderRadius: '1rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              opacity: (!selectedEmployeeId || employeeClients.length === 0) ? 0.5 : 1
            }}
            disabled={!selectedEmployeeId || employeeClients.length === 0}
            onMouseEnter={e => { if(!e.target.disabled) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)'; } }}
            onMouseLeave={e => { if(!e.target.disabled) { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)'; } }}
          >
            <Download size={20} /> Export Report
          </button>
      </div>

      {selectedEmployee && (
        <>


          {/* Charts Section */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            
            <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="#6366f1" /> Revenue Trend
              </h2>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompanyRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                      formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                    />
                    <Area type="monotone" dataKey="companyRevenue" name="Total Company Revenue" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCompanyRev)" />
                    <Area type="monotone" dataKey="revenue" name="Employee's Revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ padding: '2rem', background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#10b981" /> Client Growth Comparison
              </h2>
              <div style={{ width: '100%', height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                    <CartesianGrid vertical={false} stroke="var(--border-color)" strokeDasharray="3 3" />
                    <Tooltip 
                      contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      cursor={{ fill: 'var(--bg-tertiary)' }}
                    />
                    <Bar dataKey="companyClients" name="Total Company Clients" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="employeeClients" name="Employee's Clients" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>


          {/* Client Table Section */}
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '1.5rem', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>Assigned Clients</h2>
              <span style={{ padding: '0.35rem 1rem', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', borderRadius: '999px', fontSize: '0.85rem', fontWeight: '700' }}>
                {employeeClients.length} Total
              </span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Client Details</th>
                    <th style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Company</th>
                    <th style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)' }}>Payment Status</th>
                    <th style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>Collected</th>
                    <th style={{ padding: '1.25rem 2rem', color: 'var(--text-muted)', fontWeight: '700', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid var(--border-color)', textAlign: 'right' }}>Total Deal</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeClients.map(c => {
                    const totalDeal = c.totalDealAmount ?? getClientBudgetAmount(c) ?? 0;
                    const collected = c.paymentAmount ?? 0;
                    const isCompleted = c.paymentStatus === 'Completed';

                    return (
                      <tr key={c.id} style={{ transition: 'background 0.2s ease', borderBottom: '1px solid var(--border-color)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '1.25rem 2rem' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>{c.name || 'Unknown'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email || c.phone}</div>
                        </td>
                        <td style={{ padding: '1.25rem 2rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {getClientCompanyName(c) || '-'}
                        </td>
                        <td style={{ padding: '1.25rem 2rem' }}>
                          <span style={{ 
                            padding: '0.35rem 0.85rem', 
                            borderRadius: '999px', 
                            fontSize: '0.75rem', 
                            fontWeight: '700',
                            background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: isCompleted ? '#10b981' : '#f59e0b',
                            border: `1px solid ${isCompleted ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                          }}>
                            {c.paymentStatus || 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {fmt(collected)}
                        </td>
                        <td style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: '700', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                          {fmt(totalDeal)}
                        </td>
                      </tr>
                    );
                  })}
                  {employeeClients.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                          <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '50%', color: 'var(--text-muted)' }}>
                            <Briefcase size={32} />
                          </div>
                          <span style={{ fontSize: '1rem', fontWeight: '600' }}>No clients found for this employee.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default EmployeeData;
