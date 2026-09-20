import { FiBell, FiMail, FiClock, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { formatDate } from '../../utils/format';
import '../../styles/dashboard/notifications.css';

const NotificationsPanel = ({ notifications, systemAlerts }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'leave_request':
        return <FiClock />;
      case 'application':
        return <FiMail />;
      case 'invoice':
        return <FiAlertCircle />;
      case 'payroll':
        return <FiCheckCircle />;
      default:
        return <FiBell />;
    }
  };

  return (
    <div className="notifications-panel">
      <div className="notifications-header">
        <FiBell size={20} />
        <h3>Notifications & Alerts</h3>
      </div>

      {systemAlerts && (
        <div className="system-alerts">
          <h4>System Alerts</h4>
          <div className="alerts-grid">
            {systemAlerts.pendingLeaves > 0 && (
              <div className="alert-item">
                <FiClock color="#f59e0b" />
                <span>{systemAlerts.pendingLeaves} Pending Leaves</span>
              </div>
            )}
            {systemAlerts.newApplicants > 0 && (
              <div className="alert-item">
                <FiMail color="#6366f1" />
                <span>{systemAlerts.newApplicants} New Applicants</span>
              </div>
            )}
            {systemAlerts.overdueInvoices > 0 && (
              <div className="alert-item">
                <FiAlertCircle color="#ef4444" />
                <span>{systemAlerts.overdueInvoices} Overdue Invoices</span>
              </div>
            )}
            {systemAlerts.unprocessedPayroll > 0 && (
              <div className="alert-item">
                <FiCheckCircle color="#10b981" />
                <span>{systemAlerts.unprocessedPayroll} Unprocessed Payroll</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="notifications-list">
        <h4>Recent Notifications</h4>
        {notifications && notifications.length > 0 ? (
          <ul>
            {notifications.slice(0, 10).map((notification) => (
              <li key={notification.id} className="notification-item">
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatDate(notification.createdAt)}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            No new notifications
          </p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;

