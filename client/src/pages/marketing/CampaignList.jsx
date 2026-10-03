import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiFilter, FiCalendar, FiDollarSign, FiChevronUp, FiChevronDown, FiTarget, FiCheckCircle, FiPause } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService'; // Make sure this service is created
import Loader from '../../components/common/Loader';
import '../../styles/marketing/email-marketing.css';
import { formatCurrency, formatDate } from '../../utils/format'; // Assuming these utils exist

const CampaignList = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', type: '', search: '' });
    // Buffered Filter State
    const [filterInputs, setFilterInputs] = useState({ status: '', type: '', search: '' });
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    useEffect(() => {
        fetchCampaigns();
    }, [filters]); // Refetch when filters change

    const fetchCampaigns = async () => {
        try {
            setLoading(true);
            const res = await marketingService.getCampaigns(filters);
            if (res.data.success) {
                setCampaigns(res.data.data.campaigns || []);
            }
        } catch (error) {
            console.error('Error fetching campaigns:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        draft: 'status-draft',
        active: 'status-active',
        completed: 'status-completed',
        scheduled: 'status-scheduled',
        paused: 'status-paused'
    };

    const handleApplyFilters = () => {
        setFilters({ ...filters, ...filterInputs });
        setShowFilters(false);
    };

    const clearFilters = () => {
        const resetState = { status: '', type: '', search: '' };
        setFilterInputs(resetState);
        setFilters(resetState);
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.status) count++;
        if (filterInputs.type) count++;
        return count;
    };

    return (
        <div className="timesheets-list-page fade-in">
            {/* Header Row */}
            <div className="timesheets-page-header">
                <div className="header-title-group">
                    <div className="title-text">
                        <h1 className="page-title">Campaigns</h1>
                        <p className="page-subtitle">
                            {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/marketing/campaigns/new')}
                    >
                        <FiPlus size={16} />
                        Create Campaign
                    </button>
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
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
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>Filters</span>
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

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Campaigns */}
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
                        <FiTarget />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {campaigns.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Campaigns
                        </div>
                    </div>
                </div>

                {/* Active */}
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
                            {campaigns.filter(c => c.status === 'active').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Active
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
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCalendar />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {campaigns.filter(c => c.status === 'completed').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Completed
                        </div>
                    </div>
                </div>

                {/* Paused */}
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
                        <FiPause />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {campaigns.filter(c => c.status === 'paused').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Paused
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar Section */}
            <div className="search-bar-section" style={{ marginBottom: '16px' }}>
                <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search campaigns..."
                        value={filterInputs.search}
                        onChange={(e) => setFilterInputs({ ...filterInputs, search: e.target.value })}
                    />
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50 }}>

                {/* 2. Filter Panel (Absolute Overlay) */}
                {showFilters && (
                    <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        width: '100%',
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
                                        <option value="active">Active</option>
                                        <option value="draft">Draft</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="paused">Paused</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Type Filter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</label>
                                <div style={{ position: 'relative', width: '160px' }}>
                                    <select
                                        value={filterInputs.type}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, type: e.target.value })}
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
                                        <option value="">All Types</option>
                                        <option value="email">Email</option>
                                        <option value="social-media">Social Media</option>
                                        <option value="webinar">Webinar</option>
                                        <option value="event">Event</option>
                                        <option value="paid-ads">Paid Ads</option>
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


            {/* Content */}
            <div className="timesheets-content-wrapper">
                {loading ? (
                    <Loader />
                ) : (
                    <div className="emails-grid">
                        {campaigns.length > 0 ? (
                            campaigns.map((campaign) => (
                                <div
                                    key={campaign._id}
                                    className="email-card"
                                    onClick={() => navigate(`/marketing/campaigns/${campaign._id}`)}
                                >
                                    <div className="email-header">
                                        <span className={`email-status ${statusColors[campaign.status] || 'status-draft'}`}>
                                            {campaign.status}
                                        </span>
                                        <span className="email-campaign">{campaign.type}</span>
                                    </div>

                                    <h3 className="email-subject">{campaign.name}</h3>

                                    <div className="email-meta">
                                        <div className="meta-item">
                                            <span className="meta-label">Dates:</span>
                                            <span className="meta-value">{formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}</span>
                                        </div>
                                    </div>

                                    <div className="email-metrics">
                                        <div className="metric-item">
                                            <div className="metric-label">Budget</div>
                                            <div className="metric-value">{formatCurrency(campaign.budget || 0, campaign.currency)}</div>
                                        </div>
                                        <div className="metric-item">
                                            <div className="metric-label">Spend</div>
                                            <div className="metric-value">{formatCurrency(campaign.actualSpend || 0, campaign.currency)}</div>
                                        </div>
                                        <div className="metric-item">
                                            <div className="metric-label">Leads</div>
                                            <div className="metric-value">{campaign.metrics?.totalLeads || 0}</div>
                                        </div>
                                        <div className="metric-item">
                                            <div className="metric-label">Revenue</div>
                                            <div className="metric-value">{formatCurrency(campaign.metrics?.revenue || 0, campaign.currency)}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <FiCalendar size={64} />
                                <h3>No campaigns found</h3>
                                <p>Create your first campaign to get started!</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => navigate('/marketing/campaigns/new')}
                                >
                                    <FiPlus /> Create Campaign
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignList;
