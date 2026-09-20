import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiTarget, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useRef } from 'react';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/performance.css';

const GoalsList = () => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: '', type: '', search: '' });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    if (initialLoading) return; // Skip if initial load hasn't completed
    const timeout = setTimeout(() => {
      fetchGoals(false);
    }, filters.search ? 500 : 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, filters]);

  // Initial load
  useEffect(() => {
    fetchGoals(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGoals = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      const params = { page: pagination.page, limit: pagination.limit, ...filters };
      const res = await hrmService.getGoals(params);
      if (res.data.success) {
        setGoals(res.data.data || []);
        setPagination({
          ...pagination,
          total: res.data.total || 0,
          pages: res.data.pages || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      if (isInitialLoad) {
        setInitialLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  return (
    <div className="goals-list-page fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Goals & OKRs</h1>
          <p className="page-subtitle">Track performance goals and objectives</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/hrm/performance/goals/new')}>
          <FiPlus /> Create Goal
        </button>
      </div>

      {/* Toolbar Container - Relative for Filter Panel positioning */}
      <div style={{ position: 'relative', zIndex: 50, marginBottom: '24px' }}>
        {/* 1. Main Toolbar Row */}
        <div style={{ padding: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid #e5e7eb' }}>

          {/* Left: Search & Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="toolbar-search" style={{ margin: 0, width: '280px', display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 12px', height: '38px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <FiSearch style={{ color: '#9ca3af', marginRight: '8px' }} />
              <input
                type="text"
                placeholder="Search goals..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
                disabled={loading}
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', color: '#111827' }}
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
                transition: 'all 0.2s',
                height: '38px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
              <span style={{ fontWeight: 500 }}>Filters</span>
              {showFilters ? <FiChevronUp /> : <FiChevronDown />}
              {(filters.status || filters.type) && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 700
                }}>
                  {(filters.status ? 1 : 0) + (filters.type ? 1 : 0)}
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

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    disabled={loading}
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
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="assigned">Assigned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="achieved">Achieved</option>
                    <option value="not-achieved">Not Achieved</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                    disabled={loading}
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
                    <option value="">All Types</option>
                    <option value="kpi">KPI</option>
                    <option value="okr">OKR</option>
                    <option value="goal">Goal</option>
                    <option value="project">Project</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                <button
                  onClick={() => setFilters({ ...filters, status: '', type: '', search: '' })}
                  disabled={loading}
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
                  onClick={() => setShowFilters(false)}
                  disabled={loading}
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
                  Done
                </button>
              </div>

            </div>
          </div>
        )}
      </div>

      {initialLoading ? (
        <Loader />
      ) : (
        <div className="page-content">
          <div style={{ position: 'relative' }}>
            {loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                borderRadius: '8px',
                minHeight: '200px'
              }}>
                <Loader />
              </div>
            )}
            {!loading && (
              <div className="goals-grid">
                {goals.length > 0 ? (
                  goals.map((goal) => (
                    <div key={goal._id} className="goal-card" onClick={() => navigate(`/hrm/performance/goals/${goal._id}`)}>
                      <div className="goal-card-header">
                        <h3>{goal.title}</h3>
                        <span className={`status-badge status-${goal.status}`}>{goal.status}</span>
                      </div>
                      <div className="goal-card-body">
                        <p>{goal.description}</p>
                        <div className="goal-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${goal.progress}%` }}></div>
                          </div>
                          <span>{goal.progress}%</span>
                        </div>
                        <div className="goal-meta">
                          <span><strong>Type:</strong> {goal.type}</span>
                          <span><strong>Target:</strong> {formatDate(goal.targetDate)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <FiTarget size={48} />
                    <p>No goals found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsList;

