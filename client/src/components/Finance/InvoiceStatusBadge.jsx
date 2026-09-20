import '../../styles/finance/invoice-status-badge.css';

const InvoiceStatusBadge = ({ status }) => {
  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'badge-success';
      case 'overdue':
        return 'badge-error';
      case 'sent':
      case 'pending':
        return 'badge-warning';
      case 'draft':
        return 'badge-info';
      case 'cancelled':
        return 'badge-secondary';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <span className={`invoice-status-badge ${getStatusClass(status)}`}>
      {status?.toUpperCase() || 'N/A'}
    </span>
  );
};

export default InvoiceStatusBadge;













