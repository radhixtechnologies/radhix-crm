import { useState, useEffect } from 'react';
import { employeeService } from '../../../services/employeeService';
import { formatDate } from '../../../utils/format';
import dayjs from 'dayjs';
import '../../../styles/forms.css';

const TimesheetTab = ({ employeeId }) => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().endOf('month').format('YYYY-MM-DD'));

  useEffect(() => {
    if (employeeId) {
      fetchTimesheets();
    }
  }, [employeeId, startDate, endDate]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getTimesheets({ startDate, endDate, employeeId });
      if (response.data.success) {
        setTimesheets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching timesheets:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading timesheets...</div>;
  }

  return (
    <div className="timesheet-tab">
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input
          type="date"
          className="form-input"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          style={{ minWidth: '150px' }}
        />
        <span style={{ alignSelf: 'center' }}>to</span>
        <input
          type="date"
          className="form-input"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          style={{ minWidth: '150px' }}
        />
      </div>

      <div className="card">
        <h3 className="card-title">Timesheets</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Total Hours</th>
              <th>Billable Hours</th>
              <th>Status</th>
              <th>Approved By</th>
            </tr>
          </thead>
          <tbody>
            {timesheets.length > 0 ? (
              timesheets.map((ts) => (
                <tr key={ts._id}>
                  <td>{formatDate(ts.date)}</td>
                  <td>{ts.totalHours || 0}</td>
                  <td>{ts.billableHours || 0}</td>
                  <td>
                    <span className={`badge badge-${ts.status === 'approved' ? 'success' : ts.status === 'rejected' ? 'error' : 'warning'}`}>
                      {ts.status === 'approved' ? 'approved' : ts.status === 'rejected' ? 'rejected' : 'pending'}
                    </span>
                  </td>
                  <td>{ts.approvedBy?.name || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No timesheets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimesheetTab;

