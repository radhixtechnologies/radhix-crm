import { formatDate } from '../../utils/format';
import '../../styles/leaveReports.css';

/**
 * Leave Table Component
 * Displays leave entries in a table format
 */
const LeaveTable = ({ leaves, showEmployee = false }) => {
  const getStatusBadge = (status) => {
    const badges = {
      approved: { class: 'badge-success', text: 'Approved' },
      pending: { class: 'badge-warning', text: 'Pending' },
      rejected: { class: 'badge-error', text: 'Rejected' },
      cancelled: { class: 'badge-secondary', text: 'Cancelled' },
    };
    const badge = badges[status] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const getTypeBadge = (type) => {
    const typeNames = {
      casual: 'Casual',
      sick: 'Sick',
      annual: 'Annual',
      maternity: 'Maternity',
      paternity: 'Paternity',
      unpaid: 'Unpaid',
    };
    return <span className="badge badge-info">{typeNames[type] || type}</span>;
  };

  if (!leaves || leaves.length === 0) {
    return (
      <div className="table-empty">
        <p>No leave records found</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="leave-table">
        <thead>
          <tr>
            {showEmployee && <th>Employee</th>}
            <th>Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Days</th>
            <th>Status</th>
            <th>Reason</th>
            {showEmployee && <th>Department</th>}
          </tr>
        </thead>
        <tbody>
          {leaves.map((leave) => (
            <tr key={leave._id}>
              {showEmployee && (
                <td>
                  {leave.employee?.employeeId || 'N/A'} - {leave.employee?.user?.name || 'N/A'}
                </td>
              )}
              <td>{getTypeBadge(leave.type)}</td>
              <td>{formatDate(leave.startDate)}</td>
              <td>{formatDate(leave.endDate)}</td>
              <td>{leave.days}</td>
              <td>{getStatusBadge(leave.status)}</td>
              <td className="table-reason">{leave.reason}</td>
              {showEmployee && <td>{leave.employee?.department || 'N/A'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveTable;

