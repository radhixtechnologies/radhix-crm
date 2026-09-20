import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiPlus, FiCalendar, FiCheck, FiX, FiSearch, FiFileText, FiInfo, FiFilter, FiChevronDown, FiChevronUp, FiDownload } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/leaves.css';

const Leaves = () => {
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [approvalComments, setApprovalComments] = useState('');

    // Split state for Search (Instant/Debounced) vs Filters (Manual Apply)
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        status: '',
        department: '',
        dateFrom: '',
        dateTo: ''
    });

    // API State for active filters
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        department: '',
        dateFrom: '',
        dateTo: ''
    });

    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    const [formData, setFormData] = useState({
        type: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        documentUrl: '',
    });

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Initial load
    useEffect(() => {
        fetchLeaves(true);
        if (!isAdmin && !isSuperAdmin) {
            fetchLeaveBalance();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch when Debounced Search OR Active Filters change (NOT inputs)
    useEffect(() => {
        if (!initialLoading) {
            fetchLeaves(false);
        }
    }, [debouncedSearch, activeFilters]);

    const fetchLeaves = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setInitialLoading(true);
            else setLoading(true);

            const params = {
                search: debouncedSearch,
                ...activeFilters
            };

            // Map dateFrom/dateTo to startDate/endDate for API
            if (activeFilters.dateFrom) params.startDate = activeFilters.dateFrom;
            if (activeFilters.dateTo) params.endDate = activeFilters.dateTo;

            console.log('Fetching leaves with params:', params);
            const response = await employeeService.getLeaves(params);
            if (response.data.success) {
                setLeaves(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching leaves:', error);
        } finally {
            if (isInitialLoad) setInitialLoading(false);
            else setLoading(false);
        }
    };

    const fetchLeaveBalance = async () => {
        try {
            const employeesResponse = await employeeService.getEmployees();
            if (employeesResponse.data.success && employeesResponse.data.data.length > 0) {
                const userId = user?._id || user?.id;
                const userIdString = userId?.toString();

                const emp = employeesResponse.data.data.find(e => {
                    const empUserId = e.user?._id || e.user?.id;
                    const empUserIdString = empUserId?.toString();
                    return empUserIdString === userIdString;
                });

                if (emp && emp._id) {
                    const response = await employeeService.getLeaveBalance(emp._id, {});
                    if (response.data.success) {
                        setLeaveBalance(response.data.data);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching leave balance:', error);
        }
    };

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
    };

    const handleClearFilters = () => {
        const resetState = { status: '', department: '', dateFrom: '', dateTo: '' };
        setFilterInputs(resetState);
        setActiveFilters(resetState);
        setSearchQuery('');
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        if (filterInputs.department) count++;
        if (filterInputs.dateFrom) count++;
        return count;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check leave balance before submitting
        if (leaveBalance) {
            const days = calculateDays();
            const selectedType = formData.type;
            const balance = leaveBalance.balances[selectedType];

            if (balance) {
                const totalNeeded = balance.pending + days;
                if (totalNeeded > balance.total) {
                    alert(`Insufficient leave balance! Available: ${balance.available} days, Needed: ${days} days (${balance.pending} pending + ${days} new)`);
                    return;
                }
            }
        }

        try {
            await employeeService.createLeave(formData);
            setShowModal(false);
            setFormData({
                type: 'casual',
                startDate: '',
                endDate: '',
                reason: '',
                documentUrl: '',
            });
            fetchLeaves();
            if (!isAdmin && !isSuperAdmin) {
                fetchLeaveBalance();
            }
            alert('Leave request submitted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting leave request');
        }
    };

    const handleApproveReject = async (status) => {
        try {
            await employeeService.updateLeave(selectedLeave._id, {
                status,
                comments: approvalComments || ''
            });
            setShowApprovalModal(false);
            setSelectedLeave(null);
            setApprovalComments('');
            fetchLeaves();
            alert(`Leave ${status} successfully!`);
        } catch (error) {
            alert(error.response?.data?.message || `Error ${status === 'approved' ? 'approving' : 'rejecting'} leave`);
        }
    };

    const calculateDays = () => {
        if (formData.startDate && formData.endDate) {
            const start = dayjs(formData.startDate);
            const end = dayjs(formData.endDate);
            return Math.max(0, end.diff(start, 'day') + 1);
        }
        return 0;
    };

    const getAvailableBalance = () => {
        if (!leaveBalance) return null;
        const selectedType = formData.type;
        return leaveBalance.balances[selectedType];
    };

    return (
        <div className="leaves-list-page">
            {/* Header Row */}
            <div className="leaves-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Submit and manage leave requests</p>
                </div>
                <div className="header-actions">
                    {(isAdmin || isSuperAdmin) && (
                        <button className="btn btn-outline" onClick={() => { }}>
                            <FiDownload /> Import
                        </button>
                    )}
                    {!isAdmin && !isSuperAdmin && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            <FiPlus /> Request Leave
                        </button>
                    )}
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'none', /* Hidden by default via CSS class logic but keep consistent style props just in case */
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
                        placeholder="Search by type, reason..."
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
                                placeholder="Search by type, reason, employee..."
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
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Department - Only for Admin */}
                            {(isAdmin || isSuperAdmin) && (
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
                                        </select>
                                        <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                    </div>
                                </div>
                            )}

                            {/* Date Range */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="date"
                                        value={filterInputs.dateFrom}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, dateFrom: e.target.value })}
                                        style={{
                                            width: '130px',
                                            height: '38px',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            outline: 'none',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
                                    />
                                    <span style={{ color: '#9ca3af', fontWeight: 500 }}>→</span>
                                    <input
                                        type="date"
                                        value={filterInputs.dateTo}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, dateTo: e.target.value })}
                                        style={{
                                            width: '130px',
                                            height: '38px',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            outline: 'none',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                        }}
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

            {/* Visual Divider */}
            <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

            {/* Content */}
            <div className="leaves-content-wrapper">
                {initialLoading ? <Loader /> : (
                    <div className="table-container-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    {(isAdmin || isSuperAdmin) && <th>Employee</th>}
                                    <th>Comments</th>
                                    {(isAdmin || isSuperAdmin) && <th>Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={(isAdmin || isSuperAdmin) ? "9" : "7"} style={{ textAlign: 'center', padding: '40px' }}>
                                            <Loader />
                                        </td>
                                    </tr>
                                )}
                                {!loading && leaves.length > 0 ? (
                                    leaves.map((leave) => (
                                        <tr key={leave._id}>
                                            <td style={{ textTransform: 'capitalize' }}>{leave.type}</td>
                                            <td>{formatDate(leave.startDate)}</td>
                                            <td>{formatDate(leave.endDate)}</td>
                                            <td>{leave.days} day(s)</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {leave.reason}
                                            </td>
                                            <td>
                                                <span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'error' : 'warning'}`}>
                                                    {leave.status}
                                                </span>
                                            </td>
                                            {(isAdmin || isSuperAdmin) && (
                                                <td>{leave.employee?.employeeId || 'N/A'}</td>
                                            )}
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {leave.comments || '-'}
                                            </td>
                                            {(isAdmin || isSuperAdmin) && leave.status === 'pending' && (
                                                <td>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => {
                                                                setSelectedLeave(leave);
                                                                setShowApprovalModal(true);
                                                            }}
                                                        >
                                                            <FiCheck /> Review
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : !loading && (
                                    <tr>
                                        <td colSpan={(isAdmin || isSuperAdmin) ? 9 : 7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                            No leave requests found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Leave Modal */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Leave">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Leave Type *</label>
                        <select
                            className="form-select"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            required
                        >
                            <option value="casual">Casual</option>
                            <option value="sick">Sick</option>
                            <option value="annual">Annual</option>
                            <option value="maternity">Maternity</option>
                            <option value="paternity">Paternity</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Start Date *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                            min={dayjs().format('YYYY-MM-DD')}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">End Date *</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            required
                            min={formData.startDate || dayjs().format('YYYY-MM-DD')}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Days</label>
                        <input
                            type="text"
                            className="form-input"
                            value={calculateDays() + ' day(s)'}
                            disabled
                        />
                    </div>

                    {/* Leave Balance Display */}
                    {getAvailableBalance() && (
                        <div className="form-group" style={{ padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FiInfo style={{ color: 'var(--info)' }} />
                                <strong>Leave Balance ({formData.type}):</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                                <span>Available: <strong style={{ color: 'var(--success)' }}>{getAvailableBalance().available}</strong></span>
                                <span>Used: {getAvailableBalance().used}</span>
                                <span>Pending: {getAvailableBalance().pending}</span>
                                <span>Total: {getAvailableBalance().total}</span>
                            </div>
                            {calculateDays() > 0 && (
                                <div style={{ marginTop: '8px', padding: '8px', background: calculateDays() <= getAvailableBalance().available ? 'var(--success-light)' : 'var(--error-light)', borderRadius: '4px', fontSize: '12px' }}>
                                    {calculateDays() <= getAvailableBalance().available
                                        ? `✓ Requested ${calculateDays()} day(s) - Balance will be ${getAvailableBalance().available - calculateDays()} after approval`
                                        : `⚠ Insufficient balance! You need ${calculateDays()} days but only have ${getAvailableBalance().available} available`
                                    }
                                </div>
                            )}
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Reason *</label>
                        <textarea
                            className="form-textarea"
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            required
                            placeholder="Please provide a reason for leave"
                            rows={4}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Supporting Document (Optional)</label>
                        <input
                            type="url"
                            className="form-input"
                            value={formData.documentUrl}
                            onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                            placeholder="https://example.com/document.pdf"
                        />
                        <div className="form-helper">Upload URL for medical certificate, travel ticket, etc.</div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Submit Request
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Approval Modal */}
            <Modal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} title="Review Leave Request">
                {selectedLeave && (
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>Employee:</strong> {selectedLeave.employee?.employeeId || 'N/A'} {selectedLeave.employee?.user?.name && `(${selectedLeave.employee.user.name})`}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedLeave.type}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>Period:</strong> {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>Days:</strong> {selectedLeave.days} day(s)
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <strong>Reason:</strong>
                                <div style={{ marginTop: '8px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                                    {selectedLeave.reason}
                                </div>
                            </div>
                            {selectedLeave.documentUrl && (
                                <div style={{ marginBottom: '12px' }}>
                                    <strong>Supporting Document:</strong>
                                    <div style={{ marginTop: '8px' }}>
                                        <a
                                            href={selectedLeave.documentUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-sm btn-secondary"
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                        >
                                            <FiFileText /> View Document
                                        </a>
                                    </div>
                                </div>
                            )}
                            {selectedLeave.createdAt && (
                                <div style={{ marginBottom: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                    <strong>Submitted:</strong> {formatDate(selectedLeave.createdAt)}
                                </div>
                            )}
                        </div>

                        {/* Comments Input */}
                        <div className="form-group">
                            <label className="form-label">Comments (Optional)</label>
                            <textarea
                                className="form-textarea"
                                value={approvalComments}
                                onChange={(e) => setApprovalComments(e.target.value)}
                                placeholder="Add comments for approval/rejection..."
                                rows={3}
                            />
                            <div className="form-helper">These comments will be visible to the employee</div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => {
                                    setShowApprovalModal(false);
                                    setApprovalComments('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleApproveReject('rejected')}
                            >
                                <FiX /> Reject
                            </button>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={() => handleApproveReject('approved')}
                            >
                                <FiCheck /> Approve
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Leaves;
