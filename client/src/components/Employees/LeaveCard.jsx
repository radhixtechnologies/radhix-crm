import { formatDate } from '../../utils/format';
import '../../styles/employees.css';

const LeaveCard = ({ leave }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="leave-card">
      <div className="leave-card-header">
        <h4 style={{ textTransform: 'capitalize' }}>{leave.type}</h4>
        <span className={`badge badge-${getStatusColor(leave.status)}`}>
          {leave.status}
        </span>
      </div>
      <div className="leave-card-body">
        <div className="leave-card-field">
          <span className="label">From:</span>
          <span className="value">{formatDate(leave.startDate)}</span>
        </div>
        <div className="leave-card-field">
          <span className="label">To:</span>
          <span className="value">{formatDate(leave.endDate)}</span>
        </div>
        <div className="leave-card-field">
          <span className="label">Days:</span>
          <span className="value">{leave.days} day(s)</span>
        </div>
        {leave.reason && (
          <div className="leave-card-field">
            <span className="label">Reason:</span>
            <span className="value">{leave.reason}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveCard;

