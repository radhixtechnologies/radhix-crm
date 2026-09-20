import { useState } from 'react';
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiCheckCircle, FiXCircle, FiClock, FiInfo } from 'react-icons/fi';
import { formatDate } from '../../utils/format';
import '../../styles/leaveReports.css';

/**
 * Employee Leave History Component
 * Shows detailed leave history for a specific employee
 */
const EmployeeLeaveHistory = ({ employee, leaves = [], summary = null, monthly = [] }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (!employee) {
    return (
      <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
        <p>No employee selected</p>
      </div>
    );
  }

  const filteredLeaves = leaves.filter(leave => {
    const leaveYear = new Date(leave.startDate).getFullYear();
    return leaveYear === selectedYear;
  });

  return (
    <div className="fade-in">
      {/* Employee Info Header */}
      <div className="card" style={{ 
        marginBottom: '24px', 
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white',
        border: 'none'
      }}>
        <div style={{ padding: '24px' }}>
          <h2 style={{ margin: 0, marginBottom: '8px', fontSize: '24px' }}>
            {employee.name || employee.user?.name || 'Employee'}
          </h2>
          <div style={{ display: 'flex', gap: '24px', fontSize: '14px', opacity: 0.9 }}>
            <span><strong>ID:</strong> {employee.employeeId}</span>
            <span><strong>Department:</strong> {employee.department || 'N/A'}</span>
            <span><strong>Email:</strong> {employee.email || employee.user?.email || 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {summary && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Requests</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--primary)' }}>{summary.total}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Approved</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--success)' }}>{summary.approved}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {summary.totalDays} days
            </div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pending</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--warning)' }}>{summary.pending}</div>
          </div>
          <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Rejected</div>
            <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--error)' }}>{summary.rejected}</div>
          </div>
        </div>
      )}

      {/* Leave Type Breakdown */}
      {summary && summary.byType && (
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Leave Type Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            {Object.keys(summary.byType).filter(type => summary.byType[type].total > 0).map(type => (
              <div key={type} style={{ 
                padding: '16px', 
                background: 'var(--surface)', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'capitalize' }}>
                  {type} Leave
                </div>
                <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                  {summary.byType[type].days} days
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {summary.byType[type].approved} approved
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly Chart */}
      {monthly && monthly.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Monthly Usage - {selectedYear}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '12px' }}>
            {monthly.map(month => (
              <div key={month.month} style={{ 
                padding: '12px', 
                background: month.total > 0 ? 'var(--info-light)' : 'var(--surface)', 
                borderRadius: '8px',
                textAlign: 'center',
                border: month.total > 0 ? '1px solid var(--info)' : '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  {month.monthName}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>
                  {month.total}
                </div>
                {month.approved > 0 && (
                  <div style={{ fontSize: '10px', color: 'var(--success)', marginTop: '4px' }}>
                    {month.approved} approved
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave History Table */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Leave History</h3>
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            style={{ minWidth: '120px' }}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="table-wrapper" style={{ overflowX: 'auto' }}>
          <table className="leave-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Applied</th>
                <th>Approved/Rejected By</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.length > 0 ? (
                filteredLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td>
                      <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                        {leave.type}
                      </span>
                    </td>
                    <td>{formatDate(leave.startDate)}</td>
                    <td>{formatDate(leave.endDate)}</td>
                    <td><strong>{leave.days}</strong></td>
                    <td>
                      <span className={`badge ${
                        leave.status === 'approved' ? 'badge-success' :
                        leave.status === 'rejected' ? 'badge-error' :
                        leave.status === 'pending' ? 'badge-warning' :
                        'badge-secondary'
                      }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {leave.reason || '-'}
                    </td>
                    <td>{formatDate(leave.createdAt)}</td>
                    <td>
                      {leave.approvedBy && (
                        <div style={{ fontSize: '12px' }}>
                          <FiCheckCircle style={{ color: 'var(--success)', marginRight: '4px' }} />
                          {leave.approvedBy} {leave.approvedAt && `(${formatDate(leave.approvedAt)})`}
                        </div>
                      )}
                      {leave.rejectedBy && (
                        <div style={{ fontSize: '12px' }}>
                          <FiXCircle style={{ color: 'var(--error)', marginRight: '4px' }} />
                          {leave.rejectedBy} {leave.rejectedAt && `(${formatDate(leave.rejectedAt)})`}
                        </div>
                      )}
                      {!leave.approvedBy && !leave.rejectedBy && (
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No leave records found for {selectedYear}
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

export default EmployeeLeaveHistory;

