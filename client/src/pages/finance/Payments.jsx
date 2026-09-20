import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FiPlus,
    FiSearch,
    FiDollarSign,
    FiCheckCircle,
    FiClock,
    FiRefreshCcw,
    FiEye,
    FiFilter,
    FiCreditCard,
    FiChevronUp,
    FiChevronDown,
    FiRefreshCw
} from 'react-icons/fi';
import '../../styles/finance/payments-modern.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Payments = () => {
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [loading, setLoading] = useState(false);

    // Filter and Pagination States
    const [filterInputs, setFilterInputs] = useState({
        status: '',
        search: '',
        startDate: '',
        endDate: '',
    });
    const [activeFilters, setActiveFilters] = useState({
        status: '',
        search: '',
        startDate: '',
        endDate: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
    });
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        fetchPayments(true);
    }, []);

    useEffect(() => {
        if (initialLoading) return;
        fetchPayments(false);
    }, [pagination.page, activeFilters]);

    // Search Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            setActiveFilters(prev => ({ ...prev, search: filterInputs.search }));
        }, 500);
        return () => clearTimeout(timer);
    }, [filterInputs.search]);

    const fetchPayments = async (isInitial = false) => {
        try {
            if (isInitial) setInitialLoading(true);
            else setLoading(true);

            const token = localStorage.getItem('token');
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...activeFilters
            };

            const response = await axios.get(`${API_URL}/finance/payments`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });

            if (response.data) {
                // Assuming data structure: { data: [], total: 0, pages: 0 } or just []
                const paymentData = response.data.data || (Array.isArray(response.data) ? response.data : []);
                setPayments(paymentData);

                const totalCount = response.data.total || paymentData.length;
                setPagination(prev => ({
                    ...prev,
                    total: totalCount,
                    pages: response.data.pages || Math.ceil(totalCount / prev.limit)
                }));
            }
        } catch (error) {
            console.error('Error fetching payments:', error);
        } finally {
            setInitialLoading(false);
            setLoading(false);
        }
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'Pending': 'status-pending',
            'Completed': 'status-completed',
            'Failed': 'status-failed',
            'Refunded': 'status-refunded'
        };
        return statusClasses[status] || 'status-default';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getPaymentMethodIcon = (method) => {
        // Updated to use components or simply better logic if needed, 
        // but for now keeping it simple as we will render icons directly if possible.
        const icons = {
            'Bank Transfer': '🏦',
            'Credit Card': '💳',
            'Debit Card': '💳',
            'Cash': '💵',
            'Cheque': '📝',
            'UPI': '📱',
            'PayPal': '🅿️',
            'Razorpay': '💰',
            'Stripe': '💳',
            'Other': '💰'
        };
        return icons[method] || '💰';
    };

    const handleRefresh = () => fetchPayments(false);
    const handlePageChange = (newPage) => setPagination(prev => ({ ...prev, page: newPage }));
    const clearFilters = () => {
        const reset = { status: '', search: '', startDate: '', endDate: '' };
        setFilterInputs(reset);
        setActiveFilters(reset);
        setPagination(prev => ({ ...prev, page: 1 }));
    };
    const handleApplyFilters = () => {
        setActiveFilters({ ...filterInputs });
        setPagination(prev => ({ ...prev, page: 1 }));
        setShowFilters(false);
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        if (filterInputs.startDate) count++;
        return count;
    };

    const statistics = {
        total: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
        completed: payments.filter(p => p.status === 'Completed').length,
        completedAmount: payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + (p.amount || 0), 0),
        pending: payments.filter(p => p.status === 'Pending').length,
        refundedAmount: payments.filter(p => p.status === 'Refunded').reduce((sum, p) => sum + (p.refundedAmount || 0), 0)
    };

    if (initialLoading) {
        return <div className="loading-spinner">Loading payments...</div>;
    }

    return (
        <div className="invoice-list-page fade-in">
            {/* Header Row */}
            <div className="timesheets-page-header">
                <div className="title-text">
                    <h1 className="page-title">Payments</h1>
                    <p className="page-subtitle">
                        Track and manage all transactions • {pagination.total} total
                    </p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-outline" onClick={handleRefresh} disabled={loading}>
                        <FiRefreshCw className={loading ? 'spin' : ''} style={{ marginRight: '8px' }} />
                        Refresh
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/finance/payments/new')}>
                        <FiPlus /> Record Payment
                    </button>
                    <button
                        ref={buttonRef}
                        className="btn btn-outline"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            background: showFilters ? '#eff6ff' : 'white',
                            borderColor: showFilters ? '#3b82f6' : 'var(--border)',
                            color: showFilters ? '#2563eb' : 'var(--text-primary)',
                            minWidth: '110px'
                        }}
                    >
                        <FiFilter /> Filters {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {getActiveCount() > 0 && (
                            <span style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                marginLeft: '4px'
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
                padding: '0 24px',
                marginBottom: '24px'
            }}>
                {/* Total Volume */}
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
                        <FiDollarSign />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {formatCurrency(statistics.totalAmount)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Volume
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
                            {formatCurrency(statistics.completedAmount)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Completed
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
                            {statistics.pending}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Pending
                        </div>
                    </div>
                </div>

                {/* Refunds */}
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
                        <FiRefreshCcw />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {formatCurrency(statistics.refundedAmount)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Refunds
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ position: 'relative', zIndex: 50, padding: '0 24px', marginBottom: '16px' }}>
                {/* Search Bar Section */}
                {/* <div className="search-bar-section" style={{ marginBottom: '16px' }}>
                    <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '320px' }}>
                        <FiSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={filterInputs.search}
                            onChange={(e) => setFilterInputs({ ...filterInputs, search: e.target.value })}
                        />
                    </div>
                </div> */}

                {showFilters && (
                    <div className="filter-panel-overlay fade-in" ref={filterRef}>
                        <div className="filter-panel-row">
                            <div className="filter-group">
                                <label className="filter-group-label">Status</label>
                                <div className="filter-select-wrapper">
                                    <select
                                        className="filter-input"
                                        value={filterInputs.status}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Failed">Failed</option>
                                        <option value="Refunded">Refunded</option>
                                    </select>
                                    <FiChevronDown className="select-icon" />
                                </div>
                            </div>

                            <div className="filter-group">
                                <label className="filter-group-label">Date Range</label>
                                <div className="filter-date-inputs">
                                    <input
                                        type="date"
                                        className="filter-input date-input"
                                        value={filterInputs.startDate}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, startDate: e.target.value })}
                                    />
                                    <span className="date-separator">→</span>
                                    <input
                                        type="date"
                                        className="filter-input date-input"
                                        value={filterInputs.endDate}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="filter-panel-actions">
                                <button
                                    className="btn btn-text"
                                    onClick={clearFilters}
                                >
                                    Clear All
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleApplyFilters}
                                >
                                    Apply Filters
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="table-container-responsive">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Payment #</th>
                            <th>Invoice / Account</th>
                            <th>Amount</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && payments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    <div className="loader-spinner"></div>
                                </td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="no-data">
                                    {activeFilters.search ? 'No transactions found matching your search' : 'No transactions recorded'}
                                </td>
                            </tr>
                        ) : (
                            payments.map(payment => (
                                <tr key={payment._id}>
                                    <td className="payment-number" style={{ fontWeight: '600', color: 'var(--primary-color)' }}>
                                        {payment.paymentNumber}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span
                                                className="invoice-link"
                                                onClick={() => navigate(`/finance/invoices/${payment.invoice?._id}`)}
                                                style={{ fontWeight: '600' }}
                                            >
                                                {payment.invoice?.invoiceNumber || 'N/A'}
                                            </span>
                                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                                {payment.account?.companyName || 'Inter-account transfer'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="amount">
                                        <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                            {formatCurrency(payment.amount)}
                                        </div>
                                        {payment.status === 'Refunded' && payment.refundedAmount > 0 && (
                                            <div className="refunded-amount" style={{ color: 'var(--error)', fontSize: '11px' }}>
                                                -{formatCurrency(payment.refundedAmount)}
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                            {formatDate(payment.paymentDate)}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                                            {payment.status}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => navigate(`/finance/payments/${payment._id}`)}
                                            title="View Details"
                                        >
                                            <FiEye />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {pagination.pages > 1 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        padding: '20px',
                        borderTop: '1px solid var(--border)'
                    }}>
                        <button
                            className="btn btn-outline"
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            className="btn btn-outline"
                            disabled={pagination.page === pagination.pages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payments;
