import { formatDate } from '../../utils/format';
import { FiUser } from 'react-icons/fi';
import '../../styles/dashboard/activity-log.css';

const ActivityLogTable = ({ logs, pagination, onPageChange }) => {
  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return '#10b981';
      case 'update':
        return '#f59e0b';
      case 'delete':
        return '#ef4444';
      default:
        return '#6366f1';
    }
  };

  const getModuleIcon = (module) => {
    const icons = {
      employee: '👤',
      finance: '💰',
      sales: '📈',
      hrm: '💼',
      auth: '🔐',
      settings: '⚙️',
    };
    return icons[module] || '📋';
  };

  // Generate a unique color for each user based on their name
  const getUserColor = (userName) => {
    if (!userName || userName === 'System') {
      return { bg: 'linear-gradient(135deg, #94A3B8 0%, #64748B 100%)', icon: '#FFFFFF' };
    }

    // Color palette with vibrant gradients and unique icon colors for each user
    const colors = [
      { bg: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)', icon: '#EF4444' }, // Red
      { bg: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', icon: '#3B82F6' }, // Blue
      { bg: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)', icon: '#10B981' }, // Green
      { bg: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)', icon: '#8B5CF6' }, // Violet
      { bg: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)', icon: '#F59E0B' }, // Orange
      { bg: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)', icon: '#EC4899' }, // Pink
      { bg: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', icon: '#06B6D4' }, // Cyan
      { bg: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)', icon: '#EF4444' }, // Red
      { bg: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)', icon: '#6366F1' }, // Indigo
      { bg: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', icon: '#F59E0B' }, // Orange
      { bg: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)', icon: '#10B981' }, // Green
      { bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', icon: '#EC4899' }, // Pink
      { bg: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)', icon: '#3B82F6' }, // Blue
      { bg: 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)', icon: '#14B8A6' }, // Teal
      { bg: 'linear-gradient(135deg, #0891B2 0%, #06B6D4 100%)', icon: '#F97316' }, // Orange
      { bg: 'linear-gradient(135deg, #0D9488 0%, #14B8A6 100%)', icon: '#8B5CF6' }, // Violet
      { bg: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)', icon: '#06B6D4' }, // Cyan
      { bg: 'linear-gradient(135deg, #BE185D 0%, #EC4899 100%)', icon: '#10B981' }, // Green
      { bg: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)', icon: '#EF4444' }, // Red
      { bg: 'linear-gradient(135deg, #C026D3 0%, #D946EF 100%)', icon: '#F59E0B' }, // Orange
      { bg: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)', icon: '#EC4899' }, // Pink
      { bg: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', icon: '#3B82F6' }, // Blue
      { bg: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)', icon: '#8B5CF6' }, // Violet
      { bg: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)', icon: '#14B8A6' }, // Teal
      { bg: 'linear-gradient(135deg, #BE185D 0%, #DB2777 100%)', icon: '#06B6D4' }, // Cyan
      { bg: 'linear-gradient(135deg, #0E7490 0%, #0891B2 100%)', icon: '#F97316' }, // Orange
      { bg: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)', icon: '#EF4444' }, // Red
      { bg: 'linear-gradient(135deg, #C2410C 0%, #EA580C 100%)', icon: '#6366F1' }, // Indigo
      { bg: 'linear-gradient(135deg, #9F1239 0%, #BE185D 100%)', icon: '#10B981' }, // Green
      { bg: 'linear-gradient(135deg, #075985 0%, #0284C7 100%)', icon: '#EC4899' }, // Pink
    ];

    // Generate a hash from the user name
    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Use absolute value and modulo to get a color index
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  return (
    <div className="activity-log">
      <div className="activity-log-header">
        <h3>Recent Activity</h3>
        {pagination && (
          <div className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </div>
        )}
      </div>

      {logs && logs.length > 0 ? (
        <div className="activity-log-table-container">
          <table className="activity-log-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Module</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const userColor = getUserColor(log.user?.name || 'System');
                return (
                  <tr key={log.id}>
                    <td className="activity-time">{formatDate(log.createdAt)}</td>
                    <td className="activity-user">
                      <div className="user-info">
                        <div 
                          className="user-avatar-icon"
                          style={{ 
                            background: userColor.bg
                          }}
                        >
                          <FiUser 
                            size={16} 
                            style={{ 
                              color: userColor.icon,
                              fill: userColor.icon,
                              stroke: userColor.icon
                            }} 
                          />
                        </div>
                        <div className="user-details">
                          <span className="user-name">{log.user?.name || 'System'}</span>
                          <span className="user-role">{log.user?.role || ''}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="activity-action-badge"
                        style={{ backgroundColor: `${getActionColor(log.action)}20`, color: getActionColor(log.action) }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td>
                      <span className="activity-module">
                        {getModuleIcon(log.module)} {log.module}
                      </span>
                    </td>
                    <td>{log.entity}</td>
                    <td className="activity-details">
                      {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="activity-log-empty">
          <div className="activity-log-empty-content">
            <div className="activity-log-empty-icon">📋</div>
            <p>No activity logs found</p>
            <span>Activity logs will appear here once actions are performed</span>
          </div>
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="activity-log-pagination">
          <button
            className="btn btn-secondary"
            disabled={pagination.page === 1}
            onClick={() => onPageChange && onPageChange(pagination.page - 1)}
          >
            Previous
          </button>
          <span>
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={pagination.page === pagination.pages}
            onClick={() => onPageChange && onPageChange(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogTable;

