import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSave, FiX, FiUpload } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import { employeeService } from '../../../services/employeeService';
import { useAuth } from '../../../context/AuthContext'; // Import useAuth
import '../../../styles/hrm/skills.css';

const AddEditSkill = () => {
    const { user } = useAuth(); // Get user
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const employeeIdFromUrl = searchParams.get('employeeId');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [employees, setEmployees] = useState([]);

    const [formData, setFormData] = useState({
        employee: employeeIdFromUrl || '',
        skillName: '',
        category: 'technical',
        proficiency: 'intermediate',
        proficiencyLevel: 5,
        currentLevel: 5,
        requiredLevel: '',
        skillSource: 'on-the-job',
        skillStatus: 'active',
        priority: 'important',
        evidenceType: 'none',
        yearsOfExperience: 0,
        lastUsed: '',
    });

    useEffect(() => {
        if (user?.role === 'admin' || user?.role === 'super_admin') {
            fetchEmployees();
        }
    }, [user]);

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getEmployees();
            setEmployees(res.data.data || []);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // Convert numeric fields
            const payload = {
                ...formData,
                proficiencyLevel: parseInt(formData.proficiencyLevel),
                currentLevel: parseInt(formData.currentLevel),
                requiredLevel: formData.requiredLevel ? parseInt(formData.requiredLevel) : null,
                yearsOfExperience: parseInt(formData.yearsOfExperience) || 0,
            };

            if (user?.role === 'admin' || user?.role === 'super_admin') {
                // Admin creates directly (supports adding for others)
                await hrmService.createSkill(payload);
                setSuccess('Skill added successfully!');
            } else {
                // Employee creates request (always for self)
                const requestPayload = {
                    skillName: payload.skillName,
                    category: payload.category,
                    requestedLevel: payload.proficiencyLevel,
                    requestType: 'add',
                    priority: payload.priority,
                    requestReason: 'Added via My Skills portal',
                };
                const res = await hrmService.createSkillRequest(requestPayload);
                setSuccess(res.data.message || 'Skill request submitted successfully!');
            }

            setTimeout(() => {
                if (employeeIdFromUrl) {
                    navigate(`/hrm/skills/employee/${employeeIdFromUrl}`);
                } else {
                    // Redirect to appropriate view
                    if (user?.role === 'admin' || user?.role === 'super_admin') {
                        navigate('/hrm/skills');
                    } else {
                        navigate('/hrm/skills/my');
                    }
                }
            }, 1500);
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-edit-skill-page">
            <div className="page-header">
                <div>
                    <h1>Add New Skill</h1>
                    <p className="page-subtitle">Add a skill to employee profile</p>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    <FiX /> Cancel
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="skill-form">
                <div className="form-section">
                    <h3 className="section-title">Basic Information</h3>

                    <div className="form-grid">
                        {/* Employee Selection */}
                        {!employeeIdFromUrl && (
                            <div className="form-group">
                                <label>Employee *</label>
                                {user?.role === 'admin' || user?.role === 'super_admin' ? (
                                    <select
                                        name="employee"
                                        value={formData.employee}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.user?.name} ({emp.employeeId})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={user?.name || 'Current User'}
                                        disabled
                                        style={{ background: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                                    />
                                )}
                            </div>
                        )}

                        {/* Skill Name */}
                        <div className="form-group">
                            <label>Skill Name *</label>
                            <input
                                type="text"
                                name="skillName"
                                value={formData.skillName}
                                onChange={handleChange}
                                placeholder="e.g., JavaScript, Communication"
                                required
                            />
                        </div>

                        {/* Category */}
                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="technical">Technical Skills</option>
                                <option value="soft-skills">Soft Skills</option>
                                <option value="managerial">Managerial Skills</option>
                                <option value="compliance">Compliance Skills</option>
                                <option value="tool-platform">Tools & Platforms</option>
                                <option value="language">Languages</option>
                                <option value="certification">Certifications</option>
                                <option value="domain">Domain Knowledge</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Skill Source */}
                        <div className="form-group">
                            <label>How was this skill acquired?</label>
                            <select
                                name="skillSource"
                                value={formData.skillSource}
                                onChange={handleChange}
                            >
                                <option value="on-the-job">On-the-Job</option>
                                <option value="training">Training</option>
                                <option value="certification">Certification</option>
                                <option value="self-learning">Self-Learning</option>
                                <option value="previous-employment">Previous Employment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">Proficiency Level</h3>

                    <div className="form-grid">
                        {/* Proficiency */}
                        <div className="form-group">
                            <label>Proficiency *</label>
                            <select
                                name="proficiency"
                                value={formData.proficiency}
                                onChange={handleChange}
                                required
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>

                        {/* Proficiency Level (1-10) */}
                        <div className="form-group">
                            <label>Proficiency Level (1-10) *</label>
                            <input
                                type="number"
                                name="proficiencyLevel"
                                value={formData.proficiencyLevel}
                                onChange={handleChange}
                                min="1"
                                max="10"
                                required
                            />
                            <small>Rate your skill level from 1 (beginner) to 10 (expert)</small>
                        </div>

                        {/* Current Level */}
                        <div className="form-group">
                            <label>Current Level (1-10)</label>
                            <input
                                type="number"
                                name="currentLevel"
                                value={formData.currentLevel}
                                onChange={handleChange}
                                min="1"
                                max="10"
                            />
                        </div>

                        {/* Required Level */}
                        <div className="form-group">
                            <label>Required Level (1-10)</label>
                            <input
                                type="number"
                                name="requiredLevel"
                                value={formData.requiredLevel}
                                onChange={handleChange}
                                min="1"
                                max="10"
                                placeholder="Optional"
                            />
                            <small>Leave empty if not applicable</small>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3 className="section-title">Additional Details</h3>

                    <div className="form-grid">
                        {/* Years of Experience */}
                        <div className="form-group">
                            <label>Years of Experience</label>
                            <input
                                type="number"
                                name="yearsOfExperience"
                                value={formData.yearsOfExperience}
                                onChange={handleChange}
                                min="0"
                                step="0.5"
                            />
                        </div>

                        {/* Last Used */}
                        <div className="form-group">
                            <label>Last Used</label>
                            <input
                                type="date"
                                name="lastUsed"
                                value={formData.lastUsed}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Skill Status */}
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                name="skillStatus"
                                value={formData.skillStatus}
                                onChange={handleChange}
                            >
                                <option value="active">Active</option>
                                <option value="in-progress">In Progress</option>
                                <option value="expired">Expired</option>
                                <option value="needs-refresh">Needs Refresh</option>
                            </select>
                        </div>

                        {/* Priority */}
                        <div className="form-group">
                            <label>Priority</label>
                            <select
                                name="priority"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="critical">Critical</option>
                                <option value="important">Important</option>
                                <option value="nice-to-have">Nice to Have</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                        <FiX /> Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FiSave /> {loading ? 'Saving...' : 'Save Skill'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddEditSkill;
