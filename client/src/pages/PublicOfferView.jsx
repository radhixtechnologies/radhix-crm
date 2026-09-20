import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheck, FiX, FiCalendar, FiDollarSign, FiBriefcase, FiClock, FiFileText, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';

const PublicOfferView = () => {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [offer, setOffer] = useState(null);
    const [error, setError] = useState(null);
    const [responding, setResponding] = useState(false);
    const [responded, setResponded] = useState(false);
    const [responseType, setResponseType] = useState(null);

    useEffect(() => {
        fetchOffer();
    }, [token]);

    const fetchOffer = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hrm/offers/public/${token}`);
            if (response.data.success) {
                setOffer(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching offer:', err);
            setError(err.response?.data?.message || 'Failed to load offer. The link may be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (action) => {
        if (!window.confirm(`Are you sure you want to ${action} this offer?`)) return;

        const rejectionReason = action === 'reject' ? prompt('Please provide a reason (optional):') : null;

        try {
            setResponding(true);
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/hrm/offers/public/${token}/respond`,
                {
                    action,
                    rejectionReason,
                    comments: ''
                }
            );

            if (response.data.success) {
                setResponded(true);
                setResponseType(action);
            }
        } catch (err) {
            console.error('Error responding to offer:', err);
            alert(err.response?.data?.message || 'Failed to submit response. Please try again.');
        } finally {
            setResponding(false);
        }
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const formatCurrency = (amount, currency = 'INR') => {
        return `${currency} ${Number(amount || 0).toLocaleString()}`;
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>Loading your offer...</div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px'
            }}>
                <div style={{
                    background: '#fff',
                    padding: '48px',
                    borderRadius: '16px',
                    maxWidth: '500px',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <FiAlertCircle size={64} color="#ef4444" style={{ marginBottom: '24px' }} />
                    <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                        Offer Not Found
                    </h1>
                    <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    if (responded) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '24px'
            }}>
                <div style={{
                    background: '#fff',
                    padding: '48px',
                    borderRadius: '16px',
                    maxWidth: '500px',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    {responseType === 'accept' ? (
                        <>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: '#d1fae5',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <FiCheck size={40} color="#065f46" />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                                Congratulations! 🎉
                            </h1>
                            <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '24px' }}>
                                You have successfully accepted the offer. Our HR team will contact you shortly with the next steps.
                            </p>
                            <p style={{ fontSize: '14px', color: '#94a3b8' }}>
                                Welcome to the team!
                            </p>
                        </>
                    ) : (
                        <>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: '#fee2e2',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px'
                            }}>
                                <FiX size={40} color="#991b1b" />
                            </div>
                            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>
                                Offer Declined
                            </h1>
                            <p style={{ color: '#64748b', lineHeight: '1.6' }}>
                                Thank you for considering our offer. We wish you all the best in your career journey.
                            </p>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (!offer) return null;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px 24px'
        }}>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{
                    background: '#fff',
                    padding: '40px',
                    borderRadius: '16px 16px 0 0',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎊</div>
                        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                            Job Offer
                        </h1>
                        <p style={{ fontSize: '18px', color: '#64748b' }}>
                            We're excited to offer you a position!
                        </p>
                    </div>

                    {/* Candidate Info */}
                    <div style={{
                        background: '#f8fafc',
                        padding: '24px',
                        borderRadius: '12px',
                        marginBottom: '32px'
                    }}>
                        <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Candidate</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>
                            {offer.candidateName}
                        </div>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>
                            {offer.candidateEmail}
                        </div>
                    </div>

                    {/* Position Details */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Position</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                {offer.designation}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Department</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                {offer.department}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Location</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                {offer.location || 'Not specified'}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Employment Type</div>
                            <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', textTransform: 'capitalize' }}>
                                {offer.employmentType?.replace('-', ' ')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compensation */}
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    padding: '40px',
                    color: '#fff'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <FiDollarSign size={28} />
                        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Compensation Package</h2>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.15)',
                        padding: '32px',
                        borderRadius: '12px',
                        backdropFilter: 'blur(10px)',
                        marginBottom: '24px'
                    }}>
                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>Annual CTC</div>
                        <div style={{ fontSize: '48px', fontWeight: '700' }}>
                            {formatCurrency(offer.salaryDetails?.annualCTC, offer.salaryDetails?.currency)}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {offer.salaryDetails?.basic > 0 && (
                            <div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>Basic Salary (Monthly)</div>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {formatCurrency(offer.salaryDetails.basic, offer.salaryDetails.currency)}
                                </div>
                            </div>
                        )}
                        {offer.salaryDetails?.hra > 0 && (
                            <div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>HRA (Monthly)</div>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {formatCurrency(offer.salaryDetails.hra, offer.salaryDetails.currency)}
                                </div>
                            </div>
                        )}
                        {offer.salaryDetails?.bonus > 0 && (
                            <div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>Annual Bonus</div>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {formatCurrency(offer.salaryDetails.bonus, offer.salaryDetails.currency)}
                                </div>
                            </div>
                        )}
                        {offer.salaryDetails?.variable > 0 && (
                            <div>
                                <div style={{ fontSize: '13px', opacity: 0.8 }}>Variable Pay</div>
                                <div style={{ fontSize: '18px', fontWeight: '600' }}>
                                    {formatCurrency(offer.salaryDetails.variable, offer.salaryDetails.currency)}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Key Details */}
                <div style={{ background: '#fff', padding: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <FiBriefcase size={24} color="#667eea" />
                        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
                            Offer Details
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gap: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                            <div style={{
                                background: '#eff6ff',
                                padding: '12px',
                                borderRadius: '8px',
                                minWidth: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiCalendar size={24} color="#2563eb" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Joining Date</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                    {formatDate(offer.joiningDate)}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                            <div style={{
                                background: '#fef3c7',
                                padding: '12px',
                                borderRadius: '8px',
                                minWidth: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiClock size={24} color="#f59e0b" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Probation Period</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                    {offer.probationPeriod?.duration} {offer.probationPeriod?.unit}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                            <div style={{
                                background: '#fee2e2',
                                padding: '12px',
                                borderRadius: '8px',
                                minWidth: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiFileText size={24} color="#ef4444" />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Notice Period</div>
                                <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                    {offer.noticePeriod?.duration} {offer.noticePeriod?.unit}
                                </div>
                            </div>
                        </div>

                        {offer.workingHours && (
                            <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                                <div style={{
                                    background: '#f3f4f6',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    minWidth: '48px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <FiClock size={24} color="#6b7280" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>Working Hours</div>
                                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>
                                        {offer.workingHours}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Benefits */}
                    {offer.benefits && offer.benefits.length > 0 && (
                        <div style={{ marginTop: '32px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>
                                Benefits & Perks
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {offer.benefits.map((benefit, index) => (
                                    <div key={index} style={{
                                        background: '#eff6ff',
                                        color: '#1e40af',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '14px',
                                        fontWeight: '500'
                                    }}>
                                        ✓ {benefit}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Additional Terms */}
                    {offer.additionalTerms && (
                        <div style={{ marginTop: '32px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#0f172a', marginBottom: '12px' }}>
                                Additional Terms
                            </div>
                            <div style={{
                                background: '#f8fafc',
                                padding: '16px',
                                borderRadius: '8px',
                                fontSize: '14px',
                                color: '#334155',
                                lineHeight: '1.6',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {offer.additionalTerms}
                            </div>
                        </div>
                    )}
                </div>

                {/* Expiry Warning */}
                <div style={{
                    background: '#fef3c7',
                    padding: '20px 40px',
                    borderTop: '1px solid #fde68a'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiAlertCircle size={20} color="#92400e" />
                        <div style={{ fontSize: '14px', color: '#92400e' }}>
                            <strong>Important:</strong> This offer is valid until {formatDate(offer.validUntil)}.
                            Please respond before this date.
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div style={{
                    background: '#fff',
                    padding: '32px 40px',
                    borderRadius: '0 0 16px 16px',
                    display: 'flex',
                    gap: '16px',
                    justifyContent: 'center'
                }}>
                    <button
                        onClick={() => handleResponse('reject')}
                        disabled={responding}
                        style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: '600',
                            border: '2px solid #e2e8f0',
                            background: '#fff',
                            color: '#64748b',
                            borderRadius: '12px',
                            cursor: responding ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '150px'
                        }}
                        onMouseEnter={(e) => {
                            if (!responding) {
                                e.target.style.borderColor = '#ef4444';
                                e.target.style.color = '#ef4444';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!responding) {
                                e.target.style.borderColor = '#e2e8f0';
                                e.target.style.color = '#64748b';
                            }
                        }}
                    >
                        <FiX style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Decline
                    </button>

                    <button
                        onClick={() => handleResponse('accept')}
                        disabled={responding}
                        style={{
                            padding: '16px 32px',
                            fontSize: '16px',
                            fontWeight: '600',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: '#fff',
                            borderRadius: '12px',
                            cursor: responding ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            minWidth: '150px',
                            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            if (!responding) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!responding) {
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                            }
                        }}
                    >
                        <FiCheck style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        {responding ? 'Processing...' : 'Accept Offer'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default PublicOfferView;
