import { useState } from 'react';
import dayjs from 'dayjs';
import '../../styles/attendance.css';

const AttendanceCalendar = ({ attendance }) => {
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const daysInMonth = currentMonth.daysInMonth();
  const firstDay = currentMonth.startOf('month').day();
  const days = [];

  // Generate days array
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getAttendanceForDate = (day) => {
    if (!day) return null;
    const date = currentMonth.date(day).format('YYYY-MM-DD');
    return attendance.find(att => dayjs(att.date).format('YYYY-MM-DD') === date);
  };

  const getAttendanceStatus = (att) => {
    if (!att) return 'no-data';
    if (att.status === 'present') return 'present';
    if (att.status === 'absent') return 'absent';
    return 'other';
  };

  return (
    <div className="attendance-calendar">
      <div className="calendar-header">
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}
        >
          ←
        </button>
        <h3>{currentMonth.format('MMMM YYYY')}</h3>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}
        >
          →
        </button>
      </div>
      <div className="calendar-grid">
        <div className="calendar-day-header">Sun</div>
        <div className="calendar-day-header">Mon</div>
        <div className="calendar-day-header">Tue</div>
        <div className="calendar-day-header">Wed</div>
        <div className="calendar-day-header">Thu</div>
        <div className="calendar-day-header">Fri</div>
        <div className="calendar-day-header">Sat</div>
        {days.map((day, idx) => {
          const att = getAttendanceForDate(day);
          const status = getAttendanceStatus(att);
          return (
            <div
              key={idx}
              className={`calendar-day ${status}`}
              title={att ? `${att.status} - ${att.hoursWorked || 0} hrs` : 'No data'}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color present"></div>
          <span>Present</span>
        </div>
        <div className="legend-item">
          <div className="legend-color absent"></div>
          <span>Absent</span>
        </div>
        <div className="legend-item">
          <div className="legend-color no-data"></div>
          <span>No Data</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;

