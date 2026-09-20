import { useNavigate } from 'react-router-dom';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/finance/outstanding-invoices.css';

const OutstandingInvoicesCard = ({ invoices }) => {
  const navigate = useNavigate();

  return (
    <div className="outstanding-invoices-card">
      <h3>Outstanding Invoices</h3>
      <div className="invoices-list">
        {invoices && invoices.length > 0 ? (
          invoices.slice(0, 5).map((invoice) => (
            <div key={invoice._id} className="invoice-item" onClick={() => navigate(`/finance/invoices/${invoice._id}`)}>
              <div className="invoice-info">
                <span className="invoice-number">{invoice.invoiceNumber}</span>
                <span className="invoice-client">{invoice.client?.name || 'N/A'}</span>
              </div>
              <div className="invoice-details">
                <InvoiceStatusBadge status={invoice.status} />
                <span className="invoice-amount">{formatCurrency(invoice.total)}</span>
                <span className="invoice-date">Due: {formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          ))
        ) : (
          <p>No outstanding invoices</p>
        )}
      </div>
    </div>
  );
};

export default OutstandingInvoicesCard;

