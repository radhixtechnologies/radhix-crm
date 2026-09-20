import { FiEdit, FiTrash2 } from 'react-icons/fi';
import '../../styles/tables.css';

const EmployeeTable = ({ employees, onView, onEdit, onDelete, canEdit }) => {
  return (
    <div className="card">
      <table className="table employee-table">
        <thead>
          <tr>
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
              <tr key={emp._id}>
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
              <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
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

