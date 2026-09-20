import { formatDate } from '../../utils/format';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import '../../styles/employees.css';

dayjs.extend(relativeTime);

const Timeline = ({ logs }) => {
  const groupedLogs = logs.reduce((acc, log) => {
    const date = dayjs(log.createdAt).format('YYYY-MM-DD');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(log);
    return acc;
  }, {});

  const getActionIcon = (action) => {
    switch (action) {
      case 'create':
        return '➕';
      case 'update':
        return '✏️';
      case 'delete':
        return '🗑️';
      case 'view':
        return '👁️';
      case 'login':
        return '🔐';
      case 'logout':
        return '🚪';
      default:
        return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'create':
        return 'var(--success)';
      case 'update':
        return 'var(--info)';
      case 'delete':
        return 'var(--error)';
      case 'view':
        return 'var(--text-secondary)';
      case 'login':
        return 'var(--success)';
      case 'logout':
        return 'var(--warning)';
      default:
        return 'var(--primary-color)';
    }
  };

  return (
    <div className="timeline">
      {Object.keys(groupedLogs).sort().reverse().map((date) => (
        <div key={date} className="timeline-group">
          <div className="timeline-date">
            <strong>{formatDate(date)}</strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              {dayjs(date).fromNow()}
            </span>
          </div>
          <div className="timeline-items">
            {groupedLogs[date].map((log) => (
              <div key={log._id} className="timeline-item">
                <div
                  className="timeline-icon"
                  style={{ backgroundColor: getActionColor(log.action) }}
                >
                  {getActionIcon(log.action)}
                </div>
                <div className="timeline-content">
                  <div className="timeline-title">
                    <strong>{log.action}</strong> {log.entity}
                    {log.entityId && <span className="timeline-entity-id">#{log.entityId}</span>}
                  </div>
                  <div className="timeline-meta">
                    Module: {log.module} • {dayjs(log.createdAt).format('HH:mm:ss')}
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="timeline-details">
                      <pre>{JSON.stringify(log.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;

