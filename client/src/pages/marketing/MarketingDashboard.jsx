
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBarChart2, FiTarget, FiMail, FiUsers, FiTrendingUp, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import '../../styles/dashboard/superadmin-dashboard-new.css';

const MarketingDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [overview, setOverview] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            setLoading(true);
            setError('');
            const [res, activeCampaignsRes] = await Promise.all([
                marketingService.getMarketingOverview({}),
                marketingService.getCampaigns({ status: 'active', limit: 1 }),
            ]);
            if (res.data?.success) {
                const campaignData = activeCampaignsRes.data?.data;
                setOverview({
                    ...res.data.data,
                    activeCampaigns: campaignData?.pagination?.totalItems ?? campaignData?.campaigns?.length ?? 0,
                });
            } else {
                setError(res.data?.message || 'Unable to load marketing overview.');
            }
        } catch (err) {
            console.error('Error fetching marketing overview:', err);
            setError('Unable to load marketing overview. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;

    return (
        <div className="superadmin-dashboard-new">
            <div className="page-content">
                <div className="dashboard-layout-container">
                    <main className="dashboard-main-content">
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '28px' }}>Marketing Dashboard</h2>
                                    <p style={{ margin: '6px 0 0', color: '#64748b' }}>Campaign and audience performance overview</p>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-secondary" onClick={fetchOverview}>
                                        <FiRefreshCw /> Refresh
                                    </button>
                                    <button className="btn btn-primary" onClick={() => navigate('/marketing/campaigns')}>
                                        <FiTarget /> Manage Campaigns
                                    </button>
                                </div>
                            </div>

                            {error ? (
                                <div className="dashboard-error" style={{ padding: '20px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '12px', color: '#9f1239' }}>
                                    {error}
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                                    <div className="summary-card">
                                        <div className="card-icon"><FiTarget /></div>
                                        <div className="card-content">
                                            <div className="card-label">Campaigns</div>
                                            <div className="card-value">{overview?.campaigns ?? 0}</div>
                                            <div className="card-subtitle">Total campaigns</div>
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <div className="card-icon"><FiMail /></div>
                                        <div className="card-content">
                                            <div className="card-label">Emails</div>
                                            <div className="card-value">{overview?.emails ?? 0}</div>
                                            <div className="card-subtitle">Prepared and sent</div>
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <div className="card-icon"><FiUsers /></div>
                                        <div className="card-content">
                                            <div className="card-label">Leads</div>
                                            <div className="card-value">{overview?.leads ?? 0}</div>
                                            <div className="card-subtitle">Available records</div>
                                        </div>
                                    </div>

                                    <div className="summary-card">
                                        <div className="card-icon"><FiTrendingUp /></div>
                                        <div className="card-content">
                                            <div className="card-label">Pipeline</div>
                                            <div className="card-value">{overview?.activeCampaigns ?? 0}</div>
                                            <div className="card-subtitle">Active campaigns</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                                <button className="btn btn-primary" onClick={() => navigate('/marketing/campaigns')} style={{ justifyContent: 'center', minHeight: '120px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700 }}><FiTarget /> Campaigns</div>
                                        <div style={{ marginTop: '8px', opacity: 0.9 }}>Create and manage campaigns</div>
                                    </div>
                                </button>

                                <button className="btn btn-secondary" onClick={() => navigate('/marketing/emails')} style={{ justifyContent: 'center', minHeight: '120px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700 }}><FiMail /> Emails</div>
                                        <div style={{ marginTop: '8px', opacity: 0.9 }}>Draft, schedule, and send campaigns</div>
                                    </div>
                                </button>

                                <button className="btn btn-secondary" onClick={() => navigate('/marketing/segments')} style={{ justifyContent: 'center', minHeight: '120px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700 }}><FiUsers /> Segments</div>
                                        <div style={{ marginTop: '8px', opacity: 0.9 }}>Build audience groups and filters</div>
                                    </div>
                                </button>

                                <button className="btn btn-secondary" onClick={() => navigate('/marketing/reports')} style={{ justifyContent: 'center', minHeight: '120px' }}>
                                    <div style={{ textAlign: 'left' }}>
                                        <div style={{ fontSize: '20px', fontWeight: 700 }}><FiBarChart2 /> Reports</div>
                                        <div style={{ marginTop: '8px', opacity: 0.9 }}>View performance and ROI</div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default MarketingDashboard;
