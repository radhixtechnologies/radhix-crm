import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { FiPlus, FiUsers, FiFilter, FiTarget, FiZap, FiDatabase } from 'react-icons/fi';
import '../../styles/marketing/segments.css';

const SegmentList = () => {
    const navigate = useNavigate();
    const [segments, setSegments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        fetchSegments();
    }, [search, typeFilter]);

    const fetchSegments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;

            const res = await marketingService.getSegments(params);
            if (res.data.success) {
                setSegments(res.data.data.segments || []);
            }
        } catch (error) {
            console.error('Error fetching segments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeBadgeClass = (type) => {
        return type === 'dynamic' ? 'type-dynamic' : 'type-static';
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) return <Loader />;

    return (
        <div className="segment-list-page">
            {/* Header */}
            <div className="page-header-compact">
                <div className="header-left">
                    <div className="header-title-section">
                        <h1 className="page-title-compact">Segments</h1>
                        <p className="page-subtitle-compact">{segments.length} total</p>
                    </div>
                </div>

                <div className="header-center">
                    <div className="search-bar-compact">
                        <FiFilter className="search-icon" />
                        <input
                            type="text"
                            className="search-input"
                            placeholder="Search segments..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="header-right">
                    <select
                        className="filter-select"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="dynamic">Dynamic</option>
                        <option value="static">Static</option>
                    </select>

                    <button
                        className="btn-primary-compact"
                        onClick={() => navigate('/marketing/segments/new')}
                    >
                        <FiPlus /> Create Segment
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
                {/* Total Segments */}
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
                            {segments.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Segments
                        </div>
                    </div>
                </div>

                {/* Dynamic */}
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
                        <FiZap />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {segments.filter(s => s.type === 'dynamic').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Dynamic
                        </div>
                    </div>
                </div>

                {/* Static */}
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
                        <FiDatabase />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {segments.filter(s => s.type === 'static').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Static
                        </div>
                    </div>
                </div>

                {/* Total Members */}
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
                        <FiUsers />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {segments.reduce((sum, s) => sum + (s.cachedCounts?.totalMembers || 0), 0)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Members
                        </div>
                    </div>
                </div>
            </div>

            {/* Segments Grid */}
            <div className="segment-grid">
                {segments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <FiUsers size={48} />
                        </div>
                        <h3 className="empty-state-title">No segments found</h3>
                        <p className="empty-state-description">
                            Create your first segment to start targeting your audience
                        </p>
                        <button
                            className="btn-primary-compact"
                            onClick={() => navigate('/marketing/segments/new')}
                            style={{ marginTop: '16px' }}
                        >
                            <FiPlus /> Create Segment
                        </button>
                    </div>
                ) : (
                    segments.map((segment) => (
                        <div
                            key={segment._id}
                            className="segment-card"
                            onClick={() => navigate(`/marketing/segments/${segment._id}`)}
                        >
                            <div className="segment-header">
                                <span className={`segment-type-badge ${getTypeBadgeClass(segment.type)}`}>
                                    {segment.type}
                                </span>
                            </div>

                            <h3 className="segment-name">{segment.name}</h3>

                            {segment.description && (
                                <p className="segment-description">{segment.description}</p>
                            )}

                            <div className="segment-metrics">
                                <div className="metric-item">
                                    <span className="metric-label">Total Members</span>
                                    <span className="metric-value">
                                        {segment.cachedCounts?.totalMembers || 0}
                                    </span>
                                </div>
                                <div className="metric-item">
                                    <span className="metric-label">Last Updated</span>
                                    <span className="metric-value" style={{ fontSize: '14px' }}>
                                        {formatDate(segment.updatedAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SegmentList;
