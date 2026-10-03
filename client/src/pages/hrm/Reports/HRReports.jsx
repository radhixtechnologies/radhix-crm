import { useState, useEffect, useCallback } from 'react';
import { FiBarChart2, FiUsers, FiTrendingDown, FiTrendingUp, FiCalendar, FiSearch, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useRef } from 'react';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/employee/timesheets.css';

const HRReports = () => {
  const [reportData, setReportData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    reportType: 'headcount',
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    department: ''
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    reportType: 'headcount',
    from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
    department: ''
  });

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReport = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      let res;
      const params = {
        from: activeFilters.from,
        to: activeFilters.to,
        department: activeFilters.department
      };

      switch (activeFilters.reportType) {
        case 'headcount':
          res = await hrmService.getHeadcountReport(params);
          break;
        case 'attrition':
          res = await hrmService.getAttritionReport(params);
          break;
        case 'attendance':
          res = await hrmService.getAttendanceReport(params);
          break;
        case 'leave':
          res = await hrmService.getLeaveReport(params);
          break;
        case 'hiring':
          res = await hrmService.getHiringFunnelReport(params);
          break;
        default:
          return;
      }

      if (res.data.success) {
        setReportData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [activeFilters]);

  // Initial load
  useEffect(() => {
    fetchReport(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Active Filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchReport(false);
    }
  }, [activeFilters, fetchReport, initialLoading]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = {
      reportType: 'headcount',
      from: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
      to: new Date().toISOString().split('T')[0],
      department: ''
    };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.department) count++;
    if (filterInputs.from !== new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]) count++;
    if (filterInputs.to !== new Date().toISOString().split('T')[0]) count++;
    return count;
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="timesheets-list-page">
      {/* Header Row */}
      <div className="timesheets-page-header">
        <div className="header-title-group">
          <h1 className="page-title">HR Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive HR insights and metrics</p>
        </div>
        <div className="header-actions">
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

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Headcount */}
        <div
          onClick={() => { setFilterInputs({ ...filterInputs, reportType: 'headcount' }); setActiveFilters({ ...activeFilters, reportType: 'headcount' }); }}
          style={{
            background: activeFilters.reportType === 'headcount' ? '#eff6ff' : 'white',
            border: activeFilters.reportType === 'headcount' ? '2px solid #3b82f6' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
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
            <FiUsers />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Headcount
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Employee stats
            </div>
          </div>
        </div>

        {/* Attrition */}
        <div
          onClick={() => { setFilterInputs({ ...filterInputs, reportType: 'attrition' }); setActiveFilters({ ...activeFilters, reportType: 'attrition' }); }}
          style={{
            background: activeFilters.reportType === 'attrition' ? '#fef2f2' : 'white',
            border: activeFilters.reportType === 'attrition' ? '2px solid #ef4444' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
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
            <FiTrendingDown />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Attrition
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Turnover rates
            </div>
          </div>
        </div>

        {/* Attendance */}
        <div
          onClick={() => { setFilterInputs({ ...filterInputs, reportType: 'attendance' }); setActiveFilters({ ...activeFilters, reportType: 'attendance' }); }}
          style={{
            background: activeFilters.reportType === 'attendance' ? '#f5f3ff' : 'white',
            border: activeFilters.reportType === 'attendance' ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
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
            <FiCalendar />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Attendance
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Time tracking
            </div>
          </div>
        </div>

        {/* Hiring */}
        <div
          onClick={() => { setFilterInputs({ ...filterInputs, reportType: 'hiring' }); setActiveFilters({ ...activeFilters, reportType: 'hiring' }); }}
          style={{
            background: activeFilters.reportType === 'hiring' ? '#f0fdf4' : 'white',
            border: activeFilters.reportType === 'hiring' ? '2px solid #22c55e' : '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
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
            <FiTrendingUp />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
              Hiring
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              Funnel metrics
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar Section (Mobile) */}
      <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
        <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        {/* 1. Main Toolbar Row (Desktop) */}
        <div className="toolbar-desktop">
          {/* Left: Search & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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

              {/* Report Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report Type</label>
                <div style={{ position: 'relative', width: '200px' }}>
                  <select
                    value={filterInputs.reportType}
                    onChange={(e) => setFilterInputs({ ...filterInputs, reportType: e.target.value })}
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
                    <option value="headcount">Headcount Report</option>
                    <option value="attrition">Attrition Report</option>
                    <option value="attendance">Attendance Report</option>
                    <option value="leave">Leave Report</option>
                    <option value="hiring">Hiring Funnel Report</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Department */}
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
                    <option value="Marketing">Marketing</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Date Range */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 12px', height: '38px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <input
                    type="date"
                    value={filterInputs.from}
                    onChange={(e) => setFilterInputs({ ...filterInputs, from: e.target.value })}
                    style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent' }}
                  />
                  <span style={{ color: '#9ca3af' }}>→</span>
                  <input
                    type="date"
                    value={filterInputs.to}
                    onChange={(e) => setFilterInputs({ ...filterInputs, to: e.target.value })}
                    style={{ border: 'none', outline: 'none', fontSize: '13px', color: '#374151', background: 'transparent' }}
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

      {/* Content */}
      <div>
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>}

        {!reportData ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FiBarChart2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No report data available</h3>
            <p style={{ color: 'var(--text-muted)' }}>Select filters and generate a report</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Headcount Report */}
            {activeFilters.reportType === 'headcount' && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUsers style={{ color: '#2563eb' }} />
                  Headcount Report
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{reportData.total || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Employees</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{reportData.active || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Active</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{reportData.onboarding || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Onboarding</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{reportData.terminated || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Terminated</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attrition Report */}
            {activeFilters.reportType === 'attrition' && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiTrendingDown style={{ color: '#ef4444' }} />
                  Attrition Report
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{reportData.totalExited || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Exited</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{reportData.attritionRate || 0}%</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Attrition Rate</div>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Report */}
            {activeFilters.reportType === 'attendance' && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCalendar style={{ color: '#8b5cf6' }} />
                  Attendance Report
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{reportData.totalPresent || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Present Days</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{reportData.totalAbsent || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Absent Days</div>
                  </div>
                  <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>{reportData.averageHours || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Avg Hours/Day</div>
                  </div>
                </div>
              </div>
            )}

            {/* Leave Report */}
            {activeFilters.reportType === 'leave' && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiBarChart2 style={{ color: '#f59e0b' }} />
                  Leave Report
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{reportData.totalRequests || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Requests</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{reportData.approved || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Approved</div>
                  </div>
                  <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>{reportData.totalDays || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Days</div>
                  </div>
                </div>
              </div>
            )}

            {/* Hiring Funnel Report */}
            {activeFilters.reportType === 'hiring' && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiTrendingUp style={{ color: '#10b981' }} />
                  Hiring Funnel Report
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{reportData.totalJobs || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Jobs</div>
                  </div>
                  <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>{reportData.totalApplications || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Applications</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{reportData.byStatus?.hired || 0}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Hired</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{reportData.conversionRate?.overall || 0}%</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Conversion Rate</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRReports;
