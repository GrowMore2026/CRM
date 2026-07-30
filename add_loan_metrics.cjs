const fs = require('fs');

let code = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');

// 1. Add loanRawLeads to useApp destructuring
code = code.replace(
  'const { users, tasks, clients, currentUser, setSelectedClient, leads, leadLists, rawLeads } = useApp();',
  'const { users, tasks, clients, currentUser, setSelectedClient, leads, leadLists, rawLeads, loanRawLeads } = useApp();'
);

// 2. Add selectedLoanRawLeadEmployee state
code = code.replace(
  'const [selectedRawLeadEmployee, setSelectedRawLeadEmployee] = useState(\'\');',
  'const [selectedRawLeadEmployee, setSelectedRawLeadEmployee] = useState(\'\');\n  const [selectedLoanRawLeadEmployee, setSelectedLoanRawLeadEmployee] = useState(\'\');'
);

// 3. Add loanRawLeadMetrics useMemo right after rawLeadMetrics
const rawLeadMetricsStartStr = '  const rawLeadMetrics = useMemo(() => {';
const rawLeadMetricsStartIdx = code.indexOf(rawLeadMetricsStartStr);

// Find the end of rawLeadMetrics
// rawLeadMetrics is followed by return (...) or another useMemo
// Let's just find `const overallStats = useMemo(() => {` which is likely somewhere after.
// We can inject it right before `const overallStats` or right before `const userStats` 

const nextMemoStr = '  const overallStats = useMemo(() => {';
code = code.replace(nextMemoStr, `  const loanRawLeadMetrics = useMemo(() => {
    if (!readOnly || !loanRawLeads) return null;
    
    const totalRawLeads = loanRawLeads.length;
    
    const statusCounts = loanRawLeads.reduce((acc, curr) => {
      const st = curr.status || 'PENDING';
      if (st !== 'PENDING' && st !== 'UNASSIGNED') {
         acc[st] = (acc[st] || 0) + 1;
      }
      return acc;
    }, {});
    
    const rawLeadChartData = Object.keys(statusCounts).map(key => ({ name: key, count: statusCounts[key] })).sort((a, b) => b.count - a.count);

    const empDataMap = loanRawLeads.reduce((acc, curr) => {
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
      
    const employeeRawLeadsData = selectedLoanRawLeadEmployee
      ? employeeRawLeadsDataAll.filter(emp => emp.id === selectedLoanRawLeadEmployee)
      : employeeRawLeadsDataAll.slice(0, 5); 

    const followupLeadsCount = loanRawLeads.filter(l => l.status === 'Call Back').length;
    const pendingLeadsCount = loanRawLeads.filter(l => !l.status || l.status === 'PENDING').length;
    const processedLeadsCount = loanRawLeads.filter(l => l.status && l.status !== 'PENDING' && l.status !== 'UNASSIGNED').length;
    const remainingLeadsCount = totalRawLeads - processedLeadsCount;

    return { totalRawLeads, remainingLeadsCount, rawLeadChartData, employeeRawLeadsData, employeeRawLeadsDataAll };
  }, [loanRawLeads, readOnly, users, selectedLoanRawLeadEmployee]);

  const overallStats = useMemo(() => {`);

// 4. Add the JSX rendering
// We want to insert the JSX block for Loan Raw Leads right after the Raw Leads block.
// The Raw Leads block ends with the </BarChart> and closing </div></>
const rawLeadsJsxEndStr = `                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
`;

code = code.replace(
  rawLeadsJsxEndStr,
  rawLeadsJsxEndStr + `
          {/* ── Loan Raw Leads Performance ── */}
          {loanRawLeadMetrics && (
            <>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-primary)', margin: '3rem 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                Loan Raw Leads Performance
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Total Loan Raw Leads</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{loanRawLeadMetrics.totalRawLeads.toLocaleString()}</h3>
                  </div>
                </div>

                <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                    <TrendingUp size={28} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>Remaining Loan Leads</p>
                    <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>{loanRawLeadMetrics.remainingLeadsCount.toLocaleString()}</h3>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                <div className="card" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
                    Loan Raw Lead Status Distribution
                  </h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={loanRawLeadMetrics.rawLeadChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                        {loanRawLeadMetrics.rawLeadChartData.map((entry, index) => {
                          const colors = {
                            Interested: '#10b981', 'Call Back': '#3b82f6', 'Not Interested': '#ef4444', 
                            'Wrong Number': '#f59e0b', Invalid: '#6b7280', DND: '#8b5cf6', 
                            Busy: '#eab308', 'Not Pickup': '#f43f5e'
                          };
                          return <Cell key={\`cell-\${index}\`} fill={colors[entry.name] || '#6366f1'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card" style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)', height: '400px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)' }}>Top 5 Employees (Loan Raw Leads)</h3>
                    <select 
                      value={selectedLoanRawLeadEmployee} 
                      onChange={(e) => setSelectedLoanRawLeadEmployee(e.target.value)}
                      style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
                    >
                      <option value="">Top 5 Employees</option>
                      {loanRawLeadMetrics.employeeRawLeadsDataAll.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                  <ResponsiveContainer width="100%" height="80%">
                    <BarChart data={loanRawLeadMetrics.employeeRawLeadsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }} cursor={{ fill: 'transparent' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', color: 'var(--text-secondary)' }} />
                      <Bar dataKey="Busy" stackId="a" fill="#eab308" />
                      <Bar dataKey="Call Back" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="DND" stackId="a" fill="#8b5cf6" />
                      <Bar dataKey="Interested" stackId="a" fill="#10b981" />
                      <Bar dataKey="Invalid" stackId="a" fill="#6b7280" />
                      <Bar dataKey="Not Interested" stackId="a" fill="#ef4444" />
                      <Bar dataKey="Not Pickup" stackId="a" fill="#f43f5e" />
                      <Bar dataKey="PENDING" stackId="a" fill="#94a3b8" />
                      <Bar dataKey="Wrong Number" stackId="a" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
`
);

fs.writeFileSync('src/pages/AdminDashboard.jsx', code);
console.log('Metrics added');
