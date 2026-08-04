import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const STATUSES = [
  'CREATED', 'NOT_PICK_UP', 'INTRO', 'CALLBACK', 
  'INTERESTED', 'NOT_INTERESTED', 'LANGUAGE_ISSUE', 
  'CONNECTIVITY_ISSUE', 'DND', 'VOICE_MAIL', 'SWITCH_OFF'
];

const STATUS_COLORS = {
  'CREATED': '#94a3b8',
  'NOT_PICK_UP': '#f59e0b',
  'INTRO': '#0ea5e9',
  'CALLBACK': '#3b82f6',
  'INTERESTED': '#10b981',
  'NOT_INTERESTED': '#ef4444',
  'LANGUAGE_ISSUE': '#f43f5e',
  'CONNECTIVITY_ISSUE': '#a855f7',
  'DND': '#6b7280',
  'VOICE_MAIL': '#8b5cf6',
  'SWITCH_OFF': '#64748b'
};

const STATUS_LABELS = {
  'CREATED': 'Created',
  'NOT_PICK_UP': 'Not Pick Up',
  'INTRO': 'Intro',
  'CALLBACK': 'Callback',
  'INTERESTED': 'Interested',
  'NOT_INTERESTED': 'Not Interested',
  'LANGUAGE_ISSUE': 'Language Issue',
  'CONNECTIVITY_ISSUE': 'Connectivity Issue',
  'DND': 'DND',
  'VOICE_MAIL': 'Voice Mail',
  'SWITCH_OFF': 'Switch Off'
};

const MarketingLeadsChart = ({ leads = [] }) => {
  const chartData = STATUSES.map(status => {
    const count = leads.filter(l => (l.status || 'CREATED').toUpperCase() === status).length;
    return {
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8'
    };
  }).filter(item => item.value > 0);

  const total = leads.length;

  if (total === 0) {
    return (
      <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <h3 className="text-h3" style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontWeight: '700' }}>Marketing Leads Overview</h3>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: '500' }}>
          No marketing leads assigned yet
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 className="text-h3" style={{ margin: '0 0 1.5rem 0', color: 'var(--text-primary)', fontWeight: '700' }}>Marketing Leads Overview</h3>
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
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', letterSpacing: '1px' }}>TOTAL LEADS</div>
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

export default MarketingLeadsChart;
