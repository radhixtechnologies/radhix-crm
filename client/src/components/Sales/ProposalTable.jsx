import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiMail, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/sales/sales-tables.css';

const ProposalTable = ({ proposals, pagination, onPageChange }) => {
  const navigate = useNavigate();

  const handleEmailProposal = async (id) => {
    try {
      await salesService.emailProposal(id);
      alert('Proposal email sent successfully');
    } catch (error) {
      alert('Failed to send email');
    }
  };

  const handleConvertToInvoice = async (id) => {
    if (window.confirm('Convert this proposal to invoice?')) {
      try {
        const res = await salesService.convertToInvoice(id);
        if (res.data.success) {
          alert('Proposal converted to invoice successfully');
          navigate(`/finance/invoices/${res.data.data._id}`);
        }
      } catch (error) {
        alert('Failed to convert proposal');
      }
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
            <th>Proposal #</th>
            <th>Client</th>
            <th>Title</th>
            <th>Proposal Date</th>
            <th>Valid Until</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {proposals.length > 0 ? (
            proposals.map((proposal) => (
              <tr key={proposal._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiFileText size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: '500' }}>
                      {proposal.proposalNumber}
                    </span>
                  </div>
                </td>
                <td>
                  <span style={{ fontWeight: '500' }}>{proposal.client?.name || 'N/A'}</span>
                </td>
                <td>{proposal.title || 'N/A'}</td>
                <td>
                  {(proposal.proposalDate || proposal.issueDate) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <FiCalendar size={14} />
                      {formatDate(proposal.proposalDate || proposal.issueDate)}
                    </div>
                  ) : 'N/A'}
                </td>
                <td>
                  {(proposal.validUntil || proposal.expiryDate) ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <FiCalendar size={14} />
                      {formatDate(proposal.validUntil || proposal.expiryDate)}
                    </div>
                  ) : 'N/A'}
                </td>
                <td>
                  <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                    {formatCurrency(proposal.estimatedValue || proposal.total || 0)}
                  </span>
                </td>
                <td>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: getStatusColor(proposal.status) + '20',
                      color: getStatusColor(proposal.status),
                      border: `1px solid ${getStatusColor(proposal.status)}40`,
                      padding: '4px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}
                  >
                    {proposal.status || 'N/A'}
                  </span>
                </td>
                <td>
                  <div className="action-buttons-group">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/sales/proposals/${proposal._id}`)}
                      title="View"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => navigate(`/sales/proposals/${proposal._id}/edit`)}
                      title="Edit"
                    >
                      <FiEdit />
                    </button>
                    <button
                      className="btn btn-sm"
                      style={{ background: '#dbeafe', color: '#2563eb', border: '1px solid #bfdbfe' }}
                      onClick={() => handleEmailProposal(proposal._id)}
                      title="Email"
                    >
                      <FiMail />
                    </button>
                    {proposal.status === 'accepted' && (
                      <button
                        className="btn btn-sm"
                        style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
                        onClick={() => handleConvertToInvoice(proposal._id)}
                        title="Convert to Invoice"
                      >
                        <FiDollarSign />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No proposals found
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

export default ProposalTable;
