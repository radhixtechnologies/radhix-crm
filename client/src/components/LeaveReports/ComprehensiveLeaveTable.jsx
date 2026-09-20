import { useState, useEffect } from 'react';
import { FiEye, FiCalendar, FiUser, FiFilter } from 'react-icons/fi';
import { formatDate } from '../../utils/format';
import '../../styles/leaveReports.css';

/**
 * Comprehensive Leave Table Component
 * Displays all leaves with filters and detailed information
 */
const ComprehensiveLeaveTable = ({ leaves = [], onViewDetails, loading = false }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filteredLeaves, setFilteredLeaves] = useState(leaves);

  // Update filtered leaves when leaves prop changes
  useEffect(() => {
    setFilteredLeaves(leaves);
  }, [leaves]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredLeaves].sort((a, b) => {
      let aVal = a[key];
      let bVal = b[key];

      // Handle nested properties
      if (key === 'employee') {
        aVal = a.employee?.user?.name || a.employee?.employeeId || '';
        bVal = b.employee?.user?.name || b.employee?.employeeId || '';
      } else if (key === 'department') {
        aVal = a.employee?.department || '';
        bVal = b.employee?.department || '';
      }

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredLeaves(sorted);
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: { class: 'badge-success', label: 'Approved' },
      pending: { class: 'badge-warning', label: 'Pending' },
      rejected: { class: 'badge-error', label: 'Rejected' },
      cancelled: { class: 'badge-secondary', label: 'Cancelled' },
    };
    const badge = badges[status] || { class: 'badge-secondary', label: status };
    return <span className={`badge ${badge.class}`}>{badge.label}</span>;
  };

  const getTypeBadge = (type) => {
    return <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{type}</span>;
  };

  if (loading) {
    return (
      <div className="table-loading">
        <p>Loading leaves...</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
      <div className="card-header" style={{ marginBottom: '20px' }}>
        <h3 className="card-title">All Leave Requests</h3>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {filteredLeaves.length} total leaves
        </span>
      </div>

      <div className="table-wrapper" style={{ overflowX: 'auto' }}>
        <table className="leave-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('employee')} style={{ cursor: 'pointer' }}>
                Employee {sortConfig.key === 'employee' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('employeeId')} style={{ cursor: 'pointer' }}>
                Employee ID {sortConfig.key === 'employeeId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('department')} style={{ cursor: 'pointer' }}>
                Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                Type {sortConfig.key === 'type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('startDate')} style={{ cursor: 'pointer' }}>
                Start Date {sortConfig.key === 'startDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('endDate')} style={{ cursor: 'pointer' }}>
                End Date {sortConfig.key === 'endDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('days')} style={{ cursor: 'pointer' }}>
                Days {sortConfig.key === 'days' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th>Applied Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaves.length > 0 ? (
              filteredLeaves.map((leave) => (
                <tr key={leave._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="employee-avatar-table">
                        {leave.employee?.user?.avatar ? (
                          <img src={leave.employee.user.avatar} alt={leave.employee?.user?.name} />
                        ) : (
                          <span>
                            {(leave.employee?.user?.name || 'E').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span>{leave.employee?.user?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td>{leave.employee?.employeeId || 'N/A'}</td>
                  <td>{leave.employee?.department || 'N/A'}</td>
                  <td>{getTypeBadge(leave.type)}</td>
                  <td>{formatDate(leave.startDate)}</td>
                  <td>{formatDate(leave.endDate)}</td>
                  <td>
                    <strong>{leave.days}</strong>
                    {leave.halfDay && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '4px' }}>
                        (½ day)
                      </span>
                    )}
                  </td>
                  <td>{getStatusBadge(leave.status)}</td>
                  <td>{formatDate(leave.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onViewDetails && onViewDetails(leave)}
                      title="View Details"
                    >
                      <FiEye /> View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComprehensiveLeaveTable;

