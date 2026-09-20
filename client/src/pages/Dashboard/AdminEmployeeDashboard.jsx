import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { useQuickActions } from '../../context/QuickActionsContext';
import {
  FiUsers,
  FiUserCheck,
  FiUserPlus,
  FiCalendar,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiTrendingUp,
  FiBriefcase,
  FiDollarSign,
  FiFileText,
  FiX,
  FiMenu,
  FiZap,
  FiActivity,
  FiShield,
  FiGrid,
} from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatNumber, formatDate } from '../../utils/format';
import QuickActions from '../../components/dashboard/QuickActions';
import KPIBadge from '../../components/dashboard/KPIBadge';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import ActivityLogTable from '../../components/dashboard/ActivityLogTable';
import RevenueBarChart from '../../components/dashboard/Charts/RevenueBarChart';
import SatisfactionAreaChart from '../../components/dashboard/Charts/SatisfactionAreaChart';
import RealityTargetBarChart from '../../components/dashboard/Charts/RealityTargetBarChart';
import VisitorInsightsLineChart from '../../components/dashboard/Charts/VisitorInsightsLineChart';
import VolumeServiceBarChart from '../../components/dashboard/Charts/VolumeServiceBarChart';
import '../../styles/dashboard/superadmin-dashboard-new.css';
import '../../styles/infinity-edition.css';

