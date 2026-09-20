import '../../styles/sales/status-badge.css';

const StatusBadge = ({ status, type = 'lead' }) => {
  const getStatusClass = (status, type) => {
    if (type === 'lead') {
      switch (status?.toLowerCase()) {
        case 'new':
          return 'badge-info';
        case 'contacted':
          return 'badge-warning';
        case 'qualified':
          return 'badge-primary';
        case 'converted':
          return 'badge-success';
        case 'lost':
          return 'badge-error';
        default:
          return 'badge-secondary';
      }
    } else if (type === 'deal') {
      switch (status?.toLowerCase()) {
        case 'prospect':
          return 'badge-info';
        case 'qualified':
          return 'badge-warning';
        case 'proposal-sent':
          return 'badge-primary';
        case 'negotiation':
          return 'badge-warning';
        case 'closed-won':
          return 'badge-success';
        case 'closed-lost':
          return 'badge-error';
        default:
          return 'badge-secondary';
      }
    }
    return 'badge-secondary';
  };

  return (
    <span className={`status-badge ${getStatusClass(status, type)} ${status?.toLowerCase()}`}>
      {status?.replace(/-/g, ' ').toUpperCase() || 'N/A'}
    </span>
  );
};

export default StatusBadge;


















