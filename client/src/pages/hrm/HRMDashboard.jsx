import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuickActions } from '../../context/QuickActionsContext';
import {
  FiBriefcase,
  FiUsers,
  FiTrendingUp,
  FiCalendar,
  FiCheckCircle,
  FiTarget,
  FiUserPlus,
  FiX,
  FiMenu,
  FiZap,
  FiAward,
  FiBook,
  FiClock,
  FiUserCheck,
  FiUserX,
  FiActivity,
  FiShield,
} from 'react-icons/fi';
import { hrmService } from '../../services/hrmService';
import { dashboardService } from '../../services/dashboardService';
import { employeeService } from '../../services/employeeService';
import Loader from '../../components/common/Loader';
import { formatNumber, formatDate } from '../../utils/format';
import QuickActions from '../../components/dashboard/QuickActions';
import NotificationsPanel from '../../components/dashboard/NotificationsPanel';
import ActivityLogTable from '../../components/dashboard/ActivityLogTable';
import RevenueBarChart from '../../components/dashboard/Charts/RevenueBarChart';
import VisitorInsightsLineChart from '../../components/dashboard/Charts/VisitorInsightsLineChart';
import RealityTargetBarChart from '../../components/dashboard/Charts/RealityTargetBarChart';
import VolumeServiceBarChart from '../../components/dashboard/Charts/VolumeServiceBarChart';
import SatisfactionAreaChart from '../../components/dashboard/Charts/SatisfactionAreaChart';
import KPIBadge from '../../components/dashboard/KPIBadge';
import '../../styles/dashboard/superadmin-dashboard-new.css';
import '../../styles/infinity-edition.css';

