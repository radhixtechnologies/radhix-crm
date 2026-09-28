import { useState, useEffect } from 'react';
import { FiDownload, FiBarChart2, FiTrendingUp, FiMail, FiTarget } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatNumber } from '../../utils/format';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../../styles/marketing/marketing-reports.css';

const MarketingReports = () => {
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [overview, setOverview] = useState(null);
    const [campaigns, setCampaigns] = useState([]);
    const [emails, setEmails] = useState([]);
    const [leadSources, setLeadSources] = useState([]);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    useEffect(() => {
        const fetchReports = async () => {
            try {
                setLoading(true);
                const [overviewRes, campaignsRes, emailsRes, leadSourcesRes] = await Promise.all([
                    marketingService.getMarketingOverview(dateRange),
                    marketingService.getCampaignPerformanceReport(dateRange),
                    marketingService.getEmailAnalyticsReport(dateRange),
                    marketingService.getLeadSourceAnalysis(dateRange),
                ]);

                if (overviewRes.data?.success) setOverview(overviewRes.data.data);
                if (campaignsRes.data?.success) {
                    const data = campaignsRes.data.data;
                    setCampaigns(Array.isArray(data) ? data : data?.report || []);
                }
                if (emailsRes.data?.success) {
                    const data = emailsRes.data.data;
                    setEmails(Array.isArray(data) ? data : data?.report || []);
                }
                if (leadSourcesRes.data?.success) {
                    const data = leadSourcesRes.data.data;
                    const sources = Array.isArray(data) ? data : data?.analysis || [];
                    const totalLeads = sources.reduce((total, source) => total + Number(source.count || 0), 0);
                    setLeadSources(sources.map(source => {
                        const count = Number(source.count || 0);
                        return {
                            ...source,
                            source: source.source || source._id || 'Unknown',
                            count,
                            percentage: totalLeads ? (count / totalLeads) * 100 : 0,
                        };
                    }));
                }
            } catch (error) {
                console.error('Error fetching reports:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [dateRange]);

    const handleExport = async (reportType, format) => {
        try {
            await marketingService.exportMarketingReport({
                reportType,
                format,
                filters: dateRange,
            });
        } catch (error) {
            console.error('Error exporting report:', error);
        }
    };

    const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    if (loading) return <Loader />;

    return (
        <div className="marketing-reports-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Marketing Reports</h1>
                    <p className="page-subtitle">Comprehensive analytics and insights</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleExport(activeTab, 'csv')}
                    >
                        <FiDownload /> Export CSV
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={() => handleExport(activeTab, 'pdf')}
                    >
                        <FiDownload /> Export PDF
                    </button>
                </div>
            </div>

            <div className="date-range-filter">
                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="form-input"
                />
                <span>to</span>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="form-input"
                />
            </div>

            <div className="reports-tabs">
                <button
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <FiBarChart2 /> Overview
                </button>
                <button
                    className={`tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`}
                    onClick={() => setActiveTab('campaigns')}
                >
                    <FiTarget /> Campaigns
                </button>
                <button
                    className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
                    onClick={() => setActiveTab('emails')}
                >
                    <FiMail /> Emails
                </button>
                <button
                    className={`tab-btn ${activeTab === 'leads' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leads')}
                >
                    <FiTrendingUp /> Lead Sources
                </button>
            </div>

            <div className="reports-content">
                {activeTab === 'overview' && (
                    <div className="overview-report">
                        <div className="summary-cards">
                            <div className="summary-card">
                                <div className="card-icon">
                                    <FiTarget />
                                </div>
                                <div className="card-content">
                                    <div className="card-label">Total Campaigns</div>
                                    <div className="card-value">{formatNumber(overview?.campaigns?.total || 0)}</div>
                                    <div className="card-subtitle">{overview?.campaigns?.active || 0} active</div>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="card-icon">
                                    <FiMail />
                                </div>
                                <div className="card-content">
                                    <div className="card-label">Emails Sent</div>
                                    <div className="card-value">{formatNumber(overview?.emails?.totalSent || 0)}</div>
                                    <div className="card-subtitle">{(overview?.emails?.avgOpenRate || 0).toFixed(1)}% open rate</div>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="card-icon">
                                    <FiTrendingUp />
                                </div>
                                <div className="card-content">
                                    <div className="card-label">Total Leads</div>
                                    <div className="card-value">{formatNumber(overview?.leads?.total || 0)}</div>
                                    <div className="card-subtitle">{(overview?.leads?.avgConversionRate || 0).toFixed(1)}% conversion</div>
                                </div>
                            </div>

                            <div className="summary-card">
                                <div className="card-icon">
                                    <FiBarChart2 />
                                </div>
                                <div className="card-content">
                                    <div className="card-label">ROI</div>
                                    <div className="card-value">{(overview?.campaigns?.roi || 0).toFixed(1)}%</div>
                                    <div className="card-subtitle">{formatCurrency(overview?.campaigns?.totalRevenue || 0)} revenue</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'campaigns' && (
                    <div className="campaigns-report">
                        <div className="report-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Campaign</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Budget</th>
                                        <th>Spend</th>
                                        <th>Leads</th>
                                        <th>Conversion</th>
                                        <th>ROI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign._id || campaign.id}>
                                            <td>{campaign.name}</td>
                                            <td><span className="type-badge">{campaign.type}</span></td>
                                            <td><span className={`status-badge status-${campaign.status}`}>{campaign.status}</span></td>
                                            <td>{formatCurrency(campaign.budget)}</td>
                                            <td>{formatCurrency(campaign.actualSpend)}</td>
                                            <td>{formatNumber(campaign.metrics?.totalLeads || 0)}</td>
                                            <td>{Number(campaign.conversionRate || 0).toFixed(1)}%</td>
                                            <td className={(campaign.roi || 0) >= 0 ? 'text-success' : 'text-danger'}>
                                                {Number(campaign.roi || 0).toFixed(1)}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'emails' && (
                    <div className="emails-report">
                        <div className="report-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Subject</th>
                                        <th>Campaign</th>
                                        <th>Sent</th>
                                        <th>Delivered</th>
                                        <th>Opened</th>
                                        <th>Clicked</th>
                                        <th>Open Rate</th>
                                        <th>Click Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {emails.map((email) => (
                                        <tr key={email._id || email.id}>
                                            <td>{email.subject}</td>
                                            <td>{email.campaign?.name || email.campaign || '—'}</td>
                                            <td>{formatNumber(email.metrics?.sent || 0)}</td>
                                            <td>{formatNumber(email.metrics?.delivered || 0)}</td>
                                            <td>{formatNumber(email.metrics?.opened || 0)}</td>
                                            <td>{formatNumber(email.metrics?.clicked || 0)}</td>
                                            <td>{Number(email.openRate || 0).toFixed(1)}%</td>
                                            <td>{Number(email.clickRate || 0).toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'leads' && (
                    <div className="leads-report">
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={leadSources}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ source, percentage }) => `${source}: ${percentage.toFixed(1)}%`}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {leadSources.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="report-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Source</th>
                                        <th>Total Leads</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leadSources.map((source, index) => (
                                        <tr key={index}>
                                            <td>
                                                <span className="source-badge" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                                    {source.source}
                                                </span>
                                            </td>
                                            <td>{formatNumber(source.count)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MarketingReports;
