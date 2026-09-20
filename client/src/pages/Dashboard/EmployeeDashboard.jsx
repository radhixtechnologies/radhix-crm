import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import { useQuickActions } from '../../context/QuickActionsContext';
import { useAuth } from '../../context/AuthContext';
import {
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiTrendingUp,
  FiEdit,
  FiBriefcase,
  FiX,
  FiMenu,
  FiZap,
  FiActivity,
  FiShield,
  FiAward,
} from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatNumber, formatDate } from '../../utils/format';
import EmployeeQuickActions from '../../components/dashboard/EmployeeQuickActions';
import RevenueBarChart from '../../components/dashboard/Charts/RevenueBarChart';
import SatisfactionAreaChart from '../../components/dashboard/Charts/SatisfactionAreaChart';
import VisitorInsightsLineChart from '../../components/dashboard/Charts/VisitorInsightsLineChart';
import KPIBadge from '../../components/dashboard/KPIBadge';
import '../../styles/dashboard/employee-dashboard.css';
import '../../styles/infinity-edition.css';

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user, hasModuleAccess } = useAuth();
  const { isOpen: quickActionsOpen, toggleQuickActions, closeQuickActions } = useQuickActions();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    fetchEmployeeDashboard();
  }, []);

  const fetchEmployeeDashboard = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getEmployeeDashboard();
      if (response.data?.success) {
        setEmployeeData(response.data.data);
      } else {
        setEmployeeData({
          employeeId: null,
          attendance: null,
          tasks: { pending: 0, list: [] },
          leaveBalance: null,
          recentLeaves: [],
          salarySlip: null,
          performance: null,
          recentTimesheets: [],
        });
      }
    } catch (error) {
      console.error('Error fetching employee dashboard:', error);
      setEmployeeData({
        employeeId: null,
        attendance: null,
        tasks: { pending: 0, list: [] },
        leaveBalance: null,
        recentLeaves: [],
        salarySlip: null,
        performance: null,
        recentTimesheets: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  if (!employeeData) return <Loader />;

  const { attendance, tasks, leaveBalance, recentLeaves, salarySlip, performance, employeeId, leaveUsageTrend } = employeeData;

  const todayStatus = attendance?.today?.status || 'Not Checked In';
  const todayHours = attendance?.today?.hoursWorked || 0;
  const monthlyHours = attendance?.monthlyHours || 0;
  const monthlyDays = attendance?.monthlyDays || 0;
  const pendingTasks = tasks?.pending || 0;
  const totalTasks = tasks?.list?.length || 0;
  const annualLeave = leaveBalance?.annual || 15;
  const casualLeave = leaveBalance?.casual || 12;
  const sickLeave = leaveBalance?.sick || 10;

  return (
    <div className="superadmin-dashboard-new">
      <div className="page-content">
        {/* Compact Header Section */}
        <header className="ep-header">
          <div className="ep-identity">
            <div className="ep-avatar-placeholder"><FiTrendingUp /></div>
            <div className="ep-info-row">
              <div className="ep-name-row">
                <h1 className="ep-name">My Dashboard</h1>
                <span className="ep-status-badge status-active">Employee Portal</span>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-item"><FiClock /> {todayStatus === 'present' ? `Logged: ${todayHours}h` : 'Check-in Pending'}</div>
                <div className="ep-meta-item"><FiCheckCircle /> Tasks: {pendingTasks}</div>
                <div className="ep-meta-item"><FiShield /> Secure Connection</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline-sm" onClick={fetchEmployeeDashboard}><FiActivity /> Sync Data</button>
            <button className="btn-primary-sm" onClick={toggleQuickActions}><FiZap /> Quick Actions</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="ep-tabs-container">
          <div className="ep-tabs-list">
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'attendance', label: 'Attendance' },
              { id: 'tasks', label: 'Tasks' },
              { id: 'leaves', label: 'Leaves' },
              { id: 'payroll', label: 'Payroll' },
              ...(hasModuleAccess('sales') ? [{ id: 'sales', label: 'Sales' }] : []),
              ...(hasModuleAccess('marketing') ? [{ id: 'marketing', label: 'Marketing' }] : []),
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
              <KPIBadge icon={<FiClock />} label="Today's Hours" value={`${todayHours}h`} color="orange" />
              <KPIBadge icon={<FiTrendingUp />} label="Monthly Hours" value={`${monthlyHours}h`} color="blue" />
              <KPIBadge icon={<FiCheckCircle />} label="Pending Tasks" value={formatNumber(pendingTasks)} color="green" />
              <KPIBadge icon={<FiCalendar />} label="Leave Balance" value={formatNumber(annualLeave + casualLeave + sickLeave)} color="purple" />
            </>
          )}
          {activeTab === 'attendance' && (
            <>
              <KPIBadge icon={<FiClock />} label="Total Hours" value={`${monthlyHours}h`} color="blue" />
              <KPIBadge icon={<FiCalendar />} label="Active Days" value={formatNumber(monthlyDays)} color="green" />
              <KPIBadge icon={<FiTrendingUp />} label="Avg Hours" value={`${Math.round(monthlyHours / (monthlyDays || 1))}h`} color="indigo" />
              <KPIBadge icon={<FiCheckCircle />} label="Status" value={todayStatus.toUpperCase()} color="orange" />
            </>
          )}
          {activeTab === 'tasks' && (
            <>
              <KPIBadge icon={<FiCheckCircle />} label="Pending" value={formatNumber(pendingTasks)} color="orange" />
              <KPIBadge icon={<FiTrendingUp />} label="Completed" value={formatNumber(totalTasks - pendingTasks)} color="green" />
              <KPIBadge icon={<FiFileText />} label="Total Assigned" value={formatNumber(totalTasks)} color="blue" />
              <KPIBadge icon={<FiAward />} label="Completion Rate" value={`${Math.round(((totalTasks - pendingTasks) / (totalTasks || 1)) * 100)}%`} color="purple" />
            </>
          )}
          {activeTab === 'leaves' && (
            <>
              <KPIBadge icon={<FiCalendar />} label="Annual" value={formatNumber(annualLeave)} color="blue" />
              <KPIBadge icon={<FiCalendar />} label="Casual" value={formatNumber(casualLeave)} color="green" />
              <KPIBadge icon={<FiCalendar />} label="Sick" value={formatNumber(sickLeave)} color="orange" />
              <KPIBadge icon={<FiBriefcase />} label="Total Remaining" value={formatNumber(annualLeave + casualLeave + sickLeave)} color="purple" />
            </>
          )}
          {activeTab === 'payroll' && (
            <>
              <KPIBadge icon={<FiTrendingUp />} label="Last Net Pay" value={formatCurrency(salarySlip?.netSalary || 0)} color="green" />
              <KPIBadge icon={<FiCalendar />} label="Last Paid" value={salarySlip ? new Date(salarySlip.year, salarySlip.month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'N/A'} color="blue" />
              <KPIBadge icon={<FiFileText />} label="Tax Deducted" value={formatCurrency(salarySlip?.tax || 0)} color="orange" />
              <KPIBadge icon={<FiClock />} label="Next Payout" value="Upcoming" color="purple" />
            </>
          )}
          {activeTab === 'sales' && (
            <>
              <KPIBadge icon={<FiTrendingUp />} label="Pipeline" value="View Leads" color="blue" onClick={() => navigate('/sales/leads')} />
              <KPIBadge icon={<FiTrendingUp />} label="Deals" value="View All" color="green" onClick={() => navigate('/sales/deals')} />
              <KPIBadge icon={<FiBriefcase />} label="Clients" value="Portfolio" color="purple" onClick={() => navigate('/sales/clients')} />
              <KPIBadge icon={<FiActivity />} label="Target" value="Active" color="orange" />
            </>
          )}
          {activeTab === 'marketing' && (
            <>
              <KPIBadge icon={<FiActivity />} label="Campaigns" value="Active" color="pink" onClick={() => navigate('/marketing/campaigns')} />
              <KPIBadge icon={<FiActivity />} label="Performance" value="Analytics" color="purple" onClick={() => navigate('/marketing')} />
            </>
          )}
        </div>

        {/* Content Area */}
        <main className="ep-content-area">
          {activeTab === 'summary' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Attendance Trend</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  {attendance?.trend && <RevenueBarChart data={attendance.trend} name1="Hours" name2="Deficit" dataKey1="present" dataKey2="absent" xKey="day" />}
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Performance Snapshot</div></div>
                <div className="ep-card-body">
                  <div className="performance-summary" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Overall Rating</div>
                    <div style={{ fontSize: '32px', fontWeight: 800, color: '#6366f1' }}>{performance?.overallRating || 'N/A'}/5.0</div>
                    <div style={{ marginTop: '24px', display: 'flex', gap: '40px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Current Cycle</div>
                        <div style={{ fontWeight: 600 }}>{performance?.cycle || '2024 Final'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>Status</div>
                        <span className="ep-status-badge status-active neon">{performance?.status || 'Active'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="ep-card infinity-glass">
              <div className="ep-card-header"><div className="ep-card-title">Monthly Attendance Breakdown</div></div>
              <div className="ep-card-body" style={{ padding: 0 }}>
                <table className="ep-table">
                  <thead><tr><th>Date</th><th>Status</th><th>Hours</th><th>Comments</th></tr></thead>
                  <tbody>
                    {attendance?.history?.slice(0, 10).map((h, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{formatDate(h.date)}</td>
                        <td><span className={`ep-status-badge status-${h.status === 'present' ? 'active' : 'inactive'} neon`}>{h.status}</span></td>
                        <td>{h.hoursWorked}h</td>
                        <td>{h.comments || '---'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Priority Tasks</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Task</th><th>Due Date</th><th>Priority</th></tr></thead>
                    <tbody>
                      {tasks?.list?.slice(0, 8).map(t => (
                        <tr key={t._id}>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td>{formatDate(t.dueDate)}</td>
                          <td><span className={`ep-status-badge status-${t.priority === 'urgent' ? 'inactive' : 'active'} neon`}>{t.priority}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Task Analytics</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  {tasks?.trend && <RevenueBarChart data={tasks.trend} name1="Completed" name2="Pending" dataKey1="completed" dataKey2="pending" xKey="month" />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'leaves' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Leave History</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Dates</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {recentLeaves?.slice(0, 8).map(l => (
                        <tr key={l._id}>
                          <td style={{ fontWeight: 600 }}>{formatDate(l.startDate)} - {formatDate(l.endDate)}</td>
                          <td>{l.type}</td>
                          <td><span className={`ep-status-badge status-${l.status === 'approved' ? 'active' : 'inactive'} neon`}>{l.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Leave Utilization</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  {leaveUsageTrend && <SatisfactionAreaChart data={leaveUsageTrend} name1="Used" name2="Balance" dataKey1="used" dataKey2="remaining" xKey="month" />}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'payroll' && (
            <div className="ep-card infinity-glass">
              <div className="ep-card-header"><div className="ep-card-title">Recent Salary Slips</div></div>
              <div className="ep-card-body" style={{ padding: 0 }}>
                <table className="ep-table">
                  <thead><tr><th>Month</th><th>Gross Salary</th><th>Deductions</th><th>Net Pay</th><th>Action</th></tr></thead>
                  <tbody>
                    {/* Mocked/Derived salary history if list not available */}
                    <tr>
                      <td style={{ fontWeight: 600 }}>Jan 2024</td>
                      <td>{formatCurrency(salarySlip?.grossSalary || 50000)}</td>
                      <td>{formatCurrency(salarySlip?.deductions || 5000)}</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>{formatCurrency(salarySlip?.netSalary || 45000)}</td>
                      <td><button className="btn-primary-sm">Download</button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="ep-card infinity-glass">
              <div className="ep-card-header"><div className="ep-card-title">Sales Overview</div></div>
              <div className="ep-card-body" style={{ padding: '40px', textAlign: 'center' }}>
                <FiTrendingUp size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
                <h3>Sales Workspace</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Access your leads, deals, and client portfolio directly.</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn-primary" onClick={() => navigate('/sales/leads')}>My Leads</button>
                  <button className="btn-outline" onClick={() => navigate('/sales/deals')}>My Deals</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'marketing' && (
            <div className="ep-card infinity-glass">
              <div className="ep-card-header"><div className="ep-card-title">Marketing Hub</div></div>
              <div className="ep-card-body" style={{ padding: '40px', textAlign: 'center' }}>
                <FiActivity size={48} color="#ec4899" style={{ marginBottom: '16px' }} />
                <h3>Marketing Campaigns</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Monitor campaign reach and engagement metrics.</p>
                <button className="btn-primary" onClick={() => navigate('/marketing/campaigns')}>View Campaigns</button>
              </div>
            </div>
          )}
        </main>

        {/* Quick Actions Sidebar Overlay */}
        <div className={`quick-actions-overlay ${quickActionsOpen ? 'overlay-open' : ''}`} onClick={closeQuickActions} />
        {quickActionsOpen && (
          <aside className="dashboard-quick-actions-sidebar quick-actions-open">
            <EmployeeQuickActions />
          </aside>
        )}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
