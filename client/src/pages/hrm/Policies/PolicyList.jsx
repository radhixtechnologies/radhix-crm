import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/policies.css';
import { FiSearch, FiFilter, FiPlus, FiFileText, FiCheckCircle, FiAlertCircle, FiEye, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Loader from '../../../components/common/Loader';

const PolicyList = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [allPolicies, setAllPolicies] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('card');
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        category: '',
        status: '',
        sortBy: 'newest'
    });

    // API State for active filters
    const [activeFilters, setActiveFilters] = useState({
        category: '',
        status: '',
        sortBy: 'newest'
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const fetchPolicies = useCallback(async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setInitialLoading(true);
            else setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append('isLatestVersion', 'true');

            const response = await hrmService.getPolicies(Object.fromEntries(params));
            const data = response.data.data || [];
            setAllPolicies(data);

            // Apply client-side filtering
            let filtered = [...data];

            // Apply search
            if (debouncedSearch) {
                const searchLower = debouncedSearch.toLowerCase();
                filtered = filtered.filter(p =>
                    p.title?.toLowerCase().includes(searchLower) ||
                    p.description?.toLowerCase().includes(searchLower) ||
                    p.category?.toLowerCase().includes(searchLower)
                );
            }

            // Apply active filters
            if (activeFilters.category) {
                filtered = filtered.filter(p => p.category === activeFilters.category);
            }
            if (activeFilters.status) {
                filtered = filtered.filter(p => p.status === activeFilters.status);
            }

            // Apply sorting
            if (activeFilters.sortBy === 'newest') {
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            } else if (activeFilters.sortBy === 'oldest') {
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            } else if (activeFilters.sortBy === 'a-z') {
                filtered.sort((a, b) => a.title.localeCompare(b.title));
            } else if (activeFilters.sortBy === 'z-a') {
                filtered.sort((a, b) => b.title.localeCompare(a.title));
            }

            setPolicies(filtered);
        } catch (error) {
            console.error('Error fetching policies:', error);
            setError(error.response?.data?.message || 'Failed to load policies');
            setPolicies([]);
        } finally {
            if (isInitialLoad) setInitialLoading(false);
            else setLoading(false);
        }
    }, [debouncedSearch, activeFilters]);

    // Initial load
    useEffect(() => {
        fetchPolicies(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch when Debounced Search OR Active Filters change
    useEffect(() => {
        if (!initialLoading) {
            fetchPolicies(false);
        }
    }, [debouncedSearch, activeFilters, fetchPolicies, initialLoading]);

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
    };

    const handleClearFilters = () => {
        const resetState = { category: '', status: '', sortBy: 'newest' };
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

    // Calculate Stats
    const stats = {
        total: allPolicies.length,
        active: allPolicies.filter(p => p.status === 'active').length,
        mandatory: allPolicies.filter(p => p.isMandatory).length,
        avgCompliance: allPolicies.length > 0
            ? Math.round(allPolicies.reduce((acc, curr) => acc + (curr.acknowledgmentStats?.percentage || 0), 0) / allPolicies.length)
            : 0
    };

    if (initialLoading) return <Loader />;

    return (
        <div className="policy-list-container">
            {/* Header */}
            <div className="policy-list-header">
                <div>
                    <h1>Policy Management</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage organizational policies and track compliance.</p>
                </div>
                <button
                    className="btn-create-policy"
                    onClick={() => navigate('/hrm/policies/create')}
                >
                    <FiPlus size={18} /> Create Policy
                </button>
            </div>

            {/* Stats Overview */}
            <div className="policy-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon-wrapper stat-blue">
                        <FiFileText />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Policies</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper stat-green">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.active}</div>
                        <div className="stat-label">Active Policies</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper stat-orange">
                        <FiAlertCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.mandatory}</div>
                        <div className="stat-label">Mandatory</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon-wrapper stat-purple">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.avgCompliance}%</div>
                        <div className="stat-label">Avg. Compliance</div>
                    </div>
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50, marginBottom: '24px' }}>
                {/* Main Toolbar Row */}
                <div className="toolbar-desktop">
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
                                transition: 'all 0.2s',
                                padding: '9px 16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer'
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

                {/* Filter Panel (Absolute Overlay) */}
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
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="a-z">A-Z</option>
                                        <option value="z-a">Z-A</option>
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
                                        <option value="HR">HR</option>
                                        <option value="IT">IT</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Compliance">Compliance</option>
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
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="archived">Archived</option>
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
                                        background: '#2563eb',
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
            {error ? (
                <div className="error-message">
                    <FiAlertCircle size={24} />
                    <p>{error}</p>
                    <button onClick={() => fetchPolicies(true)}>Retry</button>
                </div>
            ) : loading ? (
                <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    <Loader />
                </div>
            ) : policies.length === 0 ? (
                <div className="no-policies" style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <FiFileText size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                    <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>No policies found</h3>
                    <p style={{ color: '#64748b' }}>Get started by creating your first policy document.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {policies.map((policy) => (
                        <div key={policy._id} className="policy-card">
                            <div className="policy-card-header">
                                <h3>{policy.title}</h3>
                                <span className={`policy-status-badge status-${policy.status}`}>
                                    {policy.status}
                                </span>
                            </div>

                            <div className="policy-card-body">
                                <p className="policy-description">{policy.description || 'No description provided.'}</p>

                                <div className="policy-meta-tags">
                                    <div className="meta-row">
                                        <FiFileText /> <span>{policy.category}</span>
                                    </div>
                                    <div className="meta-row">
                                        <FiCheckCircle />
                                        <span>
                                            {policy.acknowledgmentStats
                                                ? `${policy.acknowledgmentStats.total} Acknowledged`
                                                : '0 Acknowledged'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="policy-card-footer">
                                <div className="card-actions">
                                    <button
                                        className="btn-sm-secondary"
                                        onClick={() => navigate(`/hrm/policies/${policy._id}`)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="btn-sm-primary"
                                        onClick={() => navigate(`/hrm/policies/${policy._id}/edit`)}
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PolicyList;
