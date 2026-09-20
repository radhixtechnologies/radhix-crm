import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { FiArrowLeft, FiEdit, FiBarChart2, FiUsers, FiSend, FiMail, FiTarget, FiClock, FiCheckCircle } from 'react-icons/fi';
import { formatNumber, formatDate } from '../../utils/format';
import '../../styles/marketing/campaigns.css'; // Reusing campaign details styles

const EmailDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [email, setEmail] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEmail();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchEmail = async () => {
        try {
            setLoading(true);
            const res = await marketingService.getEmail(id);
            if (res.data.success) {
                setEmail(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching email:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;
    if (!email) return <div className="p-8 text-center">Email not found</div>;

    const stats = email.metrics || { sent: 0, opened: 0, clicked: 0, delivered: 0, totalRecipients: 0 };
    const openRate = stats.delivered ? ((stats.opened / stats.delivered) * 100).toFixed(1) : 0;
    const clickRate = stats.delivered ? ((stats.clicked / stats.delivered) * 100).toFixed(1) : 0;
    const deliveryRate = stats.sent ? ((stats.delivered / stats.sent) * 100).toFixed(1) : 0;

    return (
        <div className="campaign-details-page fade-in">
            {/* 1. HEADER SECTION */}
            <div className="details-header-container">
                <div className="header-left">
                    <button className="back-button-link mb-2" onClick={() => navigate('/marketing/emails')} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <FiArrowLeft /> Back to Emails
                    </button>
                    <div className="header-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span className="text-secondary text-sm uppercase font-semibold tracking-wider">
                            Email Campaign
                        </span>
                        <span className={`campaign-status status-${email.status}`}>
                            {email.status}
                        </span>
                    </div>
                    <h1 className="page-title mt-2 mb-1" style={{ fontSize: '24px' }}>{email.subject}</h1>
                    <p className="page-subtitle text-secondary">
                        {email.sentDate ? `Sent on ${formatDate(email.sentDate)}` : `Created on ${formatDate(email.createdAt)}`}
                    </p>
                </div>
                <div className="header-right">
                    {email.status === 'draft' && (
                        <button className="btn btn-secondary" onClick={() => navigate(`/marketing/emails/${id}/edit`)}>
                            <FiEdit /> Edit
                        </button>
                    )}
                </div>
            </div>

            {/* 2. METRICS SECTION (Only if sent/sending) */}
            {email.status !== 'draft' && (
                <div className="metrics-overview">
                    <div className="metric-card">
                        <div className="metric-card-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}><FiSend size={24} /></div>
                        <span className="metric-label">Sent</span>
                        <span className="metric-value">{formatNumber(stats.sent)}</span>
                        <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>Total Recipients: {formatNumber(stats.totalRecipients)}</small>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-icon" style={{ background: '#dcfce7', color: '#16a34a' }}><FiCheckCircle size={24} /></div>
                        <span className="metric-label">Delivered</span>
                        <span className="metric-value">{formatNumber(stats.delivered)}</span>
                        <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>Rate: {deliveryRate}%</small>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-icon" style={{ background: '#dbeafe', color: '#2563eb' }}><FiMail size={24} /></div>
                        <span className="metric-label">Opened</span>
                        <span className="metric-value">{formatNumber(stats.opened)}</span>
                        <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>Rate: {openRate}%</small>
                    </div>
                    <div className="metric-card">
                        <div className="metric-card-icon" style={{ background: '#f3e8ff', color: '#9333ea' }}><FiTarget size={24} /></div>
                        <span className="metric-label">Clicked</span>
                        <span className="metric-value">{formatNumber(stats.clicked)}</span>
                        <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>Rate: {clickRate}%</small>
                    </div>
                </div>
            )}

            {/* 3. MAIN CONTENT SECTION */}
            <div className="campaign-main-grid">
                {/* Left Column (70%) */}
                <div className="main-left">
                    <div className="detail-card">
                        <h2 className="section-title">Email Content</h2>
                        <div className="preview-container" style={{
                            background: '#f9fafb',
                            padding: '24px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            minHeight: '300px'
                        }}>
                            <div style={{ background: 'white', padding: '32px', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                <div dangerouslySetInnerHTML={{ __html: email.body ? email.body.replace(/\n/g, '<br/>') : '' }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column (30%) */}
                <div className="main-right">
                    <div className="detail-card">
                        <h3 className="card-title">Configuration</h3>

                        <div className="mb-4">
                            <label className="field-label block mb-1" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>From</label>
                            <div className="font-medium text-sm">{email.fromName}</div>
                            <div className="text-sm text-secondary">{email.fromEmail}</div>
                        </div>

                        <div className="mb-4">
                            <label className="field-label block mb-1" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Related Campaign</label>
                            {email.campaign ? (
                                <div className="font-medium text-primary text-sm flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FiTarget size={14} />
                                    {email.campaign.name}
                                </div>
                            ) : (
                                <div className="text-sm text-secondary">None (Direct Marketing)</div>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="field-label block mb-1" style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Recipients</label>
                            <div className="font-medium text-sm flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FiUsers size={14} />
                                {email.recipientType === 'all' ? 'All Leads & Contacts' :
                                    email.recipientType === 'contacts' ? 'All Client Contacts' :
                                        email.recipientType === 'leads' ? 'All Leads' : 'Specific Segment'}
                            </div>
                        </div>
                    </div>

                    <div className="detail-card mt-6">
                        <h3 className="card-title">Owner</h3>
                        <div className="owner-display" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                            <div className="owner-avatar-placeholder" style={{
                                width: '32px', height: '32px', borderRadius: '50%', background: '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#374151'
                            }}>
                                {email.owner?.user?.name ? email.owner.user.name.substring(0, 2).toUpperCase() : 'NA'}
                            </div>
                            <div className="field-value font-medium text-sm">
                                {email.owner?.user?.name || 'Unassigned'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailDetails;
