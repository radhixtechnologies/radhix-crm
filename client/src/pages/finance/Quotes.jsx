import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiFileText, FiCheckCircle, FiDollarSign, FiRefreshCw } from 'react-icons/fi';
import '../../styles/finance/quotes.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Quotes = () => {
    const navigate = useNavigate();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        fetchQuotes();
    }, []);

    const fetchQuotes = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/finance/quotes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuotes(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching quotes:', error);
            setLoading(false);
        }
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

    const filteredQuotes = quotes.filter(quote => {
        if (filter === 'All') return true;
        return quote.status === filter;
    });

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return <div className="loading-spinner">Loading quotes...</div>;
    }

    return (
        <div className="quotes-container">
            <div className="quotes-header">
                <div className="header-left">
                    <h1>Quotes</h1>
                    <p className="subtitle">Manage your sales quotes and estimates</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={() => navigate('/finance/quotes/new')}
                >
                    + Create Quote
                </button>
            </div>

            <div className="quotes-filters">
                <div className="filter-tabs">
                    {['All', 'Draft', 'Sent', 'Accepted', 'Converted'].map(status => (
                        <button
                            key={status}
                            className={`filter-tab ${filter === status ? 'active' : ''}`}
                            onClick={() => setFilter(status)}
                        >
                            {status}
                            <span className="count">
                                {status === 'All'
                                    ? quotes.length
                                    : quotes.filter(q => q.status === status).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="quotes-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Quotes */}
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
                            {quotes.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Quotes
                        </div>
                    </div>
                </div>

                {/* Accepted */}
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
                            {quotes.filter(q => q.status === 'Accepted').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Accepted
                        </div>
                    </div>
                </div>

                {/* Total Value */}
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
                        <FiDollarSign />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {formatCurrency(quotes.reduce((sum, q) => sum + q.total, 0))}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Value
                        </div>
                    </div>
                </div>

                {/* Converted */}
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
                        <FiRefreshCw />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {quotes.filter(q => q.status === 'Converted').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Converted
                        </div>
                    </div>
                </div>
            </div>

            <div className="quotes-table-container">
                <table className="quotes-table">
                    <thead>
                        <tr>
                            <th>Quote #</th>
                            <th>Subject</th>
                            <th>Account</th>
                            <th>Deal</th>
                            <th>Amount</th>
                            <th>Valid Until</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredQuotes.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="no-data">
                                    No quotes found
                                </td>
                            </tr>
                        ) : (
                            filteredQuotes.map(quote => (
                                <tr key={quote._id}>
                                    <td className="quote-number">{quote.quoteNumber}</td>
                                    <td className="quote-subject">{quote.subject}</td>
                                    <td>{quote.account?.companyName || 'N/A'}</td>
                                    <td>{quote.deal?.dealName || 'N/A'}</td>
                                    <td className="amount">{formatCurrency(quote.total)}</td>
                                    <td className={new Date(quote.validUntil) < new Date() ? 'expired-date' : ''}>
                                        {formatDate(quote.validUntil)}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${getStatusBadgeClass(quote.status)}`}>
                                            {quote.status}
                                        </span>
                                    </td>
                                    <td className="actions">
                                        <button
                                            className="btn-icon"
                                            onClick={() => navigate(`/finance/quotes/${quote._id}`)}
                                            title="View Details"
                                        >
                                            👁️
                                        </button>
                                        {quote.status === 'Draft' && (
                                            <button
                                                className="btn-icon"
                                                onClick={() => navigate(`/finance/quotes/${quote._id}/edit`)}
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Quotes;
