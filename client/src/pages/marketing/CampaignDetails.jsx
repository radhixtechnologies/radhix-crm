import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { FiEdit, FiBarChart2, FiUsers, FiDollarSign, FiMail, FiSend, FiClock, FiActivity } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/marketing/campaigns.css';

const CampaignDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [emails, setEmails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [campaignRes, emailsRes] = await Promise.all([
                marketingService.getCampaign(id),
                marketingService.getEmails({ campaign: id })
            ]);

            if (campaignRes.data.success) {
                setCampaign(campaignRes.data.data);
            }
            if (emailsRes.data?.success) {
                setEmails(emailsRes.data.data.emails || []);
            }
        } catch (error) {
            console.error('Error fetching campaign details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;
    if (!campaign) return <div>Campaign not found</div>;

    // Calculate Email Aggregates
    const emailMetrics = emails.reduce((acc, curr) => {
        const m = curr.metrics || {};
        acc.sent += m.sent || 0;
        acc.opened += m.opened || 0;
        acc.clicked += m.clicked || 0;
        return acc;
    }, { sent: 0, opened: 0, clicked: 0 });

    const openRate = emailMetrics.sent > 0 ? (emailMetrics.opened / emailMetrics.sent) * 100 : 0;
    const clickRate = emailMetrics.sent > 0 ? (emailMetrics.clicked / emailMetrics.sent) * 100 : 0;

    // Budget
    const budgetUtilized = campaign.budget > 0 ? (campaign.actualSpend / campaign.budget) * 100 : 0;

    return (
        <div className="campaign-details-page fade-in">
            {/* 1. HEADER SECTION */}
            <div className="details-header-container">
                <div className="header-left">
                    <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 12px 0', color: 'var(--text-primary)' }}>{campaign.name}</h1>
                    <div className="header-meta-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <span className={`campaign-status status-${campaign.status}`}>
                            {campaign.status}
                        </span>
                        <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            color: 'var(--text-secondary)',
                            letterSpacing: '0.5px',
                            padding: '4px 10px',
                            background: 'var(--bg-secondary)',
                            borderRadius: '6px'
                        }}>
                            {campaign.type} Campaign
                        </span>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn btn-secondary" onClick={() => navigate(`/marketing/campaigns/edit/${id}`)}>
                        <FiEdit /> Edit
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/marketing/emails/create')}>
                        <FiSend /> New Email
                    </button>
                </div>
            </div>

            {/* 2. METRICS SECTION */}
            <div className="metrics-overview">
                {campaign.type === 'email' && emails.length > 0 ? (
                    // Email Specific Metrics
                    <>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiSend size={24} /></div>
                            <span className="metric-label">Emails Sent</span>
                            <span className="metric-value">{emailMetrics.sent.toLocaleString()}</span>
                        </div>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiMail size={24} /></div>
                            <span className="metric-label">Open Rate</span>
                            <span className="metric-value">{openRate.toFixed(1)}%</span>
                            <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>{emailMetrics.opened} Opens</small>
                        </div>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiActivity size={24} /></div>
                            <span className="metric-label">Click Rate</span>
                            <span className="metric-value">{clickRate.toFixed(1)}%</span>
                            <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>{emailMetrics.clicked} Clicks</small>
                        </div>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiUsers size={24} /></div>
                            <span className="metric-label">Total Leads</span>
                            <span className="metric-value">{campaign.metrics?.totalLeads || 0}</span>
                        </div>
                    </>
                ) : (
                    // Generic Metrics
                    <>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiUsers size={24} /></div>
                            <span className="metric-label">Total Leads</span>
                            <span className="metric-value">{campaign.metrics?.totalLeads || 0}</span>
                        </div>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiDollarSign size={24} /></div>
                            <span className="metric-label">Actual Spend</span>
                            <span className="metric-value">{formatCurrency(campaign.actualSpend || 0, campaign.currency)}</span>
                            <small className="text-secondary mt-1" style={{ fontSize: '11px' }}>Budget: {formatCurrency(campaign.budget || 0, campaign.currency)}</small>
                            <div className="progress-bar-container" style={{ marginTop: '8px', height: '4px' }}>
                                <div className="progress-bar" style={{ width: `${Math.min(budgetUtilized, 100)}%` }}></div>
                            </div>
                        </div>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiBarChart2 size={24} /></div>
                            <span className="metric-label">ROI</span>
                            <span className="metric-value">{campaign.roi?.toFixed(1) || 0}%</span>
                        </div>
                        <div className="metric-card">
                            <div className="metric-card-icon"><FiMail size={24} /></div>
                            <span className="metric-label">Conversion Rate</span>
                            <span className="metric-value">{campaign.conversionRate?.toFixed(1) || 0}%</span>
                        </div>
                    </>
                )}
            </div>

            {/* 3. MAIN CONTENT SECTION */}
            <div className="campaign-main-grid">
                {/* Left Column (70%) */}
                <div className="main-left">
                    <div className="detail-card">
                        <h2 className="section-title">Campaign Overview</h2>

                        <div className="campaign-dates-section" style={{ marginBottom: '20px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                            <label className="field-label" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                                Campaign Duration
                            </label>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
                            </div>
                        </div>

                        <p className="text-secondary mb-6" style={{ lineHeight: '1.6' }}>
                            {campaign.description || 'No description provided'}
                        </p>

                        <div className="target-audience-section">
                            {campaign.segment && (
                                <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
                                    <label className="field-label" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                                        Linked Segment
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-color)' }}>
                                            {campaign.segment.name}
                                        </span>
                                        <span className="badge" style={{ fontSize: '11px' }}>
                                            {campaign.segment.type === 'dynamic' ? 'Dynamic' : 'Static'}
                                        </span>
                                        <span className="text-secondary" style={{ fontSize: '12px' }}>
                                            ({campaign.segment.totalCount} leads)
                                        </span>
                                    </div>
                                </div>
                            )}

                            <label className="field-label block mb-3" style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '600', color: 'var(--text-secondary)' }}>
                                Target Audience
                            </label>
                            {campaign.targetAudience ? (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                    {[
                                        { key: 'industry', label: 'Industry' },
                                        { key: 'location', label: 'Location' },
                                        { key: 'companySize', label: 'Size' },
                                        { key: 'leadTemperature', label: 'Temp' },
                                        { key: 'leadSource', label: 'Source' },
                                        { key: 'engagementLevel', label: 'Engagement' },
                                        { key: 'purchaseHistory', label: 'History' }
                                    ].map(({ key, label }) => {
                                        const value = campaign.targetAudience[key];
                                        if (!value || (Array.isArray(value) && value.length === 0)) return null;

                                        const items = Array.isArray(value) ? value : [value];
                                        return items.map((item, i) => (
                                            <span key={`${key}-${i}`} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span style={{ opacity: 0.7, fontSize: '10px' }}>{label}:</span>
                                                {item}
                                            </span>
                                        ));
                                    })}
                                </div>
                            ) : <span className="text-secondary">Not defined</span>}
                        </div>
                    </div>


                    {/* Leads Section */}
                    <div className="detail-card">
                        <div className="flex justify-between items-center mb-4" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <h2 className="section-title mb-0">Campaign Leads ({campaign.metrics?.totalLeads || 0})</h2>
                        </div>

                        {campaign.leads && campaign.leads.length > 0 ? (
                            <div className="leads-table-container">
                                <table className="simple-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>NAME</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>STATUS</th>
                                            <th style={{ textAlign: 'left', padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>TEMP</th>
                                            <th style={{ textAlign: 'right', padding: '12px', color: 'var(--text-secondary)', fontSize: '12px' }}>DATE</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {campaign.leads.map(lead => (
                                            <tr key={lead._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                                <td style={{ padding: '12px' }}>
                                                    <div className="font-medium text-primary">{lead.name}</div>
                                                    <div className="text-sm text-secondary">{lead.company}</div>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span className={`status-badge status-${lead.status}`}>{lead.status}</span>
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    {lead.leadTemperature ? (
                                                        <span className={`temp-badge temp-${lead.leadTemperature}`} style={{
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            background: lead.leadTemperature === 'hot' ? '#fee2e2' : lead.leadTemperature === 'warm' ? '#fef3c7' : '#e0f2fe',
                                                            color: lead.leadTemperature === 'hot' ? '#b91c1c' : lead.leadTemperature === 'warm' ? '#b45309' : '#0369a1'
                                                        }}>
                                                            {lead.leadTemperature}
                                                        </span>
                                                    ) : <span className="text-secondary text-sm">-</span>}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {formatDate(lead.createdAt)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-secondary">
                                <p>No leads generated from this campaign yet.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (30%) */}
                <div className="main-right">
                    <div style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                                color: 'var(--text-secondary)',
                                letterSpacing: '0.5px'
                            }}>
                                Assigned
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div className="owner-avatar-placeholder" style={{ width: '28px', height: '28px', fontSize: '11px' }}>
                                    {campaign.owner?.user?.name ? campaign.owner.user.name.substring(0, 2).toUpperCase() : 'NA'}
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                                    {campaign.owner?.user?.name || 'Unassigned'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Email Activities - Moved to Right Column */}
                    <div className="detail-card" style={{ marginTop: '16px' }}>
                        <h3 className="card-title" style={{ marginBottom: '12px' }}>Email Activities ({emails.length})</h3>

                        {emails.length > 0 ? (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {emails.map(email => (
                                    <div
                                        key={email._id}
                                        onClick={() => navigate(`/marketing/emails/${email._id}`)}
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid var(--border-light)',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <div style={{ marginBottom: '6px' }}>
                                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                                                {email.subject}
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                Type: {email.recipientType.toUpperCase()}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                                            <span className={`status-badge status-${email.status || 'draft'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                                                {email.status || 'Draft'}
                                            </span>
                                            <span style={{ color: 'var(--text-secondary)' }}>
                                                {formatDate(email.createdAt)}
                                            </span>
                                        </div>
                                        {email.metrics && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                <span>Sent: {email.metrics.sent || 0}</span>
                                                <span>Opens: {email.metrics.opened || 0}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 12px', color: 'var(--text-secondary)' }}>
                                <p style={{ fontSize: '13px', marginBottom: '8px' }}>No email activities yet.</p>
                                <button
                                    onClick={() => navigate('/marketing/emails/create')}
                                    style={{
                                        color: 'var(--primary)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '12px',
                                        textDecoration: 'underline'
                                    }}
                                >
                                    Create first email
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CampaignDetails;
