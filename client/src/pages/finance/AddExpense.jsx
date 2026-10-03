import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUpload,
  FiX,
  FiFile,
  FiEye,
  FiDollarSign,
  FiCalendar,
  FiTag,
  FiShoppingBag,
  FiCreditCard,
  FiPercent,
  FiFileText,
  FiInfo,
  FiArrowLeft
} from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import Loader from '../../components/common/Loader';
import api from '../../services/api';
import '../../styles/finance/invoice-form-modern.css';
import '../../styles/finance/add-expense-modern.css';

const AddExpense = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    amount: '',
    taxRate: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    vendor: '',
    paymentMethod: 'Bank Transfer',
    status: 'pending',
    receipt: null,
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload PDF, JPG, PNG, or DOC files only.');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB.');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('receipt', file);

      const res = await api.post('/finance/expenses/upload-receipt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setFormData({
          ...formData,
          receipt: {
            name: res.data.data.name,
            url: res.data.data.url,
          },
        });
      } else {
        alert('Failed to upload receipt');
      }
    } catch (error) {
      console.error('Error uploading receipt:', error);
      alert(error.response?.data?.message || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  const removeReceipt = () => {
    setFormData({
      ...formData,
      receipt: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        taxRate: parseFloat(formData.taxRate) || 0,
      };
      await financeService.createExpense(expenseData);
      navigate('/finance/expenses');
    } catch (error) {
      console.error('Error creating expense:', error);
      alert(error.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    const tax = (amount * taxRate) / 100;
    return (amount + tax).toFixed(2);
  };

  const getTaxAmount = () => {
    const amount = parseFloat(formData.amount) || 0;
    const taxRate = parseFloat(formData.taxRate) || 0;
    return ((amount * taxRate) / 100).toFixed(2);
  };

  if (loading) return <Loader />;

  return (
    <div className="invoice-form-page animate-fade-in">
      <header className="details-header-compact">
        <div className="header-top-row">
          <div className="header-left-section">
            <button className="back-nav-button" onClick={() => navigate('/finance/expenses')} title="Back to Expenses">
              <FiArrowLeft />
            </button>
            <div className="header-info">
              <h1 className="page-title-modern">Add New Expense</h1>
              <p className="page-subtitle-modern">
                Track and manage company expenses
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="invoice-form-content">
        <form className="expense-form-modern" onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section">
            <div className="section-header">
              <FiInfo className="section-icon" />
              <h2 className="section-title">Basic Information</h2>
            </div>

            <div className="form-group">
              <label className="form-label">
                <FiFileText className="label-icon" />
                Expense Title <span className="required">*</span>
              </label>
              <input
                type="text"
                className="form-input-modern"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Domain Purchase, Hosting Subscription"
              />
            </div>

            <div className="form-grid-modern">
              <div className="form-group">
                <label className="form-label">
                  <FiTag className="label-icon" />
                  Category <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    className="form-select-modern"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="hosting">Hosting</option>
                    <option value="domain">Domain</option>
                    <option value="travel">Travel</option>
                    <option value="tools">Tools & Software</option>
                    <option value="training">Training</option>
                    <option value="hardware">Hardware</option>
                    <option value="internet">Internet</option>
                    <option value="server">Server Charges</option>
                    <option value="marketing">Marketing</option>
                    <option value="office">Office Supplies</option>
                    <option value="other">Misc</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiCalendar className="label-icon" />
                  Date <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input-modern"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-grid-modern">
              <div className="form-group">
                <label className="form-label">
                  <FiShoppingBag className="label-icon" />
                  Vendor <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input-modern"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  required
                  placeholder="e.g., Hostinger, AWS, Google"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiCreditCard className="label-icon" />
                  Payment Method <span className="required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    className="form-select-modern"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="form-section">
            <div className="section-header">
              <FiDollarSign className="section-icon" />
              <h2 className="section-title">Financial Details</h2>
            </div>

            <div className="form-grid-modern">
              <div className="form-group">
                <label className="form-label">
                  <FiDollarSign className="label-icon" />
                  Amount <span className="required">*</span>
                </label>
                <div className="input-with-prefix">
                  <span className="input-prefix">$</span>
                  <input
                    type="number"
                    className="form-input-modern"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <FiPercent className="label-icon" />
                  Tax Rate (%)
                </label>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    className="form-input-modern"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
            </div>

            {/* Financial Summary Card */}
            <div className="financial-summary-card">
              <div className="summary-row">
                <span className="summary-label">Subtotal:</span>
                <span className="summary-value">${(parseFloat(formData.amount) || 0).toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Tax Amount:</span>
                <span className="summary-value">${getTaxAmount()}</span>
              </div>
              <div className="summary-row summary-total">
                <span className="summary-label">Total Amount:</span>
                <span className="summary-value-total">${getTotalAmount()}</span>
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="form-section">
            <div className="section-header">
              <FiFileText className="section-icon" />
              <h2 className="section-title">Additional Information</h2>
            </div>

            <div className="form-group">
              <label className="form-label">
                Status <span className="required">*</span>
              </label>
              <div className="select-wrapper">
                <select
                  className="form-select-modern"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-textarea-modern"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows="4"
                placeholder="Additional details about the expense..."
              />
            </div>
          </div>

          {/* Receipt Upload Section */}
          <div className="form-section">
            <div className="section-header">
              <FiFile className="section-icon" />
              <h2 className="section-title">Receipt/Bill</h2>
            </div>

            {!formData.receipt ? (
              <div className="file-upload-area-modern">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="receipt-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="receipt-upload" className="file-upload-label-modern">
                  <div className="upload-icon-wrapper">
                    <FiUpload className="upload-icon" />
                  </div>
                  <div className="upload-content">
                    <span className="upload-text">
                      {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                    </span>
                    <span className="upload-hint">PDF, JPG, PNG, or DOC (Max 10MB)</span>
                  </div>
                </label>
              </div>
            ) : (
              <div className="file-preview-modern">
                <div className="file-preview-card">
                  <div className="file-icon-wrapper">
                    <FiFile className="file-icon-large" />
                  </div>
                  <div className="file-info">
                    <span className="file-name">{formData.receipt.name}</span>
                    <span className="file-status">Uploaded successfully</span>
                  </div>
                  <div className="file-actions-modern">
                    <a
                      href={formData.receipt.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-action btn-view"
                      title="View"
                    >
                      <FiEye />
                    </a>
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="btn-action btn-remove"
                      title="Remove"
                    >
                      <FiX />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="form-actions-modern">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={() => navigate('/finance/expenses')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-submit"
              disabled={loading || uploading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                'Create Expense'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;

