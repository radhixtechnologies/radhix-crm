import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiMail, FiFileText, FiDownload, FiArrowLeft, FiDollarSign, FiCheckCircle, FiClock } from 'react-icons/fi';
import { financeService } from '../../services/financeService';
import InvoiceStatusBadge from '../../components/Finance/InvoiceStatusBadge';
import Loader from '../../components/common/Loader';
import { formatCurrency, formatDate } from '../../utils/format';
import '../../styles/finance/invoice-details.css';

const InvoiceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await financeService.getInvoice(id);
      if (res.data.success) {
        setInvoice(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setLoading(true);
      const res = await financeService.generateInvoicePDF(id);
      if (res.data.success) {
        const pdfUrl = res.data.data.pdfUrl;
        await fetchInvoice();
        if (pdfUrl) {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
          const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `${apiUrl}${pdfUrl.startsWith('/') ? pdfUrl : '/' + pdfUrl}`;
          window.open(fullUrl, '_blank');
        }
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setLoading(true);
      await financeService.sendInvoiceEmail(id);
      alert('Email sent successfully');
      fetchInvoice();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await financeService.updateInvoiceStatus(id, status);
      fetchInvoice();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  if (loading && !invoice) return <Loader />;
  if (!invoice) return <div className="p-4">Invoice not found</div>;

  const remainingBalance = invoice.total - (invoice.amountPaid || 0);

  return (
    <div className="invoice-details-page animate-fade-in">
      {/* HEADER SECTION */}
      <header className="details-header-compact">
        <div className="header-top-row">
          <div className="header-left-section">
            <button className="back-nav-button" onClick={() => navigate('/finance/invoices')} title="Back to Invoices">
              <FiArrowLeft />
            </button>
            <div className="header-avatar-md">
              {getInitials(invoice.client?.name)}
            </div>
            <div className="header-info">
              <div className="title-row">
                <h1 className="invoice-title-text">Invoice {invoice.invoiceNumber}</h1>
                <InvoiceStatusBadge status={invoice.status} />
              </div>
              <div className="meta-row">
                <span>{invoice.client?.name || 'N/A'}</span>
                <span className="meta-separator">•</span>
                <span>Issued {formatDate(invoice.issueDate)}</span>
                <span className="meta-separator">•</span>
                <span className="text-muted">Due {formatDate(invoice.dueDate)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="header-actions-row">
          <div className="primary-actions">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/finance/invoices/${id}/edit`)}>
              <FiEdit /> <span className="btn-text">Edit</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleGeneratePDF} disabled={loading}>
              <FiFileText /> <span className="btn-text">Generate PDF</span>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleSendEmail} disabled={loading}>
              <FiMail /> <span className="btn-text">Send Email</span>
            </button>
            {invoice.pdfUrl && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                  const fullUrl = invoice.pdfUrl.startsWith('http') ? invoice.pdfUrl : `${apiUrl}${invoice.pdfUrl.startsWith('/') ? invoice.pdfUrl : '/' + invoice.pdfUrl}`;
                  window.open(fullUrl, '_blank');
                }}
              >
                <FiDownload /> <span className="btn-text">View PDF</span>
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
            <span className="metric-label">Total Amount</span>
            <div className="metric-value">{formatCurrency(invoice.total)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-box green">
            <FiCheckCircle />
          </div>
          <div className="metric-content">
            <span className="metric-label">Amount Paid</span>
            <div className="metric-value">{formatCurrency(invoice.amountPaid || 0)}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon-box orange">
            <FiClock />
          </div>
          <div className="metric-content">
            <span className="metric-label">Remaining Balance</span>
            <div className="metric-value">{formatCurrency(remainingBalance)}</div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <main className="details-grid">
        {/* LEFT COLUMN: INVOICE DOCUMENT */}
        <div className="left-column">
          <div className="details-card">
            <div className="card-header-sm">
              <h3>Invoice Document</h3>
            </div>
            <div className="card-body">
              <div className="invoice-doc-header">
                <div className="invoice-info-block">
                  <h4>Invoice Number</h4>
                  <p style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>{invoice.invoiceNumber}</p>
                </div>
                <div className="invoice-info-block text-right">
                  <h4>Issue Date</h4>
                  <p style={{ fontWeight: '600' }}>{formatDate(invoice.issueDate)}</p>
                  <h4>Due Date</h4>
                  <p style={{ fontWeight: '600', color: 'var(--error)' }}>{formatDate(invoice.dueDate)}</p>
                </div>
              </div>

              <div className="party-grid">
                <div className="party-block">
                  <h4>Bill From</h4>
                  <div className="party-details">
                    <p className="name">Radhix CRM</p>
                    <p>123 Business Street</p>
                    <p>City, State 12345</p>
                  </div>
                </div>
                <div className="party-block">
                  <h4>Bill To</h4>
                  <div className="party-details">
                    <p className="name">{invoice.client?.name || 'N/A'}</p>
                    <p>{invoice.client?.company || ''}</p>
                    <p>{invoice.client?.email || ''}</p>
                  </div>
                </div>
              </div>

              <table className="doc-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Rate</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index}>
                      <td>{item.description}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.rate)}</td>
                      <td style={{ textAlign: 'right' }}>{formatCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="doc-totals">
                <div className="total-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.tax > 0 && (
                  <div className="total-row">
                    <span>Tax ({invoice.taxRate}%)</span>
                    <span>{formatCurrency(invoice.tax)}</span>
                  </div>
                )}
                {invoice.discount > 0 && (
                  <div className="total-row">
                    <span>Discount</span>
                    <span>-{formatCurrency(invoice.discount)}</span>
                  </div>
                )}
                <div className="total-row grand-total">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                  <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Notes</h4>
                  <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS & INFO */}
        <div className="right-column">
          <div className="details-card status-select-card">
            <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Update Status</h4>
            <select
              className="status-dropdown"
              value={invoice.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              style={{
                borderColor: invoice.status === 'paid' ? 'var(--success)' :
                  invoice.status === 'overdue' ? 'var(--error)' : 'var(--border)'
              }}
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="details-card">
            <div className="card-header-sm">
              <h3>System Information</h3>
            </div>
            <div className="card-body">
              <div className="info-list-compact">
                <div className="info-item-compact">
                  <span className="info-label">Created</span>
                  <span className="info-value">{formatDate(invoice.createdAt)}</span>
                </div>
                <div className="info-item-compact">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">{formatDate(invoice.updatedAt)}</span>
                </div>
                {invoice.paymentDate && (
                  <div className="info-item-compact">
                    <span className="info-label">Payment Date</span>
                    <span className="info-value" style={{ color: 'var(--success)' }}>{formatDate(invoice.paymentDate)}</span>
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

export default InvoiceDetails;

