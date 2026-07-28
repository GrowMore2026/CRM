const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// Add userChartData
if (!code.includes('userChartData')) {
    const userChartDataCode = `
  const userChartData = useMemo(() => {
    return [
      { name: 'Super Admin', count: users.filter(u => u.role === 'superadmin').length, color: 'var(--accent-primary)' },
      { name: 'Admin', count: users.filter(u => u.role === 'admin').length, color: '#10b981' },
      { name: 'Sales', count: users.filter(u => u.role === 'sales').length, color: '#0ea5e9' },
      { name: 'Accountant', count: users.filter(u => u.role === 'accountant').length, color: '#8b5cf6' },
      { name: 'Digital Mkt', count: users.filter(u => u.role === 'digital_marketing').length, color: '#ec4899' },
    ];
  }, [users]);
`;
    code = code.replace(
        /const STAGES = \[/,
        userChartDataCode.trim() + '\n\n  const STAGES = ['
    );
}

// Add User Breakdown Chart JSX
if (!code.includes('User Breakdown Chart')) {
    const userChartJSX = `
          {/* ── User Breakdown Chart ── */}
          {readOnly && (
            <div className="card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>User Breakdown</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>Distribution of roles among {users.length} total users</p>
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
                        <Cell key={\`cell-\${index}\`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
`;
    // Insert after the Client Summary Donut div closes.
    // Let's find: `<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>({clientRemainingPct}%)</span>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      )}`
    
    // Instead of complex regex, let's just insert it before `</div>\n        </div>\n      )}\n\n      {/* ── 5-Stage Pipeline Board ── */}`
    code = code.replace(
        /<\/div>\n\s*<\/div>\n\s*\)\}\n\n\s*\{\/\* ── 5-Stage Pipeline Board ── \*\/\}/,
        `</div>\n` + userChartJSX + `        </div>\n      )}\n\n      {/* ── 5-Stage Pipeline Board ── */}`
    );
}

fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
console.log('Done user chart script');
