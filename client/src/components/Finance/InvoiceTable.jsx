import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiMail, FiFileText, FiDownload, FiMoreVertical } from 'react-icons/fi';
import InvoiceStatusBadge from './InvoiceStatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../common/Modal';

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(n => n)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const InvoiceTable = ({ invoices, onDelete, onSendEmail, onDownloadPDF, onStatusChange, loading, onPageChange, pagination }) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, invoice: null });
  const [actionMenu, setActionMenu] = useState({ open: false, invoiceId: null });

  const handleDelete = (invoice) => {
    setDeleteModal({ open: true, invoice });
  };

  const confirmDelete = async () => {
    if (deleteModal.invoice) {
      await onDelete(deleteModal.invoice._id);
      setDeleteModal({ open: false, invoice: null });
    }
  };

  const handleStatusChange = async (invoiceId, status) => {
    if (onStatusChange) {
      await onStatusChange(invoiceId, status);
    }
    setActionMenu({ open: false, invoiceId: null });
  };

  const handleDownloadPDF = async (invoice) => {
    if (onDownloadPDF) {
      await onDownloadPDF(invoice);
    }
    setActionMenu({ open: false, invoiceId: null });
  };

  const toggleActionMenu = (invoiceId) => {
    setActionMenu(prev => ({
      open: prev.invoiceId === invoiceId ? !prev.open : true,
      invoiceId: invoiceId
    }));
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.action-menu-wrapper')) {
        setActionMenu({ open: false, invoiceId: null });
      }
    };

    if (actionMenu.open) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [actionMenu.open]);

  return (
    <div className="table-container-responsive">
      <table className="table">
        <thead>
          <tr>
            <th>Invoice #</th>
            <th>Client</th>
            <th>Dates</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan="8" className="text-center">
                <div className="loader-spinner"></div>
              </td>
            </tr>
          ) : invoices.length > 0 ? (
            invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td className="invoice-number" style={{ fontWeight: '600', color: 'var(--primary)' }}>
                  {invoice.invoiceNumber}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="employee-avatar-table">
                      <span>{getInitials(invoice.client?.name)}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{invoice.client?.name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{invoice.client?.company || 'Personal'}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ color: 'var(--text-main)' }}>Issued: {formatDate(invoice.issueDate)}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Due: {formatDate(invoice.dueDate)}</div>
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                    {formatCurrency(invoice.total)}
                  </div>
                  {invoice.amountPaid > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--success)' }}>
                      Paid: {formatCurrency(invoice.amountPaid)}
                    </div>
                  )}
                </td>
                <td>
                  <InvoiceStatusBadge status={invoice.status} />
                </td>
                <td>
                  <div className="action-menu-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/finance/invoices/${invoice._id}`)}
                        title="View"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => navigate(`/finance/invoices/${invoice._id}/edit`)}
                        title="Edit"
                      >
                        <FiEdit />
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => toggleActionMenu(invoice._id)}
                        title="More Actions"
                      >
                        <FiMoreVertical />
                      </button>
                    </div>
                    {actionMenu.open && actionMenu.invoiceId === invoice._id && (
                      <div
                        className="action-dropdown"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 1000,
                          minWidth: '200px',
                          marginTop: '4px'
                        }}
                      >
                        <button
                          className="dropdown-item"
                          onClick={() => handleStatusChange(invoice._id, 'paid')}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Mark as Paid"
                        >
                          <FiFileText /> Mark as Paid
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={() => handleStatusChange(invoice._id, 'pending')}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Mark as Unpaid/Pending"
                        >
                          <FiFileText /> Mark as Unpaid
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={() => handleStatusChange(invoice._id, 'overdue')}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Mark as Overdue"
                        >
                          <FiFileText /> Mark as Overdue
                        </button>
                        <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                        <button
                          className="dropdown-item"
                          onClick={() => handleDownloadPDF(invoice)}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Download PDF"
                        >
                          <FiDownload /> Download PDF
                        </button>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            onSendEmail(invoice._id);
                            setActionMenu({ open: false, invoiceId: null });
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Send Email"
                        >
                          <FiMail /> Send Email
                        </button>
                        <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid var(--border)' }} />
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            handleDelete(invoice);
                            setActionMenu({ open: false, invoiceId: null });
                          }}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            textAlign: 'left',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--error)',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--surface)'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                          title="Delete"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="text-center empty-state">
                No invoices found
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

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, invoice: null })}
        title="Delete Invoice"
      >
        <p>Are you sure you want to delete invoice {deleteModal.invoice?.invoiceNumber}?</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, invoice: null })}>
            Cancel
          </button>
          <button className="btn btn-error" onClick={confirmDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default InvoiceTable;

