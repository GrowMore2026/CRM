const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// 1. Add recharts imports
if (!code.includes('recharts')) {
    code = code.replace(
        /import \{ UserPlus, Shield \} from 'lucide-react';/,
        "import { UserPlus, Shield } from 'lucide-react';\nimport { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';"
    );
}

// 2. Add useMemo to react imports
if (!code.includes('useMemo')) {
    code = code.replace(
        /import \{ useState, useEffect \} from 'react';/,
        "import { useState, useEffect, useMemo } from 'react';"
    );
}

// 3. Add getClientPaymentsList to clientRow imports
if (!code.includes('getClientPaymentsList')) {
    code = code.replace(
        /parseClientFeedback \} from '\.\.\/utils\/clientRow';/,
        "parseClientFeedback, getClientPaymentsList } from '../utils/clientRow';"
    );
}

// 4. Add CustomTooltip and chartData before returning from AdminOverview
if (!code.includes('const CustomTooltip =')) {
    const chartLogic = `
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
`;
    // Insert before the pipeline stages
    code = code.replace(
        /const STAGES = \[/,
        chartLogic + '\n  const STAGES = ['
    );
}

// 5. Add the actual chart JSX right next to the Client Summary Donut Chart we just added
if (!code.includes('Revenue Overview Chart')) {
    const chartJSX = `
      {/* ── Revenue Overview Chart ── */}
      {readOnly && (
        <div className="card mb-4" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
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
                  tickFormatter={(val) => val >= 100000 ? \`₹\${(val / 100000).toFixed(1)}L\` : val >= 1000 ? \`₹\${(val / 1000).toFixed(0)}k\` : \`₹\${val}\`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
`;
    // We want it to be next to Client Summary Donut. 
    // They are currently just block divs. 
    // Let's create a grid container for both.
    
    // First, find the Client Summary Donut
    if (code.includes('{/* ── Client Summary Donut ── */}')) {
       // Wrap both in a grid
       code = code.replace(
         /\{\/\* ── Client Summary Donut ── \*\/\}\n\s*\{readOnly && \(\n\s*<div className="card mb-4"/,
         `{/* ── Charts Grid ── */}\n      {readOnly && (\n        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>\n` +
         chartJSX.trim() + '\n\n          {/* ── Client Summary Donut ── */}\n          <div className="card" '
       );
       
       // Close the wrapper grid right after the Client Summary Donut block
       code = code.replace(
         /<\/div>\n\s*\)\}\n\n\s*\{\/\* ── 5-Stage Pipeline Board ── \*\/\}/,
         `</div>\n        </div>\n      )}\n\n      {/* ── 5-Stage Pipeline Board ── */}`
       );
    }
}

fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
console.log('Done');
