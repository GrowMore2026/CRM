import { useApp } from '../context/AppProvider';

const AllIncentives = () => {
  // incentives → users, clients, tasks (all tables connected)
  const { incentives, tasks, clients, users, currentUser, markIncentivesPaid } = useApp();

  const salesEmployees = users.filter(u => u.role === 'sales');

  const employeeRows = salesEmployees.map(emp => {
    const empIncs      = incentives.filter(i => i.employeeId === emp.id);
    const pending      = empIncs.filter(i => i.status === 'Pending');
    const paid         = empIncs.filter(i => i.status === 'Paid');
    const totalPending = pending.reduce((s, i) => s + i.amount, 0);
    const totalPaid    = paid.reduce((s, i) => s + i.amount, 0);
    return { emp, empIncs, totalPending, totalPaid };
  });

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1">Sales Employee Incentives</h1>

      <div className="grid gap-6">
        {employeeRows.map(({ emp, empIncs, totalPending, totalPaid }) => (
          <div key={emp.id} className="card">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-h2" style={{ margin: 0 }}>
                  {emp.name}{' '}
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>({emp.id})</span>
                </h2>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1.5rem' }}>
                  <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
                    Pending: ₹{totalPending.toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>
                    Paid: ₹{totalPaid.toFixed(2)}
                  </span>
                </div>
              </div>

              {currentUser.role === 'admin' && totalPending > 0 && (
                <button className="btn btn-success" onClick={() => markIncentivesPaid(emp.id)}>
                  Mark Pending as Paid
                </button>
              )}
            </div>

            {empIncs.length > 0 ? (
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Source</th>
                      {/* connected to clients table */}
                      <th>Client / Task</th>
                      <th>Role</th>
                      <th>Client Payment</th>
                      <th>Incentive</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empIncs
                      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                      .map((inc, idx) => {
                        const isTask = inc.incentive_type === 'task';

                        // resolve client via clientId → clients.id
                        const client = clients.find(c => c.id === inc.clientId);

                        // resolve task via taskId → tasks.id
                        const task = tasks.find(t => t.id === inc.taskId);

                        const paymentAmount = inc.clientPaymentAmount || client?.paymentAmount || 0;

                        return (
                          <tr key={idx}>
                            <td>{new Date(inc.createdAt).toLocaleDateString()}</td>
                            <td>
                              {isTask
                                ? <span className="badge badge-primary">Task</span>
                                : <span className="badge badge-warning">Payment</span>}
                            </td>
                            <td>
                              {isTask
                                ? (task?.title || inc.taskId || '—')
                                : (inc.clientName || client?.name || '—')}
                            </td>
                            <td><span className="badge badge-primary">{inc.role}</span></td>
                            <td>{isTask ? '—' : `₹${paymentAmount.toFixed(2)}`}</td>
                            <td style={{ fontWeight: 'bold', color: 'var(--success)' }}>
                              ₹{inc.amount.toFixed(2)}
                            </td>
                            <td>
                              <span className={`badge ${inc.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                {inc.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No incentives earned yet.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllIncentives;