const HRMDashboard = () => {
  const navigate = useNavigate();
  const { isOpen: quickActionsOpen, toggleQuickActions, closeQuickActions } = useQuickActions();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [activityPage, setActivityPage] = useState(1);

  // Data states
  const [hrmData, setHrmData] = useState(null);
  const [jobPostings, setJobPostings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [skills, setSkills] = useState([]);
  const [exitRequests, setExitRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState(null);
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

      // Fetch HRM insights from dashboard service
      const hrmRes = await dashboardService.getHRMInsights().catch(err => ({ data: { success: false } }));
      if (hrmRes.data?.success) {
        setHrmData(hrmRes.data.data);
      }

      // Fetch attendance overview
      const attendanceRes = await dashboardService.getAttendanceOverview().catch(err => ({ data: { success: false } }));
      if (attendanceRes.data?.success) {
        setAttendanceData(attendanceRes.data.data);
      }

      // Fetch employees
      const employeesRes = await employeeService.getEmployees().catch(err => ({ data: { success: false } }));
      if (employeesRes.data?.success) {
        setEmployees(employeesRes.data.data || []);
      }

      // Fetch job postings
      const jobsRes = await hrmService.getJobPostings().catch(err => ({ data: { success: false } }));
      if (jobsRes.data?.success) {
        setJobPostings(jobsRes.data.data || []);
      }

      // Fetch applications
      const appsRes = await hrmService.getJobApplications().catch(err => ({ data: { success: false } }));
      if (appsRes.data?.success) {
        setApplications(appsRes.data.data || []);
      }

      // Fetch performance reviews
      const perfRes = await hrmService.getPerformanceReviews().catch(err => ({ data: { success: false } }));
      if (perfRes.data?.success) {
        setPerformance(perfRes.data.data || []);
      }

      // Fetch trainings
      const trainingsRes = await hrmService.getTrainings().catch(err => ({ data: { success: false } }));
      if (trainingsRes.data?.success) {
        setTrainings(trainingsRes.data.data || []);
      }

      // Fetch skills
      const skillsRes = await hrmService.getSkills().catch(err => ({ data: { success: false } }));
      if (skillsRes.data?.success) {
        setSkills(skillsRes.data.data || []);
      }

      // Fetch exit requests
      const exitRes = await hrmService.getExitRequests().catch(err => ({ data: { success: false } }));
      if (exitRes.data?.success) {
        setExitRequests(exitRes.data.data || []);
      }

      // Fetch notifications
      const notificationsRes = await dashboardService.getNotifications().catch(err => ({ data: { success: false } }));
      if (notificationsRes.data?.success) {
        setNotifications(notificationsRes.data.data);
      }

      await fetchActivityLog();
    } catch (error) {
      console.error('Error fetching HRM dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const res = await dashboardService.getActivityLog({ page: activityPage, limit: 10 });
      if (res.data?.success) {
        // Filter logs to show only HRM-related activities
        const allLogs = res.data.data?.logs || [];
        const hrmLogs = allLogs.filter(log => {
          const module = log.module?.toLowerCase() || '';
          return module.includes('hrm') || module.includes('recruitment') || module.includes('employee');
        }).slice(0, 10);

        setActivityLog({
          ...res.data.data,
          logs: hrmLogs
        });
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  if (loading) return <Loader />;

  // Calculate HRM statistics
  const totalEmployees = employees.length || 0;
  const activeEmployees = employees.filter(e => e.status === 'active').length || 0;
  const inactiveEmployees = employees.filter(e => e.status === 'inactive').length || 0;
  const newHiresThisMonth = employees.filter(e => {
    const joinDate = new Date(e.joiningDate);
    const now = new Date();
    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
  }).length || 0;

  const totalApplicants = applications.length || 0;
  const pendingApplications = applications.filter(a => ['applied', 'screening', 'interview'].includes(a.status)).length || 0;
  const openJobs = jobPostings.filter(j => j.status === 'open').length || 0;
  const totalJobs = jobPostings.length || 0;
  const interviewsScheduled = hrmData?.upcomingInterviews || 0;
  const hiredThisMonth = applications.filter(a => a.status === 'hired' && new Date(a.updatedAt).getMonth() === new Date().getMonth()).length || 0;

  const totalTrainings = trainings.length || 0;
  const activeTrainings = trainings.filter(t => t.status === 'active' || t.status === 'ongoing').length || 0;
  const totalSkills = skills.length || 0;
  const verifiedSkills = skills.filter(s => s.verified).length || 0;

  const totalExitRequests = exitRequests.length || 0;
  const pendingExits = exitRequests.filter(e => e.status === 'pending' || e.status === 'approved').length || 0;

  const totalPerformanceReviews = performance.length || 0;
  const completedReviews = performance.filter(p => p.status === 'completed').length || 0;

  const todayAttendance = attendanceData?.today || {};
  const presentToday = todayAttendance.present || 0;
  const absentToday = todayAttendance.absent || 0;
  const lateToday = todayAttendance.late || 0;

  const pendingLeaves = hrmData?.pendingLeaves || 0;

  // Prepare chart data
  // Employee Headcount Trend (Line Chart)
  const headcountTrendData = employees.slice(0, 12).reverse().map((emp, index) => {
    const date = new Date(emp.joiningDate);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      active: 1,
      new: emp.status === 'active' ? 1 : 0,
      inactive: emp.status === 'inactive' ? 1 : 0,
    };
  }).reduce((acc, item) => {
    const existing = acc.find(a => a.month === item.month);
    if (existing) {
      existing.active += item.active;
      existing.new += item.new;
      existing.inactive += item.inactive;
    } else {
      acc.push(item);
    }
    return acc;
  }, []).slice(-12) || [];

  // Department Distribution (Bar Chart)
  const departmentData = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Other';
    if (!acc[dept]) {
      acc[dept] = { department: dept, count: 0 };
    }
    acc[dept].count += 1;
    return acc;
  }, {});

  const departmentDistributionData = Object.values(departmentData).slice(0, 6).map(item => ({
    day: item.department.substring(0, 10),
    online: item.count,
    offline: Math.round(item.count * 0.8),
  }));

  // Hiring Trend (Bar Chart)
  const hiringTrendData = applications.slice(0, 12).reverse().map((app, index) => {
    const date = new Date(app.createdAt);
    return {
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      applicants: 1,
      interviews: app.status === 'interview' ? 1 : 0,
      hired: app.status === 'hired' ? 1 : 0,
    };
  }).reduce((acc, item) => {
    const existing = acc.find(a => a.month === item.month);
    if (existing) {
      existing.applicants += item.applicants;
      existing.interviews += item.interviews;
      existing.hired += item.hired;
    } else {
      acc.push(item);
    }
    return acc;
  }, []).slice(-6) || [];

  // Application Status Distribution (Bar Chart)
  const applicationStatusData = [
    { category: 'Applied', volume: applications.filter(a => a.status === 'applied').length, service: 0 },
    { category: 'Screening', volume: applications.filter(a => a.status === 'screening').length, service: 0 },
    { category: 'Interview', volume: applications.filter(a => a.status === 'interview').length, service: 0 },
    { category: 'Hired', volume: applications.filter(a => a.status === 'hired').length, service: 0 },
    { category: 'Rejected', volume: applications.filter(a => a.status === 'rejected').length, service: 0 },
  ].filter(item => item.volume > 0);

  // Attendance Trend (Area Chart)
  const attendanceTrendData = attendanceData?.attendanceTrend?.slice(-12).map(item => ({
    month: new Date(item.date).toLocaleDateString('en-US', { month: 'short' }),
    lastMonth: item.present || 0,
    thisMonth: item.present || 0,
  })) || [];

  // Performance vs Target
  const performanceTargetData = hiringTrendData.map(item => ({
    month: item.month,
    reality: item.hired,
    target: Math.round(item.hired * 1.3),
  }));

  // Calculate percentage changes
  const employeesChange = newHiresThisMonth > 0 ? `+${newHiresThisMonth}` : '0';
  const applicantsChange = totalApplicants > 0 ? '+12%' : '0%';
  const jobsChange = openJobs > 0 ? '+5%' : '0%';
  const interviewsChange = interviewsScheduled > 0 ? '+8%' : '0%';

  return (
    <div className="superadmin-dashboard-new">
      <div className="page-content">
        {/* Compact Header Section */}
        <header className="ep-header">
          <div className="ep-identity">
            <div className="ep-avatar-placeholder"><FiUsers /></div>
            <div className="ep-info-row">
              <div className="ep-name-row">
                <h1 className="ep-name">HRM Dashboard</h1>
                <span className="ep-status-badge status-active">Workforce Optimized</span>
              </div>
              <div className="ep-meta-row">
                <div className="ep-meta-item"><FiActivity /> Presence: {Math.round((presentToday / (totalEmployees || 1)) * 100)}%</div>
                <div className="ep-meta-item"><FiBriefcase /> Open Roles: {openJobs}</div>
                <div className="ep-meta-item"><FiShield /> Data Secured</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-outline-sm" onClick={fetchAllData}><FiActivity /> Refresh Insights</button>
            <button className="btn-primary-sm" onClick={toggleQuickActions}><FiZap /> HR Actions</button>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="ep-tabs-container">
          <div className="ep-tabs-list">
            {[
              { id: 'summary', label: 'Summary' },
              { id: 'recruitment', label: 'Recruitment' },
              { id: 'performance', label: 'Performance' },
              { id: 'training', label: 'Training' },
              { id: 'lifecycle', label: 'Lifecycle' },
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
              <KPIBadge icon={<FiUsers />} label="Total Employees" value={formatNumber(totalEmployees)} color="blue" />
              <KPIBadge icon={<FiUserCheck />} label="Present Today" value={formatNumber(presentToday)} color="green" />
              <KPIBadge icon={<FiClock />} label="Lates/Absents" value={`${lateToday}/${absentToday}`} color="orange" />
              <KPIBadge icon={<FiCalendar />} label="Pending Leaves" value={formatNumber(pendingLeaves)} color="purple" />
            </>
          )}
          {activeTab === 'recruitment' && (
            <>
              <KPIBadge icon={<FiBriefcase />} label="Open Jobs" value={formatNumber(openJobs)} color="indigo" />
              <KPIBadge icon={<FiUsers />} label="Total Applicants" value={formatNumber(totalApplicants)} color="blue" />
              <KPIBadge icon={<FiCalendar />} label="Interviews" value={formatNumber(interviewsScheduled)} color="orange" />
              <KPIBadge icon={<FiUserPlus />} label="Hired (Mo)" value={formatNumber(hiredThisMonth)} color="green" />
            </>
          )}
          {activeTab === 'performance' && (
            <>
              <KPIBadge icon={<FiTrendingUp />} label="Reviews Done" value={formatNumber(completedReviews)} color="green" />
              <KPIBadge icon={<FiTarget />} label="Pending Reviews" value={formatNumber(totalPerformanceReviews - completedReviews)} color="yellow" />
              <KPIBadge icon={<FiAward />} label="Skills Tracked" value={formatNumber(totalSkills)} color="purple" />
              <KPIBadge icon={<FiCheckCircle />} label="Verified" value={formatNumber(verifiedSkills)} color="blue" />
            </>
          )}
          {activeTab === 'training' && (
            <>
              <KPIBadge icon={<FiBook />} label="Active Training" value={formatNumber(activeTrainings)} color="indigo" />
              <KPIBadge icon={<FiUsers />} label="Enrolled" value="42" color="blue" />
              <KPIBadge icon={<FiCheckCircle />} label="Completions" value="12" color="green" />
              <KPIBadge icon={<FiActivity />} label="Total Progs" value={formatNumber(totalTrainings)} color="purple" />
            </>
          )}
          {activeTab === 'lifecycle' && (
            <>
              <KPIBadge icon={<FiUserPlus />} label="Onboarding" value={formatNumber(hrmData?.pendingOnboarding || 0)} color="blue" />
              <KPIBadge icon={<FiUserX />} label="Exit Requests" value={formatNumber(pendingExits)} color="orange" />
              <KPIBadge icon={<FiActivity />} label="New Hires (Mo)" value={formatNumber(newHiresThisMonth)} color="green" />
              <KPIBadge icon={<FiClock />} label="Avg Tenure" value="2.4y" color="purple" />
            </>
          )}
        </div>

        {/* Content Area */}
        <main className="ep-content-area">
          {activeTab === 'summary' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Employee Attendance Trend</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <SatisfactionAreaChart data={attendanceTrendData} />
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Department Distribution</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <RevenueBarChart data={departmentDistributionData} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recruitment' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Hiring Performance</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <RealityTargetBarChart data={performanceTargetData} />
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Application Funnel</div></div>
                <div className="ep-card-body" style={{ height: '350px' }}>
                  <VolumeServiceBarChart data={applicationStatusData} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Recent Performance Reviews</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Employee</th><th>Rating</th><th>Status</th></tr></thead>
                    <tbody>
                      {performance.slice(0, 8).map(p => (
                        <tr key={p._id}>
                          <td style={{ fontWeight: 600 }}>{p.employee?.name || 'N/A'}</td>
                          <td style={{ fontWeight: 700, color: '#f59e0b' }}>{p.rating}/5</td>
                          <td>
                            <span className={`ep-status-badge status-${p.status === 'completed' ? 'active' : 'inactive'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Skill Mastery Overview</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Skill</th><th>Employees</th><th>Verified</th></tr></thead>
                    <tbody>
                      {skills.slice(0, 8).map(s => (
                        <tr key={s._id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.employeeCount || 1}</td>
                          <td>
                            <span className={`ep-status-badge status-${s.verified ? 'active' : 'inactive'}`}>
                              {s.verified ? 'Yes' : 'No'}
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

          {activeTab === 'training' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Active Training Programs</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Program</th><th>Type</th><th>Status</th></tr></thead>
                    <tbody>
                      {trainings.slice(0, 8).map(t => (
                        <tr key={t._id}>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td>{t.type}</td>
                          <td>
                            <span className={`ep-status-badge status-${t.status === 'active' || t.status === 'ongoing' ? 'active' : 'inactive'}`}>
                              {t.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="ep-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FiBook size={48} color="#6366f1" style={{ marginBottom: '16px' }} />
                  <h4 style={{ fontWeight: 700 }}>Training Management</h4>
                  <p style={{ color: '#6b7280', fontSize: '13px' }}>Monitor internal and external certified training cycles across departments.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'lifecycle' && (
            <div className="ep-grid-2">
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Upcoming Exit Requests</div></div>
                <div className="ep-card-body" style={{ padding: 0 }}>
                  <table className="ep-table">
                    <thead><tr><th>Employee</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {exitRequests.slice(0, 8).map(e => (
                        <tr key={e._id}>
                          <td style={{ fontWeight: 600 }}>{e.employee?.name || 'N/A'}</td>
                          <td>{formatDate(e.exitDate)}</td>
                          <td>
                            <span className={`ep-status-badge status-${e.status === 'pending' ? 'inactive' : 'active'}`}>
                              {e.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {exitRequests.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>No pending exits</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="ep-card">
                <div className="ep-card-header"><div className="ep-card-title">Activity & Notifications</div></div>
                <div className="ep-card-body" style={{ padding: '16px' }}>
                  <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                    <ActivityLogTable
                      logs={activityLog?.logs || []}
                      pagination={null}
                      onPageChange={() => { }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
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
  );
};

export default HRMDashboard;
