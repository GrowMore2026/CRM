const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// Add state for summaryMonth
if (!code.includes('const [summaryMonth, setSummaryMonth]')) {
    code = code.replace(
        /const \[animate, setAnimate\] = useState\(false\);/,
        "const [animate, setAnimate] = useState(false);\n  const [summaryMonth, setSummaryMonth] = useState(-1);"
    );
}

// Add dailyChartData
if (!code.includes('const dailyChartData =')) {
    const dailyDataCode = `
  const dailyChartData = useMemo(() => {
    const targetMonth = summaryMonth === -1 ? new Date().getMonth() : summaryMonth;
    const targetYear = new Date().getFullYear();
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      name: \`\${i + 1}\`,
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
`;
    code = code.replace(
        /const STAGES = \[/,
        dailyDataCode.trim() + '\n\n  const STAGES = ['
    );
}

// Add the Daily Payment Chart JSX
if (!code.includes('Daily Payment Chart')) {
    const dailyChartJSX = `
      {/* ── Daily Payment Chart ── */}
      {readOnly && (
        <div className="card mb-4" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', borderRadius: '1.25rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 0.25rem 0' }}>Daily Payment</h2>
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
          <div style={{ width: '100%', height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmountDaily" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} dy={5} interval={0} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => \`₹\${v >= 100000 ? (v / 100000).toFixed(1) + 'L' : v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}\`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-tertiary)' }} />
                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountDaily)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
`;
    // We want to place it below the Charts Grid (Client Summary & User Breakdown)
    // The previous structure ends with:
    //             </div>
    //         </div>
    //       </>
    //       )}
    // 
    //       {/* ── 5-Stage Pipeline Board ── */}
    
    code = code.replace(
        /<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/>\n\s*\)\}\n\n\s*\{\/\* ── 5-Stage Pipeline Board ── \*\/\}/,
        `            </div>
        </div>\n` + dailyChartJSX + `      </>\n      )}\n\n      {/* ── 5-Stage Pipeline Board ── */}`
    );
}

fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
console.log('Daily chart added');
