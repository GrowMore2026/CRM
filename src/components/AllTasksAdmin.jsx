import { useApp } from '../context/AppProvider';

const AllTasksAdmin = ({ statusFilter }) => {
  const { tasks, users , setSelectedClient } = useApp();

  let filteredTasks = tasks;
  if (statusFilter) {
    filteredTasks = tasks.filter(t => t.status === statusFilter);
  }

  // Sort tasks by most recently created/added (if they had a createdAt, otherwise just reverse order)
  const sortedTasks = [...filteredTasks].reverse();

  let title = "All System Tasks";
  if (statusFilter === 'Pending') title = "Pending Tasks";
  if (statusFilter === 'Completed') title = "Completed Tasks";

  return (
    <div className="animate-fade-in">
      <h1 className="text-h1">{title}</h1>
      
      <div className="card">
        <h2 className="text-h2 mb-4">Task Overview</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Task Title</th>
                <th>Description</th>
                <th>Assigned To</th>
                <th>Created By</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map(t => {
                const assignee = users.find(u => u.id === t.assignedTo);
                const creator = users.find(u => u.id === t.createdBy);
                
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '500' }}>{t.title}</td>
                    <td>{t.description}</td>
                    <td>
                      {assignee ? (
                        <span className="badge badge-primary">{assignee.name} ({assignee.id})</span>
                      ) : (
                        <span className="badge badge-warning">Unassigned</span>
                      )}
                    </td>
                    <td>
                      {creator ? `${creator.name} (${creator.id})` : t.createdBy}
                    </td>
                    <td>
                      <span className={`badge ${t.status === 'Completed' ? 'badge-success' : t.status === 'In Progress' ? 'badge-primary' : 'badge-warning'}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {sortedTasks.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No tasks found matching this criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllTasksAdmin;
