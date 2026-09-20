import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FiSearch, FiBookOpen, FiUsers, FiCalendar, FiCheckCircle, FiClock, FiFilter, FiChevronDown, FiChevronUp, FiX, FiPlus } from 'react-icons/fi';
import { useRef } from 'react';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/employee/employees.css';

const TrainingCatalog = () => {
  const navigate = useNavigate();
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [allTrainings, setAllTrainings] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    category: '',
    type: '',
    status: '',
    sortBy: 'newest'
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    type: '',
    status: '',
    sortBy: 'newest'
  });

  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });

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

  const fetchTrainings = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      let res;
      if (isAdmin || isSuperAdmin) {
        res = await hrmService.getTrainings();
      } else {
        res = await hrmService.getTrainingCatalog();
      }

      if (res.data.success) {
        const data = res.data.data || [];
        setAllTrainings(data);

        // Apply client-side filtering
        let filtered = [...data];

        // Apply search
        if (debouncedSearch) {
          const searchLower = debouncedSearch.toLowerCase();
          filtered = filtered.filter(t =>
            t.title?.toLowerCase().includes(searchLower) ||
            t.description?.toLowerCase().includes(searchLower) ||
            t.category?.toLowerCase().includes(searchLower)
          );
        }

        // Apply active filters
        if (activeFilters.category) {
          filtered = filtered.filter(t => t.category === activeFilters.category);
        }
        if (activeFilters.type) {
          filtered = filtered.filter(t => t.type === activeFilters.type);
        }
        if (activeFilters.status) {
          filtered = filtered.filter(t => t.status === activeFilters.status);
        }

        setTrainings(filtered);
      }
    } catch (error) {
      console.error('Error fetching trainings:', error);
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [debouncedSearch, activeFilters, isAdmin, isSuperAdmin]);

  // Initial load
  useEffect(() => {
    fetchTrainings(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Debounced Search OR Active Filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchTrainings(false);
    }
  }, [debouncedSearch, activeFilters, fetchTrainings, initialLoading]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = { category: '', type: '', status: '', sortBy: 'newest' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.category) count++;
    if (filterInputs.type) count++;
    if (filterInputs.status) count++;
    return count;
  };

  const handleEnroll = async (trainingId) => {
    try {
      console.log('[ENROLL] Starting enrollment process...');
      console.log('[ENROLL] Training ID:', trainingId);
      console.log('[ENROLL] User object:', user);
      console.log('[ENROLL] User ID:', user?._id);

      const response = await hrmService.enrollInTraining(trainingId, { employeeId: user._id });

      console.log('[ENROLL] Response:', response);

      alert('Enrolled successfully!');
      fetchTrainings();
    } catch (error) {
      console.error('[ENROLL] Enrollment error:', error);
      console.error('[ENROLL] Error response:', error.response);
      alert(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleCreateTraining = async () => {
    try {
      const defaultTraining = {
        title: 'New Training Program',
        description: 'Description of the new training program.',
        category: 'technical',
        type: 'internal',
        status: 'draft',
        modules: []
      };

      const res = await hrmService.createTraining(defaultTraining);
      if (res.data.success) {
        navigate(`/hrm/training/${res.data.data._id}`);
      }
    } catch (error) {
      console.error('Failed to create training:', error);
      alert('Failed to create training');
    }
  };

  // Calculate stats
  const stats = {
    total: allTrainings.length,
    scheduled: allTrainings.filter(t => t.status === 'scheduled').length,
    inProgress: allTrainings.filter(t => t.status === 'in-progress').length,
    completed: allTrainings.filter(t => t.status === 'completed').length,
  };

  if (initialLoading) return <Loader />;

  return (
    <div className="employee-list-page">
      {/* Header Row */}
      <div className="employee-page-header">
        <div className="header-title-group">
          <h1 className="page-title">Training Catalog</h1>
          <p className="page-subtitle">Browse and enroll in training programs</p>
        </div>
        <div className="header-actions">
          {(isAdmin || isSuperAdmin) && (
            <button
              className="btn btn-primary"
              onClick={handleCreateTraining}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FiPlus /> Create Training
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiBookOpen style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.total}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Trainings</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiClock style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.scheduled}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Scheduled</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiUsers style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.inProgress}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>In Progress</div>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FiCheckCircle style={{ color: 'white', width: '20px', height: '20px' }} />
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.completed}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Completed</div>
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
            placeholder="Search training programs..."
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
                placeholder="Search training programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button
              ref={buttonRef}
              className="btn filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
              data-filter-open={showFilters}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '100px',
                justifyContent: 'center',
                background: showFilters ? '#2563eb' : 'white',
                border: showFilters ? '1px solid #2563eb' : '1px solid #d1d5db',
                color: showFilters ? 'white' : '#374151',
                transition: 'all 0.2s'
              }}
            >
              <FiFilter style={{ color: showFilters ? 'white' : '#6b7280' }} />
              <span style={{ fontWeight: 500 }}>Filters</span>
              {showFilters ? <FiChevronUp className="chevron-icon" /> : <FiChevronDown className="chevron-icon" />}
              {(getActiveCount() > 0) && (
                <span className="filter-count-badge" style={{
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
            <div className="filter-options-container" style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>

              {/* Sort By */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.sortBy}
                    onChange={(e) => setFilterInputs({ ...filterInputs, sortBy: e.target.value })}
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
                    <option value="startDate-asc">Start Date (Earliest)</option>
                    <option value="startDate-desc">Start Date (Latest)</option>
                    <option value="title-asc">Title (A-Z)</option>
                    <option value="title-desc">Title (Z-A)</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.category}
                    onChange={(e) => setFilterInputs({ ...filterInputs, category: e.target.value })}
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
                    <option value="">All Categories</option>
                    <option value="technical">Technical</option>
                    <option value="soft-skills">Soft Skills</option>
                    <option value="leadership">Leadership</option>
                    <option value="compliance">Compliance</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Type */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                <div style={{ position: 'relative', width: '180px' }}>
                  <select
                    value={filterInputs.type}
                    onChange={(e) => setFilterInputs({ ...filterInputs, type: e.target.value })}
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
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="online">Online</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>


              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '160px' }}>
                  <select
                    value={filterInputs.status}
                    onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
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
                    <option value="">All Status</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Actions */}
              <div className="filter-actions-container" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
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

        {trainings.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FiBookOpen size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No trainings available</h3>
            <p style={{ color: 'var(--text-muted)' }}>Check back later for new training programs</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
            {trainings.map((training) => (
              <div key={training._id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: 0, flex: 1 }}>{training.title}</h3>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '500',
                    backgroundColor: training.status === 'scheduled' ? '#fef3c7' : training.status === 'in-progress' ? '#dbeafe' : training.status === 'completed' ? '#d1fae5' : '#fee2e2',
                    color: training.status === 'scheduled' ? '#92400e' : training.status === 'in-progress' ? '#1e40af' : training.status === 'completed' ? '#065f46' : '#991b1b'
                  }}>{training.status}</span>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: '1.5' }}>
                  {training.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <FiBookOpen size={14} />
                    <span>{training.category || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <FiUsers size={14} />
                    <span>{training.enrollments?.length || 0} enrolled</span>
                  </div>
                  {training.schedule?.startDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <FiCalendar size={14} />
                      <span>{formatDate(training.schedule.startDate)}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate(`/hrm/training/${training._id}`)}>
                    View Details
                  </button>
                  {training.status === 'scheduled' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleEnroll(training._id)}>
                      Enroll
                    </button>
                  )}
                </div>

                {/* Show enrollment status for employees */}
                {!isAdmin && !isSuperAdmin && user && user.employeeId && training.enrollments && training.enrollments.length > 0 && (() => {
                  // Find enrollment by comparing employee ID
                  const userEnrollment = training.enrollments.find(e => {
                    const empId = typeof e.employee === 'string' ? e.employee : e.employee?._id;
                    return empId && empId.toString() === user.employeeId.toString();
                  });

                  if (userEnrollment) {
                    const statusColors = {
                      'pending': { bg: '#fef3c7', text: '#92400e', label: 'Pending Approval' },
                      'selected': { bg: '#d1fae5', text: '#065f46', label: 'Approved ✓' },
                      'rejected': { bg: '#fee2e2', text: '#991b1b', label: 'Not Approved' },
                      'enrolled': { bg: '#dbeafe', text: '#1e40af', label: 'Enrolled' },
                      'in-progress': { bg: '#dbeafe', text: '#1e40af', label: 'In Progress' },
                      'completed': { bg: '#a7f3d0', text: '#064e3b', label: 'Completed ✓' },
                      'dropped': { bg: '#f3f4f6', text: '#6b7280', label: 'Dropped' }
                    };
                    const colors = statusColors[userEnrollment.status] || statusColors['pending'];

                    return (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        background: colors.bg,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${colors.text}40`
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>
                          {colors.label}
                        </span>
                        <span style={{ fontSize: '11px', color: colors.text, opacity: 0.7 }}>
                          {new Date(userEnrollment.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div >
  );
};

export default TrainingCatalog;
