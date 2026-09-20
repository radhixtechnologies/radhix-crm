import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCalendar, FiFileText, FiCheckCircle, FiXCircle, FiClock, FiEye, FiDollarSign, FiSearch, FiPlus, FiFilter, FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi';
import { useRef } from 'react';
import { hrmService } from '../../../services/hrmService';
import { employeeService } from '../../../services/employeeService';
import { useAuth } from '../../../context/AuthContext';
import Loader from '../../../components/common/Loader';
import Modal from '../../../components/common/Modal';
import { formatDate } from '../../../utils/format';
import '../../../styles/employee/timesheets.css';

const ExitManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        status: '',
        reason: '',
        viewMode: 'my-exits' // 'my-exits' or 'all-exits'
    });

    // API State for active filters
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        reason: '',
        viewMode: 'my-exits'
    });

    const [form, setForm] = useState({
        employeeId: '',
        type: 'resignation',
        resignationDate: '',
        lastWorkingDate: '',
        reason: 'other',
        reasonDetails: '',
    });

    const [employees, setEmployees] = useState([]);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';

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

            // Remove empty filters and viewMode
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === null || params[key] === undefined || key === 'viewMode') {
                    delete params[key];
                }
            });

            const res = await hrmService.getExitRequests(params);
            if (res.data.success) {
                let data = res.data.data || [];

                // Apply client-side filtering for search
                if (debouncedSearch) {
                    const searchLower = debouncedSearch.toLowerCase();
                    data = data.filter(r =>
                        r.employee?.user?.name?.toLowerCase().includes(searchLower) ||
                        r.employee?.employeeId?.toLowerCase().includes(searchLower) ||
                        r.reason?.toLowerCase().includes(searchLower)
                    );
                }

                // Filter by view mode (only if not handled by API)
                // Assuming API handles viewMode if passed, but local filter for safety
                if (activeFilters.viewMode === 'my-exits' && !isAdmin) {
                    data = data.filter(r => r.submittedBy?._id === user?._id || r.employee?.user?._id === user?._id);
                } else if (activeFilters.viewMode === 'my-exits' && isAdmin) {
                    // Admin viewing their own exists? usually admin sees all
                    // But if selected 'My Exit Requests', filter by submittedBy me
                    data = data.filter(r => r.submittedBy?._id === user?._id);
                }

                setRequests(data);
            }
        } catch (e) {
            setError(e?.response?.data?.message || e.message);
        } finally {
            if (isInitialLoad) setInitialLoading(false);
            else setLoading(false);
        }
    }, [debouncedSearch, activeFilters, user, isAdmin]);

    // Initial load
    useEffect(() => {
        fetchData(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch employees for dropdown if Admin
    useEffect(() => {
        if (isAdmin && showModal) {
            const fetchEmployees = async () => {
                try {
                    const res = await employeeService.getEmployees({ limit: 1000 }); // Basic limit
                    if (res.data.success) {
                        setEmployees(res.data.data);
                    }
                } catch (e) {
                    console.error("Failed to fetch employees", e);
                }
            };
            fetchEmployees();
        }
    }, [isAdmin, showModal]);


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
        const resetState = { status: '', reason: '', viewMode: 'my-exits' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
        setSearchQuery('');
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        if (filterInputs.reason) count++;
        if (filterInputs.viewMode !== 'my-exits') count++;
        return count;
    };

    const submit = async () => {
        if (!form.resignationDate || !form.lastWorkingDate) {
            alert('Please fill in all required fields');
            return;
        }

        if (isAdmin && !form.employeeId) {
            alert('Please select an employee');
            return;
        }

        try {
            await hrmService.submitExitRequest(form);
            setForm({ employeeId: '', type: 'resignation', resignationDate: '', lastWorkingDate: '', reason: 'other', reasonDetails: '' });
            setShowModal(false);
            fetchData();
            alert('Exit request submitted successfully');
        } catch (e) {
            alert(e?.response?.data?.message || e.message || 'Failed to submit exit request');
        }
    };

    const handleApprove = async (requestId) => {
        if (!window.confirm('Are you sure you want to approve this exit request?')) return;

        try {
            await hrmService.approveExitRequest(requestId, {});
            fetchData();
            alert('Exit request approved successfully');
        } catch (e) {
            alert(e?.response?.data?.message || e.message || 'Failed to approve exit request');
        }
    };

    const handleCalculateSettlement = async (requestId) => {
        try {
            const res = await hrmService.calculateFinalSettlement(requestId);
            if (res.data.success) {
                alert('Settlement calculated successfully');
                fetchData();
            }
        } catch (e) {
            alert(e?.response?.data?.message || e.message || 'Failed to calculate settlement');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved': return '#22c55e';
            case 'under_review': return '#f59e0b';
            case 'rejected': return '#ef4444';
            case 'submitted': return '#3b82f6';
            case 'completed': return '#10b981';
            case 'exited': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (error) {
        return (
            <div className="timesheets-list-page">
                <div className="timesheets-page-header">
                    <div className="header-title-group">
                        <h1 className="page-title">Exit Management</h1>
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
                    <h1 className="page-title">Exit Management</h1>
                    <p className="page-subtitle">Manage employee exits and settlements</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus /> {isAdmin ? 'Initiate Exit' : 'Submit Resignation'}
                    </button>
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
                {/* Total Requests */}
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
                        <FiFileText />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {requests.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Requests
                        </div>
                    </div>
                </div>

                {/* Submitted / Pending */}
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
                        <FiClock />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {requests.filter(r => r.status === 'submitted' || r.status === 'under_review').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Pending
                        </div>
                    </div>
                </div>

                {/* Approved */}
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
                            {requests.filter(r => r.status === 'approved').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Approved
                        </div>
                    </div>
                </div>

                {/* Completed */}
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
                        <FiUser />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {requests.filter(r => r.status === 'completed' || r.status === 'exited').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Completed
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
                        placeholder="Search exit requests..."
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
                                placeholder="Search exit requests..."
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

                            {/* View Mode (Admin Only) */}
                            {isAdmin && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>View Mode</label>
                                    <div style={{ position: 'relative', width: '180px' }}>
                                        <select
                                            value={filterInputs.viewMode}
                                            onChange={(e) => setFilterInputs({ ...filterInputs, viewMode: e.target.value })}
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
                                            <option value="my-exits">My Exit Requests</option>
                                            <option value="all-exits">All Exit Requests</option>
                                        </select>
                                        <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                            )}

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
                                        <option value="submitted">Submitted</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="completed">Completed</option>
                                        <option value="exited">Exited</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Reason */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason</label>
                                <div style={{ position: 'relative', width: '180px' }}>
                                    <select
                                        value={filterInputs.reason}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, reason: e.target.value })}
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
                                        <option value="">All Reasons</option>
                                        <option value="better_opportunity">Better Opportunity</option>
                                        <option value="career_growth">Career Growth</option>
                                        <option value="relocation">Relocation</option>
                                        <option value="health">Health</option>
                                        <option value="family">Family</option>
                                        <option value="dissatisfaction">Dissatisfaction</option>
                                        <option value="retirement">Retirement</option>
                                        <option value="other">Other</option>
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

            {/* Content */}
            <div>
                {loading && <div style={{ padding: '20px', textAlign: 'center' }}><Loader /></div>}

                {requests.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                        <FiFileText size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                        <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Exit Requests</h3>
                        <p style={{ color: 'var(--text-muted)' }}>No exit requests found</p>
                    </div>
                ) : (
                    <div className="table-container-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Dates</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request._id}>
                                        <td>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{request.employee?.user?.name || 'N/A'}</div>
                                                <small style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                                                    ID: {request.employee?.employeeId || 'N/A'}
                                                </small>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${request.type === 'termination' ? 'badge-danger' : 'badge-secondary'}`}>
                                                {request.type ? request.type.toUpperCase() : 'RESIGNATION'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ fontSize: '12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} title="Resignation/Initiation Date">
                                                    <span style={{ color: '#6b7280' }}>In:</span> {formatDate(request.resignationDate)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }} title="Last Working Date">
                                                    <span style={{ color: '#6b7280' }}>Out:</span> {formatDate(request.lastWorkingDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="badge badge-secondary">
                                                {request.reason?.replace('_', ' ').toUpperCase() || 'N/A'}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className="badge"
                                                style={{
                                                    backgroundColor: getStatusColor(request.status) + '20',
                                                    color: getStatusColor(request.status),
                                                    border: `1px solid ${getStatusColor(request.status)}40`
                                                }}
                                            >
                                                {request.status?.replace('_', ' ').toUpperCase()}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={() => navigate(`/hrm/exit/${request._id}`)}
                                                    title="View Details"
                                                >
                                                    <FiEye />
                                                </button>
                                                {isAdmin && request.status === 'submitted' && (
                                                    <button
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => handleApprove(request._id)}
                                                        title="Approve"
                                                    >
                                                        <FiCheckCircle />
                                                    </button>
                                                )}
                                                {isAdmin && request.status === 'approved' && !request.settlement && (
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
                                                        onClick={() => handleCalculateSettlement(request._id)}
                                                        title="Calculate Settlement"
                                                    >
                                                        <FiDollarSign />
                                                    </button>
                                                )}
                                                {request.settlement && (
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        onClick={() => navigate(`/hrm/exit/${request._id}/settlement`)}
                                                        title="View Settlement"
                                                    >
                                                        <FiDollarSign />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Submit Resignation Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setForm({ employeeId: '', type: 'resignation', resignationDate: '', lastWorkingDate: '', reason: 'other', reasonDetails: '' });
                }}
                title={isAdmin ? "Initiate Exit" : "Submit Resignation"}
            >
                {isAdmin && (
                    <div className="form-group">
                        <label className="form-label">Employee *</label>
                        <div style={{ position: 'relative' }}>
                            <div
                                className="form-input"
                                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: '#fff'
                                }}
                            >
                                <span>
                                    {form.employeeId
                                        ? employees.find(e => e._id === form.employeeId)?.user?.name + ` (${employees.find(e => e._id === form.employeeId)?.employeeId})`
                                        : "Select Employee"
                                    }
                                </span>
                                <FiChevronDown />
                            </div>

                            {showEmployeeDropdown && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    background: '#fff',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0 0 6px 6px',
                                    marginTop: '4px',
                                    zIndex: 10,
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>
                                        <div style={{ position: 'relative' }}>
                                            <FiSearch style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                                            <input
                                                type="text"
                                                placeholder="Search..."
                                                value={employeeSearch}
                                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    padding: '6px 8px 6px 30px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: '4px',
                                                    fontSize: '13px',
                                                    outline: 'none'
                                                }}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {employees
                                            .filter(emp =>
                                                !employeeSearch ||
                                                emp.user?.name?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
                                                emp.employeeId?.toLowerCase().includes(employeeSearch.toLowerCase())
                                            )
                                            .map(emp => (
                                                <div
                                                    key={emp._id}
                                                    onClick={() => {
                                                        setForm({ ...form, employeeId: emp._id });
                                                        setShowEmployeeDropdown(false);
                                                        setEmployeeSearch('');
                                                    }}
                                                    style={{
                                                        padding: '8px 12px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        borderBottom: '1px solid #f3f4f6',
                                                        background: form.employeeId === emp._id ? '#eff6ff' : 'transparent',
                                                        color: form.employeeId === emp._id ? '#2563eb' : 'inherit'
                                                    }}
                                                    onMouseEnter={(e) => e.target.style.background = '#f9fafb'}
                                                    onMouseLeave={(e) => e.target.style.background = form.employeeId === emp._id ? '#eff6ff' : 'transparent'}
                                                >
                                                    {emp.user?.name || 'Unknown'} ({emp.employeeId})
                                                </div>
                                            ))
                                        }
                                        {employees.length === 0 && (
                                            <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontSize: '13px' }}>
                                                No employees found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div className="form-group">
                        <label className="form-label">Exit Type *</label>
                        <select
                            className="form-input"
                            value={form.type}
                            onChange={(e) => setForm({ ...form, type: e.target.value })}
                            required
                        >
                            <option value="resignation">Resignation</option>
                            <option value="termination">Termination</option>
                        </select>
                    </div>
                )}

                <div className="form-group">
                    <label className="form-label">{form.type === 'termination' ? 'Effective Date' : 'Resignation Date'} *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={form.resignationDate}
                        onChange={(e) => setForm({ ...form, resignationDate: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Last Working Date *</label>
                    <input
                        type="date"
                        className="form-input"
                        value={form.lastWorkingDate}
                        onChange={(e) => setForm({ ...form, lastWorkingDate: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">Reason</label>
                    <select
                        className="form-input"
                        value={form.reason}
                        onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    >
                        <option value="better_opportunity">Better Opportunity</option>
                        <option value="career_growth">Career Growth</option>
                        <option value="relocation">Relocation</option>
                        <option value="health">Health</option>
                        <option value="family">Family</option>
                        <option value="dissatisfaction">Dissatisfaction</option>
                        <option value="retirement">Retirement</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Details</label>
                    <textarea
                        className="form-input"
                        value={form.reasonDetails}
                        onChange={(e) => setForm({ ...form, reasonDetails: e.target.value })}
                        rows={4}
                        placeholder={form.type === 'termination' ? "Reason for termination..." : "Provide additional details about your resignation..."}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                            setShowModal(false);
                            setForm({ employeeId: '', type: 'resignation', resignationDate: '', lastWorkingDate: '', reason: 'other', reasonDetails: '' });
                        }}
                    >
                        Cancel
                    </button>
                    <button type="button" className="btn btn-primary" onClick={submit}>
                        {isAdmin ? 'Initiate Exit' : 'Submit Resignation'}
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default ExitManagement;
