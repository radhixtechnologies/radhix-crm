import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiMail, FiFileText, FiDownload, FiDollarSign, FiPrinter, FiCalendar, FiUser, FiCheckCircle, FiXCircle, FiClock, FiTag } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/format';
import '../../styles/sales/proposal-details.css';

const ProposalDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProposal();
    }, [id]);

    const fetchProposal = async () => {
        try {
            setLoading(true);
            const res = await salesService.getProposal(id);
            if (res.data.success) {
                setProposal(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching proposal:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePDF = async () => {
        try {
            await salesService.generateProposalPDF(id);
            alert('PDF generated successfully');
            fetchProposal();
        } catch {
            alert('Failed to generate PDF');
        }
    };

    const handleSendEmail = async () => {
        try {
            await salesService.emailProposal(id);
            alert('Email sent successfully');
            fetchProposal();
        } catch {
            alert('Failed to send email');
        }
    };

    const handleConvertToInvoice = async () => {
        if (window.confirm('Convert this proposal to invoice?')) {
            try {
                const res = await salesService.convertToInvoice(id);
                if (res.data.success) {
                    alert('Proposal converted to invoice successfully');
                    navigate(`/finance/invoices/${res.data.data._id}`);
                }
            } catch {
                alert('Failed to convert proposal');
            }
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Loader />;

    if (!proposal) {
        return <div>Proposal not found</div>;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const getStatusBadgeClass = (status) => {
        const statusMap = {
            'draft': 'badge-draft',
            'pending-approval': 'badge-pending',
            'approved': 'badge-approved',
            'sent': 'badge-sent',
            'revised': 'badge-revised',
            'accepted': 'badge-accepted',
            'rejected': 'badge-rejected',
            'expired': 'badge-expired',
            'withdrawn': 'badge-withdrawn'
        };
        return statusMap[status] || 'badge-draft';
    };

    const getCurrencySymbol = (currency) => {
        const symbols = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'AUD': 'A$',
            'CAD': 'C$'
        };
        return symbols[currency] || '₹';
    };

    // Helper function to check if a value exists and is not empty
    const hasValue = (value) => {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'number') return true;
        return false;
    };

    return (
        <div className="proposal-details-container">
            {/* Action Bar - Hidden on Print */}
            <div className="proposal-action-bar no-print">
                <div className="action-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => navigate('/sales/proposals')}
                        style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            border: '1px solid #e3e8f7',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            fontSize: '20px',
                            color: '#2d3748'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#f8f9ff';
                            e.currentTarget.style.borderColor = '#5e35b1';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'white';
                            e.currentTarget.style.borderColor = '#e3e8f7';
                        }}
                        title="Back to Proposals"
                    >
                        ←
                    </button>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #5e35b1 0%, #7e57c2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 600,
                        letterSpacing: '0.5px'
                    }}>
                        {proposal?.client?.name ? proposal.client.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'PR'}
                    </div>
                </div>
                <div className="action-bar-right">
                    <button className="btn btn-secondary" onClick={handlePrint} title="Print">
                        <FiPrinter /> Print
                    </button>
                    <button className="btn btn-secondary" onClick={() => navigate(`/sales/proposals/${id}/edit`)}>
                        <FiEdit /> Edit
                    </button>
                    <button className="btn btn-secondary" onClick={handleGeneratePDF}>
                        <FiFileText /> Generate PDF
                    </button>
                    <button className="btn btn-secondary" onClick={handleSendEmail}>
                        <FiMail /> Send Email
                    </button>
                    {proposal.status === 'accepted' && (
                        <button className="btn btn-primary" onClick={handleConvertToInvoice}>
                            <FiDollarSign /> Convert to Invoice
                        </button>
                    )}
                    {proposal.pdfUrl && (
                        <a href={`${API_URL}${proposal.pdfUrl}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                            <FiDownload /> View PDF
                        </a>
                    )}
                </div>
            </div>

            {/* Proposal Document */}
            <div className="proposal-document">
                {/* Header Section */}
                <div className="proposal-doc-header">
                    <div className="header-top">
                        <div className="header-left">
                            {hasValue(proposal.title) && (
                                <h2 className="proposal-title">{proposal.title}</h2>
                            )}
                        </div>
                        <div className="header-right">
                            <span className={`status-badge ${getStatusBadgeClass(proposal.status)}`}>
                                {proposal.status?.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                        </div>
                    </div>

                    <div className="proposal-meta-grid">
                        {hasValue(proposal.proposalDate || proposal.issueDate) && (
                            <div className="meta-item">
                                <FiCalendar className="meta-icon" />
                                <div>
                                    <span className="meta-label">Proposal Date</span>
                                    <span className="meta-value">{formatDate(proposal.proposalDate || proposal.issueDate)}</span>
                                </div>
                            </div>
                        )}
                        {hasValue(proposal.validUntil || proposal.expiryDate) && (
                            <div className="meta-item">
                                <FiClock className="meta-icon" />
                                <div>
                                    <span className="meta-label">Valid Until</span>
                                    <span className="meta-value">{formatDate(proposal.validUntil || proposal.expiryDate)}</span>
                                </div>
                            </div>
                        )}
                        {hasValue(proposal.submissionDate) && (
                            <div className="meta-item">
                                <FiCalendar className="meta-icon" />
                                <div>
                                    <span className="meta-label">Submitted On</span>
                                    <span className="meta-value">{formatDate(proposal.submissionDate)}</span>
                                </div>
                            </div>
                        )}
                        {hasValue(proposal.acceptanceDate) && (
                            <div className="meta-item">
                                <FiCheckCircle className="meta-icon" />
                                <div>
                                    <span className="meta-label">Accepted On</span>
                                    <span className="meta-value">{formatDate(proposal.acceptanceDate)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* FROM and TO Section */}
                <div className="proposal-parties-section">
                    <div className="party-box">
                        <h3 className="party-title">From</h3>
                        <div className="party-details">
                            <p className="company-name">Radhix CRM</p>
                            <p>123 Business Street</p>
                            <p>City, State 12345</p>
                            <p>Email: support@radhix.com</p>
                        </div>
                    </div>

                    <div className="party-box">
                        <h3 className="party-title">To</h3>
                        <div className="party-details">
                            <p className="company-name">{proposal.client?.name || 'N/A'}</p>
                            {hasValue(proposal.client?.company) && <p>{proposal.client.company}</p>}
                            {hasValue(proposal.client?.email) && <p>Email: {proposal.client.email}</p>}
                            {hasValue(proposal.contactPersons) && (
                                <div style={{ marginTop: '12px' }}>
                                    <p style={{ fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#6b7280' }}>Contact Person(s):</p>
                                    {proposal.contactPersons.map((contact, idx) => (
                                        <p key={idx} style={{ fontSize: '14px', margin: '4px 0' }}>
                                            <FiUser style={{ display: 'inline', marginRight: '6px', fontSize: '12px' }} />
                                            {contact.firstName} {contact.lastName}
                                            {contact.email && <span style={{ color: '#6b7280' }}> ({contact.email})</span>}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Approval Status */}
                {proposal.internalApprovalRequired && (
                    <div className="approval-section">
                        <div className="approval-header">
                            <h3 className="section-title">Approval Status</h3>
                            <span className={`approval-badge ${proposal.approvalStatus}`}>
                                {proposal.approvalStatus?.replace('-', ' ').toUpperCase()}
                            </span>
                        </div>
                        {hasValue(proposal.approvedBy) && (
                            <div className="approval-info">
                                <FiCheckCircle />
                                <span>Approved by <strong>{proposal.approvedBy.name}</strong></span>
                                {hasValue(proposal.approvalDate) && <span> on {formatDate(proposal.approvalDate)}</span>}
                            </div>
                        )}
                        {hasValue(proposal.rejectionReason) && (
                            <div className="rejection-reason">
                                <FiXCircle />
                                <span><strong>Rejection Reason:</strong> {proposal.rejectionReason}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Business Content Sections */}
                {hasValue(proposal.clientRequirements) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Client Requirements</h3>
                        <div className="section-content">
                            <p>{proposal.clientRequirements}</p>
                        </div>
                    </div>
                )}

                {hasValue(proposal.scopeOfWork) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Scope of Work</h3>
                        <div className="section-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.scopeOfWork}</p>
                        </div>
                    </div>
                )}

                {hasValue(proposal.solutionOverview) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Solution Overview</h3>
                        <div className="section-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.solutionOverview}</p>
                        </div>
                    </div>
                )}

                {/* Estimated Value (for new proposals without items) */}
                {(!proposal.items || proposal.items.length === 0) && hasValue(proposal.estimatedValue) && proposal.estimatedValue > 0 && (
                    <div className="proposal-section">
                        <h3 className="section-title">Estimated Value</h3>
                        <div className="table-wrapper">
                            <table className="proposal-items-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30%' }}>Currency</th>
                                        <th style={{ width: '40%' }}>Amount</th>
                                        <th style={{ width: '30%' }}>Timeline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><strong>{proposal.currency || 'INR'}</strong></td>
                                        <td>
                                            <strong style={{ fontSize: '18px', color: '#5e35b1' }}>
                                                {getCurrencySymbol(proposal.currency)}{parseFloat(proposal.estimatedValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </strong>
                                        </td>
                                        <td>{proposal.executionTimeline || 'Not specified'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Deliverables */}
                {hasValue(proposal.deliverables) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Deliverables</h3>
                        <div className="table-wrapper">
                            <table className="proposal-items-table">
                                <thead>
                                    <tr>
                                        <th className="col-description" style={{ width: '40%' }}>Deliverable Name</th>
                                        <th className="col-description" style={{ width: '60%' }}>Description</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proposal.deliverables.map((deliverable, idx) => (
                                        <tr key={idx}>
                                            <td className="col-description">
                                                <strong>{deliverable.title}</strong>
                                                {hasValue(deliverable.dueDate) && (
                                                    <div style={{ fontSize: '12px', color: '#5e35b1', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <FiCalendar size={12} /> Due: {formatDate(deliverable.dueDate)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="col-description">{deliverable.description || 'No description provided'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {hasValue(proposal.exclusions) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Exclusions</h3>
                        <div className="section-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.exclusions}</p>
                        </div>
                    </div>
                )}

                {hasValue(proposal.assumptions) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Assumptions</h3>
                        <div className="section-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.assumptions}</p>
                        </div>
                    </div>
                )}

                {hasValue(proposal.dependencies) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Dependencies</h3>
                        <div className="section-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.dependencies}</p>
                        </div>
                    </div>
                )}

                {/* Line Items Table (if exists for backward compatibility) */}
                {hasValue(proposal.items) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Line Items</h3>
                        <div className="table-wrapper">
                            <table className="proposal-items-table">
                                <thead>
                                    <tr>
                                        <th className="col-description">Description</th>
                                        <th className="col-quantity">Qty</th>
                                        <th className="col-rate">Rate</th>
                                        <th className="col-amount">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proposal.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="col-description">{item.description}</td>
                                            <td className="col-quantity">{item.quantity}</td>
                                            <td className="col-rate">{getCurrencySymbol(proposal.currency)}{parseFloat(item.rate || 0).toFixed(2)}</td>
                                            <td className="col-amount">{getCurrencySymbol(proposal.currency)}{parseFloat(item.amount || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pricing Summary */}
                        <div className="proposal-pricing-summary">
                            <div className="summary-row">
                                <span className="summary-label">Subtotal</span>
                                <span className="summary-value">{getCurrencySymbol(proposal.currency)}{parseFloat(proposal.subtotal || 0).toFixed(2)}</span>
                            </div>
                            {proposal.tax > 0 && (
                                <div className="summary-row">
                                    <span className="summary-label">Tax ({proposal.taxRate}%)</span>
                                    <span className="summary-value">{getCurrencySymbol(proposal.currency)}{parseFloat(proposal.tax || 0).toFixed(2)}</span>
                                </div>
                            )}
                            {proposal.discount > 0 && (
                                <div className="summary-row discount-row">
                                    <span className="summary-label">Discount</span>
                                    <span className="summary-value">-{getCurrencySymbol(proposal.currency)}{parseFloat(proposal.discount || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="summary-row summary-total">
                                <span className="summary-label">Total</span>
                                <span className="summary-value">{getCurrencySymbol(proposal.currency)}{parseFloat(proposal.total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}


                {/* Commercial & Legal Terms */}
                {(hasValue(proposal.paymentTerms) || hasValue(proposal.executionTimeline) || hasValue(proposal.warrantyTerms) ||
                    hasValue(proposal.supportTerms) || hasValue(proposal.slaReference) || hasValue(proposal.confidentialityClause) ||
                    hasValue(proposal.terminationClause) || hasValue(proposal.governingLaw)) && (
                        <div className="proposal-section">
                            <h3 className="section-title">Commercial & Legal Terms</h3>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '20px',
                                marginTop: '20px'
                            }}>
                                {hasValue(proposal.paymentTerms) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>💳</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Payment Terms
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.paymentTerms}</p>
                                    </div>
                                )}

                                {hasValue(proposal.executionTimeline) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>⏱️</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Execution Timeline
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.executionTimeline}</p>
                                    </div>
                                )}

                                {hasValue(proposal.warrantyTerms) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>🛡️</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Warranty Terms
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.warrantyTerms}</p>
                                    </div>
                                )}

                                {hasValue(proposal.supportTerms) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>🤝</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Support Terms
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.supportTerms}</p>
                                    </div>
                                )}

                                {hasValue(proposal.slaReference) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>📋</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                SLA Reference
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.slaReference}</p>
                                    </div>
                                )}

                                {hasValue(proposal.confidentialityClause) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>🔒</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Confidentiality
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.confidentialityClause}</p>
                                    </div>
                                )}

                                {hasValue(proposal.terminationClause) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>⚠️</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Termination
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.terminationClause}</p>
                                    </div>
                                )}

                                {hasValue(proposal.governingLaw) && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
                                        border: '1px solid #e3e8f7',
                                        borderRadius: '16px',
                                        padding: '24px',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(94, 53, 177, 0.08)',
                                        cursor: 'default'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 53, 177, 0.15)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 53, 177, 0.08)';
                                        }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            marginBottom: '12px'
                                        }}>
                                            <span style={{ fontSize: '24px' }}>⚖️</span>
                                            <h4 style={{
                                                fontSize: '15px',
                                                fontWeight: 600,
                                                color: '#5e35b1',
                                                margin: 0
                                            }}>
                                                Governing Law
                                            </h4>
                                        </div>
                                        <p style={{ fontSize: '14px', color: '#4a5568', lineHeight: 1.7, margin: 0 }}>{proposal.governingLaw}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                {/* Metadata */}
                {(hasValue(proposal.industry) || (hasValue(proposal.language) && proposal.language !== 'English') || (hasValue(proposal.tags) && proposal.tags.length > 0)) && (
                    <div className="metadata-section">
                        <div className="metadata-grid">
                            {hasValue(proposal.language) && proposal.language !== 'English' && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Language</span>
                                    <span className="metadata-value">{proposal.language}</span>
                                </div>
                            )}
                            {hasValue(proposal.industry) && (
                                <div className="metadata-item">
                                    <span className="metadata-label">Industry</span>
                                    <span className="metadata-value">{proposal.industry}</span>
                                </div>
                            )}
                            {hasValue(proposal.tags) && (
                                <div className="metadata-item full-width">
                                    <span className="metadata-label"><FiTag style={{ display: 'inline', marginRight: '6px' }} />Tags</span>
                                    <div className="tags-container">
                                        {proposal.tags.map((tag, idx) => (
                                            <span key={idx} className="tag-badge">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {hasValue(proposal.notes) && (
                    <div className="proposal-section">
                        <h3 className="section-title">Internal Notes</h3>
                        <div className="notes-content">
                            <p style={{ whiteSpace: 'pre-wrap' }}>{proposal.notes}</p>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {(hasValue(proposal.createdBy) || hasValue(proposal.lastModifiedBy)) && (
                    <div className="proposal-footer">
                        <div className="footer-info">
                            {hasValue(proposal.createdBy) && (
                                <p><strong>Created by:</strong> {proposal.createdBy.name} on {formatDate(proposal.createdAt)}</p>
                            )}
                            {hasValue(proposal.lastModifiedBy) && (
                                <p><strong>Last modified by:</strong> {proposal.lastModifiedBy.name} on {formatDate(proposal.updatedAt)}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProposalDetails;
