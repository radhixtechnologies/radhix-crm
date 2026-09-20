import { useState, useEffect } from 'react';
import { employeeService } from '../../../services/employeeService';
import { formatDate } from '../../../utils/format';
import AttendanceCalendar from '../../../components/Employees/AttendanceCalendar';
import '../../../styles/attendance.css';

const AttendanceTab = ({ employeeId }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [employeeId, startDate, endDate]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAttendance(employeeId, {
        startDate,
        endDate,
      });
      if (response.data.success) {
        setAttendance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading attendance...</div>;
  }

  return (
    <div className="attendance-tab">
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

      <div className="card" style={{ marginBottom: '24px' }}>
        <h3 className="card-title">Attendance Calendar</h3>
        <AttendanceCalendar attendance={attendance} />
      </div>

      <div className="card">
        <h3 className="card-title">Attendance History</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.length > 0 ? (
              attendance.map((att) => (
                <tr key={att._id}>
                  <td>{formatDate(att.date)}</td>
                  <td>{att.checkIn ? formatDate(att.checkIn, 'HH:mm:ss') : '-'}</td>
                  <td>{att.checkOut ? formatDate(att.checkOut, 'HH:mm:ss') : '-'}</td>
                  <td>
                    {att.checkIn && att.checkOut ? (() => {
                      const diff = new Date(att.checkOut) - new Date(att.checkIn);
                      const hrs = Math.floor(diff / 3600000);
                      const mins = Math.floor((diff % 3600000) / 60000);
                      const secs = Math.floor((diff % 60000) / 1000);
                      return `${hrs}h ${mins}m ${secs}s`;
                    })() : att.hoursWorked ? (() => {
                      const totalSeconds = Math.round(att.hoursWorked * 3600);
                      const hrs = Math.floor(totalSeconds / 3600);
                      const mins = Math.floor((totalSeconds % 3600) / 60);
                      const secs = totalSeconds % 60;
                      return `${hrs}h ${mins}m ${secs}s`;
                    })() : '-'}
                  </td>
                  <td>
                    <span className={`badge badge-${att.status === 'present' ? 'success' : att.status === 'absent' ? 'error' : 'warning'}`}>
                      {att.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No attendance records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTab;

