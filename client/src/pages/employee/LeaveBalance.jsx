import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiCalendar, FiTrendingUp, FiTrendingDown, FiRefreshCw, FiBarChart2, FiInfo, FiAlertCircle, FiCheckCircle, FiClock, FiDownload, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/forms.css';
import '../../styles/finance/expenses.css';


const LeaveBalance = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveReports, setLeaveReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('balance');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedBalanceYear, setSelectedBalanceYear] = useState(new Date().getFullYear());
  const [reportLoading, setReportLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Fetch employee ID first
  useEffect(() => {
    fetchEmployee();
  }, []);

  useEffect(() => {
    if (employeeId) {
      fetchLeaveBalance();
    }
  }, [employeeId, selectedBalanceYear]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchLeaveReports();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getEmployees();
      if (response.data.success && response.data.data.length > 0) {
        // Find employee for current user
        const userId = user?._id || user?.id;
        const userIdString = userId?.toString();

        const emp = response.data.data.find(e => {
          const empUserId = e.user?._id || e.user?.id;
          const empUserIdString = empUserId?.toString();
          return empUserIdString === userIdString;
        });

        if (emp) {
          setEmployeeId(emp._id);
        } else {
          console.error('Employee record not found for current user');
        }
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!employeeId) {
      console.error('Employee ID is required');
      return;
    }

    try {
      setLoading(true);
      // Pass employeeId and year as params
      const params = selectedBalanceYear ? { year: selectedBalanceYear } : {};
      const response = await employeeService.getLeaveBalance(employeeId, params);
      if (response.data.success) {
        setLeaveBalance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      if (error.response?.status === 400) {
        console.error('Bad Request - Check if employee ID is valid');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaveReports = async () => {
    try {
      setReportLoading(true);
      const response = await employeeService.getLeaveReports({
        month: selectedMonth,
        year: selectedYear,
      });
      if (response.data.success) {
        setLeaveReports(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching leave reports:', error);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <Loader />;

  const getLeaveTypeColor = (type) => {
    const colors = {
      casual: 'info',
      sick: 'warning',
      annual: 'success',
      maternity: 'error',
      paternity: 'error',
      unpaid: 'secondary',
    };
    return colors[type] || 'secondary';
  };

  const getUsagePercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  // Calculate summary statistics
  const getSummaryStats = () => {
    if (!leaveBalance || !leaveBalance.balances) return null;

    const balances = leaveBalance.balances;
    let totalAvailable = 0;
    let totalUsed = 0;
    let totalPending = 0;
    let totalDays = 0;

    Object.keys(balances).forEach(type => {
      const balance = balances[type];
      totalAvailable += balance.available || 0;
      totalUsed += balance.used || 0;
      totalPending += balance.pending || 0;
      totalDays += balance.total || 0;
    });

    return {
      totalAvailable,
      totalUsed,
      totalPending,
      totalDays,
      utilizationPercent: totalDays > 0 ? Math.round((totalUsed / totalDays) * 100) : 0,
    };
  };

  // Calculate summary stats
  const summaryStats = leaveBalance ? getSummaryStats() : null;

  return (
    <div className="expense-list-page">
      {/* Header Row */}
      <div className="expenses-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Leave Balance & Reports</h1>
          <p className="page-subtitle">Track your leave balance and history</p>
        </div>
        <div className="header-actions">
          {/* Tabs moved to Header */}
          <div style={{ display: 'flex', gap: '8px', marginRight: '12px' }}>
            <button
              className={`btn ${activeTab === 'balance' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('balance')}
            >
              <FiBarChart2 /> Balance
            </button>
            <button
              className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('reports')}
            >
              <FiTrendingUp /> Reports
            </button>
          </div>

          {(isAdmin || isSuperAdmin) && activeTab === 'balance' && (
            <button
              className="btn btn-outline btn-sm"
              onClick={async () => {
                if (window.confirm('This will reset leave balances for the next year. Continue?')) {
                  try {
                    const response = await employeeService.resetLeaveBalance(leaveBalance.employee._id, {
                      year: leaveBalance.year + 1,
                    });
                    if (response.data.success) {
                      alert('Leave balance reset successfully for next year!');
                      fetchLeaveBalance();
                    }
                  } catch (error) {
                    alert(error.response?.data?.message || 'Error resetting leave balance');
                  }
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiRefreshCw /> Reset Next Year
            </button>
          )}

          <button
            ref={buttonRef}
            className="btn filter-btn-mobile"
            onClick={() => setShowFilters(!showFilters)}
            style={{
              display: 'none',
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
          </button>
        </div>
      </div>

      {/* Search Bar Section (Mobile) */}
      <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
        {activeTab === 'reports' && (
          <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        {/* 1. Main Toolbar Row (Desktop) */}
        <div className="toolbar-desktop">
          {/* Left: Search (Reports only) & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeTab === 'reports' && (
              <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search reports..."
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

              {/* Years (Balance & Reports) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {activeTab === 'balance' ? 'Balance Year' : 'Report Year'}
                </label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={activeTab === 'balance' ? selectedBalanceYear : selectedYear}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (activeTab === 'balance') setSelectedBalanceYear(val);
                      else setSelectedYear(val);
                    }}
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
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Month (Reports Only) */}
              {activeTab === 'reports' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Month</label>
                  <div style={{ position: 'relative', width: '180px' }}>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
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
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                        <option key={m} value={m}>
                          {dayjs().month(m - 1).format('MMMM')}
                        </option>
                      ))}
                    </select>
                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visual Divider */}
      <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

      <div className="page-content">

        {/* Leave Balance Tab */}
        {activeTab === 'balance' && leaveBalance && (
          <div>
            {/* Summary Statistics */}
            {summaryStats && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
                marginBottom: '32px'
              }}>
                <div className="card" style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)',
                  border: 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Available</span>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiCheckCircle size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 700, lineHeight: 1, marginBottom: '8px' }}>
                    {summaryStats.totalAvailable}
                  </div>
                  <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 500 }}>days remaining</div>
                </div>

                <div className="card" style={{
                  padding: '24px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Used</span>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiTrendingUp style={{ color: '#3b82f6' }} size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#3b82f6', lineHeight: 1, marginBottom: '8px' }}>
                    {summaryStats.totalUsed}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                    {summaryStats.utilizationPercent}% of total
                  </div>
                </div>

                {summaryStats.totalPending > 0 && (
                  <div className="card" style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    border: '2px solid #f59e0b',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '13px', color: '#92400e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Requests</span>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <FiClock style={{ color: '#f59e0b' }} size={20} />
                      </div>
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 700, color: '#f59e0b', lineHeight: 1, marginBottom: '8px' }}>
                      {summaryStats.totalPending}
                    </div>
                    <div style={{ fontSize: '13px', color: '#92400e', fontWeight: 500 }}>days pending</div>
                  </div>
                )}

                <div className="card" style={{
                  padding: '24px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Allocation</span>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FiCalendar style={{ color: '#6366f1' }} size={20} />
                    </div>
                  </div>
                  <div style={{ fontSize: '36px', fontWeight: 700, color: '#6366f1', lineHeight: 1, marginBottom: '8px' }}>
                    {summaryStats.totalDays}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                    days per year
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{
              marginBottom: '24px',
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              <div className="card-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                padding: '24px',
                background: '#fafbfc',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div>
                  <h3 className="card-title" style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#111827' }}>Leave Balance</h3>
                  <p className="card-subtitle" style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>Available leave days by type</p>
                </div>
              </div>


              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                  {Object.keys(leaveBalance.balances)
                    .filter(type => leaveBalance.balances[type].total > 0) // Only show leave types with allocation
                    .map((leaveType) => {
                      const balance = leaveBalance.balances[leaveType];
                      const usagePercent = getUsagePercentage(balance.used, balance.total);
                      const availablePercent = balance.total > 0 ? Math.round((balance.available / balance.total) * 100) : 0;
                      const isLow = balance.available < balance.total * 0.2 && balance.total > 0;
                      const isEmpty = balance.available === 0 && balance.total > 0;

                      return (
                        <div
                          key={leaveType}
                          className="card"
                          style={{
                            padding: '24px',
                            background: isEmpty ? '#fef2f2' : isLow ? '#fffbeb' : 'white',
                            border: isEmpty ? '2px solid #ef4444' : isLow ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                            borderRadius: '12px',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.05)';
                          }}
                        >
                          {/* Warning Indicator */}
                          {(isEmpty || isLow) && (
                            <div style={{
                              position: 'absolute',
                              top: '12px',
                              right: '12px',
                              background: isEmpty ? 'var(--error)' : 'var(--warning)',
                              borderRadius: '50%',
                              width: '24px',
                              height: '24px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white'
                            }}>
                              <FiAlertCircle size={14} />
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                            <div>
                              <h4 style={{ margin: 0, textTransform: 'capitalize', fontSize: '18px', fontWeight: 600, marginBottom: '4px' }}>
                                {leaveType} Leave
                              </h4>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                {leaveBalance.year} Allocation
                              </span>
                            </div>
                            <span className={`badge badge-${getLeaveTypeColor(leaveType)}`} style={{ fontSize: '13px', padding: '6px 12px' }}>
                              {balance.total} days
                            </span>
                          </div>

                          {/* Circular Progress Indicator */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                              <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="34"
                                  stroke="var(--border)"
                                  strokeWidth="6"
                                  fill="none"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="34"
                                  stroke={isEmpty ? 'var(--error)' : isLow ? 'var(--warning)' : 'var(--success)'}
                                  strokeWidth="6"
                                  fill="none"
                                  strokeDasharray={`${2 * Math.PI * 34}`}
                                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - availablePercent / 100)}`}
                                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                              </svg>
                              <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center'
                              }}>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: isEmpty ? 'var(--error)' : isLow ? 'var(--warning)' : 'var(--success)' }}>
                                  {availablePercent}%
                                </div>
                              </div>
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FiCheckCircle size={14} style={{ color: 'var(--success)' }} />
                                  Available
                                </span>
                                <strong style={{ fontSize: '18px', color: isEmpty ? 'var(--error)' : 'var(--success)', fontWeight: 600 }}>
                                  {balance.available} days
                                </strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <FiTrendingUp size={14} style={{ color: 'var(--info)' }} />
                                  Used
                                </span>
                                <span style={{ fontSize: '16px', fontWeight: 500 }}>{balance.used} days</span>
                              </div>
                              {balance.pending > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiClock size={14} style={{ color: 'var(--warning)' }} />
                                    Pending
                                  </span>
                                  <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--warning)' }}>{balance.pending} days</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Progress Bar */}
                          {balance.total > 0 && (
                            <div style={{ marginTop: '16px' }}>
                              <div style={{
                                width: '100%',
                                height: '10px',
                                background: 'var(--border)',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <div
                                  style={{
                                    width: `${usagePercent}%`,
                                    height: '100%',
                                    background: isEmpty ? 'var(--error)' : isLow ? 'var(--warning)' : 'var(--primary)',
                                    transition: 'width 0.5s ease',
                                    borderRadius: '6px'
                                  }}
                                />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                <span>{usagePercent}% utilized</span>
                                <span>{balance.total - balance.used - balance.pending} days remaining</span>
                              </div>
                            </div>
                          )}

                          {/* Low Balance Alert */}
                          {isLow && !isEmpty && (
                            <div style={{
                              marginTop: '16px',
                              padding: '12px',
                              background: 'var(--warning-light)',
                              borderRadius: '8px',
                              border: '1px solid var(--warning)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: 'var(--warning-text)'
                            }}>
                              <FiAlertCircle />
                              <span>Low balance warning: Less than 20% remaining</span>
                            </div>
                          )}

                          {isEmpty && (
                            <div style={{
                              marginTop: '16px',
                              padding: '12px',
                              background: 'var(--error-light)',
                              borderRadius: '8px',
                              border: '1px solid var(--error)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: 'var(--error-text)'
                            }}>
                              <FiAlertCircle />
                              <span>No available balance remaining</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">Leave Reports</h3>
              </div>

              {reportLoading ? (
                <Loader />
              ) : leaveReports ? (
                <>
                  {/* Statistics */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Requests</div>
                      <div style={{ fontSize: '24px', fontWeight: 600 }}>{leaveReports.stats.total}</div>
                    </div>
                    <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Approved</div>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--success)' }}>{leaveReports.stats.approved}</div>
                    </div>
                    <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Pending</div>
                      <div style={{ fontSize: '24px', fontWeight: 600, color: 'var(--warning)' }}>{leaveReports.stats.pending}</div>
                    </div>
                    <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Days</div>
                      <div style={{ fontSize: '24px', fontWeight: 600 }}>{leaveReports.stats.totalDays}</div>
                    </div>
                  </div>

                  {/* Leave Type Breakdown */}
                  <div className="card" style={{ marginBottom: '24px' }}>
                    <h4 style={{ marginBottom: '16px' }}>Leave Type Breakdown</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                      {Object.keys(leaveReports.stats.byType).map(type => (
                        <div key={type} style={{ padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {type}
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            {leaveReports.stats.byType[type]} days
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Leave History */}
                  <div className="card">
                    <h4 style={{ marginBottom: '16px' }}>Leave History</h4>
                    <table className="table">
                      <thead>
                        <tr>
                          {(isAdmin || isSuperAdmin) && <th>Name</th>}
                          {(isAdmin || isSuperAdmin) && <th>Employee ID</th>}
                          <th>Type</th>
                          <th>Start Date</th>
                          <th>End Date</th>
                          <th>Days</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaveReports.leaves.length > 0 ? (
                          leaveReports.leaves
                            .filter(leave => {
                              if (!searchQuery) return true;
                              const query = searchQuery.toLowerCase();
                              return (
                                leave.type?.toLowerCase().includes(query) ||
                                leave.status?.toLowerCase().includes(query) ||
                                (leave.employee?.user?.name && leave.employee.user.name.toLowerCase().includes(query)) ||
                                (leave.employee?.employeeId && leave.employee.employeeId.toLowerCase().includes(query))
                              );
                            })
                            .map((leave) => (
                              <tr key={leave._id}>
                                {(isAdmin || isSuperAdmin) && (
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div className="employee-avatar-table">
                                        {leave.employee?.user?.avatar ? (
                                          <img src={leave.employee.user.avatar} alt={leave.employee?.user?.name || 'Employee'} />
                                        ) : (
                                          <span>{getInitials(leave.employee?.user?.name)}</span>
                                        )}
                                      </div>
                                      <span>{leave.employee?.user?.name || 'N/A'}</span>
                                    </div>
                                  </td>
                                )}
                                {(isAdmin || isSuperAdmin) && (
                                  <td>{leave.employee?.employeeId || 'N/A'}</td>
                                )}
                                <td style={{ textTransform: 'capitalize' }}>{leave.type}</td>
                                <td>{formatDate(leave.startDate)}</td>
                                <td>{formatDate(leave.endDate)}</td>
                                <td>{leave.days} day(s)</td>
                                <td>
                                  <span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'error' : 'warning'}`}>
                                    {leave.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={(isAdmin || isSuperAdmin) ? 7 : 5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                              No leave records found for this month
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Team Overview (Admin Only) */}
                  {(isAdmin || isSuperAdmin) && leaveReports.teamOverview && (
                    <div className="card" style={{ marginTop: '24px' }}>
                      <h4 style={{ marginBottom: '16px' }}>Team Overview</h4>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Employee ID</th>
                            <th>Department</th>
                            <th>Casual</th>
                            <th>Sick</th>
                            <th>Annual</th>
                            <th>Days This Month</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveReports.teamOverview.length > 0 ? (
                            leaveReports.teamOverview.map((item) => (
                              <tr key={item.employee._id}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="employee-avatar-table">
                                      {item.employee?.user?.avatar ? (
                                        <img src={item.employee.user.avatar} alt={item.employee?.name || 'Employee'} />
                                      ) : (
                                        <span>{getInitials(item.employee?.name || item.employee?.user?.name)}</span>
                                      )}
                                    </div>
                                    <span>{item.employee?.name || item.employee?.user?.name || item.employee?.employeeId || 'N/A'}</span>
                                  </div>
                                </td>
                                <td>{item.employee?.employeeId || 'N/A'}</td>
                                <td>{item.employee.department}</td>
                                <td>
                                  {item.balance?.casual?.available || 0} / {item.balance?.casual?.total || 0}
                                </td>
                                <td>
                                  {item.balance?.sick?.available || 0} / {item.balance?.sick?.total || 0}
                                </td>
                                <td>
                                  {item.balance?.annual?.available || 0} / {item.balance?.annual?.total || 0}
                                </td>
                                <td>{item.daysThisMonth} days</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                No team data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No reports available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalance;

