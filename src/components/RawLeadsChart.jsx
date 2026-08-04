import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

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

const RawLeadsChart = ({ rawLeads = [], title = "Raw Leads Activity", totalLabel = "TOTAL RAW LEADS" }) => {
  const statusCounts = {};
  rawLeads.forEach(l => {
    if (l.status) {
      statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    }
  });

  const chartData = Object.entries(statusCounts)
    .map(([name, value]) => ({
      name,
      value,
      color: RAW_LEAD_COLORS[name] || '#94a3b8'
    }))
    .sort((a, b) => b.value - a.value);

  const total = rawLeads.length;

  if (total === 0) {
    return (
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 className="text-h3" style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontWeight: '700' }}>{title}</h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
          No processed raw leads found
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="text-h3" style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontWeight: '700' }}>{title}</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center', flex: 1 }}>

        {/* Chart */}
        <div style={{ height: '220px', width: '220px', position: 'relative', flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                dataKey="value"
                stroke="none"
                paddingAngle={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)', boxShadow: 'var(--shadow-lg)' }}
                itemStyle={{ color: 'var(--text-primary)', fontWeight: '600' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: '1.2' }}>{total}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>{totalLabel}</div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1, minWidth: '150px', maxHeight: '220px', overflowY: 'auto', paddingRight: '1rem' }}>
          {chartData.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: idx !== chartData.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></div>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.name}</span>
              </div>
              <span style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: '800' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RawLeadsChart;
