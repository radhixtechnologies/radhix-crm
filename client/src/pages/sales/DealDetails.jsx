import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FiPhone, FiMail, FiMessageCircle, FiEdit, FiCalendar,
    FiDollarSign, FiTrendingUp, FiPackage,
    FiUser, FiMoreHorizontal, FiArrowLeft, FiClock, FiActivity,
    FiGlobe, FiMapPin
} from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import StatusBadge from '../../components/Sales/StatusBadge';
import ScheduleFollowUpModal from '../../components/Sales/ScheduleFollowUpModal';
import ActivitySection from '../../components/activities/ActivitySection';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import '../../styles/sales/lead-details.css';

const DealDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [deal, setDeal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showFollowUpModal, setShowFollowUpModal] = useState(false);
    const [activeActivityTab, setActiveActivityTab] = useState('activities');
    const [refreshActivityTrigger, setRefreshActivityTrigger] = useState(0);

    useEffect(() => {
        fetchDeal();
    }, [id]);

    const fetchDeal = async () => {
        try {
            setLoading(true);
            const res = await salesService.getDeal(id);
            if (res.data.success) {
                setDeal(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching deal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (newStage) => {
        try {
            await salesService.changeDealStage(id, newStage);
            setDeal({ ...deal, stage: newStage });
            setRefreshActivityTrigger(prev => prev + 1); // Trigger activity refresh
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update stage');
        }
    };

    const getCurrencySymbol = (currency) => {
        const symbols = {
            'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£', 'AUD': 'A$', 'CAD': 'C$'
        };
        return symbols[currency] || '₹';
    };

    const getStageColor = (stage) => {
        const colors = {
            'new-deal': '#3b82f6',
            'proposal': '#8b5cf6',
            'quotation': '#ec4899',
            'negotiation': '#f59e0b',
            'closed-won': '#10b981',
            'closed-lost': '#ef4444'
        };
        return colors[stage] || '#6b7280';
    };

    const getInitials = (name) => name ? name.substring(0, 2).toUpperCase() : '??';

    const calculateDaysOpen = () => {
        if (!deal) return 0;
        const created = new Date(deal.createdAt);
        const now = new Date();
        const diff = Math.floor((now - created) / (1000 * 60 * 60 * 24));
        return diff;
    };

    if (loading) return <div className="loading-container"><Loader /></div>;
    if (!deal) return <div className="error-state">Deal not found</div>;

    return (
        <div className="lead-details-page">
            {/* Header */}
            <header className="details-header-compact">
                <div className="header-top-row">
                    <div className="header-left-section">
                        <button
                            className="back-nav-button"
                            onClick={() => navigate('/sales/pipeline')}
                            title="Back to Pipeline"
                        >
                            <FiArrowLeft />
                        </button>
                        <div className="header-avatar-md">
                            {getInitials(deal.name || deal.title)}
                        </div>
                        <div className="header-info">
                            <div className="title-row">
                                <h1 className="lead-name">{deal.name || deal.title}</h1>
                                <StatusBadge status={deal.stage} type="deal" />
                            </div>
                            <div className="meta-row">
                                <span className="meta-detail-text">{deal.company || 'No Company'}</span>
                                <span className="meta-separator">•</span>
                                <span className="meta-detail-text">{deal.source}</span>
                                <span className="meta-separator">•</span>
                                <span className="meta-detail-text text-muted">Created {formatDate(deal.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="header-actions-row">
                    <div className="quick-actions">
                        <button className="btn-icon-action" title="Call"><FiPhone size={16} /></button>
                        <button className="btn-icon-action" title="Email"><FiMail size={16} /></button>
                        <button className="btn-icon-action" title="WhatsApp"><FiMessageCircle size={16} /></button>
                        <button className="btn-icon-action" title="More"><FiMoreHorizontal size={16} /></button>
                    </div>

                    <div className="primary-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowFollowUpModal(true)}>
                            <FiCalendar size={14} className="mr-1" /> Follow-up
                        </button>
                        {deal.stage === 'closed-won' && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => navigate('/finance/invoices/new', { state: { deal } })}
                                style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                            >
                                <FiDollarSign size={14} className="mr-1" /> Create Invoice
                            </button>
                        )}
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/sales/deals/${id}/update`)}>
                            <FiEdit size={14} className="mr-1" /> Edit
                        </button>
                    </div>
                </div>
            </header>

            {/* Metrics Row */}
            <section className="metrics-row">
                <div className="metric-card">
                    <div className="metric-icon-box" style={{ background: '#dbeafe', color: '#1e40af' }}>
                        <FiDollarSign size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Deal Value</span>
                        <div className="metric-value">
                            {getCurrencySymbol(deal.currency)}{deal.value?.toLocaleString() || 0}
                        </div>
                        <small className="metric-hint">{deal.currency || 'INR'}</small>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-box" style={{ background: '#ddd6fe', color: '#6b21a8' }}>
                        <FiTrendingUp size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Win Probability</span>
                        <div className="metric-value">{deal.probability || 0}%</div>
                        <div className="qualification-progress">
                            <div
                                className="qualification-progress-bar"
                                style={{ width: `${deal.probability || 0}%`, background: getStageColor(deal.stage) }}
                            />
                        </div>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-box" style={{ background: '#fef3c7', color: '#92400e' }}>
                        <FiClock size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Days in Pipeline</span>
                        <div className="metric-value">{calculateDaysOpen()}</div>
                        <small className="metric-hint">days</small>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-icon-box" style={{ background: '#d1fae5', color: '#065f46' }}>
                        <FiCalendar size={16} />
                    </div>
                    <div className="metric-content">
                        <span className="metric-label">Expected Close</span>
                        <div className="metric-value" style={{ fontSize: '14px' }}>
                            {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not set'}
                        </div>
                        <small className="metric-hint">target date</small>
                    </div>
                </div>
            </section>

            {/* Main Content Grid - Matching LeadDetails Layout */}
            <main className="details-grid">

                {/* LEFT COLUMN */}
                <div className="left-column">

                    {/* Contact Information Card */}
                    <div className="card details-card">
                        <div className="card-header-sm">
                            <h3>Contact Information</h3>
                        </div>
                        <div className="card-body">
                            <div className="contact-grid">
                                <div className="contact-item-horizontal">
                                    <div className="contact-icon-box blue">
                                        <FiUser size={18} />
                                    </div>
                                    <div className="contact-info">
                                        <span className="contact-label">Contact Name</span>
                                        <span className="contact-value">{deal.contactName || 'Not provided'}</span>
                                    </div>
                                </div>

                                <div className="contact-item-horizontal">
                                    <div className="contact-icon-box green">
                                        <FiPhone size={18} />
                                    </div>
                                    <div className="contact-info">
                                        <span className="contact-label">Phone</span>
                                        <span className="contact-value">{deal.phone || 'Not provided'}</span>
                                    </div>
                                </div>

                                <div className="contact-item-horizontal">
                                    <div className="contact-icon-box orange">
                                        <FiMail size={18} />
                                    </div>
                                    <div className="contact-info">
                                        <span className="contact-label">Email</span>
                                        <span className="contact-value">{deal.email || 'Not provided'}</span>
                                    </div>
                                </div>

                                {deal.website ? (
                                    <a href={deal.website.startsWith('http') ? deal.website : `https://${deal.website}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="contact-item-horizontal clickable"
                                    >
                                        <div className="contact-icon-box purple">
                                            <FiGlobe size={18} />
                                        </div>
                                        <div className="contact-info">
                                            <span className="contact-label">Website</span>
                                            <span className="contact-value">{deal.website}</span>
                                        </div>
                                    </a>
                                ) : (
                                    <div className="contact-item-horizontal">
                                        <div className="contact-icon-box purple">
                                            <FiGlobe size={18} />
                                        </div>
                                        <div className="contact-info">
                                            <span className="contact-label">Website</span>
                                            <span className="contact-value empty">Not provided</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products & Services Card */}
                    {deal.products && deal.products.length > 0 && (
                        <div className="card details-card">
                            <div className="card-header-sm">
                                <h3><FiPackage style={{ marginRight: '8px', verticalAlign: 'text-bottom' }} /> Products & Services</h3>
                            </div>
                            <div className="card-body">
                                <div className="products-table-wrapper" style={{ overflowX: 'auto' }}>
                                    <table className="products-table" style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                                <th style={{ padding: '10px' }}>Product</th>
                                                <th style={{ padding: '10px' }}>Qty</th>
                                                <th style={{ padding: '10px' }}>Price</th>
                                                <th style={{ padding: '10px' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {deal.products.map((product, index) => (
                                                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                    <td style={{ padding: '10px' }}>
                                                        <div style={{ fontWeight: 600 }}>{product.name}</div>
                                                        {product.description && <div style={{ fontSize: '11px', color: '#6b7280' }}>{product.description}</div>}
                                                    </td>
                                                    <td style={{ padding: '10px' }}>{product.quantity}</td>
                                                    <td style={{ padding: '10px' }}>{getCurrencySymbol(deal.currency)}{product.unitPrice}</td>
                                                    <td style={{ padding: '10px', fontWeight: 600 }}>{getCurrencySymbol(deal.currency)}{product.total}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Activity Timeline & Notes */}
                    <div className="card details-card">
                        <div className="card-header-sm card-header-with-tabs">
                            <div className="header-tabs">
                                <button
                                    className={`header-tab-btn ${activeActivityTab === 'activities' ? 'active' : ''}`}
                                    onClick={() => setActiveActivityTab('activities')}
                                >
                                    Activity Timeline
                                </button>
                                <button
                                    className={`header-tab-btn ${activeActivityTab === 'notes' ? 'active' : ''}`}
                                    onClick={() => setActiveActivityTab('notes')}
                                >
                                    Notes
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <ActivitySection
                                relatedTo={{
                                    entityType: 'Deal',
                                    entityId: deal._id,
                                    entityName: deal.name || deal.title
                                }}
                                activeTab={activeActivityTab}
                                leadNotes={deal.notes || []}
                                refreshTrigger={refreshActivityTrigger}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="right-column">

                    {/* Pipeline Stage - Compact */}
                    <div className="card details-card">
                        <div className="card-header-compact">
                            <h3>Pipeline Stage</h3>
                        </div>
                        <div className="card-body-compact">
                            <select
                                className="form-select" // Use standard form-select for better styling
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '14px',
                                    color: '#374151',
                                    marginBottom: '16px',
                                    background: '#fff'
                                }}
                                value={deal.stage}
                                onChange={(e) => handleStageChange(e.target.value)}
                            >
                                <option value="new-deal">New Deal (10%)</option>
                                <option value="proposal">Proposal (40%)</option>
                                <option value="quotation">Quotation (60%)</option>
                                <option value="negotiation">Negotiation (80%)</option>
                                <option value="closed-won">Closed Won (100%)</option>
                                <option value="closed-lost">Closed Lost (0%)</option>
                            </select>

                            <div className="info-list-compact">
                                <div className="info-item-compact">
                                    <span className="info-label">Assigned</span>
                                    <div className="info-value-with-avatar">
                                        <div className="mini-avatar">{getInitials(deal.assignedTo?.name || 'Unassigned')}</div>
                                        <span>{deal.assignedTo?.name || 'Unassigned'}</span>
                                    </div>
                                </div>
                                <div className="info-item-compact">
                                    <span className="info-label">Source</span>
                                    <span className="info-value badge-minimal">{deal.source || 'None'}</span>
                                </div>
                                <div className="info-item-compact">
                                    <span className="info-label">Expected Close</span>
                                    <span className="info-value">{deal.expectedCloseDate ? formatDate(deal.expectedCloseDate) : 'Not set'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Info - Compact */}
                    <div className="card details-card">
                        <div className="card-header-compact">
                            <h3>System Info</h3>
                        </div>
                        <div className="card-body-compact">
                            <div className="info-list-compact">
                                <div className="info-item-compact">
                                    <span className="info-label">Created</span>
                                    <span className="info-value">{formatDate(deal.createdAt)}</span>
                                </div>
                                <div className="info-item-compact">
                                    <span className="info-label">Last Modified</span>
                                    <span className="info-value">{formatDate(deal.updatedAt)}</span>
                                </div>
                                <div className="info-item-compact">
                                    <span className="info-label">Deal ID</span>
                                    <span className="info-value" style={{ fontSize: '11px', fontFamily: 'monospace' }}>{deal._id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Schedule Follow-up Modal */}
            <ScheduleFollowUpModal
                isOpen={showFollowUpModal}
                onClose={() => setShowFollowUpModal(false)}
                prefilledData={{ type: 'deal', relatedId: id }}
                onSuccess={() => {
                    setShowFollowUpModal(false);
                    alert('Follow-up scheduled successfully!');
                    // Optionally refresh history
                }}
            />
        </div>
    );
};

export default DealDetails;
