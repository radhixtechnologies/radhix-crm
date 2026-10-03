import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiDownload, FiPlus, FiEdit, FiTrash2, FiDollarSign, FiFileText, FiCheck, FiX } from 'react-icons/fi';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatDate, formatCurrency } from '../../utils/format';
import dayjs from 'dayjs';
import '../../styles/forms.css';

const Payroll = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [salarySlips, setSalarySlips] = useState([]);
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('salary-slips');
  const [showReimbursementModal, setShowReimbursementModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);
  const [selectedSalarySlip, setSelectedSalarySlip] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [reimbursementForm, setReimbursementForm] = useState({
    title: '',
    category: 'travel',
    amount: '',
    date: dayjs().format('YYYY-MM-DD'),
    description: '',
    receipt: { name: '', url: '' },
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'salary-slips') {
        const response = await employeeService.getSalarySlips({});
        if (response.data.success) {
          setSalarySlips(response.data.data);
        }
      } else {
        const params = statusFilter ? { status: statusFilter } : {};
        const response = await employeeService.getReimbursements(params);
        if (response.data.success) {
          setReimbursements(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReimbursement = async (e) => {
    e.preventDefault();
    try {
      await employeeService.createReimbursement(reimbursementForm);
      setShowReimbursementModal(false);
      setReimbursementForm({
        title: '',
        category: 'travel',
        amount: '',
        date: dayjs().format('YYYY-MM-DD'),
        description: '',
        receipt: { name: '', url: '' },
      });
      fetchData();
      alert('Reimbursement claim submitted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error submitting reimbursement');
    }
  };

  const handleDeleteReimbursement = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reimbursement claim?')) return;
    try {
      await employeeService.deleteReimbursement(id);
      fetchData();
      alert('Reimbursement deleted successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting reimbursement');
    }
  };

  const handleApproveReject = async (status, comments = '', rejectionReason = '') => {
    try {
      await employeeService.updateReimbursement(selectedReimbursement._id, {
        status,
        comments,
        rejectionReason,
      });
      setShowApprovalModal(false);
      setSelectedReimbursement(null);
      fetchData();
      alert(`Reimbursement ${status} successfully!`);
    } catch (error) {
      alert(error.response?.data?.message || `Error ${status === 'approved' ? 'approving' : 'rejecting'} reimbursement`);
    }
  };

  const getMonthName = (month) => {
    return dayjs().month(month - 1).format('MMMM');
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      paid: 'info',
    };
    return colors[status] || 'secondary';
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">My Payroll</h1>
            <p className="page-subtitle">View and download your salary slips. Manage reimbursement claims.</p>
          </div>
          {activeTab === 'reimbursements' && (
            <button className="btn btn-primary" onClick={() => setShowReimbursementModal(true)}>
              <FiPlus /> Claim Reimbursement
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', borderBottom: '1px solid var(--border)' }}>
          <button
            className={`btn ${activeTab === 'salary-slips' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('salary-slips')}
            style={{ border: 'none', borderBottom: activeTab === 'salary-slips' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
          >
            <FiFileText /> Salary Slips
          </button>
          <button
            className={`btn ${activeTab === 'reimbursements' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reimbursements')}
            style={{ border: 'none', borderBottom: activeTab === 'reimbursements' ? '2px solid var(--primary-color)' : '2px solid transparent' }}
          >
            <FiDollarSign /> Reimbursements
          </button>
        </div>

        {/* Salary Slips Tab */}
        {activeTab === 'salary-slips' && (
          <div>
            {salarySlips.length > 0 ? (
              <div style={{ display: 'grid', gap: '20px' }}>
                {salarySlips.map((slip) => (
                  <div key={slip._id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0' }}>
                          Salary Slip - {getMonthName(slip.month)} {slip.year}
                        </h3>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Generated: {formatDate(slip.generatedAt)}
                        </div>
                      </div>
                      {slip.pdfUrl && (
                        <a
                          href={slip.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-secondary"
                        >
                          <FiDownload /> Download PDF
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Earnings */}
                      <div>
                        <h4 style={{ marginBottom: '16px' }}>Earnings</h4>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Basic Salary</span>
                            <strong>{formatCurrency(slip.earnings?.basic || 0)}</strong>
                          </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>HRA</span>
                            <strong>{formatCurrency(slip.earnings?.hra || 0)}</strong>
                          </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Allowances</span>
                            <strong>{formatCurrency(slip.earnings?.allowances || 0)}</strong>
                          </div>
                        </div>
                        {slip.earnings?.bonus > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Bonus</span>
                              <strong>{formatCurrency(slip.earnings.bonus)}</strong>
                            </div>
                          </div>
                        )}
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>Total Earnings</span>
                            <span>{formatCurrency(slip.earnings?.totalEarnings || 0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Deductions */}
                      <div>
                        <h4 style={{ marginBottom: '16px' }}>Deductions</h4>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>PF (Provident Fund)</span>
                            <strong>{formatCurrency(slip.deductions?.pf || 0)}</strong>
                          </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Tax / TDS</span>
                            <strong>{formatCurrency(slip.deductions?.tax || 0)}</strong>
                          </div>
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>ESI</span>
                            <strong>{formatCurrency(slip.deductions?.esi || 0)}</strong>
                          </div>
                        </div>
                        {slip.deductions?.loan > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Loan</span>
                              <strong>{formatCurrency(slip.deductions.loan)}</strong>
                            </div>
                          </div>
                        )}
                        {slip.deductions?.unpaidLeave > 0 && (
                          <div style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>Unpaid Leave</span>
                              <strong>{formatCurrency(slip.deductions.unpaidLeave)}</strong>
                            </div>
                          </div>
                        )}
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                            <span>Total Deductions</span>
                            <span>{formatCurrency(slip.deductions?.totalDeductions || 0)}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--primary-color)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '18px' }}>
                            <span>Net Salary</span>
                            <span style={{ color: 'var(--success)' }}>{formatCurrency(slip.netSalary || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                No salary slips found
              </div>
            )}
          </div>
        )}

        {/* Reimbursements Tab */}
        {activeTab === 'reimbursements' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            <div className="card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reimbursements.length > 0 ? (
                    reimbursements.map((reimb) => (
                      <tr key={reimb._id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{reimb.title}</div>
                          {reimb.description && (
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              {reimb.description.substring(0, 50)}
                              {reimb.description.length > 50 && '...'}
                            </div>
                          )}
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{reimb.category.replace('-', ' ')}</td>
                        <td>{formatCurrency(reimb.amount)}</td>
                        <td>{formatDate(reimb.date)}</td>
                        <td>
                          <span className={`badge badge-${getStatusColor(reimb.status)}`}>
                            {reimb.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {reimb.receipt?.url && (
                              <a
                                href={reimb.receipt.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-secondary"
                                title="View Receipt"
                              >
                                <FiDownload />
                              </a>
                            )}
                            {reimb.status === 'pending' && (
                              <>
                                <button
                                  className="btn btn-sm btn-secondary"
                                  onClick={() => {
                                    setReimbursementForm({
                                      title: reimb.title,
                                      category: reimb.category,
                                      amount: reimb.amount,
                                      date: formatDate(reimb.date, 'YYYY-MM-DD'),
                                      description: reimb.description || '',
                                      receipt: reimb.receipt || { name: '', url: '' },
                                    });
                                    setSelectedReimbursement(reimb);
                                    // For edit, you'd update the existing one - simplified for now
                                    setShowReimbursementModal(true);
                                  }}
                                  title="Edit"
                                >
                                  <FiEdit />
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteReimbursement(reimb._id)}
                                  title="Delete"
                                >
                                  <FiTrash2 />
                                </button>
                              </>
                            )}
                            {(isAdmin || isSuperAdmin) && reimb.status === 'pending' && (
                              <button
                                className="btn btn-sm btn-success"
                                onClick={() => {
                                  setSelectedReimbursement(reimb);
                                  setShowApprovalModal(true);
                                }}
                                title="Approve/Reject"
                              >
                                <FiCheck /> Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No reimbursement claims found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Reimbursement Modal */}
        <Modal isOpen={showReimbursementModal} onClose={() => setShowReimbursementModal(false)} title="Claim Reimbursement">
          <form onSubmit={handleSubmitReimbursement}>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                type="text"
                className="form-input"
                value={reimbursementForm.title}
                onChange={(e) => setReimbursementForm({ ...reimbursementForm, title: e.target.value })}
                required
                placeholder="e.g., Business Trip - New York"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-select"
                value={reimbursementForm.category}
                onChange={(e) => setReimbursementForm({ ...reimbursementForm, category: e.target.value })}
                required
              >
                <option value="travel">Travel</option>
                <option value="meals">Meals</option>
                <option value="accommodation">Accommodation</option>
                <option value="office-supplies">Office Supplies</option>
                <option value="training">Training</option>
                <option value="medical">Medical</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <input
                type="number"
                className="form-input"
                value={reimbursementForm.amount}
                onChange={(e) => setReimbursementForm({ ...reimbursementForm, amount: e.target.value })}
                required
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={reimbursementForm.date}
                onChange={(e) => setReimbursementForm({ ...reimbursementForm, date: e.target.value })}
                required
                max={dayjs().format('YYYY-MM-DD')}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea"
                value={reimbursementForm.description}
                onChange={(e) => setReimbursementForm({ ...reimbursementForm, description: e.target.value })}
                placeholder="Describe the expense"
                rows={4}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Receipt URL</label>
              <input
                type="url"
                className="form-input"
                value={reimbursementForm.receipt.url}
                onChange={(e) => setReimbursementForm({
                  ...reimbursementForm,
                  receipt: { ...reimbursementForm.receipt, url: e.target.value },
                })}
                placeholder="https://example.com/receipt.pdf"
              />
              <div className="form-helper">Note: File upload will be added in future updates</div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowReimbursementModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Submit Claim
              </button>
            </div>
          </form>
        </Modal>

        {/* Approval Modal */}
        <Modal isOpen={showApprovalModal} onClose={() => setShowApprovalModal(false)} title="Review Reimbursement">
          {selectedReimbursement && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Title:</strong> {selectedReimbursement.title}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Category:</strong> {selectedReimbursement.category.replace('-', ' ')}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Amount:</strong> {formatCurrency(selectedReimbursement.amount)}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Date:</strong> {formatDate(selectedReimbursement.date)}
                </div>
                {selectedReimbursement.description && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Description:</strong>
                    <div style={{ marginTop: '8px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius)' }}>
                      {selectedReimbursement.description}
                    </div>
                  </div>
                )}
                {selectedReimbursement.receipt?.url && (
                  <div style={{ marginBottom: '12px' }}>
                    <strong>Receipt:</strong>
                    <div style={{ marginTop: '8px' }}>
                      <a href={selectedReimbursement.receipt.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-secondary">
                        <FiDownload /> View Receipt
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowApprovalModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleApproveReject('rejected', '', 'Rejected by manager')}
                >
                  <FiX /> Reject
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => handleApproveReject('approved', 'Approved')}
                >
                  <FiCheck /> Approve
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Payroll;

