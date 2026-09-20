import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiMail, FiDollarSign, FiCalendar, FiFileText, FiSend } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/sales/sales-tables.css';

const QuotationTable = ({ quotations, pagination, onPageChange }) => {
    const navigate = useNavigate();

    const handleSendQuotation = async (id) => {
        try {
            await salesService.sendQuotation(id);
            alert('Quotation sent to client successfully');
        } catch (error) {
            alert('Failed to send quotation');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'accepted': return '#10b981';
            case 'rejected': return '#ef4444';
            case 'sent': return '#f59e0b';
            case 'draft': return '#6b7280';
            case 'expired': return '#dc2626';
            default: return '#6b7280';
        }
    };

    return (
        <div className="table-container-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th>Quotation #</th>
                        <th>Client</th>
                        <th>Title</th>
                        <th>Issue Date</th>
                        <th>Valid Until</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {quotations.length > 0 ? (
                        quotations.map((quote) => (
                            <tr key={quote._id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <FiFileText size={14} style={{ color: 'var(--text-muted)' }} />
                                        <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '500' }}>
                                            {quote.quotationNumber || quote.quoteNumber}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span style={{ fontWeight: '500' }}>{quote.client?.name || 'N/A'}</span>
                                </td>
                                <td>{quote.title || 'N/A'}</td>
                                <td>
                                    {quote.issueDate ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <FiCalendar size={14} />
                                            {formatDate(quote.issueDate)}
                                        </div>
                                    ) : 'N/A'}
                                </td>
                                <td>
                                    {quote.validUntil ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                            <FiCalendar size={14} />
                                            {formatDate(quote.validUntil)}
                                        </div>
                                    ) : 'N/A'}
                                </td>
                                <td>
                                    <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                        {formatCurrency(quote.total || quote.grandTotal || 0)}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: getStatusColor(quote.status) + '20',
                                            color: getStatusColor(quote.status),
                                            border: `1px solid ${getStatusColor(quote.status)}40`,
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {quote.status || 'Draft'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons-group">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => navigate(`/sales/quotations/${quote._id}`)}
                                            title="View"
                                        >
                                            <FiEye />
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => navigate(`/sales/quotations/${quote._id}/edit`)}
                                            title="Edit"
                                        >
                                            <FiEdit />
                                        </button>
                                        {quote.status === 'draft' && (
                                            <button
                                                className="btn btn-sm"
                                                style={{ background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' }}
                                                onClick={() => handleSendQuotation(quote._id)}
                                                title="Send to Client"
                                            >
                                                <FiSend />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                No quotations found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {pagination && pagination.pages > 1 && (
                <div className="pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '20px', borderTop: '1px solid var(--border)' }}>
                    <button
                        className="btn btn-sm btn-secondary"
                        disabled={pagination.page === 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                    >
                        Previous
                    </button>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                        Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                        className="btn btn-sm btn-secondary"
                        disabled={pagination.page === pagination.pages}
                        onClick={() => onPageChange(pagination.page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default QuotationTable;
