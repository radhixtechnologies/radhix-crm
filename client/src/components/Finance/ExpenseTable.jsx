import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit, FiTrash2, FiEye, FiFile, FiDownload } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/format';
import Modal from '../common/Modal';
import '../../styles/finance/expenses.css';

const ExpenseTable = ({ expenses, onDelete, onPageChange, pagination }) => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, expense: null });

  const handleDelete = (expense) => {
    setDeleteModal({ open: true, expense });
  };

  const confirmDelete = async () => {
    if (deleteModal.expense) {
      await onDelete(deleteModal.expense._id);
      setDeleteModal({ open: false, expense: null });
    }
  };

  const getCategoryLabel = (category) => {
    const labels = {
      hosting: 'Hosting',
      domain: 'Domain',
      travel: 'Travel',
      tools: 'Tools & Software',
      training: 'Training',
      hardware: 'Hardware',
      internet: 'Internet',
      server: 'Server Charges',
      marketing: 'Marketing',
      office: 'Office Supplies',
      other: 'Misc',
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status) => {
    const statusClass = `status-badge status-badge-${status}`;
    const labels = {
      paid: 'Paid',
      pending: 'Pending',
      approved: 'Approved',
      rejected: 'Rejected',
    };
    return (
      <span className={statusClass}>
        {labels[status] || 'Pending'}
      </span>
    );
  };

  return (
    <div>
      <table className="table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Vendor</th>
            <th>Payment Method</th>
            <th>Amount</th>
            <th>Tax</th>
            <th>Total</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <tr key={expense._id}>
                <td>
                  <div className="expense-title-cell">
                    <span className="expense-title">{expense.title}</span>
                    {expense.receipt && (
                      <div className="receipt-actions-inline">
                        {(() => {
                          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                          const receiptUrl = expense.receipt.url?.startsWith('http')
                            ? expense.receipt.url
                            : expense.receipt.url?.startsWith('/')
                              ? `${apiUrl}${expense.receipt.url}`
                              : `${apiUrl}/uploads/expenses/${expense.receipt.url || expense.receipt.name}`;
                          return (
                            <>
                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-icon-small"
                                title="Preview Receipt"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiEye />
                              </a>
                              <a
                                href={receiptUrl}
                                download
                                className="btn-icon-small"
                                title="Download Receipt"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FiDownload />
                              </a>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <span className="category-badge">{getCategoryLabel(expense.category)}</span>
                </td>
                <td>{expense.vendor || 'N/A'}</td>
                <td>{expense.paymentMethod || 'Bank Transfer'}</td>
                <td className="amount">${expense.amount?.toFixed(2) || '0.00'}</td>
                <td className="tax">${expense.tax?.toFixed(2) || '0.00'}</td>
                <td className="total-amount">${expense.total?.toFixed(2) || '0.00'}</td>
                <td>{formatDate(expense.date)}</td>
                <td>{getStatusBadge(expense.status)}</td>
                <td className="actions">
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      className="btn-icon"
                      onClick={() => navigate(`/finance/expenses/${expense._id}`)}
                      title="View"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleDelete(expense)}
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="10" className="text-center empty-state">
                No expenses found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, expense: null })} title="Delete Expense">
        <p>Are you sure you want to delete this expense?</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={() => setDeleteModal({ open: false, expense: null })}>
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

export default ExpenseTable;









