import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/policies.css';
import { FiSearch, FiFilter, FiGrid, FiList, FiPlus, FiFileText, FiCheckCircle, FiAlertCircle, FiClock, FiMoreVertical, FiEye, FiEdit2, FiArchive, FiBell, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const PolicyList = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [allPolicies, setAllPolicies] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [viewMode] = useState('card');
    const [showFilters, setShowFilters] = useState(false);

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
        setShowFilters(false);
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

    const renderCardView = () => (
        <div className="policy-grid">
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
    );

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

            {/* Toolbar */}
            <div className="policy-toolbar-container">
                <div className="toolbar-desktop">
                    <div className="search-filter-wrapper">
                        <div className="toolbar-search">
                            <FiSearch />
                            <input
                                type="text"
                                placeholder="Search policies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <button
                                className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <FiFilter />
                                <span>Filters</span>
                                <FiChevronDown />
                                {getActiveCount() > 0 && (
                                    <span style={{
                                        background: '#3b82f6', color: 'white', fontSize: '10px',
                                        padding: '0 5px', borderRadius: '10px', marginLeft: '4px'
                                    }}>
                                        {getActiveCount()}
                                    </span>
                                )}
                            </button>

                            {showFilters && (
                                <div className="filter-panel-overlay">
                                    <div className="filter-options-grid">
                                        <div className="filter-column">
                                            <label>Sort By</label>
                                            <div className="filter-wrapper">
                                                <select className="filter-select">
                                                    <option>Newest First</option>
                                                    <option>Oldest First</option>
                                                    <option>A-Z</option>
                                                </select>
                                                <FiChevronDown className="filter-chevron" />
                                            </div>
                                        </div>

                                        <div className="filter-column">
                                            <label>Category</label>
                                            <div className="filter-wrapper">
                                                <select
                                                    value={filterInputs.category}
                                                    onChange={(e) => setFilterInputs({ ...filterInputs, category: e.target.value })}
                                                    className="filter-select"
                                                >
                                                    <option value="">All Categories</option>
                                                    <option value="HR">HR</option>
                                                    <option value="IT">IT</option>
                                                    <option value="Finance">Finance</option>
                                                    <option value="Compliance">Compliance</option>
                                                </select>
                                                <FiChevronDown className="filter-chevron" />
                                            </div>
                                        </div>

                                        <div className="filter-column">
                                            <label>Status</label>
                                            <div className="filter-wrapper">
                                                <select
                                                    value={filterInputs.status}
                                                    onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                                                    className="filter-select"
                                                >
                                                    <option value="">All Status</option>
                                                    <option value="draft">Draft</option>
                                                    <option value="active">Active</option>
                                                    <option value="archived">Archived</option>
                                                </select>
                                                <FiChevronDown className="filter-chevron" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="filter-actions">
                                        <button
                                            className="btn-text-action"
                                            onClick={handleClearFilters}
                                            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}
                                        >
                                            Clear All
                                        </button>
                                        <button
                                            className="btn-sm-primary"
                                            onClick={() => {
                                                handleApplyFilters();
                                                setShowFilters(false);
                                            }}
                                            style={{ width: 'auto', padding: '8px 24px' }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {error ? (
                <div className="error-message">
                    <FiAlertCircle size={24} />
                    <p>{error}</p>
                    <button onClick={fetchPolicies}>Retry</button>
                </div>
            ) : loading ? (
                <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading policies...
                </div>
            ) : policies.length === 0 ? (
                <div className="no-policies" style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <FiFileText size={48} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                    <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>No policies found</h3>
                    <p style={{ color: '#64748b' }}>Get started by creating your first policy document.</p>
                </div>
            ) : (
                viewMode === 'card' ? renderCardView() : (
                    /* Basic Table Fallback - Can be enhanced later to match new table styles */
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <tr>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Title</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Category</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Status</th>
                                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b' }}>Last Updated</th>
                                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {policies.map(policy => (
                                    <tr key={policy._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '16px' }}><strong>{policy.title}</strong></td>
                                        <td style={{ padding: '16px' }}><span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{policy.category}</span></td>
                                        <td style={{ padding: '16px' }}><span className={`policy-status-badge status-${policy.status}`}>{policy.status}</span></td>
                                        <td style={{ padding: '16px', color: '#64748b', fontSize: '13px' }}>{new Date(policy.updatedAt || policy.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '16px', textAlign: 'right' }}>
                                            <button className="btn-icon-action" style={{ display: 'inline-flex' }} onClick={() => navigate(`/hrm/policies/${policy._id}`)}>
                                                <FiEye />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            )}
        </div>
    );
};

export default PolicyList;
