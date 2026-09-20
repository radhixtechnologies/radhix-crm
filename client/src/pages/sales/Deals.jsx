import { useState, useEffect, useRef } from 'react';
import { FiPlus, FiSearch, FiFilter, FiDownload, FiChevronDown, FiChevronUp, FiTarget, FiCheckCircle, FiXCircle, FiTrendingUp } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import DealTable from '../../components/Sales/DealTable';
import Loader from '../../components/common/Loader';
import '../../styles/employee/timesheets.css';

const Deals = () => {
    const [deals, setDeals] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const [filterInputs, setFilterInputs] = useState({
        sortBy: 'newest',
        stage: '',
        owner: ''
    });

    const [activeFilters, setActiveFilters] = useState({
        sortBy: 'newest',
        stage: '',
        owner: ''
    });

    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
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

    // Initial load
    useEffect(() => {
        fetchDeals(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch when search or filters change
    useEffect(() => {
        if (!initialLoading) {
            fetchDeals(false);
        }
    }, [debouncedSearch, activeFilters, pagination.page]);

    const fetchDeals = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setInitialLoading(true);
            else setLoading(true);

            const params = {
                page: pagination.page,
                limit: pagination.limit,
                search: debouncedSearch,
                ...activeFilters
            };

            const res = await salesService.getDeals(params);
            if (res.data.success) {
                setDeals(res.data.data || []);
                setPagination({ ...pagination, total: res.data.total || 0, pages: res.data.pages || 0 });
            }
        } catch (error) {
            console.error('Error fetching deals:', error);
        } finally {
            if (isInitialLoad) setInitialLoading(false);
            else setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
        setPagination({ ...pagination, page: 1 });
    };

    const handleClearFilters = () => {
        const resetState = { sortBy: 'newest', stage: '', owner: '' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
        setSearchQuery('');
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.stage) count++;
        if (filterInputs.owner) count++;
        return count;
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this deal?')) {
            await salesService.deleteDeal(id);
            fetchDeals();
        }
    };

    return (
        <div className="timesheets-list-page">
            {/* Header Row */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <div className="title-text">
                        <h1 className="page-title">Deals</h1>
                        <p className="page-subtitle">Manage and track your sales opportunities</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
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

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Deals */}
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
                        <FiTarget />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {deals.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Deals
                        </div>
                    </div>
                </div>

                {/* In Progress */}
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
                        <FiTrendingUp />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            In Progress
                        </div>
                    </div>
                </div>

                {/* Won */}
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
                            {deals.filter(d => d.stage === 'closed-won').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Won
                        </div>
                    </div>
                </div>

                {/* Lost */}
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
                        <FiXCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {deals.filter(d => d.stage === 'closed-lost').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Lost
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar Section */}
            <div className="search-bar-section" style={{ marginBottom: '16px' }}>
                <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search deals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Filter Panel */}
            <div style={{ position: 'relative', zIndex: 50 }}>
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

                            {/* Sort By */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sort By</label>
                                <div style={{ position: 'relative', width: '140px' }}>
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
                                        <option value="value-high">Value: High-Low</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Stage */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Stage</label>
                                <div style={{ position: 'relative', width: '150px' }}>
                                    <select
                                        value={filterInputs.stage}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, stage: e.target.value })}
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
                                        <option value="">All Stages</option>
                                        <option value="new-deal">New Deal</option>
                                        <option value="proposal">Proposal</option>
                                        <option value="quotation">Quotation</option>
                                        <option value="negotiation">Negotiation</option>
                                        <option value="closed-won">Closed Won</option>
                                        <option value="closed-lost">Closed Lost</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Owner */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</label>
                                <div style={{ position: 'relative', width: '150px' }}>
                                    <select
                                        value={filterInputs.owner}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, owner: e.target.value })}
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
                                        <option value="">All Owners</option>
                                        <option value="me">My Deals</option>
                                        <option value="unassigned">Unassigned</option>
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
            <div>
                {initialLoading ? <Loader /> : (
                    <div className="table-container-responsive">
                        <DealTable
                            deals={deals}
                            onDelete={handleDelete}
                            pagination={pagination}
                            onPageChange={(p) => setPagination({ ...pagination, page: p })}
                            loading={loading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Deals;
