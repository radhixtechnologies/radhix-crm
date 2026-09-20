import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import {
    FiArrowLeft,
    FiEdit2,
    FiTrash2,
    FiRefreshCw,
    FiUsers,
    FiUserCheck,
    FiUserPlus,
    FiFilter,
    FiMail,
    FiPhone,
    FiBriefcase
} from 'react-icons/fi';
import '../../styles/marketing/segments.css';

const SegmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [segment, setSegment] = useState(null);
    const [members, setMembers] = useState({ leads: [], contacts: [] });
    const [counts, setCounts] = useState({ totalMembers: 0, leads: 0, contacts: 0 });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchSegmentData();
    }, [id]);

    const fetchSegmentData = async () => {
        try {
            setLoading(true);

            // Fetch segment metadata
            const segmentRes = await marketingService.getSegment(id);
            if (segmentRes.data.success) {
                setSegment(segmentRes.data.data);
            }

            // Resolve segment members
            const resolveRes = await marketingService.resolveSegment(id);
            if (resolveRes.data.success) {
                setMembers({
                    leads: resolveRes.data.data.leads || [],
                    contacts: resolveRes.data.data.contacts || []
                });
                setCounts(resolveRes.data.data.counts || { totalMembers: 0, leads: 0, contacts: 0 });
            }
        } catch (error) {
            console.error('Error fetching segment data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            await marketingService.refreshSegment(id);
            await fetchSegmentData();
        } catch (error) {
            console.error('Error refreshing segment:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this segment?')) {
            try {
                await marketingService.deleteSegment(id);
                navigate('/marketing/segments');
            } catch (error) {
                console.error('Error deleting segment:', error);
                alert('Failed to delete segment. It may be in use by campaigns.');
            }
        }
    };

    const getDisplayMembers = () => {
        if (activeTab === 'leads') return members.leads;
        if (activeTab === 'contacts') return members.contacts;
        return [...members.leads, ...members.contacts];
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getOperatorLabel = (operator) => {
        const labels = {
            'equals': '=',
            'not_equals': '≠',
            'contains': 'contains',
            'not_contains': 'does not contain',
            'in': 'is one of',
            'not_in': 'is not one of',
            'greater_than': '>',
            'less_than': '<',
            'between': 'between'
        };
        return labels[operator] || operator;
    };

    if (loading) return <Loader />;
    if (!segment) return <div>Segment not found</div>;

    return (
        <div className="segment-details-page">
            {/* Header */}
            <div className="details-header-container">
                <div className="header-left-section">
                    <button className="btn-back" onClick={() => navigate('/marketing/segments')}>
                        <FiArrowLeft />
                    </button>
                    <div>
                        <div className="header-meta-row">
                            <h1 className="segment-title">{segment.name}</h1>
                            <span className={`segment-type-badge ${segment.type === 'dynamic' ? 'type-dynamic' : 'type-static'}`}>
                                {segment.type}
                            </span>
                        </div>
                        <div className="header-dates">
                            <span>Created: {formatDate(segment.createdAt)}</span>
                            <span className="date-separator">•</span>
                            <span>Updated: {formatDate(segment.updatedAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="header-actions">
                    {segment.type === 'dynamic' && (
                        <button
                            className="btn-secondary-compact"
                            onClick={handleRefresh}
                            disabled={refreshing}
                        >
                            <FiRefreshCw className={refreshing ? 'spinning' : ''} />
                            {refreshing ? 'Refreshing...' : 'Refresh Rules'}
                        </button>
                    )}
                    <button
                        className="btn-secondary-compact"
                        onClick={() => navigate(`/marketing/segments/${id}/edit`)}
                    >
                        <FiEdit2 /> Edit
                    </button>
                    <button
                        className="btn-danger-compact"
                        onClick={handleDelete}
                    >
                        <FiTrash2 /> Delete
                    </button>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="metrics-overview">
                <div className="metric-card">
                    <div className="metric-card-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <FiUsers />
                    </div>
                    <div className="metric-label">Total Members</div>
                    <div className="metric-value">{counts.totalMembers}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-card-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                        <FiUserPlus />
                    </div>
                    <div className="metric-label">Leads</div>
                    <div className="metric-value">{counts.leads}</div>
                </div>
                <div className="metric-card">
                    <div className="metric-card-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                        <FiUserCheck />
                    </div>
                    <div className="metric-label">Contacts</div>
                    <div className="metric-value">{counts.contacts}</div>
                </div>
            </div>

            {/* Description */}
            {segment.description && (
                <div className="detail-section">
                    <h2 className="section-title">Description</h2>
                    <p className="segment-description-full">{segment.description}</p>
                </div>
            )}

            {/* Filter Criteria (for dynamic segments) */}
            {segment.type === 'dynamic' && segment.rules && segment.rules.length > 0 && (
                <div className="detail-section">
                    <h2 className="section-title">
                        <FiFilter style={{ display: 'inline', marginRight: '8px' }} />
                        Filter Criteria
                    </h2>
                    <div className="rules-list">
                        {segment.rules.map((rule, index) => (
                            <div key={index} className="rule-item">
                                <span className="rule-field">{rule.field}</span>
                                <span className="rule-operator">{getOperatorLabel(rule.operator)}</span>
                                <span className="rule-value">
                                    {Array.isArray(rule.value) ? rule.value.join(', ') : rule.value}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Campaigns Using This Segment */}
            {segment.usedInCampaigns && segment.usedInCampaigns.length > 0 && (
                <div className="detail-section">
                    <h2 className="section-title">Used in Campaigns ({segment.usedInCampaigns.length})</h2>
                    <div className="campaigns-list">
                        {segment.usedInCampaigns.map((campaign) => (
                            <div
                                key={campaign._id}
                                className="campaign-chip"
                                onClick={() => navigate(`/marketing/campaigns/${campaign._id}`)}
                            >
                                {campaign.name}
                                <span className={`campaign-status-badge status-${campaign.status}`}>
                                    {campaign.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Segment Members */}
            <div className="detail-section">
                <h2 className="section-title">Segment Members</h2>

                {/* Tabs */}
                <div className="members-tabs">
                    <button
                        className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All ({counts.totalMembers})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'leads' ? 'active' : ''}`}
                        onClick={() => setActiveTab('leads')}
                    >
                        Leads ({counts.leads})
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'contacts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contacts')}
                    >
                        Contacts ({counts.contacts})
                    </button>
                </div>

                {/* Members Table */}
                {getDisplayMembers().length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FiUsers size={48} />
                        </div>
                        <h3 className="empty-state-title">No members found</h3>
                        <p className="empty-state-description">
                            {segment.type === 'dynamic'
                                ? 'No leads or contacts match the current filter criteria'
                                : 'Add members to this static segment'}
                        </p>
                    </div>
                ) : (
                    <div className="members-table-container">
                        <table className="members-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    {activeTab !== 'contacts' && <th>Temperature</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {getDisplayMembers().map((member) => (
                                    <tr key={member._id}>
                                        <td className="member-name">{member.name}</td>
                                        <td>
                                            <div className="member-email">
                                                <FiMail size={14} />
                                                {member.email || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="member-phone">
                                                <FiPhone size={14} />
                                                {member.phone || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="member-company">
                                                <FiBriefcase size={14} />
                                                {member.company || 'N/A'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-badge status-${member.status}`}>
                                                {member.status || 'N/A'}
                                            </span>
                                        </td>
                                        {activeTab !== 'contacts' && (
                                            <td>
                                                {member.leadTemperature && (
                                                    <span className={`temp-badge temp-${member.leadTemperature}`}>
                                                        {member.leadTemperature}
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SegmentDetails;
