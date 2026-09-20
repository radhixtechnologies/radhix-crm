import { useEffect, useState, useCallback } from 'react';
import { FiSearch, FiFileText, FiCheckCircle, FiCalendar, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useRef } from 'react';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/employee/timesheets.css';

const PolicyCenter = () => {
  const [policiesByCategory, setPoliciesByCategory] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const buttonRef = useRef(null);

  // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // UI State for inputs
  const [filterInputs, setFilterInputs] = useState({
    category: '',
    status: ''
  });

  // API State for active filters
  const [activeFilters, setActiveFilters] = useState({
    category: '',
    status: ''
  });

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      else setLoading(true);

      const params = {
        search: debouncedSearch,
        ...activeFilters
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const res = await hrmService.getDocumentCenter(params);
      let data = res.data.data || {};

      // Apply client-side filtering if needed
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const filtered = {};
        Object.entries(data).forEach(([category, items]) => {
          const filteredItems = items.filter(p =>
            p.title?.toLowerCase().includes(searchLower) ||
            p.version?.toLowerCase().includes(searchLower)
          );
          if (filteredItems.length > 0) {
            filtered[category] = filteredItems;
          }
        });
        data = filtered;
      }

      setPoliciesByCategory(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      if (isInitialLoad) setInitialLoading(false);
      else setLoading(false);
    }
  }, [debouncedSearch, activeFilters]);

  // Initial load
  useEffect(() => {
    fetchData(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch when Debounced Search OR Active Filters change
  useEffect(() => {
    if (!initialLoading) {
      fetchData(false);
    }
  }, [debouncedSearch, activeFilters, fetchData, initialLoading]);

  const handleApplyFilters = () => {
    setActiveFilters(filterInputs);
  };

  const handleClearFilters = () => {
    const resetState = { category: '', status: '' };
    setFilterInputs(resetState);
    setActiveFilters(resetState);
    setSearchQuery('');
  };

  const getActiveCount = () => {
    let count = 0;
    if (filterInputs.category) count++;
    if (filterInputs.status) count++;
    return count;
  };

  const acknowledge = async (id) => {
    try {
      await hrmService.acknowledgePolicy(id);
      fetchData();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  const categories = Object.keys(policiesByCategory);

  if (error) {
    return (
      <div className="timesheets-list-page">
        <div className="timesheets-page-header">
          <div className="header-title-group">
            <h1 className="page-title">Policy Center</h1>
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
          <h1 className="page-title">Policy Center</h1>
          <p className="page-subtitle">View and acknowledge company policies</p>
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

      {/* Search Bar Section (Mobile) */}
      <div className="search-bar-section" style={{ marginBottom: '16px', display: 'none' }}>
        <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search policies..."
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
                placeholder="Search policies..."
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

              {/* Category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                <div style={{ position: 'relative', width: '200px' }}>
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
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                </div>
              </div>

              {/* Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                <div style={{ position: 'relative', width: '180px' }}>
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
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                  <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
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
      <div className="timesheets-content-wrapper">
        {loading && <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>}

        {categories.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <FiFileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No active policies</h3>
            <p style={{ color: 'var(--text-muted)' }}>Check back later for policy updates</p>
          </div>
        ) : (
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {Object.entries(policiesByCategory).map(([category, items]) => (
              <div key={category} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiFileText style={{ color: '#2563eb' }} />
                  {category}
                  <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    ({items.length} {items.length === 1 ? 'policy' : 'policies'})
                  </span>
                </h2>
                <div className="table-container-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Version</th>
                        <th>Effective Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <div style={{ fontWeight: '500' }}>{p.title}</div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontSize: '13px' }}>{p.version}</span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                              <FiCalendar size={14} />
                              {formatDate(p.effectiveDate)}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              {p.documentUrl ? (
                                <a
                                  href={p.documentUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn btn-sm btn-secondary"
                                  style={{ textDecoration: 'none' }}
                                >
                                  View Document
                                </a>
                              ) : (
                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No document</span>
                              )}
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => acknowledge(p._id)}
                              >
                                <FiCheckCircle /> Acknowledge
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PolicyCenter;
