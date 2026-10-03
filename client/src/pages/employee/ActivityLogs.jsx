import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiClock, FiUser, FiFileText, FiCheckCircle, FiCalendar, FiTrendingUp, FiActivity, FiXCircle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import '../../styles/forms.css';

const ActivityLogs = () => {
  const { id } = useParams();
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('timeline');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    module: '',
    action: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, id, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'timeline') {
        const response = await employeeService.getActivityTimeline(id);
        if (response.data.success) {
          setTimeline(response.data.data);
        }
      } else if (activeTab === 'logs') {
        const params = {};
        if (filters.module) params.module = filters.module;
        if (filters.action) params.action = filters.action;
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        const response = await employeeService.getActivityLogs(id, params);
        if (response.data.success) {
          setActivityLogs(response.data.data);
        }
      } else if (activeTab === 'login') {
        const response = await employeeService.getLoginHistory(id);
        if (response.data.success) {
          setLoginHistory(response.data.data);
        }
      } else if (activeTab === 'stats') {
        const response = await employeeService.getActivityStats(id);
        if (response.data.success) {
          setStats(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return <FiCheckCircle style={{ color: 'var(--success)' }} />;
      case 'update':
        return <FiFileText style={{ color: 'var(--info)' }} />;
      case 'delete':
        return <FiXCircle style={{ color: 'var(--error)' }} />;
      case 'login':
        return <FiUser style={{ color: 'var(--primary-color)' }} />;
      default:
        return <FiActivity style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const getActionColor = (action) => {
    const colors = {
      create: 'success',
      update: 'info',
      delete: 'error',
      login: 'primary',
      logout: 'secondary',
      view: 'secondary',
    };
    return colors[action] || 'secondary';
  };

  const getModuleColor = (module) => {
    const colors = {
      employee: '#6366f1',
      finance: '#10b981',
      sales: '#f59e0b',
      hrm: '#8b5cf6',
      auth: '#ef4444',
      settings: '#6b7280',
    };
    return colors[module] || '#6b7280';
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">Activity Logs</h1>
        <p className="page-subtitle">View activity history and login records</p>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)' }}>
          <button
            className={`btn ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('timeline')}
            style={{ border: 'none', borderBottom: activeTab === 'timeline' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
          >
            <FiClock /> Timeline
          </button>
          <button
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('logs')}
            style={{ border: 'none', borderBottom: activeTab === 'logs' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
          >
            <FiActivity /> Activity Logs
          </button>
          <button
            className={`btn ${activeTab === 'login' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('login')}
            style={{ border: 'none', borderBottom: activeTab === 'login' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
          >
            <FiUser /> Login History
          </button>
          <button
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('stats')}
            style={{ border: 'none', borderBottom: activeTab === 'stats' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
          >
            <FiTrendingUp /> Statistics
          </button>
        </div>

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div>
            {timeline.length > 0 ? (
              timeline.map((day, dayIndex) => (
                <div key={dayIndex} className="card" style={{ marginBottom: '20px' }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: 600, color: 'var(--primary-color)' }}>
                    {formatDate(day.date, 'MMMM DD, YYYY')}
                  </div>
                  <div style={{ padding: '16px' }}>
                    {day.activities.map((activity, actIndex) => (
                      <div
                        key={actIndex}
                        style={{
                          display: 'flex',
                          gap: '16px',
                          padding: '12px 0',
                          borderBottom: actIndex < day.activities.length - 1 ? '1px solid var(--border)' : 'none',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ marginTop: '4px' }}>
                          {getActionIcon(activity.action)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                            <span className={`badge badge-${getActionColor(activity.action)}`}>
                              {activity.action}
                            </span>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: `${getModuleColor(activity.module)}20`,
                                color: getModuleColor(activity.module),
                              }}
                            >
                              {activity.module}
                            </span>
                            <span style={{ fontWeight: 600 }}>{activity.entity}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {activity.details && typeof activity.details === 'object' ? JSON.stringify(activity.details) : activity.details || 'No details'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                            <span>{formatDate(activity.createdAt, 'relative')}</span>
                            {activity.ipAddress && <span>IP: {activity.ipAddress}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No activity timeline available
              </div>
            )}
          </div>
        )}

        {/* Activity Logs Tab */}
        {activeTab === 'logs' && (
          <div>
            {/* Filters */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 className="card-title" style={{ marginBottom: '16px' }}>Filters</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <select
                  className="form-select"
                  value={filters.module}
                  onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                >
                  <option value="">All Modules</option>
                  <option value="employee">Employee</option>
                  <option value="finance">Finance</option>
                  <option value="sales">Sales</option>
                  <option value="hrm">HRM</option>
                  <option value="auth">Auth</option>
                  <option value="settings">Settings</option>
                </select>
                <select
                  className="form-select"
                  value={filters.action}
                  onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                >
                  <option value="">All Actions</option>
                  <option value="create">Create</option>
                  <option value="update">Update</option>
                  <option value="delete">Delete</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="view">View</option>
                </select>
                <input
                  type="date"
                  className="form-input"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  className="form-input"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                  placeholder="End Date"
                />
                {(filters.module || filters.action || filters.startDate || filters.endDate) && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setFilters({ module: '', action: '', startDate: '', endDate: '' })}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* Activity Logs List */}
            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Action</th>
                    <th>Module</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {activityLogs.length > 0 ? (
                    activityLogs.map((log) => (
                      <tr key={log._id}>
                        <td>{formatDate(log.createdAt, 'relative')}</td>
                        <td>
                          <span className={`badge badge-${getActionColor(log.action)}`}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: `${getModuleColor(log.module)}20`,
                              color: getModuleColor(log.module),
                            }}
                          >
                            {log.module}
                          </span>
                        </td>
                        <td>{log.entity}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {log.details ? (typeof log.details === 'object' ? JSON.stringify(log.details).substring(0, 50) + '...' : log.details.substring(0, 50)) : '-'}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{log.ipAddress || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No activity logs found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Login History Tab */}
        {activeTab === 'login' && (
          <div>
            {loginHistory.length > 0 ? (
              <div className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="card-title">Login History</h3>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Total Logins: {loginHistory.length}
                  </div>
                </div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>IP Address</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((log) => (
                      <tr key={log._id}>
                        <td>{formatDate(log.createdAt)}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{log.ipAddress || 'N/A'}</td>
                        <td>
                          <span className="badge badge-success">Success</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No login history available
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && stats && (
          <div>
            <div className="stats-grid" style={{ marginBottom: '24px' }}>
              <div className="stat-card">
                <div className="stat-card-header">
                  <div>
                    <div className="stat-title">Total Activities</div>
                    <div className="stat-value">{stats.totalActivities}</div>
                    <div className="stat-change">Last 30 days</div>
                  </div>
                  <div className="stat-icon" style={{ backgroundColor: '#6366f120', color: '#6366f1' }}>
                    <FiActivity />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
              {/* By Action */}
              <div className="card">
                <h3 className="card-title">Activities by Action</h3>
                <div style={{ marginTop: '20px' }}>
                  {Object.keys(stats.byAction).length > 0 ? (
                    Object.entries(stats.byAction).map(([action, count]) => (
                      <div key={action} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getActionIcon(action)}
                          <span style={{ textTransform: 'capitalize' }}>{action}</span>
                        </div>
                        <span className={`badge badge-${getActionColor(action)}`}>{count}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* By Module */}
              <div className="card">
                <h3 className="card-title">Activities by Module</h3>
                <div style={{ marginTop: '20px' }}>
                  {Object.keys(stats.byModule).length > 0 ? (
                    Object.entries(stats.byModule).map(([module, count]) => (
                      <div key={module} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{module}</span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: `${getModuleColor(module)}20`,
                            color: getModuleColor(module),
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>

              {/* By Entity */}
              <div className="card">
                <h3 className="card-title">Activities by Entity</h3>
                <div style={{ marginTop: '20px' }}>
                  {Object.keys(stats.byEntity).length > 0 ? (
                    Object.entries(stats.byEntity)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 10)
                      .map(([entity, count]) => (
                        <div key={entity} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                          <span>{entity}</span>
                          <span className="badge badge-secondary">{count}</span>
                        </div>
                      ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            {stats.recentActivities && stats.recentActivities.length > 0 && (
              <div className="card" style={{ marginTop: '24px' }}>
                <h3 className="card-title">Recent Activities</h3>
                <div style={{ marginTop: '20px' }}>
                  {stats.recentActivities.map((activity) => (
                    <div
                      key={activity._id}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px 0',
                        borderBottom: '1px solid var(--border)',
                        alignItems: 'center',
                      }}
                    >
                      <div>{getActionIcon(activity.action)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                          <span className={`badge badge-${getActionColor(activity.action)}`}>
                            {activity.action}
                          </span>
                          <span>{activity.entity}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {formatDate(activity.createdAt, 'relative')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;

