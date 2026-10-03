import { useState } from 'react';
import { FiX, FiArrowRight, FiCheckCircle, FiDollarSign, FiPackage, FiAlertCircle } from 'react-icons/fi';
import '../../styles/sales/convert-lead-modal.css';

const ConvertLeadModal = ({ lead, onClose, onConvert }) => {
    const [converting, setConverting] = useState(false);

    const handleConvert = async () => {
        try {
            setConverting(true);

            // Calculate expected close date (30 days from now)
            const expectedCloseDate = new Date();
            expectedCloseDate.setDate(expectedCloseDate.getDate() + 30);

            // Split lead name into first and last name
            const nameParts = lead.name.trim().split(' ');
            const firstName = nameParts[0] || lead.name;
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Unknown';

            await onConvert({
                createContact: true,
                createAccount: true,
                createDeal: true,
                // Contact fields
                contactFirstName: firstName,
                contactLastName: lastName,
                // Deal fields
                dealValue: lead.value || 0,
                currency: lead.currency || 'INR',
                accountName: lead.company || lead.name,
                requirement: 'Sales Opportunity',
                expectedCloseDate: expectedCloseDate.toISOString().split('T')[0],
            });
        } catch (error) {
            console.error('Conversion error:', error);
            setConverting(false);
        }
    };

    // Get currency symbol
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

    // Check if lead is qualified
    const isQualified =
        lead.status === 'qualified' ||
        lead.leadTemperature === 'qualified' ||
        lead.leadTemperature === 'hot';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="convert-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-content">
                        <div className="header-icon">
                            {isQualified ? (
                                <FiCheckCircle className="icon-success" size={24} />
                            ) : (
                                <FiAlertCircle className="icon-warning" size={24} />
                            )}
                        </div>
                        <div className="header-text">
                            <h2>Convert Lead to Deal</h2>
                            <p className="header-subtitle">Transform this qualified lead into an active sales opportunity</p>
                        </div>
                    </div>
                    <button className="btn-close" onClick={onClose}>
                        <FiX size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {!isQualified && (
                        <div className="warning-banner">
                            <FiAlertCircle size={18} />
                            <div>
                                <strong>Lead Not Fully Qualified</strong>
                                <p>This lead has not been marked as qualified. Consider nurturing it further before converting.</p>
                            </div>
                        </div>
                    )}

                    {/* Lead Summary */}
                    <div className="lead-summary-card">
                        <h3>Lead Summary</h3>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="label">Contact</span>
                                <span className="value">{lead.name}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Email</span>
                                <span className="value">{lead.email}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Company</span>
                                <span className="value">{lead.company || 'Not provided'}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Phone</span>
                                <span className="value">{lead.phone || 'Not provided'}</span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Temperature</span>
                                <span className="value">
                                    <span className={`temp-badge temp-${lead.leadTemperature || 'cold'}`}>
                                        {lead.leadTemperature === 'cold' && '🧊 Cold'}
                                        {lead.leadTemperature === 'warm' && '🟡 Warm'}
                                        {lead.leadTemperature === 'hot' && '🔥 Hot'}
                                        {lead.leadTemperature === 'qualified' && '✅ Qualified'}
                                        {!lead.leadTemperature && '🧊 Cold'}
                                    </span>
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="label">Estimated Value</span>
                                <span className="value value-highlight">
                                    {getCurrencySymbol(lead.currency)}{lead.value?.toLocaleString() || 0} {lead.currency || 'INR'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Conversion Process */}
                    <div className="conversion-process">
                        <h3>What Happens Next?</h3>
                        <div className="process-steps">
                            <div className="process-step">
                                <div className="step-number">1</div>
                                <div className="step-content">
                                    <FiCheckCircle className="step-icon" />
                                    <div>
                                        <h4>Deal Created</h4>
                                        <p>A new deal will be created with stage "New Deal" (10% probability)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="step-arrow">
                                <FiArrowRight />
                            </div>

                            <div className="process-step">
                                <div className="step-number">2</div>
                                <div className="step-content">
                                    <FiPackage className="step-icon" />
                                    <div>
                                        <h4>Add Products</h4>
                                        <p>You'll be redirected to add products/services and finalize deal value</p>
                                    </div>
                                </div>
                            </div>

                            <div className="step-arrow">
                                <FiArrowRight />
                            </div>

                            <div className="process-step">
                                <div className="step-number">3</div>
                                <div className="step-content">
                                    <FiDollarSign className="step-icon" />
                                    <div>
                                        <h4>Manage Pipeline</h4>
                                        <p>Track the deal through stages: Proposal → Quotation → Negotiation → Won</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="info-box">
                        <FiCheckCircle size={16} />
                        <div>
                            <strong>Automatic Data Transfer</strong>
                            <p>All lead information, activities, and notes will be automatically linked to the new deal.</p>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button
                        className="btn btn-secondary"
                        onClick={onClose}
                        disabled={converting}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConvert}
                        disabled={converting}
                    >
                        {converting ? (
                            <>
                                <span className="spinner"></span>
                                Converting...
                            </>
                        ) : (
                            <>
                                <FiCheckCircle />
                                Convert to Deal
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConvertLeadModal;
