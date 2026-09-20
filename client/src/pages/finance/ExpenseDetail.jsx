import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiTrash2,
  FiDownload,
  FiFile,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiUser,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertCircle,
  FiEdit
} from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';
import '../../styles/finance/invoice-details.css';

const ExpenseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSuperAdmin, hasModuleAccess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expense, setExpense] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExpense = async () => {
    try {
      setLoading(true);
      const res = await financeService.getExpense(id);
      if (res.data.success) {
        setExpense(res.data.data);
      } else {
        alert('Expense not found');
        navigate('/finance/expenses');
      }
    } catch (error) {
      console.error('Error fetching expense:', error);
      alert('Failed to load expense');
      navigate('/finance/expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      setDeleting(true);
      await financeService.deleteExpense(id);
      navigate('/finance/expenses');
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert(error.response?.data?.message || 'Failed to delete expense');
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    const statusLabels = {
      'paid': 'Paid',
      'pending': 'Pending',
      'approved': 'Approved',
      'rejected': 'Rejected',
    };

    if (!window.confirm(`Are you sure you want to change status to ${statusLabels[newStatus] || newStatus}?`)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      const res = await financeService.updateExpense(id, { status: newStatus });
      if (res.data.success) {
        await fetchExpense();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const hasFinanceAccess = hasModuleAccess('finance');
  const canEdit = isSuperAdmin || hasFinanceAccess || (expense?.createdBy?._id === user?._id);
  const canApprove = isSuperAdmin || hasFinanceAccess;

  if (loading) return <Loader />;
  if (!expense) return null;

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const receiptUrl = expense.receipt?.url
    ? (expense.receipt.url.startsWith('http')
      ? expense.receipt.url
      : expense.receipt.url.startsWith('/')
        ? `${apiUrl}${expense.receipt.url}`
        : `${apiUrl}/uploads/expenses/${expense.receipt.url}`)
    : null;

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
    const statusConfig = {
      paid: { label: 'Paid', class: 'status-paid' },
      pending: { label: 'Pending', class: 'status-pending' },
      approved: { label: 'Approved', class: 'status-approved' },
      rejected: { label: 'Rejected', class: 'status-rejected' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="invoice-details-page animate-fade-in">
      {/* HEADER */}
      <header className="details-header-compact">
        <div className="header-top-row">
          <div className="header-left-section">
            <button className="back-nav-button" onClick={() => navigate('/finance/expenses')} title="Back to Expenses">
              <FiArrowLeft />
            </button>
            <div className="header-info">
              <div className="title-row">
                <h1 className="invoice-title-text">{expense.title}</h1>
                {getStatusBadge(expense.status)}
              </div>
              <div className="meta-row">
                <span><FiTag style={{ marginRight: '4px' }} />{getCategoryLabel(expense.category)}</span>
                <span className="meta-separator">•</span>
                <span>{formatDate(expense.date)}</span>
                <span className="meta-separator">•</span>
                <span className="text-muted">Vendor: {expense.vendor}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions-row">
          <div className="primary-actions">
            {canApprove && expense.status === 'pending' && (
              <>
                <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate('approved')} disabled={updatingStatus}>
                  <FiCheckCircle /> <span className="btn-text">Approve</span>
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate('rejected')} disabled={updatingStatus}>
                  <FiXCircle /> <span className="btn-text">Reject</span>
                </button>
              </>
            )}
            {canApprove && expense.status === 'approved' && (
              <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate('paid')} disabled={updatingStatus}>
                <FiCheckCircle /> <span className="btn-text">Mark as Paid</span>
              </button>
            )}
            {canApprove && expense.status === 'rejected' && (
              <button className="btn btn-secondary btn-sm" onClick={() => handleStatusUpdate('pending')} disabled={updatingStatus}>
                <FiAlertCircle /> <span className="btn-text">Resubmit</span>
              </button>
            )}
            {canEdit && (
              <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting}>
                <FiTrash2 /> <span className="btn-text">{deleting ? 'Deleting...' : 'Delete'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* METRICS ROW */}
      <section className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon-box blue">
            <FiDollarSign />
          </div>
          <div className="metric-content">
            <span className="metric-label">Amount</span>
            <div className="metric-value">{formatCurrency(expense.amount)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-box orange">
            <FiDollarSign />
          </div>
          <div className="metric-content">
            <span className="metric-label">Tax</span>
            <div className="metric-value">{formatCurrency(expense.tax)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-box green">
            <FiCheckCircle />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Amount</span>
            <div className="metric-value">{formatCurrency(expense.total)}</div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <main className="details-grid">
        {/* LEFT COLUMN */}
        <div className="left-column">
          <div className="details-card">
            <div className="card-header-sm">
              <h3>Expense Details</h3>
            </div>
            <div className="card-body">
              <div className="info-grid-2col">
                <div className="info-row">
                  <span className="info-label">Vendor</span>
                  <span className="info-value">{expense.vendor}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Category</span>
                  <span className="info-value">{getCategoryLabel(expense.category)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date</span>
                  <span className="info-value">{formatDate(expense.date)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Payment Method</span>
                  <span className="info-value">{expense.paymentMethod || 'Bank Transfer'}</span>
                </div>
              </div>

              {expense.description && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>Description</h4>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', margin: 0 }}>{expense.description}</p>
                </div>
              )}

              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '16px' }}>Financial Breakdown</h4>
                <div className="doc-totals">
                  <div className="total-row">
                    <span>Amount</span>
                    <span>{formatCurrency(expense.amount)}</span>
                  </div>
                  <div className="total-row">
                    <span>Tax Rate</span>
                    <span>{expense.taxRate?.toFixed(2) || '0.00'}%</span>
                  </div>
                  <div className="total-row">
                    <span>Tax Amount</span>
                    <span>{formatCurrency(expense.tax)}</span>
                  </div>
                  <div className="total-row grand-total">
                    <span>Total Amount</span>
                    <span>{formatCurrency(expense.total)}</span>
                  </div>
                </div>
              </div>

              {expense.receipt && receiptUrl && (
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>Receipt</h4>
                    <a href={receiptUrl} download className="btn btn-secondary btn-sm">
                      <FiDownload /> Download
                    </a>
                  </div>
                  <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)' }}>
                    {receiptUrl.toLowerCase().endsWith('.pdf') ? (
                      <iframe src={receiptUrl} style={{ width: '100%', height: '600px', border: 'none' }} title="Receipt Preview" />
                    ) : (
                      <img src={receiptUrl} alt="Receipt" style={{ width: '100%', height: 'auto', display: 'block' }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="right-column">
          <div className="details-card">
            <div className="card-header-sm">
              <h3>Additional Information</h3>
            </div>
            <div className="card-body">
              <div className="info-list">
                <div className="info-list-item">
                  <span className="info-list-label">
                    <FiUser style={{ marginRight: '8px' }} />
                    Created By
                  </span>
                  <span className="info-list-value">{expense.createdBy?.name || 'N/A'}</span>
                </div>
                <div className="info-list-item">
                  <span className="info-list-label">
                    <FiClock style={{ marginRight: '8px' }} />
                    Created At
                  </span>
                  <span className="info-list-value">
                    {new Date(expense.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {expense.approvedBy && (
                  <div className="info-list-item">
                    <span className="info-list-label">
                      <FiCheckCircle style={{ marginRight: '8px' }} />
                      Approved By
                    </span>
                    <span className="info-list-value">{expense.approvedBy?.name || 'N/A'}</span>
                  </div>
                )}
                {expense.updatedAt && (
                  <div className="info-list-item">
                    <span className="info-list-label">
                      <FiClock style={{ marginRight: '8px' }} />
                      Last Updated
                    </span>
                    <span className="info-list-value">
                      {new Date(expense.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExpenseDetail;
