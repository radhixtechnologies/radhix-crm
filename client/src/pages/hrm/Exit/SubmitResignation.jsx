import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/exit.css';

const SubmitResignation = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        resignationDate: '',
        proposedLastWorkingDay: '',
        exitReason: '',
        exitReasonDetails: '',
        resignationLetter: null
    });

    const exitReasons = [
        { value: 'better_opportunity', label: 'Better Opportunity' },
        { value: 'higher_compensation', label: 'Higher Compensation' },
        { value: 'career_growth', label: 'Career Growth' },
        { value: 'relocation', label: 'Relocation' },
        { value: 'personal_reasons', label: 'Personal Reasons' },
        { value: 'health_issues', label: 'Health Issues' },
        { value: 'further_studies', label: 'Further Studies' },
        { value: 'work_life_balance', label: 'Work-Life Balance' },
        { value: 'company_culture', label: 'Company Culture' },
        { value: 'management_issues', label: 'Management Issues' },
        { value: 'retirement', label: 'Retirement' },
        { value: 'other', label: 'Other' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Auto-calculate last working day (30 days notice period)
        if (name === 'resignationDate' && value) {
            const resDate = new Date(value);
            resDate.setDate(resDate.getDate() + 30);
            setFormData(prev => ({
                ...prev,
                proposedLastWorkingDay: resDate.toISOString().split('T')[0]
            }));
        }
    };

    const handleFileChange = (e) => {
        setFormData(prev => ({
            ...prev,
            resignationLetter: e.target.files[0]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            // In a real implementation, you would upload the file first
            // and get the URL, then submit with the URL
            const submitData = {
                resignationDate: formData.resignationDate,
                proposedLastWorkingDay: formData.proposedLastWorkingDay,
                exitReason: formData.exitReason,
                exitReasonDetails: formData.exitReasonDetails,
                // resignationLetter: uploadedFileUrl
            };

            await hrmService.submitResignation(submitData);

            alert('Resignation submitted successfully. Your manager will be notified.');
            navigate('/hrm/exit/my-requests');
        } catch (error) {
            console.error('Error submitting resignation:', error);
            alert(error.response?.data?.message || 'Failed to submit resignation');
        } finally {
            setLoading(false);
        }
    };

    const calculateNoticePeriod = () => {
        if (formData.resignationDate && formData.proposedLastWorkingDay) {
            const start = new Date(formData.resignationDate);
            const end = new Date(formData.proposedLastWorkingDay);
            const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
            return days;
        }
        return 0;
    };

    return (
        <div className="submit-resignation-container">
            <div className="page-header">
                <h1>Submit Resignation</h1>
                <p>Please fill out the form below to submit your resignation</p>
            </div>

            <form onSubmit={handleSubmit} className="resignation-form">
                <div className="form-card">
                    <h2>Resignation Details</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="resignationDate">
                                Resignation Date <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="resignationDate"
                                name="resignationDate"
                                value={formData.resignationDate}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="proposedLastWorkingDay">
                                Proposed Last Working Day <span className="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="proposedLastWorkingDay"
                                name="proposedLastWorkingDay"
                                value={formData.proposedLastWorkingDay}
                                onChange={handleChange}
                                min={formData.resignationDate}
                                required
                            />
                            {calculateNoticePeriod() > 0 && (
                                <small className="notice-period-info">
                                    Notice Period: {calculateNoticePeriod()} days
                                </small>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="exitReason">
                            Reason for Leaving <span className="required">*</span>
                        </label>
                        <select
                            id="exitReason"
                            name="exitReason"
                            value={formData.exitReason}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a reason</option>
                            {exitReasons.map(reason => (
                                <option key={reason.value} value={reason.value}>
                                    {reason.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="exitReasonDetails">
                            Additional Details
                        </label>
                        <textarea
                            id="exitReasonDetails"
                            name="exitReasonDetails"
                            value={formData.exitReasonDetails}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Please provide additional details about your decision to leave..."
                            maxLength="1000"
                        />
                        <small>{formData.exitReasonDetails.length}/1000 characters</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="resignationLetter">
                            Resignation Letter (Optional)
                        </label>
                        <input
                            type="file"
                            id="resignationLetter"
                            name="resignationLetter"
                            onChange={handleFileChange}
                            accept=".pdf,.doc,.docx"
                        />
                        <small>Accepted formats: PDF, DOC, DOCX (Max 5MB)</small>
                    </div>
                </div>

                <div className="info-card">
                    <div className="info-icon">
                        <i className="fas fa-info-circle"></i>
                    </div>
                    <div className="info-content">
                        <h3>What happens next?</h3>
                        <ul>
                            <li>Your resignation will be sent to your reporting manager for approval</li>
                            <li>After manager approval, HR will review and initiate the exit process</li>
                            <li>You will be assigned exit tasks to complete before your last working day</li>
                            <li>An exit interview will be scheduled</li>
                            <li>Your Full & Final settlement will be calculated and processed</li>
                        </ul>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/hrm/exit/my-requests')}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Submitting...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-paper-plane"></i> Submit Resignation
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SubmitResignation;
