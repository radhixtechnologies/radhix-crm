import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiSend, FiCheck, FiX, FiFileText, FiDollarSign, FiCalendar, FiAlertCircle, FiClock, FiUser, FiBriefcase } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/recruitment.css';

const OfferForm = () => {
    const { applicationId, offerId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [application, setApplication] = useState(null);
    const [templates, setTemplates] = useState([]);
    const [policies, setPolicies] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        // Candidate & Job Context (read-only, populated from application)
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        jobTitle: '',
        department: '',
        location: '',
        employmentType: 'full-time',

        // Compensation Structure
        salaryDetails: {
            basic: 0,
            hra: 0,
            allowances: 0,
            specialAllowance: 0,
            medical: 0,
            transport: 0,
            bonus: 0,
            variable: 0,
            otherBenefits: 0,
            currency: 'INR'
        },

        // Auto-calculated CTC (read-only)
        calculatedCTC: {
            monthlyGross: 0,
            annualGross: 0,
            annualCTC: 0
        },

        // Dates
        joiningDate: '',
        validUntil: '',

        // Offer Terms
        probationPeriod: { duration: 3, unit: 'months' },
        noticePeriod: { duration: 30, unit: 'days' },
        workingHours: '9 AM - 6 PM',
        benefits: [],
        additionalTerms: '',

        // Policy References
        policyReferences: [],

        // Template
        templateId: '',

        // Status tracking
        status: 'draft',
        approver: null,
        activities: []
    });

    useEffect(() => {
        fetchData();
    }, [applicationId, offerId]);

    useEffect(() => {
        // Auto-calculate CTC whenever salary details change
        calculateCTC();
    }, [formData.salaryDetails]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch application details
            if (applicationId) {
                const appRes = await hrmService.getApplicant(applicationId);
                if (appRes.data.success) {
                    const app = appRes.data.data;
                    setApplication(app);

                    // Populate candidate & job context
                    setFormData(prev => ({
                        ...prev,
                        candidateName: app.applicantName,
                        candidateEmail: app.email,
                        candidatePhone: app.phone,
                        jobTitle: app.jobPosting?.title || '',
                        department: app.jobPosting?.department || '',
                        location: app.jobPosting?.location || '',
                        employmentType: app.jobPosting?.type || 'full-time'
                    }));
                }
            }

            // Fetch existing offer if editing
            if (offerId) {
                const offerRes = await hrmService.getOffer(offerId);
                if (offerRes.data.success) {
                    const offer = offerRes.data.data;
                    setFormData({
                        ...offer,
                        calculatedCTC: {
                            monthlyGross: offer.salaryDetails?.monthlyGross || 0,
                            annualGross: offer.salaryDetails?.annualGross || 0,
                            annualCTC: offer.salaryDetails?.annualCTC || 0
                        },
                        templateId: offer.template?._id || '',
                        policyReferences: offer.policyReferences || [],
                        benefits: offer.benefits || []
                    });
                }
            }

            // Fetch templates
            const templatesRes = await hrmService.getOfferTemplates({ isActive: true });
            if (templatesRes.data.success) {
                setTemplates(templatesRes.data.data);
            }

            // Fetch policies
            const policiesRes = await hrmService.getPolicies({ category: 'employment' });
            if (policiesRes.data.success) {
                setPolicies(policiesRes.data.data);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const calculateCTC = () => {
        const {
            basic = 0,
            hra = 0,
            allowances = 0,
            specialAllowance = 0,
            medical = 0,
            transport = 0,
            bonus = 0,
            variable = 0,
            otherBenefits = 0
        } = formData.salaryDetails;

        const monthlyGross = Number(basic) + Number(hra) + Number(allowances) +
            Number(specialAllowance) + Number(medical) + Number(transport);
        const annualGross = monthlyGross * 12;
        const annualCTC = annualGross + Number(bonus) + Number(variable) + Number(otherBenefits);

        setFormData(prev => ({
            ...prev,
            calculatedCTC: {
                monthlyGross,
                annualGross,
                annualCTC
            }
        }));
    };

    const handleSalaryChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            salaryDetails: {
                ...prev.salaryDetails,
                [field]: Number(value) || 0
            }
        }));
    };

    const handleSaveDraft = async () => {
        // Validation
        if (!formData.joiningDate) {
            alert('Please select a Joining Date');
            return;
        }
        if (!formData.validUntil) {
            alert('Please select an Offer Validity Date');
            return;
        }

        try {
            setSaving(true);

            const payload = {
                applicationId: applicationId || formData.application,
                salaryDetails: {
                    ...formData.salaryDetails,
                    ...formData.calculatedCTC
                },
                joiningDate: formData.joiningDate,
                validUntil: formData.validUntil,
                probationPeriod: formData.probationPeriod,
                noticePeriod: formData.noticePeriod,
                workingHours: formData.workingHours,
                policyReferences: formData.policyReferences,
                additionalTerms: formData.additionalTerms,
                benefits: formData.benefits,
                templateId: formData.templateId || null // Send null if empty string
            };

            let response;
            if (offerId) {
                response = await hrmService.updateOffer(offerId, payload);
            } else {
                response = await hrmService.createOffer(payload);
            }

            if (response.data.success) {
                alert('Offer saved successfully');
                if (!offerId) {
                    navigate(`/hrm/recruitment/offers/${response.data.data._id}/edit`);
                } else {
                    fetchData(); // Refresh data
                }
            }
        } catch (error) {
            console.error('Error saving offer:', error);
            alert(error.response?.data?.message || 'Failed to save offer');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitForApproval = async () => {
        if (!offerId) {
            alert('Please save the offer first');
            return;
        }

        if (!window.confirm('Submit this offer for approval?')) return;

        try {
            setSaving(true);
            const response = await hrmService.submitOffer(offerId);
            if (response.data.success) {
                alert('Offer submitted for approval');
                fetchData();
            }
        } catch (error) {
            console.error('Error submitting offer:', error);
            alert(error.response?.data?.message || 'Failed to submit offer');
        } finally {
            setSaving(false);
        }
    };

    const handleSendOffer = async () => {
        if (!window.confirm('Send this offer to the candidate?')) return;

        try {
            setSaving(true);
            const response = await hrmService.sendOffer(offerId);
            if (response.data.success) {
                alert('Offer sent successfully');
                fetchData();
            }
        } catch (error) {
            console.error('Error sending offer:', error);
            alert(error.response?.data?.message || 'Failed to send offer');
        } finally {
            setSaving(false);
        }
    };

    const handleGeneratePDF = async () => {
        try {
            setSaving(true);
            const response = await hrmService.generateOfferPDF(offerId);
            if (response.data.success) {
                window.open(response.data.data.pdfUrl, '_blank');
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert(error.response?.data?.message || 'Failed to generate PDF');
        } finally {
            setSaving(false);
        }
    };

    const addBenefit = () => {
        const benefit = prompt('Enter benefit:');
        if (benefit) {
            setFormData(prev => ({
                ...prev,
                benefits: [...prev.benefits, benefit]
            }));
        }
    };

    const removeBenefit = (index) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.filter((_, i) => i !== index)
        }));
    };

    const addPolicyReference = () => {
        const policyId = prompt('Enter policy ID or name:');
        if (policyId) {
            setFormData(prev => ({
                ...prev,
                policyReferences: [...prev.policyReferences, { policyName: policyId, description: '' }]
            }));
        }
    };

    const removePolicyReference = (index) => {
        setFormData(prev => ({
            ...prev,
            policyReferences: prev.policyReferences.filter((_, i) => i !== index)
        }));
    };

    // Dynamic action buttons based on status
    const renderActionButtons = () => {
        const { status } = formData;

        if (status === 'draft' || status === 'rejected_by_approver') {
            return (
                <>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                        <FiX /> Cancel
                    </button>
                    <button className="btn btn-outline-primary" onClick={handleSaveDraft} disabled={saving}>
                        <FiSave /> {saving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmitForApproval} disabled={saving || !offerId}>
                        <FiSend /> Submit for Approval
                    </button>
                </>
            );
        }

        if (status === 'pending_approval') {
            return (
                <>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <div style={{ padding: '12px 24px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                        <FiClock style={{ marginRight: '8px' }} />
                        Pending Approval
                    </div>
                </>
            );
        }

        if (status === 'approved') {
            return (
                <>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <button className="btn btn-outline-primary" onClick={handleGeneratePDF} disabled={saving}>
                        <FiFileText /> Generate PDF
                    </button>
                    <button className="btn btn-primary" onClick={handleSendOffer} disabled={saving}>
                        <FiSend /> Send to Candidate
                    </button>
                </>
            );
        }

        if (status === 'sent') {
            return (
                <>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <div style={{ padding: '12px 24px', background: '#dbeafe', borderRadius: '8px', color: '#1e40af' }}>
                        <FiSend style={{ marginRight: '8px' }} />
                        Sent to Candidate
                    </div>
                </>
            );
        }

        if (status === 'accepted') {
            return (
                <>
                    <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                        Back
                    </button>
                    <div style={{ padding: '12px 24px', background: '#d1fae5', borderRadius: '8px', color: '#065f46' }}>
                        <FiCheck style={{ marginRight: '8px' }} />
                        Accepted by Candidate
                    </div>
                </>
            );
        }

        return (
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                Back
            </button>
        );
    };

    if (loading) return <Loader />;

    const isReadOnly = !['draft', 'rejected_by_approver'].includes(formData.status);

    return (
        <div className="offer-form-page" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '24px' }}>

            {/* Header */}
            <div className="page-header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                        {offerId ? 'Edit Offer Letter' : 'Create Offer Letter'}
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        {application ? `For ${application.applicantName} - ${application.jobPosting?.title}` : 'Offer Letter Details'}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {renderActionButtons()}
                </div>
            </div>

            {/* Status Banner */}
            {formData.status !== 'draft' && (
                <div style={{
                    padding: '16px 24px',
                    background: formData.status === 'accepted' ? '#d1fae5' : formData.status === 'rejected_by_candidate' ? '#fee2e2' : '#fef3c7',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    border: `1px solid ${formData.status === 'accepted' ? '#a7f3d0' : formData.status === 'rejected_by_candidate' ? '#fecaca' : '#fde68a'}`
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiAlertCircle size={20} />
                        <div>
                            <strong>Status: {formData.status.replace(/_/g, ' ').toUpperCase()}</strong>
                            {formData.approver && <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Approver: {formData.approver.name}</p>}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gap: '24px' }}>

                {/* SECTION 1: Candidate & Job Context (Read-only) */}
                <div className="form-card" style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiUser /> Candidate & Job Context
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Candidate Name</label>
                            <input
                                type="text"
                                value={formData.candidateName}
                                readOnly
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Email</label>
                            <input
                                type="email"
                                value={formData.candidateEmail}
                                readOnly
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Phone</label>
                            <input
                                type="text"
                                value={formData.candidatePhone}
                                readOnly
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Job Title</label>
                            <input
                                type="text"
                                value={formData.jobTitle}
                                readOnly
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Department</label>
                            <input
                                type="text"
                                value={formData.department}
                                readOnly
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'block', marginBottom: '8px' }}>Location</label>
                            <input
                                type="text"
                                value={formData.location}
                                readOnly
                                style={{ width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc', color: '#64748b' }}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 2: Compensation Structure */}
                <div className="form-card" style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiDollarSign /> Compensation Structure
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Basic Salary (Monthly)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.basic}
                                onChange={(e) => handleSalaryChange('basic', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>HRA (Monthly)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.hra}
                                onChange={(e) => handleSalaryChange('hra', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Allowances (Monthly)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.allowances}
                                onChange={(e) => handleSalaryChange('allowances', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Special Allowance (Monthly)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.specialAllowance}
                                onChange={(e) => handleSalaryChange('specialAllowance', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Medical (Monthly)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.medical}
                                onChange={(e) => handleSalaryChange('medical', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Transport (Monthly)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.transport}
                                onChange={(e) => handleSalaryChange('transport', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Annual Bonus</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.bonus}
                                onChange={(e) => handleSalaryChange('bonus', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Variable Pay (Annual)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.variable}
                                onChange={(e) => handleSalaryChange('variable', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Other Benefits (Annual)</label>
                            <input
                                type="number"
                                value={formData.salaryDetails.otherBenefits}
                                onChange={(e) => handleSalaryChange('otherBenefits', e.target.value)}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 3: Auto-calculated CTC Summary */}
                <div className="form-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '32px', borderRadius: '12px', color: '#fff' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>
                        CTC Summary (Auto-calculated)
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Monthly Gross</div>
                            <div style={{ fontSize: '28px', fontWeight: '700' }}>
                                {formData.salaryDetails.currency} {formData.calculatedCTC.monthlyGross.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.15)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)' }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Annual Gross</div>
                            <div style={{ fontSize: '28px', fontWeight: '700' }}>
                                {formData.salaryDetails.currency} {formData.calculatedCTC.annualGross.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.25)', padding: '20px', borderRadius: '12px', backdropFilter: 'blur(10px)', border: '2px solid rgba(255,255,255,0.3)' }}>
                            <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>Annual CTC</div>
                            <div style={{ fontSize: '32px', fontWeight: '700' }}>
                                {formData.salaryDetails.currency} {formData.calculatedCTC.annualCTC.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* SECTION 4: Joining & Offer Validity */}
                <div className="form-card" style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiCalendar /> Joining & Offer Validity
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Joining Date *</label>
                            <input
                                type="date"
                                value={formData.joiningDate ? formData.joiningDate.split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Offer Valid Until *</label>
                            <input
                                type="date"
                                value={formData.validUntil ? formData.validUntil.split('T')[0] : ''}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                disabled={isReadOnly}
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 5: Offer Terms & Policies */}
                <div className="form-card" style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiBriefcase /> Offer Terms & Policies
                    </h2>
                    <div style={{ display: 'grid', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Probation Period</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number"
                                        value={formData.probationPeriod.duration}
                                        onChange={(e) => setFormData({ ...formData, probationPeriod: { ...formData.probationPeriod, duration: e.target.value } })}
                                        disabled={isReadOnly}
                                        style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                    />
                                    <select
                                        value={formData.probationPeriod.unit}
                                        onChange={(e) => setFormData({ ...formData, probationPeriod: { ...formData.probationPeriod, unit: e.target.value } })}
                                        disabled={isReadOnly}
                                        style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                    >
                                        <option value="months">Months</option>
                                        <option value="days">Days</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Notice Period</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type="number"
                                        value={formData.noticePeriod.duration}
                                        onChange={(e) => setFormData({ ...formData, noticePeriod: { ...formData.noticePeriod, duration: e.target.value } })}
                                        disabled={isReadOnly}
                                        style={{ flex: 1, padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                    />
                                    <select
                                        value={formData.noticePeriod.unit}
                                        onChange={(e) => setFormData({ ...formData, noticePeriod: { ...formData.noticePeriod, unit: e.target.value } })}
                                        disabled={isReadOnly}
                                        style={{ padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                    >
                                        <option value="days">Days</option>
                                        <option value="months">Months</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Working Hours</label>
                                <input
                                    type="text"
                                    value={formData.workingHours}
                                    onChange={(e) => setFormData({ ...formData, workingHours: e.target.value })}
                                    disabled={isReadOnly}
                                    placeholder="e.g., 9 AM - 6 PM"
                                    style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Benefits</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {formData.benefits.map((benefit, index) => (
                                    <div key={index} style={{ background: '#eff6ff', padding: '8px 16px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{benefit}</span>
                                        {!isReadOnly && (
                                            <button onClick={() => removeBenefit(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                                <FiX size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {!isReadOnly && (
                                <button onClick={addBenefit} className="btn btn-sm btn-outline-primary">
                                    + Add Benefit
                                </button>
                            )}
                        </div>

                        <div>
                            <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Additional Terms</label>
                            <textarea
                                value={formData.additionalTerms}
                                onChange={(e) => setFormData({ ...formData, additionalTerms: e.target.value })}
                                disabled={isReadOnly}
                                rows={4}
                                placeholder="Any additional terms and conditions..."
                                style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontFamily: 'inherit' }}
                            />
                        </div>
                    </div>
                </div>

                {/* SECTION 6: Template Selection */}
                <div className="form-card" style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <FiFileText /> Offer Letter Template
                    </h2>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: '#334155', display: 'block', marginBottom: '8px' }}>Select Template</label>
                        <select
                            value={formData.templateId}
                            onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                            disabled={isReadOnly}
                            style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px' }}
                        >
                            <option value="">-- Select Template --</option>
                            {templates.map(template => (
                                <option key={template._id} value={template._id}>
                                    {template.name} {template.isDefault ? '(Default)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* SECTION 7: Approval & Status Tracking */}
                {formData.activities && formData.activities.length > 0 && (
                    <div className="form-card" style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px' }}>
                            Activity Timeline
                        </h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {formData.activities.map((activity, index) => (
                                <div key={index} style={{ display: 'flex', gap: '16px', padding: '16px', background: '#f8fafc', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                                            {activity.action.replace(/_/g, ' ').toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            {activity.details}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                        {new Date(activity.at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div >
    );
};

export default OfferForm;
