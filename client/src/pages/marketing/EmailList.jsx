import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiMail, FiClock, FiCheckCircle, FiXCircle, FiFilter, FiChevronUp, FiChevronDown, FiSend } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { formatDate, formatNumber } from '../../utils/format';
import '../../styles/marketing/email-marketing.css';

const EmailList = () => {
    const navigate = useNavigate();
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', search: '' });
    // Buffered Filter State
    const [filterInputs, setFilterInputs] = useState({ status: '', search: '' });
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        fetchEmails();
    }, [filters]);

    const fetchEmails = async () => {
        try {
            setLoading(true);
            const res = await marketingService.getEmails(filters);
            if (res.data.success) {
                setEmails(res.data.data.emails || []);
            }
        } catch (error) {
            console.error('Error fetching emails:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusIcons = {
        draft: FiClock,
        scheduled: FiClock,
        sending: FiMail,
        sent: FiCheckCircle,
        failed: FiXCircle,
    };

    const statusColors = {
        draft: 'status-draft',
        scheduled: 'status-scheduled',
        sending: 'status-sending',
        sent: 'status-sent',
        failed: 'status-failed',
    };

    const handleApplyFilters = () => {
        setFilters({ ...filters, ...filterInputs });
        setShowFilters(false);
    };

    const clearFilters = () => {
        const resetState = { status: '', search: '' };
        setFilterInputs(resetState);
        setFilters(resetState);
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        return count;
    };

    return (
        <div className="email-list-page">
            {/* Compact Professional Header */}
            <div className="page-header-compact">
                <div className="header-left">
                    <div className="header-title-section">
                        <h1 className="page-title-compact">Email Campaigns</h1>
                        <p className="page-subtitle-compact">
                            {emails.length} {emails.length === 1 ? 'email' : 'emails'}
                        </p>
                    </div>
                </div>

                <div className="header-right">
                    <button
                        className="btn btn-primary-compact"
                        onClick={() => navigate('/marketing/emails/new')}
                    >
                        <FiPlus size={16} />
                        Create Email
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                margin: '0 24px 24px 24px'
            }}>
                {/* Total Emails */}
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
                        <FiMail />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {emails.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Emails
                        </div>
                    </div>
                </div>

                {/* Sent */}
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
                        <FiSend />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {emails.filter(e => e.status === 'sent').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Sent
                        </div>
                    </div>
                </div>

                {/* Draft */}
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
                            {emails.filter(e => e.status === 'draft').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Draft
                        </div>
                    </div>
                </div>

                {/* Scheduled */}
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
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {emails.filter(e => e.status === 'scheduled').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Scheduled
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50, padding: '0 24px', marginBottom: '16px' }}>
                {/* 1. Main Toolbar Row */}
                <div style={{ padding: '0 0 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

                    {/* Left: Search & Filter Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="toolbar-search" style={{ margin: 0, width: '280px', display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0 12px', height: '38px' }}>
                            <FiSearch className="search-icon" style={{ color: '#9ca3af', marginRight: '8px' }} />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                value={filterInputs.search}
                                onChange={(e) => setFilterInputs({ ...filterInputs, search: e.target.value })}
                                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', background: 'transparent' }}
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
                                transition: 'all 0.2s',
                                height: '38px',
                                padding: '0 16px',
                                borderRadius: '6px',
                                cursor: 'pointer'
                            }}
                        >
                            <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                            <span style={{ fontWeight: 500, fontSize: '13px' }}>Filters</span>
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
                        left: '24px',
                        width: 'calc(100% - 48px)',
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

                            {/* Status Filter */}
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
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="sent">Sent</option>
                                        <option value="failed">Failed</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                                <button
                                    onClick={clearFilters}
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
                                >
                                    Clear All
                                </button>
                                <button
                                    onClick={handleApplyFilters}
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
            <div style={{ height: '1px', background: '#e5e7eb', margin: '0 24px 16px 24px' }}></div>

            {loading ? (
                <Loader />
            ) : (
                <div className="emails-grid">
                    {emails.length > 0 ? (
                        emails.map((email) => {
                            const StatusIcon = statusIcons[email.status] || FiMail;
                            return (
                                <div
                                    key={email._id}
                                    className="email-card"
                                    onClick={() => navigate(`/marketing/emails/${email._id}`)}
                                >
                                    <div className="email-header">
                                        <span className={`email-status ${statusColors[email.status]}`}>
                                            <StatusIcon size={14} />
                                            {email.status}
                                        </span>
                                        {email.campaign && (
                                            <span className="email-campaign">{email.campaign.name}</span>
                                        )}
                                    </div>

                                    <h3 className="email-subject">{email.subject}</h3>

                                    <div className="email-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">From:</span>
                                            <span className="meta-value">{email.fromName}</span>
                                        </div>
                                        {email.scheduledDate && (
                                            <div className="meta-item">
                                                <span className="meta-label">Scheduled:</span>
                                                <span className="meta-value">{formatDate(email.scheduledDate)}</span>
                                            </div>
                                        )}
                                        {email.sentDate && (
                                            <div className="meta-item">
                                                <span className="meta-label">Sent:</span>
                                                <span className="meta-value">{formatDate(email.sentDate)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {email.status === 'sent' && (
                                        <div className="email-metrics">
                                            <div className="metric-item">
                                                <div className="metric-label">Sent</div>
                                                <div className="metric-value">{formatNumber(email.metrics.sent)}</div>
                                            </div>
                                            <div className="metric-item">
                                                <div className="metric-label">Opened</div>
                                                <div className="metric-value">
                                                    {formatNumber(email.metrics.opened)}
                                                    <span className="metric-rate">({email.openRate.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                            <div className="metric-item">
                                                <div className="metric-label">Clicked</div>
                                                <div className="metric-value">
                                                    {formatNumber(email.metrics.clicked)}
                                                    <span className="metric-rate">({email.clickRate.toFixed(1)}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty-state">
                            <FiMail size={64} />
                            <h3>No email campaigns found</h3>
                            <p>Create your first email campaign to get started!</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/marketing/emails/new')}
                            >
                                <FiPlus /> Create Email Campaign
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default EmailList;
