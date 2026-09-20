import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import {
    FiLogIn, FiLogOut, FiHome, FiCalendar, FiClock,
    FiCheckCircle, FiAlertCircle, FiUsers, FiX
} from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/attendance.css';

const MyAttendance = () => {
    const { user } = useAuth();
    const roleSlug = typeof user?.role === 'object' ? user?.role?.slug : user?.role;
    const isHrmAdmin = roleSlug === 'hrm_admin' || roleSlug === 'admin' || roleSlug === 'super_admin';
    const [attendance, setAttendance] = useState(null);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    // UI States
    const [initialLoading, setInitialLoading] = useState(true);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [checkingIn, setCheckingIn] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);

    // Filter
    const [dateFrom, setDateFrom] = useState(dayjs().subtract(30, 'days').format('YYYY-MM-DD'));
    const [dateTo, setDateTo] = useState(dayjs().format('YYYY-MM-DD'));

    // Timer States
    const [workDuration, setWorkDuration] = useState('00:00:00');

    useEffect(() => {
        const timer = setInterval(() => {
            const todayStr = dayjs().format('YYYY-MM-DD');
            const isCheckedIn = attendance && dayjs(attendance.date).isSame(todayStr, 'day');
            const isCheckedOut = isCheckedIn && attendance.checkOut;

            if (isCheckedIn && !isCheckedOut && attendance.checkIn) {
                // Calculate live duration
                const start = dayjs(attendance.checkIn);
                const now = dayjs();
                const diffMs = now.diff(start);

                if (diffMs > 0) {
                    const hrs = Math.floor(diffMs / 3600000);
                    const mins = Math.floor((diffMs % 3600000) / 60000);
                    const secs = Math.floor((diffMs % 60000) / 1000);
                    setWorkDuration(
                        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
                    );
                }
            } else if (isCheckedOut) {
                // Show final duration (static)
                // NOTE: If we have hoursWorked from backend, use it, else calculate from checkIn/checkOut
                if (attendance.hoursWorked) {
                    // Convert float hours to HH:mm:ss ? OR keep it simple
                    // Usually calculateDuration returns "X hrs" or "Xh Ym"
                    // Let's stick to the HH:mm:ss format for consistency in this display if possible,
                    // calculateDuration below uses diff.
                    const start = dayjs(attendance.checkIn);
                    const end = dayjs(attendance.checkOut);
                    const diffMs = end.diff(start);
                    const hrs = Math.floor(diffMs / 3600000);
                    const mins = Math.floor((diffMs % 3600000) / 60000);
                    const secs = Math.floor((diffMs % 60000) / 1000);
                    setWorkDuration(
                        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
                    );
                } else {
                    setWorkDuration("00:00:00");
                }
            } else {
                setWorkDuration("00:00:00");
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [attendance]);

    const init = async () => {
        setInitialLoading(true);
        try {
            await fetchTodayAttendance();
            await fetchHistory();
        } catch (e) {
            console.error(e);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => { init(); }, []);
    useEffect(() => { if (!initialLoading) fetchHistory(); }, [dateFrom, dateTo]);

    const fetchTodayAttendance = async () => {
        const today = dayjs().format('YYYY-MM-DD');
        const res = await employeeService.getAttendanceSelf({ startDate: today, endDate: today });
        if (res.data.success && res.data.data.length > 0) setAttendance(res.data.data[0]);
        else setAttendance(null);
    };

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await employeeService.getAttendanceSelf({ startDate: dateFrom, endDate: dateTo });
            if (res.data.success) {
                setAttendanceHistory(res.data.data.sort((a, b) => new Date(b.date) - new Date(a.date)));
            }
        } catch (e) { console.error(e); }
        finally { setLoadingHistory(false); }
    };

    const handleCheckIn = async (status = 'present') => {
        setCheckingIn(true);
        try {
            const payload = status === 'present' ? {} : { status };
            const res = await employeeService.checkInSelf(payload);
            if (res.data.success) {
                setAttendance(res.data.data);
                fetchHistory();
            }
        } catch (e) { alert(e.response?.data?.message || 'Check-in failed'); }
        finally { setCheckingIn(false); }
    };

    const handleCheckOut = async () => {
        setCheckingOut(true);
        try {
            const res = await employeeService.checkOutSelf({});
            if (res.data.success) {
                setAttendance(res.data.data);
                fetchHistory();
            }
        } catch (e) { alert(e.response?.data?.message || 'Check-out failed'); }
        finally { setCheckingOut(false); }
    };

    const todayStr = dayjs().format('YYYY-MM-DD');
    const isCheckedIn = attendance && dayjs(attendance.date).isSame(todayStr, 'day');
    const isCheckedOut = isCheckedIn && attendance.checkOut;

    const calculateDuration = (inTime, outTime, hoursWorked) => {
        if (hoursWorked) {
            // Convert decimal hours to h m s format
            const totalSeconds = Math.round(hoursWorked * 3600);
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            return `${hrs}h ${mins}m ${secs}s`;
        }
        if (inTime && outTime) {
            const diff = new Date(outTime) - new Date(inTime);
            const hrs = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            return `${hrs}h ${mins}m ${secs}s`;
        }
        return '-';
    };

    if (initialLoading) return <Loader />;

    return (
        <div className="attendance-list-page">

            {/* Header */}
            <div className="attendance-page-header">
                <div className="header-title-group">
                    <h1>My Attendance</h1>
                    <p>Track your daily check-ins and work hours</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Days */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCalendar />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {attendanceHistory.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Records
                        </div>
                    </div>
                </div>

                {/* Present */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {attendanceHistory.filter(a => a.status === 'present').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Present
                        </div>
                    </div>
                </div>

                {/* WFH */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiHome />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {attendanceHistory.filter(a => a.status === 'wfh').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Work From Home
                        </div>
                    </div>
                </div>

                {/* Absent */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiX />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {attendanceHistory.filter(a => a.status === 'absent').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Absent
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Stats Card (Redesigned) */}
            <div className="attendance-today-card fade-in">
                <div className="today-card-header">
                    <h3>Today's Activity</h3>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {dayjs().format('dddd, MMMM D, YYYY')}
                    </div>
                </div>

                <div className="today-card-body">
                    {/* Left: Status & Time */}
                    <div className="today-info-side">
                        <div>
                            <div className="live-time-display">
                                {attendance?.status === 'absent' ? '-' : workDuration}
                            </div>
                            <div className="current-date-display">
                                {isCheckedIn && attendance?.status === 'absent' ? 'Duration' :
                                    isCheckedIn && !isCheckedOut ? 'Working Duration' :
                                    isCheckedOut ? 'Total Duration' : 'Not Started'}
                            </div>
                        </div>

                        <div>
                            {isCheckedIn ? (
                                attendance.status === 'absent' ?
                                    <span className="status-badge-lg inactive" style={{ background: '#fef2f2', color: '#dc2626' }}>
                                        <FiX /> Marked Absent
                                    </span>
                                : isCheckedOut ?
                                    <span className="status-badge-lg active">
                                        <FiCheckCircle /> Completed for Day
                                    </span>
                                    :
                                    <span className="status-badge-lg active">
                                        <span className="status-dot-pulse"></span> Currently Working
                                    </span>
                            ) : (
                                <span className="status-badge-lg inactive">
                                    <FiAlertCircle /> Not Checked In
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="today-action-side">
                        {!isCheckedIn ? (
                            <>
                                <div className="action-instruction">Good Morning! Please select your work mode:</div>
                                <div className="action-buttons-grid">
                                    <button className="btn-action-lg success" onClick={() => handleCheckIn('present')} disabled={checkingIn}>
                                        <FiLogIn size={32} />
                                        <span>Office Check In</span>
                                    </button>
                                    <button className="btn-action-lg primary" onClick={() => handleCheckIn('wfh')} disabled={checkingIn}>
                                        <FiHome size={32} />
                                        <span>Work From Home</span>
                                    </button>
                                </div>
                                <div className="action-buttons-grid" style={{ marginTop: '16px' }}>
                                    <button className="btn-action-lg warning" onClick={() => handleCheckIn('half-day')} disabled={checkingIn}>
                                        <FiClock size={32} />
                                        <span>Half Day</span>
                                    </button>
                                    {isHrmAdmin ? (
                                        <button className="btn-action-lg error" onClick={() => handleCheckIn('absent')} disabled={checkingIn}>
                                            <FiX size={32} />
                                            <span>Absent</span>
                                        </button>
                                    ) : (
                                        <div style={{ flex: 1 }}></div>
                                    )}
                                </div>
                            </>
                        ) : attendance.status === 'absent' ? (
                            <div style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
                                <FiX size={48} color="#dc2626" style={{ marginBottom: '16px' }} />
                                <div>You have been marked absent for today.</div>
                            </div>
                        ) : !isCheckedOut ? (
                            <>
                                <div className="action-instruction">
                                    Checked In at <strong>{formatDate(attendance.checkIn, 'HH:mm')}</strong>
                                </div>
                                <div className="action-buttons-grid">
                                    <button className="btn-action-lg primary" onClick={handleCheckOut} disabled={checkingOut} style={{ width: '100%' }}>
                                        <FiLogOut size={32} />
                                        <span>Check Out</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
                                <FiCheckCircle size={48} color="var(--success)" style={{ marginBottom: '16px' }} />
                                <div>You have completed your work day.</div>
                                <div style={{ fontWeight: '600', marginTop: '8px' }}>
                                    Total Duration: {calculateDuration(attendance.checkIn, attendance.checkOut, attendance.hoursWorked)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="history-section fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="history-section-header">
                    <h3>My History</h3>
                    <div className="date-range-picker">
                        <FiCalendar color="var(--text-muted)" style={{ marginRight: '8px' }} />
                        <input type="date" className="date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        <span style={{ color: 'var(--border)', margin: '0 8px' }}>|</span>
                        <input type="date" className="date-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                    </div>
                </div>

                <div className="card-container">
                    <table className="modern-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Check In</th>
                                <th>Check Out</th>
                                <th>Total Hrs</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingHistory ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px' }}><Loader /></td></tr>
                            ) : attendanceHistory.length > 0 ? (
                                attendanceHistory.map(att => (
                                    <tr key={att._id}>
                                        <td>{formatDate(att.date)}</td>
                                        <td>{att.checkIn ? formatDate(att.checkIn, 'HH:mm') : '-'}</td>
                                        <td>{att.checkOut ? formatDate(att.checkOut, 'HH:mm') : '-'}</td>
                                        <td>{calculateDuration(att.checkIn, att.checkOut, att.hoursWorked)}</td>
                                        <td>
                                            <span className={`badge badge-${att.status === 'present' ? 'success' :
                                                att.status === 'wfh' ? 'info' :
                                                    att.status === 'absent' ? 'error' : 'warning'}`}>
                                                {att.status === 'wfh' ? 'WFH' : att.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No history found for allowed range.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyAttendance;
