import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/policies.css';

const PolicyForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const [loading, setLoading] = useState(false);
    const [departments, setDepartments] = useState(['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations']);

    const [formData, setFormData] = useState({
        title: '',
        category: 'HR',
        description: '',
        content: '',
        documentUrl: '',
        effectiveDate: '',
        expiryDate: '',
        isMandatory: false,
        requiresAcknowledgment: true,
        applicableTo: {
            allEmployees: true,
            departments: [],
            roles: [],
            locations: [],
            employmentTypes: [],
        },
        enforcementRules: {
            blockAttendance: false,
            blockOfferAcceptance: false,
            blockSystemAccess: false,
            blockLeaveApplication: false,
        },
        reminderSchedule: {
            enabled: false,
            frequency: 'weekly',
            maxReminders: 3,
        },
    });

    useEffect(() => {
        if (isEditMode) {
            fetchPolicy();
        }
    }, [id]);

    const fetchPolicy = async () => {
        try {
            setLoading(true);
            const response = await hrmService.getPolicy(id);
            const policy = response.data.data;

            setFormData({
                title: policy.title || '',
                category: policy.category || 'HR',
                description: policy.description || '',
                content: policy.content || '',
                documentUrl: policy.documentUrl || '',
                effectiveDate: policy.effectiveDate ? new Date(policy.effectiveDate).toISOString().split('T')[0] : '',
                expiryDate: policy.expiryDate ? new Date(policy.expiryDate).toISOString().split('T')[0] : '',
                isMandatory: policy.isMandatory || false,
                requiresAcknowledgment: policy.requiresAcknowledgment !== false,
                applicableTo: policy.applicableTo || {
                    allEmployees: true,
                    departments: [],
                    roles: [],
                    locations: [],
                    employmentTypes: [],
                },
                enforcementRules: policy.enforcementRules || {
                    blockAttendance: false,
                    blockOfferAcceptance: false,
                    blockSystemAccess: false,
                    blockLeaveApplication: false,
                },
                reminderSchedule: policy.reminderSchedule || {
                    enabled: false,
                    frequency: 'weekly',
                    maxReminders: 3,
                },
            });
        } catch (error) {
            console.error('Error fetching policy:', error);
            alert('Failed to load policy');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleApplicableToChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            applicableTo: {
                ...prev.applicableTo,
                [field]: value,
            },
        }));
    };

    const handleEnforcementChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            enforcementRules: {
                ...prev.enforcementRules,
                [field]: value,
            },
        }));
    };

    const handleReminderChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            reminderSchedule: {
                ...prev.reminderSchedule,
                [field]: value,
            },
        }));
    };

    const handleDepartmentToggle = (dept) => {
        const currentDepts = formData.applicableTo.departments || [];
        const newDepts = currentDepts.includes(dept)
            ? currentDepts.filter(d => d !== dept)
            : [...currentDepts, dept];

        handleApplicableToChange('departments', newDepts);
    };

    const handleLocationToggle = (location) => {
        const currentLocations = formData.applicableTo.locations || [];
        const newLocations = currentLocations.includes(location)
            ? currentLocations.filter(l => l !== location)
            : [...currentLocations, location];

        handleApplicableToChange('locations', newLocations);
    };

    const handleEmploymentTypeToggle = (type) => {
        const currentTypes = formData.applicableTo.employmentTypes || [];
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter(t => t !== type)
            : [...currentTypes, type];

        handleApplicableToChange('employmentTypes', newTypes);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.content || !formData.effectiveDate) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setLoading(true);

            if (isEditMode) {
                await hrmService.updatePolicy(id, formData);
                alert('Policy updated successfully');
            } else {
                await hrmService.createPolicy(formData);
                alert('Policy created successfully');
            }

            navigate('/hrm/policies');
        } catch (error) {
            console.error('Error saving policy:', error);
            alert(error.response?.data?.message || 'Failed to save policy');
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEditMode) {
        return <div className="loading">Loading policy...</div>;
    }

    return (
        <div className="policy-form-container">
            <div className="policy-form-header">
                <h1>{isEditMode ? 'Edit Policy' : 'Create New Policy'}</h1>
                <button className="btn-back" onClick={() => navigate('/hrm/policies')}>
                    <i className="fas fa-arrow-left"></i> Back to Policies
                </button>
            </div>

            <form onSubmit={handleSubmit} className="policy-form">
                {/* Basic Information */}
                <div className="form-section">
                    <h2>Basic Information</h2>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Policy Title <span className="required">*</span></label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g., Code of Conduct Policy"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Category <span className="required">*</span></label>
                            <select name="category" value={formData.category} onChange={handleChange} required>
                                <option value="HR">HR</option>
                                <option value="IT">IT</option>
                                <option value="POSH">POSH</option>
                                <option value="Compliance">Compliance</option>
                                <option value="Leave">Leave</option>
                                <option value="Security">Security</option>
                                <option value="Code of Conduct">Code of Conduct</option>
                                <option value="Expense">Expense</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Brief description of the policy"
                            rows="3"
                        />
                    </div>

                    <div className="form-group">
                        <label>Policy Content <span className="required">*</span></label>
                        <textarea
                            name="content"
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="Full policy content (supports HTML)"
                            rows="10"
                            required
                        />
                        <small>You can use HTML tags for formatting</small>
                    </div>

                    <div className="form-group">
                        <label>Document URL (Optional)</label>
                        <input
                            type="url"
                            name="documentUrl"
                            value={formData.documentUrl}
                            onChange={handleChange}
                            placeholder="https://example.com/policy.pdf"
                        />
                        <small>Link to PDF or external document</small>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Effective Date <span className="required">*</span></label>
                            <input
                                type="date"
                                name="effectiveDate"
                                value={formData.effectiveDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Expiry Date (Optional)</label>
                            <input
                                type="date"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Policy Settings */}
                <div className="form-section">
                    <h2>Policy Settings</h2>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="isMandatory"
                                checked={formData.isMandatory}
                                onChange={handleChange}
                            />
                            <span>Mandatory Policy</span>
                        </label>
                        <small>Employees must acknowledge this policy</small>
                    </div>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                name="requiresAcknowledgment"
                                checked={formData.requiresAcknowledgment}
                                onChange={handleChange}
                            />
                            <span>Requires Acknowledgment</span>
                        </label>
                        <small>Track employee acknowledgments</small>
                    </div>
                </div>

                {/* Applicable To */}
                <div className="form-section">
                    <h2>Applicable To</h2>

                    <div className="checkbox-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.applicableTo.allEmployees}
                                onChange={(e) => handleApplicableToChange('allEmployees', e.target.checked)}
                            />
                            <span>All Employees</span>
                        </label>
                    </div>

                    {!formData.applicableTo.allEmployees && (
                        <>
                            <div className="targeting-group">
                                <label>Departments</label>
                                <div className="checkbox-grid">
                                    {departments.map(dept => (
                                        <label key={dept} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.applicableTo.departments?.includes(dept)}
                                                onChange={() => handleDepartmentToggle(dept)}
                                            />
                                            <span>{dept}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="targeting-group">
                                <label>Locations</label>
                                <div className="checkbox-grid">
                                    {['remote', 'hybrid', 'office'].map(location => (
                                        <label key={location} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.applicableTo.locations?.includes(location)}
                                                onChange={() => handleLocationToggle(location)}
                                            />
                                            <span>{location.charAt(0).toUpperCase() + location.slice(1)}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="targeting-group">
                                <label>Employment Types</label>
                                <div className="checkbox-grid">
                                    {['full-time', 'part-time', 'intern', 'contract', 'consultant'].map(type => (
                                        <label key={type} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.applicableTo.employmentTypes?.includes(type)}
                                                onChange={() => handleEmploymentTypeToggle(type)}
                                            />
                                            <span>{type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Enforcement Rules */}
                {formData.isMandatory && (
                    <div className="form-section">
                        <h2>Enforcement Rules</h2>
                        <p className="section-description">Block these actions until policy is acknowledged</p>

                        <div className="checkbox-grid">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.enforcementRules.blockAttendance}
                                    onChange={(e) => handleEnforcementChange('blockAttendance', e.target.checked)}
                                />
                                <span>Block Attendance Marking</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.enforcementRules.blockOfferAcceptance}
                                    onChange={(e) => handleEnforcementChange('blockOfferAcceptance', e.target.checked)}
                                />
                                <span>Block Offer Acceptance</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.enforcementRules.blockSystemAccess}
                                    onChange={(e) => handleEnforcementChange('blockSystemAccess', e.target.checked)}
                                />
                                <span>Block System Access</span>
                            </label>

                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.enforcementRules.blockLeaveApplication}
                                    onChange={(e) => handleEnforcementChange('blockLeaveApplication', e.target.checked)}
                                />
                                <span>Block Leave Application</span>
                            </label>
                        </div>
                    </div>
                )}

                {/* Reminder Settings */}
                {formData.requiresAcknowledgment && (
                    <div className="form-section">
                        <h2>Reminder Settings</h2>

                        <div className="checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.reminderSchedule.enabled}
                                    onChange={(e) => handleReminderChange('enabled', e.target.checked)}
                                />
                                <span>Enable Automatic Reminders</span>
                            </label>
                        </div>

                        {formData.reminderSchedule.enabled && (
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Reminder Frequency</label>
                                    <select
                                        value={formData.reminderSchedule.frequency}
                                        onChange={(e) => handleReminderChange('frequency', e.target.value)}
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Maximum Reminders</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={formData.reminderSchedule.maxReminders}
                                        onChange={(e) => handleReminderChange('maxReminders', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Form Actions */}
                <div className="form-actions">
                    <button type="button" className="btn-cancel" onClick={() => navigate('/hrm/policies')}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-submit" disabled={loading}>
                        {loading ? 'Saving...' : (isEditMode ? 'Update Policy' : 'Create Policy')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PolicyForm;
