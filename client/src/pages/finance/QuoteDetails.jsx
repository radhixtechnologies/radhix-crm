import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/finance/quoteDetails.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const QuoteDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quote, setQuote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchQuoteDetails();
    }, [id]);

    const fetchQuoteDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/finance/quotes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuote(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching quote details:', error);
            setLoading(false);
        }
    };

    const handleSendQuote = async () => {
        if (!window.confirm('Are you sure you want to send this quote to the customer?')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/finance/quotes/${id}/send`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Quote sent successfully!');
            fetchQuoteDetails();
        } catch (error) {
            console.error('Error sending quote:', error);
            alert('Failed to send quote: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptQuote = async () => {
        if (!window.confirm('Are you sure you want to accept this quote?')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/finance/quotes/${id}/accept`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Quote accepted successfully!');
            fetchQuoteDetails();
        } catch (error) {
            console.error('Error accepting quote:', error);
            alert('Failed to accept quote: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleConvertToInvoice = async () => {
        if (!window.confirm('Convert this quote to an invoice? This action cannot be undone.')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/finance/quotes/${id}/convert`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Quote converted to invoice successfully!');
            navigate(`/finance/invoices/${response.data.invoice._id}`);
        } catch (error) {
            console.error('Error converting quote:', error);
            alert('Failed to convert quote: ' + (error.response?.data?.message || error.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteQuote = async () => {
        if (!window.confirm('Are you sure you want to delete this quote? This action cannot be undone.')) return;

        setActionLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/finance/quotes/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Quote deleted successfully!');
            navigate('/finance/quotes');
        } catch (error) {
            console.error('Error deleting quote:', error);
            alert('Failed to delete quote: ' + (error.response?.data?.message || error.message));
        } finally {
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
            day: 'numeric'
        });
    };

    const getStatusBadgeClass = (status) => {
        const statusClasses = {
            'Draft': 'status-draft',
            'Sent': 'status-sent',
            'Viewed': 'status-viewed',
            'Accepted': 'status-accepted',
            'Rejected': 'status-rejected',
            'Expired': 'status-expired',
            'Converted': 'status-converted'
        };
        return statusClasses[status] || 'status-default';
    };

    if (loading) {
        return <div className="loading-spinner">Loading quote details...</div>;
    }

    if (!quote) {
        return <div className="error-message">Quote not found</div>;
    }

    const isExpired = new Date(quote.validUntil) < new Date();

    return (
        <div className="quote-details-container">
            {/* Header */}
            <div className="quote-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/finance/quotes')}>
                        ← Back to Quotes
                    </button>
                    <h1>Quote {quote.quoteNumber}</h1>
                    <span className={`status-badge ${getStatusBadgeClass(quote.status)}`}>
                        {quote.status}
                    </span>
                    {isExpired && quote.status !== 'Converted' && quote.status !== 'Accepted' && (
                        <span className="expired-badge">Expired</span>
                    )}
                </div>
                <div className="header-actions">
                    {quote.status === 'Draft' && (
                        <>
                            <button
                                className="btn-secondary"
                                onClick={() => navigate(`/finance/quotes/${id}/edit`)}
                                disabled={actionLoading}
                            >
                                ✏️ Edit
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSendQuote}
                                disabled={actionLoading}
                            >
                                📧 Send Quote
                            </button>
                            <button
                                className="btn-danger"
                                onClick={handleDeleteQuote}
                                disabled={actionLoading}
                            >
                                🗑️ Delete
                            </button>
                        </>
                    )}
                    {(quote.status === 'Sent' || quote.status === 'Viewed') && (
                        <button
                            className="btn-success"
                            onClick={handleAcceptQuote}
                            disabled={actionLoading}
                        >
                            ✅ Accept Quote
                        </button>
                    )}
                    {quote.status === 'Accepted' && !quote.convertedToInvoice && (
                        <button
                            className="btn-primary"
                            onClick={handleConvertToInvoice}
                            disabled={actionLoading}
                        >
                            🔄 Convert to Invoice
                        </button>
                    )}
                    {quote.convertedToInvoice && (
                        <button
                            className="btn-secondary"
                            onClick={() => navigate(`/finance/invoices/${quote.convertedToInvoice._id}`)}
                        >
                            📄 View Invoice
                        </button>
                    )}
                </div>
            </div>

            {/* Quote Info */}
            <div className="quote-info-grid">
                <div className="info-card">
                    <h3>Quote Information</h3>
                    <div className="info-row">
                        <span className="label">Subject:</span>
                        <span className="value">{quote.subject}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Deal:</span>
                        <span className="value">{quote.deal?.dealName || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Account:</span>
                        <span className="value">{quote.account?.companyName || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                        <span className="label">Contact:</span>
                        <span className="value">
                            {quote.contact ? `${quote.contact.firstName} ${quote.contact.lastName}` : 'N/A'}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="label">Valid Until:</span>
                        <span className={`value ${isExpired ? 'expired-text' : ''}`}>
                            {formatDate(quote.validUntil)}
                            {isExpired && ' (Expired)'}
                        </span>
                    </div>
                </div>

                <div className="info-card">
                    <h3>Timeline</h3>
                    <div className="timeline">
                        <div className="timeline-item">
                            <span className="timeline-icon">📝</span>
                            <div>
                                <div className="timeline-label">Created</div>
                                <div className="timeline-date">{formatDate(quote.createdAt)}</div>
                                <div className="timeline-user">by {quote.createdBy?.name}</div>
                            </div>
                        </div>
                        {quote.sentAt && (
                            <div className="timeline-item">
                                <span className="timeline-icon">📧</span>
                                <div>
                                    <div className="timeline-label">Sent</div>
                                    <div className="timeline-date">{formatDate(quote.sentAt)}</div>
                                </div>
                            </div>
                        )}
                        {quote.viewedAt && (
                            <div className="timeline-item">
                                <span className="timeline-icon">👁️</span>
                                <div>
                                    <div className="timeline-label">Viewed</div>
                                    <div className="timeline-date">{formatDate(quote.viewedAt)}</div>
                                </div>
                            </div>
                        )}
                        {quote.acceptedAt && (
                            <div className="timeline-item">
                                <span className="timeline-icon">✅</span>
                                <div>
                                    <div className="timeline-label">Accepted</div>
                                    <div className="timeline-date">{formatDate(quote.acceptedAt)}</div>
                                    {quote.approvedBy && (
                                        <div className="timeline-user">by {quote.approvedBy.name}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Line Items */}
            <div className="line-items-section">
                <h3>Line Items</h3>
                <table className="line-items-table">
                    <thead>
                        <tr>
                            <th>Product/Service</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Discount</th>
                            <th>Tax Rate</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {quote.lineItems.map((item, index) => (
                            <tr key={index}>
                                <td>{item.productName}</td>
                                <td>{item.description || '-'}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.unitPrice)}</td>
                                <td>
                                    {item.discount > 0
                                        ? `${item.discount}${item.discountType === 'percentage' ? '%' : ' ₹'}`
                                        : '-'
                                    }
                                </td>
                                <td>{item.taxRate}%</td>
                                <td className="amount">{formatCurrency(item.lineTotal)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="totals-section">
                <div className="totals-card">
                    <div className="total-row">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(quote.subtotal)}</span>
                    </div>
                    {quote.discountAmount > 0 && (
                        <div className="total-row discount">
                            <span>Discount:</span>
                            <span>-{formatCurrency(quote.discountAmount)}</span>
                        </div>
                    )}
                    <div className="total-row">
                        <span>Tax:</span>
                        <span>{formatCurrency(quote.taxAmount)}</span>
                    </div>
                    <div className="total-row grand-total">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(quote.total)}</span>
                    </div>
                </div>
            </div>

            {/* Additional Info */}
            {(quote.termsAndConditions || quote.notes) && (
                <div className="additional-info">
                    {quote.termsAndConditions && (
                        <div className="info-section">
                            <h3>Terms & Conditions</h3>
                            <p>{quote.termsAndConditions}</p>
                        </div>
                    )}
                    {quote.notes && (
                        <div className="info-section">
                            <h3>Notes</h3>
                            <p>{quote.notes}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Addresses */}
            {(quote.billingAddress || quote.shippingAddress) && (
                <div className="addresses-grid">
                    {quote.billingAddress && (
                        <div className="address-card">
                            <h3>Billing Address</h3>
                            <p>
                                {quote.billingAddress.street}<br />
                                {quote.billingAddress.city}, {quote.billingAddress.state} {quote.billingAddress.postalCode}<br />
                                {quote.billingAddress.country}
                            </p>
                        </div>
                    )}
                    {quote.shippingAddress && (
                        <div className="address-card">
                            <h3>Shipping Address</h3>
                            <p>
                                {quote.shippingAddress.street}<br />
                                {quote.shippingAddress.city}, {quote.shippingAddress.state} {quote.shippingAddress.postalCode}<br />
                                {quote.shippingAddress.country}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuoteDetails;
