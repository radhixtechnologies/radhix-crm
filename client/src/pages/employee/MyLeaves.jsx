import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiPlus, FiCalendar, FiFileText, FiInfo, FiChevronDown, FiChevronUp, FiCheckCircle, FiClock, FiX } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/employee/leaves.css';

const MyLeaves = () => {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [leaveBalance, setLeaveBalance] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);

    const [formData, setFormData] = useState({
        type: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        documentUrl: '',
    });

    // Initial load
    useEffect(() => {
        fetchLeaves(true);
        fetchLeaveBalance();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchLeaves = async (isInitialLoad = false) => {
        try {
            if (isInitialLoad) setInitialLoading(true);
            else setLoading(true);

            // Fetch only MY leaves with no filters (or basic ones if needed later)
            const response = await employeeService.getLeaves({});
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
                    setEmployeeId(emp._id);
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
            const payload = {
                ...formData,
                employeeId: employeeId // Include employeeId in the payload
            };

            await employeeService.createLeave(payload);
            setShowModal(false);
            setFormData({
                type: 'casual',
                startDate: '',
                endDate: '',
                reason: '',
                documentUrl: '',
            });
            fetchLeaves();
            fetchLeaveBalance();
            alert('Leave request submitted successfully!');
        } catch (error) {
            alert(error.response?.data?.message || 'Error submitting leave request');
        }
    };

    return (
        <div className="leaves-list-page">
            {/* Header Row */}
            <div className="leaves-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">My Leaves</h1>
                    <p className="page-subtitle">Request and track your leave status</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <FiPlus /> Request Leave
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
                        <FiClock />
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
                        <FiCheckCircle />
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
                                    <th>Comments</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
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
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {leave.comments || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : !loading && (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
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
        </div>
    );
};

export default MyLeaves;
