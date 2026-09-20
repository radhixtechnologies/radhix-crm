import { useEffect, useState, useCallback } from 'react';
import { FiBarChart2, FiUsers, FiTrendingUp, FiCalendar, FiAward, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useRef } from 'react';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/employee/timesheets.css';

const HRAnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    period: 'month'
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    period: 'month'
  });

  const fetchData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const res = await hrmService.getHRAnalyticsDashboard({ period: activeFilters.period });
      setData(res.data.data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [activeFilters]);

  // Initial load
  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Active Filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchData(false);
    }
  }, [activeFilters, fetchData, initialLoading]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = { period: 'month' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
  };

  const getActiveCount = () => {
    return filterInputs.period !== 'month' ? 1 : 0;
  };

  if (error) {
    return (
      <div className="timesheets-list-page">
        <div className="timesheets-page-header">
          <div className="header-title-group">
            <h1 className="page-title">HR Analytics</h1>
            <p className="page-subtitle" style={{ color: '#ef4444' }}>Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (initialLoading) return <Loader />;

  return (
    <div className="timesheets-list-page">
      {/* Header Row */}
      <div className="timesheets-page-header">
        <div className="header-title-group">
          <h1 className="page-title">HR Analytics</h1>
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
        {/* Total Employees */}
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
            <FiUsers />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {data?.summary?.totalEmployees || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Total Employees
            </div>
          </div>
        </div>

        {/* Active Jobs */}
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
            <FiTrendingUp />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {data?.summary?.activeJobs || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Active Jobs
            </div>
          </div>
        </div>

        {/* Pending Interviews */}
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
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
              {data?.summary?.pendingInterviews || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Pending Interviews
            </div>
          </div>
        </div>

        {/* Onboarding */}
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
            <FiAward />
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
              {data?.summary?.onboardingEmployees || 0}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
              Onboarding
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50 }}>
        {/* 1. Main Toolbar Row (Desktop) */}
        <div className="toolbar-desktop" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {/* Right: Filter Toggle */}
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

        {/* 2. Filter Panel (Absolute Overlay) */}
        {showFilters && (
          <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
            position: 'absolute',
            top: '100%',
            right: '0',
            width: '300px',
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

              {/* Period */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time Period</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    value={filterInputs.period}
                    onChange={(e) => setFilterInputs({ ...filterInputs, period: e.target.value })}
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
                    <option value="week">Last 7 days</option>
                    <option value="month">This month</option>
                    <option value="quarter">This quarter</option>
                    <option value="year">This year</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', height: '38px', marginTop: '8px' }}>
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
                  Reset
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

        {!data ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FiBarChart2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No analytics available</h3>
            <p style={{ color: 'var(--text-muted)' }}>Select a period to view analytics</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Summary Stats */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{data.summary?.totalEmployees || 0}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Employees</div>
                </div>
                <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb' }}>{data.summary?.activeJobs || 0}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Active Jobs</div>
                </div>
                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{data.summary?.pendingInterviews || 0}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Pending Interviews</div>
                </div>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{data.summary?.onboardingEmployees || 0}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Onboarding</div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Headcount Trend */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiTrendingUp style={{ color: '#2563eb' }} />
                  Headcount Trend (12 months)
                </h2>
                <div className="table-container-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.headcountTrend?.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r.month}</td>
                          <td>{r.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Distribution */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUsers style={{ color: '#8b5cf6' }} />
                  Departments
                </h2>
                <div className="table-container-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th>Employees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.departmentDistribution || {}).map(([dept, count]) => (
                        <tr key={dept}>
                          <td>{dept}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Hiring Funnel */}
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBarChart2 style={{ color: '#10b981' }} />
                Hiring Funnel (30d)
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{data.hiringFunnel?.jobsPosted || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Jobs Posted</div>
                </div>
                <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{data.hiringFunnel?.applicationsReceived || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Applications</div>
                </div>
                <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{data.hiringFunnel?.interviews || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Interviews</div>
                </div>
                <div style={{ padding: '16px', background: '#e0e7ff', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#6366f1' }}>{data.hiringFunnel?.offers || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Offers</div>
                </div>
                <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{data.hiringFunnel?.hired || 0}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Hired</div>
                </div>
              </div>
            </div>

            {/* Two Column Layout - Performance & Exit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Performance Statistics */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiAward style={{ color: '#f59e0b' }} />
                  Performance Statistics
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{data.performanceStats?.totalReviews || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Reviews</div>
                  </div>
                  <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{data.performanceStats?.averageRating || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg Rating (out of 5)</div>
                  </div>
                </div>
                {data.performanceStats?.ratingDistribution && (
                  <div className="table-container-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Rating</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.performanceStats.ratingDistribution).reverse().map(([rating, count]) => (
                          <tr key={rating}>
                            <td>{rating} ⭐</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Exit Statistics */}
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUsers style={{ color: '#ef4444' }} />
                  Exit Statistics
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{data.exitStats?.total || 0}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total</div>
                  </div>
                  <div style={{ padding: '12px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#10b981' }}>{data.exitStats?.approved || 0}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Approved</div>
                  </div>
                  <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '700', color: '#f59e0b' }}>{data.exitStats?.pending || 0}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pending</div>
                  </div>
                </div>
                {data.exitStats?.byReason && Object.keys(data.exitStats.byReason).length > 0 && (
                  <div className="table-container-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Reason</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(data.exitStats.byReason).map(([reason, count]) => (
                          <tr key={reason}>
                            <td>{reason.replace('_', ' ').toUpperCase()}</td>
                            <td>{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Summary */}
            {data.attendanceStats && (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCalendar style={{ color: '#2563eb' }} />
                  Attendance Summary
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
                  <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{data.attendanceStats.totalDays || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Total Days</div>
                  </div>
                  <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{data.attendanceStats.present || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Present</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#ef4444' }}>{data.attendanceStats.absent || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Absent</div>
                  </div>
                  <div style={{ padding: '16px', background: '#fef3c7', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#f59e0b' }}>{data.attendanceStats.leave || 0}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Leave</div>
                  </div>
                  {data.attendanceStats.averageHours && (
                    <div style={{ padding: '16px', background: '#dbeafe', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#2563eb' }}>{data.attendanceStats.averageHours}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Avg Hours/Day</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRAnalyticsDashboard;
