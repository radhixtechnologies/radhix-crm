import '../../styles/sales/followups.css';

const ReminderBadge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge-success';
      case 'overdue':
        return 'badge-error';
      case 'pending':
        return 'badge-warning';
      case 'cancelled':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <span className={`reminder-badge ${getStatusClass(status)}`}>
      {status?.toUpperCase() || 'N/A'}
    </span>
  );
};

export default ReminderBadge;


















