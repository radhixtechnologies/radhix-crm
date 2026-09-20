import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiEdit, FiX, FiCalendar, FiDollarSign, FiFileText, FiUser, FiMail, FiPhone, FiMapPin, FiClock, FiCheckCircle, FiPrinter, FiDownload } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { formatCurrency, formatDate } from '../../utils/format';
import Loader from '../../components/common/Loader';
import '../../styles/sales/quotation-view.css';

const QuotationDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [quotation, setQuotation] = useState(null);
    const [loading, setLoading] = useState(true);
    const API_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';

    useEffect(() => {
        fetchQuotation();
    }, [id]);

    const fetchQuotation = async () => {
        try {
            setLoading(true);
            const res = await salesService.getQuotation(id);
            if (res.data.success) {
                setQuotation(res.data.data);
            } else {
                alert('Failed to fetch quotation');
                navigate('/sales/proposals?tab=quotations');
            }
        } catch (error) {
            console.error('Error fetching quotation:', error);
            alert('Error loading quotation');
            navigate('/sales/proposals?tab=quotations');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleGeneratePDF = async () => {
        try {
            // Show loading overlay or toast
            const res = await salesService.generateQuotationPDF(id);
            if (res.data.success) {
                alert('PDF generated successfully');
                fetchQuotation(); // Refresh to get PDF URL
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF');
        }
    };

    const handleSendEmail = async () => {
        try {
            const res = await salesService.sendQuotation(id);
            if (res.data.success) {
                alert('Email sent successfully');
                fetchQuotation();
            }
        } catch (error) {
            console.error('Error sending email:', error);
            alert('Failed to send email');
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

    if (loading) return <div className="page-container"><Loader /></div>;
    if (!quotation) return <div className="page-container">Quotation not found</div>;

    // Calculate totals
    let subtotal = 0;
    let lineItemDiscount = 0;
    quotation.items?.forEach(item => {
        const total = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
        subtotal += total;
        lineItemDiscount += (total * (parseFloat(item.discount) || 0) / 100);
    });

    let totalDiscount = lineItemDiscount;
    if (quotation.discountType === 'percentage') {
        totalDiscount += (subtotal - lineItemDiscount) * (parseFloat(quotation.discountValue) || 0) / 100;
    } else if (quotation.discountType === 'fixed') {
        totalDiscount += parseFloat(quotation.discountValue) || 0;
    }

    const taxableAmount = Math.max(0, subtotal - totalDiscount);
    let taxAmount = 0;
    if (!quotation.taxInclusive) {
        taxAmount = taxableAmount * (parseFloat(quotation.taxRate) || 0) / 100;
    } else {
        taxAmount = taxableAmount - (taxableAmount / (1 + (parseFloat(quotation.taxRate) || 0) / 100));
    }

    const grandTotal = quotation.taxInclusive ? taxableAmount : (taxableAmount + taxAmount);

    return (
        <div className="page-container">
            <div className="quotation-view-container">
                {/* Header with Tabs */}
                <div className="quotation-view-header">
                    {/* Title and Actions Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="quotation-view-header-left">
                            <div className="quotation-view-title">
                                <FiFileText size={24} />
                                <h1>{quotation.quotationName || 'Quotation'}</h1>
                            </div>
                            <span
                                className="quotation-view-status-badge"
                                style={{
                                    backgroundColor: getStatusColor(quotation.status) + '20',
                                    color: getStatusColor(quotation.status),
                                    border: `1px solid ${getStatusColor(quotation.status)}40`
                                }}
                            >
                                {quotation.status?.toUpperCase() || 'DRAFT'}
                            </span>
                        </div>
                        <div className="quotation-view-header-actions no-print">
                            <button className="btn btn-secondary" onClick={handlePrint}>
                                <FiPrinter /> Print
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate(`/sales/quotations/${id}/edit`)}
                            >
                                <FiEdit /> Edit
                            </button>
                            <button className="btn btn-secondary" onClick={handleGeneratePDF}>
                                <FiFileText /> Generate PDF
                            </button>
                            <button className="btn btn-secondary" onClick={handleSendEmail}>
                                <FiMail /> Send Email
                            </button>
                            {quotation.pdfUrl && (
                                <a
                                    href={`${API_URL}${quotation.pdfUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-primary"
                                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}
                                >
                                    <FiDownload /> View PDF
                                </a>
                            )}
                            <button
                                className="btn btn-secondary"
                                onClick={() => navigate('/sales/proposals?tab=quotations')}
                            >
                                <FiX /> Close
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="quotation-view-content">
                    {/* Basic Information Section */}
                    <section className="quotation-view-section">
                        <h2 className="quotation-view-section-title">Basic Information</h2>
                        <div className="quotation-view-grid">
                            <div className="quotation-view-field">
                                <label><FiFileText size={16} /> Quotation Number</label>
                                <p>{quotation.quotationNumber || 'N/A'}</p>
                            </div>
                            <div className="quotation-view-field">
                                <label><FiCalendar size={16} /> Quotation Date</label>
                                <p>{quotation.quotationDate ? formatDate(quotation.quotationDate) : 'N/A'}</p>
                            </div>
                            <div className="quotation-view-field">
                                <label><FiClock size={16} /> Valid Until</label>
                                <p>{quotation.priceValidUntil ? formatDate(quotation.priceValidUntil) : 'N/A'}</p>
                            </div>
                            <div className="quotation-view-field">
                                <label><FiDollarSign size={16} /> Currency</label>
                                <p>{quotation.currency || 'INR'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Client Information Section */}
                    <section className="quotation-view-section">
                        <h2 className="quotation-view-section-title">Client Information</h2>
                        {quotation.client ? (
                            <div className="quotation-view-grid">
                                <div className="quotation-view-field">
                                    <label><FiUser size={16} /> Client Name</label>
                                    <p>{quotation.client.name || 'N/A'}</p>
                                </div>
                                <div className="quotation-view-field">
                                    <label><FiMail size={16} /> Email</label>
                                    <p>{quotation.client.email || 'N/A'}</p>
                                </div>
                                <div className="quotation-view-field">
                                    <label><FiPhone size={16} /> Phone</label>
                                    <p>{quotation.client.phone || 'N/A'}</p>
                                </div>
                                {quotation.contact && (
                                    <div className="quotation-view-field">
                                        <label><FiUser size={16} /> Contact Person</label>
                                        <p>{quotation.contact.firstName} {quotation.contact.lastName}</p>
                                    </div>
                                )}
                            </div>
                        ) : quotation.customClientDetails ? (
                            <div className="quotation-view-grid">
                                <div className="quotation-view-field">
                                    <label><FiUser size={16} /> Client Name</label>
                                    <p>{quotation.customClientDetails.name || 'N/A'}</p>
                                </div>
                                <div className="quotation-view-field">
                                    <label><FiMail size={16} /> Email</label>
                                    <p>{quotation.customClientDetails.email || 'N/A'}</p>
                                </div>
                                <div className="quotation-view-field">
                                    <label><FiPhone size={16} /> Phone</label>
                                    <p>{quotation.customClientDetails.phone || 'N/A'}</p>
                                </div>
                                <div className="quotation-view-field quotation-view-field-full">
                                    <label><FiMapPin size={16} /> Address</label>
                                    <p>{quotation.customClientDetails.address || 'N/A'}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="quotation-view-empty">No client information available</p>
                        )}
                    </section>

                    {/* Deliverables Section */}
                    {quotation.deliverables && quotation.deliverables.length > 0 && (
                        <section className="quotation-view-section">
                            <h2 className="quotation-view-section-title">Deliverables</h2>
                            <div className="quotation-view-table-wrapper">
                                <table className="quotation-view-table">
                                    <thead>
                                        <tr>
                                            <th>Deliverable</th>
                                            <th>Description</th>
                                            <th>Timeline</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotation.deliverables.map((item, idx) => (
                                            <tr key={idx}>
                                                <td><strong>{item.name || 'N/A'}</strong></td>
                                                <td>{item.description || 'N/A'}</td>
                                                <td>{item.customTimelineText || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {quotation.deliveryTimeline && (
                                <div className="quotation-view-highlight">
                                    <FiClock size={18} />
                                    <div>
                                        <strong>Total Project Duration</strong>
                                        <p>{quotation.deliveryTimeline}</p>
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Extra Requirements Section */}
                    {quotation.extraRequirements && quotation.extraRequirements.length > 0 && (
                        <section className="quotation-view-section">
                            <h2 className="quotation-view-section-title">Extra Requirements</h2>
                            <div className="quotation-view-table-wrapper">
                                <table className="quotation-view-table">
                                    <thead>
                                        <tr>
                                            <th>Requirement</th>
                                            <th>Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {quotation.extraRequirements.map((item, idx) => (
                                            <tr key={idx}>
                                                <td><strong>{item.name || 'N/A'}</strong></td>
                                                <td>{item.description || 'N/A'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Cost Breakdown Section */}
                    <section className="quotation-view-section">
                        <h2 className="quotation-view-section-title">Cost Breakdown</h2>
                        {quotation.items && quotation.items.length > 0 ? (
                            <>
                                <div className="quotation-view-table-wrapper">
                                    <table className="quotation-view-table">
                                        <thead>
                                            <tr>
                                                <th>Item / Deliverable</th>
                                                <th style={{ textAlign: 'center' }}>Quantity</th>
                                                <th style={{ textAlign: 'right' }}>Unit Price</th>
                                                <th style={{ textAlign: 'right' }}>Discount %</th>
                                                <th style={{ textAlign: 'right' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {quotation.items.map((item, idx) => {
                                                const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
                                                const itemDiscount = itemTotal * (parseFloat(item.discount) || 0) / 100;
                                                const itemNet = itemTotal - itemDiscount;
                                                return (
                                                    <tr key={idx}>
                                                        <td><strong>{item.itemName || item.description || 'N/A'}</strong></td>
                                                        <td style={{ textAlign: 'center' }}>{item.quantity || 0}</td>
                                                        <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice || 0, quotation.currency)}</td>
                                                        <td style={{ textAlign: 'right' }}>{item.discount || 0}%</td>
                                                        <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(itemNet, quotation.currency)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals Summary */}
                                <div className="quotation-view-totals">
                                    <div className="quotation-view-totals-row">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal, quotation.currency)}</span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="quotation-view-totals-row" style={{ color: '#dc2626' }}>
                                            <span>Total Discount</span>
                                            <span>- {formatCurrency(totalDiscount, quotation.currency)}</span>
                                        </div>
                                    )}
                                    <div className="quotation-view-totals-row">
                                        <span>Tax ({quotation.taxRate || 0}%)</span>
                                        <span>{formatCurrency(taxAmount, quotation.currency)}</span>
                                    </div>
                                    <div className="quotation-view-totals-row quotation-view-totals-grand">
                                        <span>Grand Total</span>
                                        <span>{formatCurrency(grandTotal, quotation.currency)}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="quotation-view-empty">No cost items added</p>
                        )}
                    </section>

                    {/* Custom Fields Section */}
                    {quotation.customFields && quotation.customFields.length > 0 && (
                        <section className="quotation-view-section">
                            <h2 className="quotation-view-section-title">Additional Information</h2>
                            <div className="quotation-view-grid">
                                {quotation.customFields.map((field, idx) => (
                                    <div key={idx} className="quotation-view-field">
                                        <label><FiCheckCircle size={16} /> {field.fieldName}</label>
                                        <p>{field.fieldValue || 'N/A'}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Payment Terms Section */}
                    {quotation.paymentTerms && (
                        <section className="quotation-view-section">
                            <h2 className="quotation-view-section-title">Payment Terms</h2>
                            <div className="quotation-view-text-content">
                                <p>{quotation.paymentTerms}</p>
                            </div>
                        </section>
                    )}

                    {/* Notes Section */}
                    {quotation.notes && (
                        <section className="quotation-view-section">
                            <h2 className="quotation-view-section-title">Notes</h2>
                            <div className="quotation-view-text-content">
                                <p>{quotation.notes}</p>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuotationDetails;
