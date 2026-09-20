import { FiCalendar, FiTarget, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import '../../styles/performance.css';

/**
 * Goal Card Component
 * Displays a single performance goal
 */
const GoalCard = ({ goal, onEdit, showActions = false }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="status-icon status-completed" />;
      case 'in_progress':
        return <FiClock className="status-icon status-in-progress" />;
      case 'cancelled':
        return <FiXCircle className="status-icon status-cancelled" />;
      default:
        return <FiTarget className="status-icon status-not-started" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-secondary';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'var(--success)';
    if (progress >= 75) return 'var(--info)';
    if (progress >= 50) return 'var(--warning)';
    return 'var(--error)';
  };

  const isOverdue = new Date(goal.deadline) < new Date() && goal.status !== 'completed';

  return (
    <div className={`goal-card ${isOverdue ? 'goal-overdue' : ''}`}>
      <div className="goal-header">
        <div className="goal-title-section">
          {getStatusIcon(goal.status)}
          <h3 className="goal-title">{goal.title}</h3>
        </div>
        <span className={`badge ${getStatusClass(goal.status)}`}>
          {goal.status.replace('_', ' ')}
        </span>
      </div>

      {goal.description && (
        <p className="goal-description">{goal.description}</p>
      )}

      <div className="goal-progress-section">
        <div className="goal-progress-header">
          <span>Progress</span>
          <span className="goal-progress-value">{goal.progress}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${goal.progress}%`,
              backgroundColor: getProgressColor(goal.progress),
            }}
          />
        </div>
      </div>

      <div className="goal-footer">
        <div className="goal-date">
          <FiCalendar size={16} />
          <span>
            Deadline: {new Date(goal.deadline).toLocaleDateString()}
            {isOverdue && <span className="overdue-label"> (Overdue)</span>}
          </span>
        </div>
        {showActions && onEdit && (
          <button className="btn btn-secondary btn-sm" onClick={() => onEdit(goal)}>
            Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default GoalCard;

