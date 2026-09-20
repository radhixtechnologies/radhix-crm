import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuickActions } from '../../context/QuickActionsContext';
import {
  FiUsers, FiDollarSign, FiTrendingUp, FiTarget, FiCheckCircle,
  FiClock, FiAward, FiActivity, FiCalendar, FiFileText,
  FiRefreshCw, FiDownload, FiFilter, FiArrowUp, FiArrowDown,
  FiZap, FiPieChart, FiBarChart2, FiShield, FiX, FiMenu, FiShoppingCart, FiTag
} from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatNumber, formatDate } from '../../utils/format';
import QuickActions from '../../components/dashboard/QuickActions';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import VisitorInsightsLineChart from '../../components/dashboard/Charts/VisitorInsightsLineChart';
import KPIBadge from '../../components/dashboard/KPIBadge';
import '../../styles/dashboard/superadmin-dashboard-new.css';
import '../../styles/infinity-edition.css';

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  teal: '#14B8A6',
  indigo: '#6366F1'
};

const STAGE_COLORS = {
  'new-deal': COLORS.primary,
  'proposal': COLORS.warning,
  'quotation': COLORS.purple,
  'negotiation': COLORS.teal,
  'closed-won': COLORS.success,
  'closed-lost': COLORS.danger
};

const SalesDashboard = () => {
  const navigate = useNavigate();
  const { isOpen: quickActionsOpen, toggleQuickActions, closeQuickActions } = useQuickActions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('30');
  const [stats, setStats] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setErrorMessage('');
      const response = await salesService.getDashboardStats({ period });
      if (response.data?.success) {
        setStats(response.data.data);
      } else {
        setStats(null);
        setErrorMessage(response.data?.message || 'The dashboard data could not be loaded.');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setStats(null);
      setErrorMessage(
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK'
          ? 'Cannot connect to the server. Start the backend and make sure MongoDB is running.'
          : 'The dashboard data could not be loaded. Please try again.')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) return <Loader />;
  if (!stats) {
    return (
      <div className="dashboard-error">
        <strong>Failed to load dashboard data</strong>
        <span>{errorMessage || 'Please try again.'}</span>
        <button type="button" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
          Try again
        </button>
      </div>
    );
  }

  const { kpis, pipeline, monthlyRevenue, leadsBySource, recentActivity, topDeals } = stats;

  // Format monthly revenue for charts
  const revenueChartData = monthlyRevenue?.map(item => ({
    month: new Date(2024, item._id.month - 1).toLocaleString('default', { month: 'short' }),
    revenue: item.revenue,
    deals: item.count
  })) || [];

  // Format pipeline data
  const pipelineChartData = pipeline?.map(stage => ({
    name: stage._id.replace(/-/g, ' ').toUpperCase(),
    value: stage.totalValue,
    count: stage.count,
    avg: Math.round(stage.avgValue || 0)
  })) || [];

  // Format lead source data
  const sourceChartData = leadsBySource?.map(source => ({
    name: source._id || 'Unknown',
    value: source.count,
    converted: source.converted,
    rate: source.count > 0 ? Math.round((source.converted / source.count) * 100) : 0
  })) || [];

  return (
    <div className="superadmin-dashboard-new">
      <div className="page-content">
        {/* Compact Header Section */}
        <header className="ep-header">
          <div className="ep-identity">
            <div className="ep-avatar-placeholder"><FiTrendingUp /></div>
            <div className="ep-info-row">
              <div className="ep-name-row">
                <h1 className="ep-name">Sales Dashboard</h1>
                <span className="ep-status-badge status-active">Growth Target Tracked</span>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-item"><FiActivity /> Conversion: {kpis.conversionRate}%</div>
                <div className="ep-meta-item"><FiClock /> Avg Cycle: {kpis.avgDaysToClose} Days</div>
                <div className="ep-meta-item"><FiShield /> Data Secured</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              className="period-selector"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
            <button className="btn-outline-sm" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
              <FiRefreshCw className={refreshing ? 'spinning' : ''} />
            </button>
            <button className="btn-primary-sm" onClick={toggleQuickActions}><FiZap /> Sales Actions</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="ep-tabs-container">
          <div className="ep-tabs-list">
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'leads', label: 'Leads' },
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'clients', label: 'Deals/Clients' },
              { id: 'activity', label: 'Activity' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`ep-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Dynamic KPI Cards based on Tab */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {activeTab === 'summary' && (
            <>
              <KPIBadge icon={<FiDollarSign />} label="Total Revenue" value={formatCurrency(kpis.totalRevenue)} color="green" />
              <KPIBadge icon={<FiTarget />} label="Active Deals" value={formatNumber(kpis.totalDeals - kpis.wonDeals - kpis.lostDeals)} color="blue" />
              <KPIBadge icon={<FiUsers />} label="Total Leads" value={formatNumber(kpis.totalLeads)} color="purple" />
              <KPIBadge icon={<FiAward />} label="Win Rate" value={`${kpis.winRate}%`} color="yellow" />
            </>
          )}
          {activeTab === 'leads' && (
            <>
              <KPIBadge icon={<FiUsers />} label="New Leads" value={formatNumber(recentActivity?.leads?.length || 0)} color="blue" />
              <KPIBadge icon={<FiCheckCircle />} label="Converted" value={formatNumber(kpis.convertedLeads)} color="green" />
              <KPIBadge icon={<FiActivity />} label="Conv. Rate" value={`${kpis.conversionRate}%`} color="purple" />
              <KPIBadge icon={<FiClock />} label="Pending" value={formatNumber(kpis.totalLeads - kpis.convertedLeads)} color="orange" />
            </>
          )}
          {activeTab === 'pipeline' && (
            <>
              <KPIBadge icon={<FiTarget />} label="Pipeline Value" value={formatCurrency(pipelineChartData.reduce((sum, s) => sum + s.value, 0))} color="indigo" />
              <KPIBadge icon={<FiTrendingUp />} label="Avg Deal Size" value={formatCurrency(kpis.averageDealSize)} color="green" />
              <KPIBadge icon={<FiFileText />} label="Proposals" value={`${kpis.acceptedProposals}/${kpis.totalProposals}`} color="purple" />
              <KPIBadge icon={<FiClock />} label="Cycle Time" value={`${kpis.avgDaysToClose}d`} color="orange" />
            </>
          )}
          {activeTab === 'clients' && (
            <>
              <KPIBadge icon={<FiUsers />} label="Total Clients" value={formatNumber(kpis.totalClients)} color="blue" />
              <KPIBadge icon={<FiAward />} label="Won Deals" value={formatNumber(kpis.wonDeals)} color="green" />
              <KPIBadge icon={<FiDollarSign />} label="Current Month" value={formatCurrency(kpis.currentMonthRevenue)} color="purple" />
              <KPIBadge icon={<FiTrendingUp />} label="Top Value" value={formatCurrency(topDeals?.[0]?.value || 0)} color="yellow" />
            </>
          )}
          {activeTab === 'activity' && (
            <>
              <KPIBadge icon={<FiCalendar />} label="Follow-ups" value={formatNumber(kpis.followUpsPending)} color="orange" />
              <KPIBadge icon={<FiActivity />} label="Recent Acts" value={formatNumber(recentActivity?.upcoming?.length || 0)} color="blue" />
              <KPIBadge icon={<FiTarget />} label="Sales Hit Rate" value={`${kpis.winRate}%`} color="green" />
              <KPIBadge icon={<FiClock />} label="Avg Response" value="4h" color="purple" />
            </>
          )}
        </div>

        {/* Content Area */}
        <main className="ep-content-area">
          {activeTab === 'summary' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Monthly Revenue Trend</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: '#f9fafb' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value, name) => [
                          name === 'revenue' ? formatCurrency(value) : value,
                          name === 'revenue' ? 'Revenue' : 'Deals'
                        ]}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="revenue" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={30} />
                      <Bar dataKey="deals" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Pipeline Health</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pipelineChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                      >
                        {pipelineChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={Object.values(STAGE_COLORS)[index % 6]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leads' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Lead Sources</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} />
                      <Tooltip cursor={{ fill: '#f9fafb' }} />
                      <Bar dataKey="value" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Recent Leads</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Name</th><th>Company</th><th>Status</th></tr></thead>
                    <tbody>
                      {recentActivity?.leads?.slice(0, 8).map(lead => (
                        <tr key={lead._id} onClick={() => navigate(`/sales/leads/${lead._id}`)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 600 }}>{lead.name}</td>
                          <td>{lead.company || 'N/A'}</td>
                          <td>
                            <span className={`ep-status-badge status-${lead.status === 'converted' ? 'active' : 'inactive'}`}>
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Pipeline Analysis</div></div>
                <div className="ep-card-body">
                  <div className="pipeline-bars" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {pipelineChartData.map((stage, index) => {
                      const maxValue = Math.max(...pipelineChartData.map(s => s.value));
                      const percentage = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                      return (
                        <div key={index}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 600, fontSize: '13px' }}>{stage.name}</span>
                            <span style={{ fontWeight: 700, color: COLORS.primary }}>{formatCurrency(stage.value)}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${percentage}%`,
                              height: '100%',
                              background: Object.values(STAGE_COLORS)[index % 6]
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Recent Deals</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Deal Title</th><th>Value</th><th>Stage</th></tr></thead>
                    <tbody>
                      {recentActivity?.deals?.slice(0, 8).map(deal => (
                        <tr key={deal._id} onClick={() => navigate(`/sales/deals/${deal._id}`)} style={{ cursor: 'pointer' }}>
                          <td style={{ fontWeight: 600 }}>{deal.title}</td>
                          <td style={{ color: COLORS.success, fontWeight: 700 }}>{formatCurrency(deal.value)}</td>
                          <td>
                            <span className="ep-status-badge status-active">
                              {deal.stage?.replace(/-/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clients' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Top Performing Deals</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Client</th><th>Deal Title</th><th>Value</th></tr></thead>
                    <tbody>
                      {topDeals?.slice(0, 8).map((deal) => (
                        <tr key={deal._id}>
                          <td style={{ fontWeight: 600 }}>{deal.client?.name || 'N/A'}</td>
                          <td>{deal.title}</td>
                          <td style={{ fontWeight: 700, color: COLORS.purple }}>{formatCurrency(deal.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Quick Stats</div></div>
                <div className="ep-card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    {[
                      { label: 'Total Clients', value: kpis.totalClients, icon: <FiUsers />, color: 'blue' },
                      { label: 'Proposals', value: `${kpis.acceptedProposals}`, icon: <FiFileText />, color: 'purple' },
                      { label: 'Follow-ups', value: kpis.followUpsPending, icon: <FiCalendar />, color: 'orange' },
                      { label: 'Conversions', value: kpis.convertedLeads, icon: <FiCheckCircle />, color: 'green' }
                    ].map((stat, i) => (
                      <div key={i} style={{ padding: '20px', borderRadius: '12px', background: '#f9fafb' }}>
                        <div style={{ color: COLORS[stat.color] || COLORS.primary, marginBottom: '12px' }}>{stat.icon}</div>
                        <div style={{ fontSize: '20px', fontWeight: 800 }}>{stat.value}</div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600 }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="ep-card">
                <div className="ep-card-header">
                  <div className="ep-card-title">Upcoming Activities</div>
                </div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <div className="upcoming-list">
                    {recentActivity?.upcoming?.map(activity => (
                      <div key={activity._id} style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid #f3f4f6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '8px',
                            background: '#eff6ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: COLORS.primary
                          }}>
                            <FiActivity />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{activity.subject}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              {activity.assignedTo?.name} • {formatDate(activity.dueDate)}
                            </div>
                          </div>
                        </div>
                        <span className={`ep-status-badge status-${activity.type === 'call' ? 'active' : 'inactive'}`}>
                          {activity.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Quick Actions Sidebar Overlay */}
        <div className={`quick-actions-overlay ${quickActionsOpen ? 'overlay-open' : ''}`} onClick={closeQuickActions} />
        {
          quickActionsOpen && (
            <aside className="dashboard-quick-actions-sidebar quick-actions-open">
              <QuickActions />
            </aside>
          )
        }
      </div >
    </div >
  );
};

export default SalesDashboard;
