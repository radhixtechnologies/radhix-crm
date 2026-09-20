import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiCheck, FiX, FiSearch, FiFileText, FiFilter, FiChevronDown, FiChevronUp, FiDownload, FiUser } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/leaves.css';

const HRMLeaves = () => {
    const { isAdmin, isSuperAdmin } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [selectedLeave, setSelectedLeave] = useState(null);
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
    }, []);

    // Fetch when Debounced Search OR Active Filters change
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
            // Assuming getLeaves is smart enough to switch to "all" if role is admin,
            // OR we might need a dedicated getAllLeaves endpoint depending on API.
            // Based on previous code, getLeaves checked context on backend or was sufficient.
            // If strictly separating, HRM should probably use a "ViewAll" flag or dedicated endpoint.
            // For now, reusing getLeaves as it likely returns all for Admins.
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

    return (
        <div className="leaves-list-page">
            <div className="leaves-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Leave Management</h1>
                    <p className="page-subtitle">Manage employee leave requests and approvals</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={() => { /* Export logic */ }}>
                        <FiDownload /> Export
                    </button>
                    {/* Filters Toggle */}
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
                            {leaves.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Requests
                        </div>
                    </div>
                </div>

                {/* Pending */}
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
                        <FiFileText />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leaves.filter(l => l.status === 'pending').length}
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
                        <FiCheck />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leaves.filter(l => l.status === 'approved').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Approved
                        </div>
                    </div>
                </div>

                {/* Rejected */}
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
                        <FiX />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {leaves.filter(l => l.status === 'rejected').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Rejected
                        </div>
                    </div>
                </div>
            </div>

            {/* Visual Divider */}
            <div style={{ height: '1px', background: '#e5e7eb', margin: '0 0 16px 0' }}></div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50, marginBottom: '16px' }}>
                <div className="toolbar-search" style={{ margin: 0, width: '280px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by employee, reason..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
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
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>
                            {/* Status */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                                <div style={{ position: 'relative', width: '160px' }}>
                                    <select
                                        value={filterInputs.status}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                                        style={{ appearance: 'none', width: '100%', padding: '0 32px 0 12px', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Department */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</label>
                                <div style={{ position: 'relative', width: '180px' }}>
                                    <select
                                        value={filterInputs.department}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, department: e.target.value })}
                                        style={{ appearance: 'none', width: '100%', padding: '0 32px 0 12px', height: '38px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                    >
                                        <option value="">All Departments</option>
                                        <option value="IT">IT</option>
                                        <option value="HR">HR</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Sales">Sales</option>
                                        <option value="Management">Management</option>
                                        <option value="Operations">Operations</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                                <button onClick={handleClearFilters} className="btn">Clear</button>
                                <button onClick={() => { handleApplyFilters(); setShowFilters(false); }} className="btn btn-primary">Apply</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="leaves-content-wrapper">
                {initialLoading ? <Loader /> : (
                    <div className="table-container-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Days</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" style={{ textAlign: 'center' }}><Loader /></td></tr>
                                ) : leaves.length > 0 ? (
                                    leaves.map((leave) => (
                                        <tr key={leave._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <FiUser size={16} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{leave.employee?.user?.name || 'Unknown'}</div>
                                                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{leave.employee?.employeeId || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ textTransform: 'capitalize' }}>{leave.type}</td>
                                            <td>{formatDate(leave.startDate)}</td>
                                            <td>{formatDate(leave.endDate)}</td>
                                            <td>{leave.days}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{leave.reason}</td>
                                            <td><span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'error' : 'warning'}`}>{leave.status}</span></td>
                                            <td>
                                                {leave.status === 'pending' && (
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <button className="btn btn-sm btn-success" onClick={() => { setSelectedLeave(leave); setShowApprovalModal(true); }}>
                                                            <FiCheck /> Review
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="8" style={{ textAlign: 'center' }}>No leave requests found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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

export default HRMLeaves;
