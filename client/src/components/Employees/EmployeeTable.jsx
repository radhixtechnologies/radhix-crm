import { FiEdit, FiTrash2 } from 'react-icons/fi';
import '../../styles/tables.css';

const EmployeeTable = ({
  employees,
  onView,
  onEdit,
  onDelete,
  canEdit,
  selectedEmployees = [],
  onSelectEmployees
}) => {
  const allVisibleSelected = employees.length > 0 && employees.every(emp => selectedEmployees.includes(emp._id));
  const someVisibleSelected = employees.some(emp => selectedEmployees.includes(emp._id)) && !allVisibleSelected;

  const handleSelectAll = (e) => {
    if (!onSelectEmployees) return;
    if (e.target.checked) {
      const newIds = Array.from(new Set([...selectedEmployees, ...employees.map(emp => emp._id)]));
      onSelectEmployees(newIds);
    } else {
      const visibleIds = new Set(employees.map(emp => emp._id));
      onSelectEmployees(selectedEmployees.filter(id => !visibleIds.has(id)));
    }
  };

  const handleToggleSelect = (id, e) => {
    if (e) e.stopPropagation();
    if (!onSelectEmployees) return;
    if (selectedEmployees.includes(id)) {
      onSelectEmployees(selectedEmployees.filter(item => item !== id));
    } else {
      onSelectEmployees([...selectedEmployees, id]);
    }
  };

  return (
    <div className="card">
      <table className="table employee-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={allVisibleSelected}
                ref={(el) => { if (el) el.indeterminate = someVisibleSelected; }}
                onChange={handleSelectAll}
                title="Select all on this page"
                style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
              />
            </th>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Designation</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.length > 0 ? (
            employees.map((emp) => (
              <tr
                key={emp._id}
                style={{
                  backgroundColor: selectedEmployees.includes(emp._id) ? '#eff6ff' : undefined,
                  transition: 'background-color 0.15s ease'
                }}
              >
                <td style={{ width: '40px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp._id)}
                    onChange={(e) => handleToggleSelect(emp._id, e)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#3b82f6' }}
                  />
                </td>
                <td>{emp.employeeId}</td>
                <td>{emp.user?.name || 'N/A'}</td>
                <td>{emp.department}</td>
                <td>{emp.designation}</td>
                <td>
                  <span className={`badge badge-${emp.status === 'active' ? 'success' : 'secondary'}`}>
                    {emp.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => onView(emp._id)}
                    >
                      View
                    </button>
                    {canEdit && (
                      <>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => onEdit(emp)}
                        >
                          <FiEdit />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => onDelete(emp._id)}
                        >
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                {employees.length === 0 ? 'No employees found' : 'No employees match your filters'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;