const AdminEmployeeDashboard = () => {
  const navigate = useNavigate();
  const { isOpen: quickActionsOpen, toggleQuickActions, closeQuickActions } = useQuickActions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [activityPage, setActivityPage] = useState(1);

  // Data states
  const [statistics, setStatistics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [notifications, setNotifications] = useState(null);
  const [activityLog, setActivityLog] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchActivityLog();
  }, [activityPage]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch employee statistics
      const statsRes = await employeeService.getEmployeeStatistics().catch(err => ({ data: { success: false } }));
      if (statsRes.data?.success) {
        setStatistics(statsRes.data.data);
      }

      // Fetch employees list
      const employeesRes = await employeeService.getEmployees({ limit: 100 }).catch(err => ({ data: { success: false } }));
      if (employeesRes.data?.success) {
        setEmployees(employeesRes.data.data?.employees || []);
      }

      // Fetch attendance data
      const attendanceRes = await employeeService.getAllAttendance({ limit: 100 }).catch(err => ({ data: { success: false } }));
      if (attendanceRes.data?.success) {
        const attendanceData = attendanceRes.data.data?.attendance || [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayAttendance = attendanceData.filter(att => {
          const attDate = new Date(att.date);
          attDate.setHours(0, 0, 0, 0);
          return attDate.getTime() === today.getTime();
        });
        setAttendance({
          today: {
            present: todayAttendance.filter(att => att.status === 'present').length,
            total: todayAttendance.length,
          },
          liveCheckIns: todayAttendance.filter(att => att.checkIn && !att.checkOut).length,
        });
      }

      // Fetch leaves
      const leavesRes = await employeeService.getLeaves({ status: 'pending', limit: 50 }).catch(err => ({ data: { success: false } }));
      if (leavesRes.data?.success) {
        setLeaves(leavesRes.data.data?.leaves || []);
      }

      // Mock notifications for now
      setNotifications({
        notifications: [],
        systemAlerts: null,
      });

      await fetchActivityLog();
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      // Using employee activity logs
      const res = await employeeService.getActivityLogs(null, { page: activityPage, limit: 10 }).catch(err => ({ data: { success: false } }));
      if (res.data?.success) {
        setActivityLog({
          logs: res.data.data?.logs || [],
          pagination: res.data.data?.pagination,
        });
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  if (loading) return <Loader />;

  // Calculate KPI data from statistics
  const totalEmployees = statistics?.overview?.total || 0;
  const activeEmployees = statistics?.overview?.active || 0;
  const newHires = statistics?.overview?.newHires || 0;
  const pendingLeaves = leaves?.length || 0;

  // Calculate percentage changes (mock data for now)
  const employeesChange = '+5%';
  const activeChange = '+3%';
  const newHiresChange = '+12%';
  const leavesChange = '+8%';

  // Prepare chart data from statistics
  // Employee Growth Chart (using byMonth data)
  const employeeGrowthData = statistics?.byMonth?.slice(-12).map(item => {
    const monthStr = item.month || '';
    const monthAbbr = monthStr.length >= 7 ? monthStr.substring(5, 7) : monthStr.substring(0, 3);
    return {
      day: monthAbbr || 'N/A',
      online: item.count || 0,
      offline: 0,
    };
  }) || [];

  // Attendance Trend (mock for now - can be enhanced with real attendance data)
  const attendanceTrendData = [
    { month: 'Jan', lastMonth: 85, thisMonth: 90 },
    { month: 'Feb', lastMonth: 88, thisMonth: 92 },
    { month: 'Mar', lastMonth: 90, thisMonth: 95 },
    { month: 'Apr', lastMonth: 92, thisMonth: 93 },
    { month: 'May', lastMonth: 91, thisMonth: 94 },
    { month: 'Jun', lastMonth: 93, thisMonth: 96 },
  ];

  // Employee Headcount Trend (Reality vs Target)
  const headcountData = statistics?.byMonth?.slice(-12).map((item) => {
    const baseValue = item.count || 0;
    const monthStr = item.month || '';
    const monthAbbr = monthStr.length >= 7 ? monthStr.substring(5, 7) : monthStr.substring(0, 3);
    return {
      month: monthAbbr || 'N/A',
      reality: baseValue,
      target: Math.round(baseValue * 1.1),
    };
  }) || [];

  // Department Distribution (for Visitor Insights chart)
  const departmentData = statistics?.byDepartment?.slice(0, 12).map((dept, index) => ({
    month: dept.department?.substring(0, 3) || 'N/A',
    loyal: dept.count || 0,
    new: 0,
    lost: 0,
  })) || [];

  // Leave Summary data
  const leaveSummaryData = statistics?.leaves?.map((item) => ({
    category: item.status?.substring(0, 3) || 'N/A',
    volume: item.count || 0,
    service: item.totalDays || 0,
  })) || [];

  // Department Analytics table
  const departmentAnalyticsData = statistics?.byDepartment?.slice(0, 5).map((dept, index) => ({
    id: index + 1,
    name: dept.department || 'N/A',
    popularity: Math.round((dept.count / totalEmployees) * 100) || 0,
    sales: dept.count || 0,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index] || '#3B82F6',
  })) || [];

  // Top Employees (by department or status)
  const topEmployees = employees.slice(0, 5);


  return (
    <div className="superadmin-dashboard-new">
      <div className="page-content">
        {/* Compact Header Section */}
        <header className="ep-header">
          <div className="ep-identity">
            <div className="ep-avatar-placeholder"><FiBriefcase /></div>
            <div className="ep-info-row">
              <div className="ep-name-row">
                <h1 className="ep-name">Admin Dashboard</h1>
                <span className="ep-status-badge status-active">System Administration</span>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-item"><FiActivity /> Active Ratio: {Math.round((activeEmployees / (totalEmployees || 1)) * 100)}%</div>
                <div className="ep-meta-item"><FiUsers /> Total Staff: {totalEmployees}</div>
                <div className="ep-meta-item"><FiShield /> Admin Privacy On</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline-sm" onClick={fetchAllData}><FiActivity /> Refresh Data</button>
            <button className="btn-primary-sm" onClick={toggleQuickActions}><FiZap /> Admin Actions</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="ep-tabs-container">
          <div className="ep-tabs-list">
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'workforce', label: 'Workforce' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'system', label: 'Logs & Alerts' },
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

        {/* Dynamic KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {activeTab === 'summary' && (
            <>
              <KPIBadge icon={<FiUsers />} label="Total Employees" value={formatNumber(totalEmployees)} color="blue" />
              <KPIBadge icon={<FiUserCheck />} label="Active" value={formatNumber(activeEmployees)} color="green" />
              <KPIBadge icon={<FiUserPlus />} label="New Hires" value={formatNumber(newHires)} color="yellow" />
              <KPIBadge icon={<FiCalendar />} label="Pending Leaves" value={formatNumber(pendingLeaves)} color="purple" />
            </>
          )}
          {activeTab === 'workforce' && (
            <>
              <KPIBadge icon={<FiGrid />} label="Departments" value={formatNumber(statistics?.byDepartment?.length || 0)} color="indigo" />
              <KPIBadge icon={<FiTrendingUp />} label="Growth Rate" value={employeesChange} color="green" />
              <KPIBadge icon={<FiFileText />} label="Open Requests" value={pendingLeaves} color="orange" />
              <KPIBadge icon={<FiActivity />} label="Retention" value="94%" color="blue" />
            </>
          )}
          {activeTab === 'attendance' && (
            <>
              <KPIBadge icon={<FiClock />} label="Today Present" value={`${attendance?.today?.present || 0} / ${attendance?.today?.total || 0}`} color="green" />
              <KPIBadge icon={<FiZap />} label="Live Check-ins" value={formatNumber(attendance?.liveCheckIns || 0)} color="yellow" />
              <KPIBadge icon={<FiAlertCircle />} label="Late Entries" value="2" color="red" />
              <KPIBadge icon={<FiCheckCircle />} label="Avg. Rate" value={`${statistics?.attendance?.averageRate || 0}%`} color="blue" />
            </>
          )}
        </div>

        {/* Content Area */}
        <main className="ep-content-area">
          {activeTab === 'summary' && (
            <div className="ep-grid-2">
              <div className="ep-card infinity-glass">
                <div className="ep-card-header"><div className="ep-card-title">Employee Growth</div></div>
                <div className="chart-body" style={{ height: '350px' }}>
                  <RevenueBarChart data={employeeGrowthData} />
                </div>
              </div>
              <div className="ep-card infinity-glass">
                <div className="ep-card-header"><div className="ep-card-title">Headcount Reality vs Target</div></div>
                <div className="chart-body" style={{ height: '350px' }}>
                  <RealityTargetBarChart data={headcountData} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'workforce' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Department Distribution</div></div>
                <div className="chart-body" style={{ height: '350px' }}>
                  <VisitorInsightsLineChart data={departmentData} />
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Department Breakdown</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Department</th><th>Popularity</th><th>Employees</th></tr></thead>
                    <tbody>
                      {departmentAnalyticsData.map((dept, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{dept.name}</td>
                          <td>
                            <div className="progress-bar-container">
                              <div className="progress-bar" style={{ width: `${dept.popularity}%`, background: dept.color }} />
                              <span className="progress-text">{dept.popularity}%</span>
                            </div>
                          </td>
                          <td>{dept.sales}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="ep-card infinity-glass">
              <div className="ep-card-header"><div className="ep-card-title">Attendance Trend Analysis</div></div>
              <div className="chart-body" style={{ height: '400px' }}>
                <SatisfactionAreaChart data={attendanceTrendData} />
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Recent Activity Log</div></div>
                <div className="ep-card-body">
                  <ActivityLogTable
                    logs={activityLog?.logs || []}
                    pagination={activityLog?.pagination}
                    onPageChange={(page) => setActivityPage(page)}
                  />
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">System Notifications</div></div>
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
      </div>

      {/* Quick Actions Sidebar */}
      {quickActionsOpen && (
        <>
          <div className="dashboard-quick-actions-sidebar quick-actions-open">
            <QuickActions />
          </div>
          <div className="quick-actions-overlay overlay-open" onClick={closeQuickActions} />
        </>
      )}
    </div>
  );
};

export default AdminEmployeeDashboard;

