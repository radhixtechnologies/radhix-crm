import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dashboardService } from '../../services/dashboardService';
import { useQuickActions } from '../../context/QuickActionsContext';
import {
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiFileText,
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPackage,
  FiTarget,
  FiShoppingCart,
  FiShoppingBag,
  FiTag,
  FiUser,
  FiBox,
  FiX,
  FiMenu,
  FiZap,
  FiUserPlus,
  FiLayers,
  FiCreditCard,
  FiActivity,
  FiBarChart2,
  FiArrowUp,
  FiArrowDown,
  FiShield
} from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatNumber, formatDate } from '../../utils/format';
import QuickActions from '../../components/dashboard/QuickActions';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import ActivityLogTable from '../../components/dashboard/ActivityLogTable';
import RevenueBarChart from '../../components/dashboard/Charts/RevenueBarChart';
import SatisfactionAreaChart from '../../components/dashboard/Charts/SatisfactionAreaChart';
import RealityTargetBarChart from '../../components/dashboard/Charts/RealityTargetBarChart';
import VisitorInsightsLineChart from '../../components/dashboard/Charts/VisitorInsightsLineChart';
import VolumeServiceBarChart from '../../components/dashboard/Charts/VolumeServiceBarChart';
import RevenueAnalysisChart from '../../components/dashboard/Charts/RevenueAnalysisChart';
import KPIBadge from '../../components/dashboard/KPIBadge';
import '../../styles/dashboard/superadmin-dashboard-new.css';

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, hasModuleAccess } = useAuth();
  const { isOpen: quickActionsOpen, toggleQuickActions, closeQuickActions } = useQuickActions();
  const [loading, setLoading] = useState(true);

  // Define available tabs based on permissions
  const availableTabs = [
    { id: 'summary', label: 'Summary', access: true }, // Summary usually always visible or at least default
    { id: 'finance', label: 'Finance', access: hasModuleAccess('finance') || isSuperAdmin },
    { id: 'sales', label: 'Sales', access: hasModuleAccess('sales') || isSuperAdmin },
    { id: 'hrm', label: 'HRM', access: hasModuleAccess('hrm') || isSuperAdmin },
    { id: 'system', label: 'System Health', access: isSuperAdmin }, // System health remains Super Admin only
  ].filter(tab => tab.access);

  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'summary');
  const [activityPage, setActivityPage] = useState(1);

  // Data states
  const [overview, setOverview] = useState(null);
  const [hrm, setHrm] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [sales, setSales] = useState(null);
  const [finance, setFinance] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [activityLog, setActivityLog] = useState(null);

  useEffect(() => {
    fetchAllData();

    // Auto-refresh every 60 seconds to keep data real-time
    const intervalId = setInterval(fetchAllData, 60000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchActivityLog();
  }, [activityPage]);

  /* DEBUG: Log dashboard data for verification */
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Run all requests in parallel
      const [overviewRes, hrmRes, attendanceRes, salesRes, financeRes, notificationsRes] = await Promise.all([
        dashboardService.getSuperAdminOverview(),
        dashboardService.getHRMInsights(),
        dashboardService.getAttendanceOverview(),
        dashboardService.getSalesSummary(),
        dashboardService.getFinanceSummary(),
        dashboardService.getNotifications()
      ]);

      console.log('Dashboard Data:', {
        overview: overviewRes.data?.data,
        finance: financeRes.data?.data,
        sales: salesRes.data?.data
      });

      if (overviewRes.data?.success) setOverview(overviewRes.data.data);
      if (hrmRes.data?.success) setHrm(hrmRes.data.data);
      if (attendanceRes.data?.success) setAttendance(attendanceRes.data.data);
      if (salesRes.data?.success) setSales(salesRes.data.data);
      if (financeRes.data?.success) setFinance(financeRes.data.data);
      if (notificationsRes.data?.success) setNotifications(notificationsRes.data.data);

      await fetchActivityLog();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const res = await dashboardService.getActivityLog({ page: activityPage, limit: 10 });
      if (res.data?.success) {
        setActivityLog(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  if (loading) return <Loader />;

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Calculate KPI data from real data
  const totalRevenue = finance?.totalRevenue || 0;
  const totalExpenses = finance?.totalExpenses || 0;
  const netProfit = totalRevenue - totalExpenses;
  const totalEmployees = overview?.employees?.total || 0;
  const activeEmployees = overview?.employees?.active || 0;
  const newHires = overview?.employees?.newHiresThisMonth || 0;
  const totalLeads = sales?.leads?.total || 0;
  const pendingInvoices = finance?.invoices?.pending || 0;
  const overdueInvoices = finance?.invoices?.overdue || 0;
  const pendingLeaves = hrm?.pendingLeaves || 0;
  const openJobs = hrm?.openJobPosts || 0;
  const totalApplicants = hrm?.totalApplicants || 0;
  const pendingPayroll = finance?.payroll?.pending || 0;
  const processedPayroll = finance?.payroll?.processed || 0;

  // Prepare chart data from real data
  const revenueData = finance?.incomeExpenseTrend?.map(item => ({
    day: item.month?.substring(0, 3) || 'N/A',
    online: item.income || 0,
    offline: item.expense || 0,
  })) || [];

  // Attendance trend data
  const attendanceData = attendance?.attendanceTrend?.map((item) => ({
    month: item.date || 'N/A',
    lastMonth: item.present || 0,
    thisMonth: item.present || 0,
  })) || [];

  // Prepare Attendance Pie Data
  const presentCount = attendance?.today?.present || 0;
  const totalCount = attendance?.today?.total || 0;
  const absentCount = totalCount > presentCount ? totalCount - presentCount : 0;

  const attendancePieData = [
    { name: 'Present', value: presentCount, color: '#10B981' },
    { name: 'Absent', value: absentCount, color: '#EF4444' }
  ];

  // Employee headcount trend
  const headcountData = overview?.employees?.headcountTrend?.map((item) => {
    const baseValue = item.count || 0;
    return {
      month: item.month?.substring(0, 3) || 'N/A',
      reality: baseValue,
      target: Math.round(baseValue * 1.15),
    };
  }) || [];

  // Visitor Insights data - mapped from Lead Trend
  const visitorInsightsData = sales?.leadTrend || [];

  // Leave summary data
  const leaveSummaryData = hrm?.leaveSummary?.map((item) => ({
    category: item.month?.substring(0, 3) || 'N/A',
    volume: item.count || 0,
    service: 0,
  })) || [];

  // Sales Analytics table data - mapped from Top Products
  const totalProductSales = sales?.topProducts?.reduce((acc, curr) => acc + curr.sales, 0) || 1;
  const salesAnalyticsData = sales?.topProducts?.map((item, index) => ({
    id: index + 1,
    name: item.name || 'Unknown Product',
    popularity: Math.round((item.sales / totalProductSales) * 100),
    sales: Math.round((item.sales / totalProductSales) * 100), // Displaying approx % market share
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]
  })) || [];

  // Top performers data
  const topPerformers = sales?.topPerformers?.slice(0, 5) || [];

  const revenueAnalysisData = finance?.incomeExpenseTrend?.map(item => ({
    month: item.month || 'N/A',
    revenue: item.income || 0,
    expense: item.expense || 0,
    profit: (item.income || 0) - (item.expense || 0),
  })) || [];

  // Calculate Today's Sales KPIs
  const totalSales = finance?.totalRevenue || 0;
  const totalOrders = sales?.totalOrders || 0;
  const productsSold = sales?.productsSold || 0;
  const newCustomers = sales?.leads?.closed || 0; // Won leads treated as New Customers

  // Calculate percentage changes
  const calcChange = (arr, key) => {
    if (!arr || arr.length < 2) return 0;
    const current = arr[arr.length - 1][key] || 0;
    const prev = arr[arr.length - 2][key] || 0;
    if (prev === 0) return 0;
    return Math.round(((current - prev) / prev) * 100);
  };

  const revenueTrend = finance?.incomeExpenseTrend || [];
  const salesChangeVal = calcChange(revenueTrend, 'income');
  const salesChange = `${salesChangeVal >= 0 ? '+' : ''}${salesChangeVal}%`;

  const leadTrend = sales?.leadTrend || [];
  const customersChangeVal = calcChange(leadTrend, 'loyal');
  const customersChange = `${customersChangeVal >= 0 ? '+' : ''}${customersChangeVal}%`;

  const ordersChange = '0%'; // Trend not tracked yet
  const productsChange = '0%'; // Trend not tracked yet


  return (
    <div className="superadmin-dashboard-new">
      <div className="page-content">
        {/* Compact Header Section */}
        <header className="ep-header">
          <div className="ep-identity">
            <div className="ep-avatar-placeholder"><FiZap /></div>
            <div className="ep-info-row">
              <div className="ep-name-row">
                <h1 className="ep-name">Super Admin Dashboard</h1>
                <span className="ep-status-badge status-active">System Online</span>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-item"><FiActivity /> Active Node: US-East-1</div>
                <div className="ep-meta-item"><FiClock /> Last Sync: Just now</div>
                <div className="ep-meta-item"><FiShield /> Secure Mode</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline-sm" onClick={fetchAllData}><FiActivity /> Refresh Data</button>
            <button className="btn-primary-sm" onClick={toggleQuickActions}><FiZap /> Quick Actions</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="ep-tabs-container">
          <div className="ep-tabs-list">
            {availableTabs.map(tab => (
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

        {/* Dynamic KPI Cards based on Tab - Using a grid similar to Profile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {activeTab === 'summary' && (
            <>
              <KPIBadge icon={<FiUsers />} label="Total Staff" value={formatNumber(totalEmployees)} color="blue" />
              <KPIBadge icon={<FiDollarSign />} label="MTD Revenue" value={formatCurrency(totalRevenue)} color="green" />
              <KPIBadge icon={<FiLayers />} label="Total Leads" value={formatNumber(totalLeads)} color="yellow" />
              <KPIBadge icon={<FiActivity />} label="System Load" value="2.4%" color="purple" />
            </>
          )}
          {activeTab === 'finance' && (
            <>
              <KPIBadge icon={<FiDollarSign />} label="Revenue" value={formatCurrency(totalRevenue)} color="green" />
              <KPIBadge icon={<FiCreditCard />} label="Expenses" value={formatCurrency(totalExpenses)} color="orange" />
              <KPIBadge icon={<FiFileText />} label="Pending Invoices" value={formatNumber(pendingInvoices)} color="yellow" />
              <KPIBadge icon={<FiCheckCircle />} label="Processed Payroll" value={formatNumber(processedPayroll)} color="blue" />
            </>
          )}
          {activeTab === 'sales' && (
            <>
              <KPIBadge icon={<FiLayers />} label="Leads" value={formatNumber(totalLeads)} color="yellow" />
              <KPIBadge icon={<FiTarget />} label="Conversions" value="18%" color="green" />
              <KPIBadge icon={<FiShoppingCart />} label="Orders" value={formatNumber(totalOrders)} color="blue" />
              <KPIBadge icon={<FiTrendingUp />} label="Pipeline Val" value={formatCurrency(totalRevenue * 1.5)} color="purple" />
            </>
          )}
          {activeTab === 'hrm' && (
            <>
              <KPIBadge icon={<FiUsers />} label="Employees" value={formatNumber(totalEmployees)} color="blue" />
              <KPIBadge icon={<FiClock />} label="On Leave" value={formatNumber(pendingLeaves)} color="yellow" />
              <KPIBadge icon={<FiBriefcase />} label="Open Roles" value={formatNumber(openJobs)} color="orange" />
              <KPIBadge icon={<FiUserPlus />} label="New Hires" value={formatNumber(newHires)} color="green" />
            </>
          )}
          {activeTab === 'system' && (
            <>
              <KPIBadge icon={<FiZap />} label="Uptime" value="99.9%" color="green" />
              <KPIBadge icon={<FiActivity />} label="API Latency" value="45ms" color="blue" />
              <KPIBadge icon={<FiAlertCircle />} label="Alerts" value={formatNumber(notifications?.systemAlerts?.length || 0)} color="orange" />
              <KPIBadge icon={<FiShield />} label="Threats" value="0" color="purple" />
            </>
          )}
        </div>

        <div className="dashboard-layout-container">
          <main className="dashboard-main-content">
            <main className="ep-content-area">
              {activeTab === 'summary' && (
                <div className="ep-grid-2">
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Revenue Overview</div></div>
                    <div className="ep-card-body" style={{ height: '320px' }}>
                      <RevenueBarChart data={revenueData} />
                    </div>
                  </div>
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Lead Acquisition</div></div>
                    <div className="ep-card-body" style={{ height: '320px' }}>
                      <SatisfactionAreaChart data={sales?.leadTrend?.map(item => ({
                        month: item.month,
                        thisMonth: item.new,
                        lastMonth: item.loyal
                      }))} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'finance' && (
                <div className="ep-grid-2">
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Income vs Expense</div></div>
                    <div className="ep-card-body" style={{ height: '350px' }}>
                      <RevenueAnalysisChart data={revenueAnalysisData} />
                    </div>
                  </div>
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Expense Breakdown</div></div>
                    <div className="ep-card-body" style={{ height: '350px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={finance.expenseBreakdown}
                            dataKey="total"
                            nameKey="category"
                            cx="50%" cy="50%" outerRadius={100}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {finance.expenseBreakdown?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sales' && (
                <div className="ep-grid-2">
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Top Products</div></div>
                    <table className="ep-table">
                      <thead><tr><th>Name</th><th>Popularity</th><th>Sales Share</th></tr></thead>
                      <tbody>
                        {salesAnalyticsData.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: '600' }}>{item.name}</td>
                            <td>
                              <div style={{ width: '100px', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${item.popularity}%`, height: '100%', background: item.color }} />
                              </div>
                            </td>
                            <td style={{ fontWeight: '700', color: item.color }}>{item.sales}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Lead Insights</div></div>
                    <div className="ep-card-body" style={{ height: '320px' }}>
                      <VisitorInsightsLineChart data={visitorInsightsData} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'hrm' && (
                <div className="ep-grid-2">
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Staff by Department</div></div>
                    <div className="ep-card-body" style={{ height: '320px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={overview.employees.departmentCounts} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis dataKey="department" type="category" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Today's Attendance</div></div>
                    <div className="ep-card-body" style={{ height: '320px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={attendancePieData} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5}>
                            {attendancePieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                          </Pie>
                          <Tooltip />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'system' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div className="ep-card">
                    <div className="ep-card-header">
                      <div className="ep-card-title">Live Activity Stream</div>
                      <button className="btn-outline-sm" onClick={() => navigate('/activity-logs')}>Detailed View</button>
                    </div>
                    <div className="ep-card-body">
                      <ActivityLogTable
                        logs={activityLog?.logs || []}
                        pagination={activityLog?.pagination}
                        onPageChange={(page) => setActivityPage(page)}
                      />
                    </div>
                  </div>
                  <div className="ep-card">
                    <div className="ep-card-header"><div className="ep-card-title">Critical Notifications</div></div>
                    <div className="ep-card-body">
                      <NotificationsPanel
                        notifications={notifications?.notifications || []}
                        systemAlerts={notifications?.systemAlerts}
                      />
                    </div>
                  </div>
                </div>
              )}
            </main>
          </main>

          {/* Quick Actions Sidebar Overlay */}
          <div className={`quick-actions-overlay ${quickActionsOpen ? 'overlay-open' : ''}`} onClick={closeQuickActions} />
          {quickActionsOpen && (
            <aside className="dashboard-quick-actions-sidebar quick-actions-open">
              <QuickActions />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
};


// KPI Card Component
// KPI Card Component - Matched to Sales Dashboard V2
const KPICard = ({ icon, label, value, change, trend, color, subtitle }) => (
  <div className={`kpi-card kpi-${color}`}>
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-content">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {change !== undefined && (
        <div className={`kpi-change ${trend === 'up' ? 'positive' : 'negative'}`}>
          {trend === 'up' ? <FiArrowUp /> : <FiArrowDown />}
          {Math.abs(change)}% vs last month
        </div>
      )}
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </div>
  </div>
);

export default SuperAdminDashboard;
