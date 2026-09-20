import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiClock, FiLogIn, FiLogOut, FiCalendar, FiUsers, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiX, FiHome } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/attendance.css';

const Attendance = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [viewMode, setViewMode] = useState('my'); // 'my' or 'all'

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    department: '',
    dateFrom: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    dateTo: dayjs().format('YYYY-MM-DD')
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    department: '',
    dateFrom: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
    dateTo: dayjs().format('YYYY-MM-DD')
  });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const calculateDuration = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return '-';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end - start;

    if (diff < 0) return '-';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (!initialLoading) {
      if (viewMode === 'my') {
        fetchAttendance();
        fetchAttendanceHistory();
      } else if (viewMode === 'all' && (isAdmin || isSuperAdmin)) {
        fetchAllAttendance();
      }
    }
  }, [debouncedSearch, activeFilters, viewMode]);

  // Initial load
  useEffect(() => {
    if (viewMode === 'my') {
      fetchAttendance();
      fetchAttendanceHistory(true);
    } else if (viewMode === 'all' && (isAdmin || isSuperAdmin)) {
      fetchAllAttendance(true);
    }
  }, [employeeId, viewMode]);

  const fetchEmployee = async () => {
    try {
      setInitialLoading(true);
      const response = await employeeService.getEmployees();
      if (response.data.success && response.data.data.length > 0) {
        const userId = user?._id || user?.id;
        const userIdString = userId?.toString();

        const emp = response.data.data.find(e => {
          const empUserId = e.user?._id || e.user?.id;
          const empUserIdString = empUserId?.toString();
          return empUserIdString === userIdString ||
            (e.user && JSON.stringify(e.user._id || e.user.id) === JSON.stringify(userId));
        });

        if (emp) {
          setEmployeeId(emp._id);
        } else {
          if (isAdmin || isSuperAdmin) {
            console.warn('No employee record found for user.');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const response = await employeeService.getAttendanceSelf({
        startDate: today,
        endDate: today,
      });
      if (response.data.success && response.data.data.length > 0) {
        setAttendance(response.data.data[0]);
      } else {
        setAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
      if (error.response?.data?.message?.includes('Employee record not found')) {
        setAttendance(null);
      }
    }
  };

  const fetchAttendanceHistory = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const response = await employeeService.getAttendanceSelf({
        startDate: activeFilters.dateFrom,
        endDate: activeFilters.dateTo,
      });
      if (response.data.success) {
        setAttendanceHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      if (error.response?.data?.message?.includes('Employee record not found')) {
        setAttendanceHistory([]);
      }
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  };

  const fetchAllAttendance = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const response = await employeeService.getAllAttendance({
        startDate: activeFilters.dateFrom,
        endDate: activeFilters.dateTo,
      });
      if (response.data.success) {
        let attendanceData = response.data.data;

        // Apply department filter
        if (activeFilters.department) {
          attendanceData = attendanceData.filter(att => att.employee?.department === activeFilters.department);
        }

        // Apply search filter
        if (debouncedSearch) {
          const searchLower = debouncedSearch.toLowerCase();
          attendanceData = attendanceData.filter(att =>
            att.employee?.user?.name?.toLowerCase().includes(searchLower) ||
            att.employee?.employeeId?.toLowerCase().includes(searchLower)
          );
        }

        setAttendanceHistory(attendanceData);

        // Set today's attendance
        const today = dayjs().format('YYYY-MM-DD');
        const todayAttendance = attendanceData.find(
          (att) => att.date && dayjs(att.date).isSame(today, 'day')
        );
        if (todayAttendance && dayjs(todayAttendance.date).isSame(today, 'day')) {
          setAttendance(todayAttendance);
        } else {
          setAttendance(null);
        }
      }
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      alert(error.response?.data?.message || 'Error fetching all employees attendance');
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = {
      department: '',
      dateFrom: dayjs().subtract(7, 'days').format('YYYY-MM-DD'),
      dateTo: dayjs().format('YYYY-MM-DD')
    };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.department) count++;
    if (filterInputs.dateFrom !== dayjs().subtract(7, 'days').format('YYYY-MM-DD')) count++;
    if (filterInputs.dateTo !== dayjs().format('YYYY-MM-DD')) count++;
    return count;
  };

  const handleCheckIn = async (isWFH = false) => {
    try {
      setCheckingIn(true);
      const payload = isWFH ? { status: 'wfh' } : {};
      const response = await employeeService.checkInSelf(payload);
      if (response.data.success) {
        setAttendance(response.data.data);
        await fetchEmployee();
        await fetchAttendance();
        alert(isWFH ? 'Checked in for WFH successfully!' : 'Checked in successfully!');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error checking in';
      alert(errorMessage);
      if (errorMessage.includes('Employee record not found')) {
        await fetchEmployee();
      }
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setCheckingOut(true);
      const response = await employeeService.checkOutSelf({});
      if (response.data.success) {
        setAttendance(response.data.data);
        await fetchEmployee();
        await fetchAttendance();
        await fetchAttendanceHistory();
        alert(`Checked out successfully! Hours worked: ${response.data.data.hoursWorked || '0'} hrs`);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error checking out';
      alert(errorMessage);
      if (errorMessage.includes('Employee record not found')) {
        await fetchEmployee();
      }
    } finally {
      setCheckingOut(false);
    }
  };

  const today = dayjs().format('YYYY-MM-DD');
  const isCheckedIn = attendance && attendance.checkIn && dayjs(attendance.date).isSame(today, 'day');
  const isCheckedOut = attendance && attendance.checkOut && dayjs(attendance.date).isSame(today, 'day');

  return (
    <div className="attendance-list-page">
      {/* Header Row */}
      <div className="attendance-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {viewMode === 'my' ? 'Track your check-in and check-out' : 'View all employees attendance'}
          </p>
        </div>
        <div className="header-actions">
          {(isAdmin || isSuperAdmin) && (
            <>
              <button
                className={`btn ${viewMode === 'my' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setViewMode('my');
                  setAttendance(null);
                  setAttendanceHistory([]);
                }}
                style={{ minWidth: '120px' }}
              >
                <FiCalendar /> My Attendance
              </button>
              <button
                className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setViewMode('all');
                  setAttendance(null);
                  setAttendanceHistory([]);
                }}
                style={{ minWidth: '160px' }}
              >
                <FiUsers /> All Employees
              </button>
            </>
          )}
        </div>
      </div>

      {/* Today's Attendance Card - Only for "My Attendance" view */}
      {viewMode === 'my' && (
        <div className="attendance-today-card">
          <h3>Today's Attendance</h3>
          <p>{formatDate(new Date())}</p>

          {initialLoading ? (
            <Loader />
          ) : (
            <>
              {attendance && isCheckedIn ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Check In Time
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--success)' }}>
                      {formatDate(attendance.checkIn, 'HH:mm:ss')}
                    </div>
                  </div>
                  {attendance.checkOut ? (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Check Out Time
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--primary)' }}>
                        {formatDate(attendance.checkOut, 'HH:mm:ss')}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        Hours Worked
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 600 }}>
                        {attendance.hoursWorked || '0'} hrs
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', marginBottom: '24px' }}>
                  <p style={{ color: 'var(--text-muted)' }}>
                    No attendance record for today
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                {!isCheckedIn && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleCheckIn(false)}
                      disabled={checkingIn}
                      style={{ minWidth: '150px' }}
                    >
                      <FiLogIn /> {checkingIn ? 'Checking In...' : 'Check In'}
                    </button>
                    <button
                      className="btn"
                      onClick={() => handleCheckIn(true)}
                      disabled={checkingIn}
                      style={{
                        minWidth: '150px',
                        background: '#6366f1', // Indigo for WFH
                        color: 'white',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <FiHome /> {checkingIn ? 'Checking In...' : 'Remote'}
                    </button>
                  </>
                )}
                {isCheckedIn && !isCheckedOut && (
                  <button
                    className="btn btn-primary"
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                    style={{ minWidth: '150px' }}
                  >
                    <FiLogOut /> {checkingOut ? 'Checking Out...' : 'Check Out'}
                  </button>
                )}
              </div>

              {!employeeId && (
                <div style={{ marginTop: '16px', textAlign: 'center', padding: '12px', background: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
                  <p style={{ color: '#0c5460', margin: 0, fontSize: '13px' }}>
                    {(isAdmin || isSuperAdmin)
                      ? 'Note: If you don\'t have an employee record, the system will attempt to create one automatically.'
                      : 'Note: The system will automatically find or create your employee record when you check in.'}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        {/* 1. Main Toolbar Row */}
        <div style={{ padding: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

          {/* Left: Search & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {viewMode === 'all' && (
              <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name or employee ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}

            <button
              ref={buttonRef}
              className="btn"
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                justifyContent: 'center',
                background: showFilters ? '#eff6ff' : 'white',
                border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                color: showFilters ? '#2563eb' : '#374151',
                transition: 'all 0.2s'
              }}
            >
              <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
              <span style={{ fontWeight: 500 }}>Filters</span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              {(getActiveCount() > 0) && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {getActiveCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 2. Filter Panel (Absolute Overlay) */}
        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            width: '100%',
            background: '#f9fafb',
            padding: '24px',
            marginTop: '8px',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>

              {/* Department - Only for Admin/All view */}
              {viewMode === 'all' && (isAdmin || isSuperAdmin) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</label>
                  <div style={{ position: 'relative', width: '180px' }}>
                    <select
                      value={filterInputs.department}
                      onChange={(e) => setFilterInputs({ ...filterInputs, department: e.target.value })}
                      style={{
                        appearance: 'none',
                        width: '100%',
                        background: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        padding: '0 32px 0 12px',
                        fontSize: '13px',
                        color: '#374151',
                        height: '38px',
                        cursor: 'pointer',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        outline: 'none'
                      }}
                    >
                      <option value="">All Departments</option>
                      <option value="IT">IT</option>
                      <option value="HR">HR</option>
                      <option value="Finance">Finance</option>
                      <option value="Sales">Sales</option>
                      <option value="Management">Management</option>
                      <option value="Operations">Operations</option>
                    </select>
                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  </div>
                </div>
              )}

              {/* Date Range */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="date"
                    value={filterInputs.dateFrom}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                    style={{
                      width: '130px',
                      height: '38px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                  <span style={{ color: '#9ca3af', fontWeight: 500 }}>→</span>
                  <input
                    type="date"
                    value={filterInputs.dateTo}
                    onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                    style={{
                      width: '130px',
                      height: '38px',
                      background: 'white',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      padding: '0 12px',
                      fontSize: '13px',
                      color: '#374151',
                      outline: 'none',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={handleClearFilters}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6b7280',
                    background: 'transparent',
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    padding: '0 12px',
                    borderRadius: '6px',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#111827';
                    e.currentTarget.style.background = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#6b7280';
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  Clear All
                </button>
                <button
                  onClick={() => { handleApplyFilters(); setShowFilters(false); }}
                  style={{
                    background: '#2563eb', // Primary Blue
                    color: 'white',
                    border: 'none',
                    padding: '0 20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  Apply
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Visual Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

      {/* Content */}
      <div className="attendance-content-wrapper">
        {initialLoading ? <Loader /> : (
          <div className="table-container-responsive">
            <table className="table">
              <thead>
                <tr>
                  {viewMode === 'all' && <th>Name</th>}
                  {viewMode === 'all' && <th>Employee ID</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={viewMode === 'all' ? 7 : 5} style={{ textAlign: 'center', padding: '40px' }}>
                      <Loader />
                    </td>
                  </tr>
                )}
                {!loading && attendanceHistory.length > 0 ? (
                  attendanceHistory.map((att) => (
                    <tr key={att._id}>
                      {viewMode === 'all' && (
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="employee-avatar-table">
                              {att.employee?.user?.avatar ? (
                                <img src={att.employee.user.avatar} alt={att.employee?.user?.name || 'Employee'} />
                              ) : (
                                <span>{getInitials(att.employee?.user?.name)}</span>
                              )}
                            </div>
                            <span>{att.employee?.user?.name || 'N/A'}</span>
                          </div>
                        </td>
                      )}
                      {viewMode === 'all' && (
                        <td>{att.employee?.employeeId || 'N/A'}</td>
                      )}
                      <td>{formatDate(att.date)}</td>
                      <td>{att.checkIn ? formatDate(att.checkIn, 'HH:mm:ss') : '-'}</td>
                      <td>{att.checkOut ? formatDate(att.checkOut, 'HH:mm:ss') : '-'}</td>
                      <td>
                        {att.checkIn && att.checkOut
                          ? calculateDuration(att.checkIn, att.checkOut)
                          : att.hoursWorked
                            ? (() => {
                              const totalSeconds = Math.round(att.hoursWorked * 3600);
                              const hrs = Math.floor(totalSeconds / 3600);
                              const mins = Math.floor((totalSeconds % 3600) / 60);
                              const secs = totalSeconds % 60;
                              return `${hrs}h ${mins}m ${secs}s`;
                            })()
                            : '-'}
                      </td>
                      <td>
                        <span className={`badge badge-${att.status === 'present' ? 'success' : att.status === 'absent' ? 'error' : 'warning'}`}>
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : !loading && (
                  <tr>
                    <td colSpan={viewMode === 'all' ? 7 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
