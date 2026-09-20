import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/finance/paymentDetails.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PaymentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundData, setRefundData] = useState({
        refundAmount: '',
        refundReason: ''
    });
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPaymentDetails();
    }, [id]);

    const fetchPaymentDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/finance/payments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPayment(response.data);
            setRefundData({ refundAmount: response.data.amount, refundReason: '' });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching payment details:', error);
            setLoading(false);
        }
    };

    const handleRefund = async () => {
        if (!refundData.refundAmount || parseFloat(refundData.refundAmount) <= 0) {
            alert('Please enter a valid refund amount');
            return;
        }

        if (!refundData.refundReason.trim()) {
            alert('Please provide a reason for the refund');
            return;
        }

        if (!window.confirm(`Are you sure you want to refund ${formatCurrency(refundData.refundAmount)}?`)) {
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/finance/payments/${id}/refund`,
                refundData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            alert('Payment refunded successfully!');
            setShowRefundModal(false);
            fetchPaymentDetails();
        } catch (error) {
            console.error('Error refunding payment:', error);
            alert('Failed to refund payment: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
            return;
        }

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/finance/payments/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Payment deleted successfully!');
            navigate('/finance/payments');
        } catch (error) {
            console.error('Error deleting payment:', error);
            alert('Failed to delete payment: ' + (error.response?.data?.message || error.message));
            setActionLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

    const getPaymentMethodIcon = (method) => {
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

    if (loading) {
        return <div className="loading-spinner">Loading payment details...</div>;
    }

    if (!payment) {
        return <div className="error-message">Payment not found</div>;
    }

    return (
        <div className="payment-details-container">
            {/* Header */}
            <div className="payment-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/finance/payments')}>
                        ← Back to Payments
                    </button>
                    <h1>Payment {payment.paymentNumber}</h1>
                    <span className={`status-badge ${getStatusBadgeClass(payment.status)}`}>
                        {payment.status}
                    </span>
                </div>
                <div className="header-actions">
                    {payment.status === 'Completed' && (
                        <button
                            className="btn-warning"
                            onClick={() => setShowRefundModal(true)}
                            disabled={actionLoading}
                        >
                            ↩️ Refund Payment
                        </button>
                    )}
                    <button
                        className="btn-danger"
                        onClick={handleDelete}
                        disabled={actionLoading}
                    >
                        🗑️ Delete
                    </button>
                </div>
            </div>

            {/* Payment Info Grid */}
            <div className="payment-info-grid">
                <div className="info-card">
                    <h3>Payment Information</h3>
                    <div className="info-row">
                        <span className="label">Payment Number:</span>
                        <span className="value">{payment.paymentNumber}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Amount:</span>
                        <span className="value amount">{formatCurrency(payment.amount)}</span>
                    </div>
                    {payment.status === 'Refunded' && payment.refundedAmount > 0 && (
                        <div className="info-row refund">
                            <span className="label">Refunded Amount:</span>
                            <span className="value">{formatCurrency(payment.refundedAmount)}</span>
                        </div>
                    )}
                    <div className="info-row">
                        <span className="label">Payment Date:</span>
                        <span className="value">{formatDate(payment.paymentDate)}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Payment Method:</span>
                        <span className="value">
                            {getPaymentMethodIcon(payment.paymentMethod)} {payment.paymentMethod}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="label">Status:</span>
                        <span className={`value ${payment.status.toLowerCase()}-text`}>
                            {payment.status}
                        </span>
                    </div>
                </div>

                <div className="info-card">
                    <h3>Invoice Information</h3>
                    <div className="info-row">
                        <span className="label">Invoice Number:</span>
                        <span
                            className="value invoice-link"
                            onClick={() => navigate(`/finance/invoices/${payment.invoice?._id}`)}
                        >
                            {payment.invoice?.invoiceNumber || 'N/A'}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="label">Customer:</span>
                        <span className="value">{payment.account?.companyName || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Invoice Total:</span>
                        <span className="value">{formatCurrency(payment.invoice?.total || 0)}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Invoice Status:</span>
                        <span className="value">{payment.invoice?.status || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Transaction Details */}
            <div className="transaction-details">
                <h3>Transaction Details</h3>
                <div className="details-grid">
                    {payment.referenceNumber && (
                        <div className="detail-item">
                            <span className="detail-label">Reference Number</span>
                            <span className="detail-value">{payment.referenceNumber}</span>
                        </div>
                    )}
                    {payment.transactionId && (
                        <div className="detail-item">
                            <span className="detail-label">Transaction ID</span>
                            <span className="detail-value transaction-id">{payment.transactionId}</span>
                        </div>
                    )}
                    <div className="detail-item">
                        <span className="detail-label">Recorded By</span>
                        <span className="detail-value">{payment.createdBy?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Recorded On</span>
                        <span className="detail-value">{formatDate(payment.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Notes */}
            {payment.notes && (
                <div className="notes-section">
                    <h3>Notes</h3>
                    <p>{payment.notes}</p>
                </div>
            )}

            {/* Refund Information */}
            {payment.status === 'Refunded' && (
                <div className="refund-info">
                    <h3>Refund Information</h3>
                    <div className="info-row">
                        <span className="label">Refunded Amount:</span>
                        <span className="value">{formatCurrency(payment.refundedAmount)}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Refunded On:</span>
                        <span className="value">{formatDate(payment.refundedAt)}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Refund Reason:</span>
                        <span className="value">{payment.refundReason}</span>
                    </div>
                </div>
            )}

            {/* Refund Modal */}
            {showRefundModal && (
                <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Refund Payment</h2>
                            <button className="modal-close" onClick={() => setShowRefundModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Refund Amount</label>
                                <input
                                    type="number"
                                    value={refundData.refundAmount}
                                    onChange={(e) => setRefundData({ ...refundData, refundAmount: e.target.value })}
                                    max={payment.amount}
                                    step="0.01"
                                />
                                <span className="help-text">Maximum: {formatCurrency(payment.amount)}</span>
                            </div>
                            <div className="form-group">
                                <label>Refund Reason <span className="required">*</span></label>
                                <textarea
                                    value={refundData.refundReason}
                                    onChange={(e) => setRefundData({ ...refundData, refundReason: e.target.value })}
                                    placeholder="Explain why this payment is being refunded..."
                                    rows="4"
                                    required
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowRefundModal(false)}
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-warning"
                                onClick={handleRefund}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'Processing...' : 'Process Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentDetails;
