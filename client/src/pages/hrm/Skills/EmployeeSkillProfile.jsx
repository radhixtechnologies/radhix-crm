import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiAward, FiCheckCircle, FiXCircle, FiPlus, FiEdit2, FiTrendingUp, FiAlertCircle, FiCalendar, FiUser, FiBriefcase, FiUsers } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import { employeeService } from '../../../services/employeeService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/skills.css';

const EmployeeSkillProfile = () => {
    const { employeeId } = useParams();
    const navigate = useNavigate();

    const [employee, setEmployee] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchData();
    }, [employeeId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [empRes, skillsRes] = await Promise.all([
                employeeService.getEmployee(employeeId),
                hrmService.getSkills({ employeeId }),
            ]);
            setEmployee(empRes.data.data);
            setSkills(skillsRes.data.data);
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader />;
    if (error) return <div className="error-message">{error}</div>;
    if (!employee) return <div className="error-message">Employee not found</div>;

    // Calculate statistics
    const stats = {
        total: skills.length,
        verified: skills.filter(s => s.verified).length,
        expert: skills.filter(s => s.proficiency === 'expert').length,
        advanced: skills.filter(s => s.proficiency === 'advanced').length,
        intermediate: skills.filter(s => s.proficiency === 'intermediate').length,
        beginner: skills.filter(s => s.proficiency === 'beginner').length,
        withGaps: skills.filter(s => s.gap && s.gap > 0).length,
        certifications: skills.reduce((acc, s) => acc + (s.certifications?.length || 0), 0),
    };

    // Group skills by category
    const skillsByCategory = skills.reduce((acc, skill) => {
        const cat = skill.category || 'other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
    }, {});

    // Filter skills based on active tab
    const getFilteredSkills = () => {
        if (activeTab === 'all') return skills;
        return skillsByCategory[activeTab] || [];
    };

    const filteredSkills = getFilteredSkills();

    const categoryLabels = {
        'technical': 'Technical Skills',
        'soft-skills': 'Soft Skills',
        'managerial': 'Managerial Skills',
        'compliance': 'Compliance Skills',
        'tool-platform': 'Tools & Platforms',
        'language': 'Languages',
        'certification': 'Certifications',
        'domain': 'Domain Knowledge',
        'other': 'Other Skills',
    };

    const getProficiencyColor = (proficiency) => {
        switch (proficiency) {
            case 'expert': return '#10b981';
            case 'advanced': return '#8b5cf6';
            case 'intermediate': return '#3b82f6';
            case 'beginner': return '#94a3b8';
            default: return '#6b7280';
        }
    };

    const getGapColor = (gap) => {
        if (!gap || gap <= 0) return '#10b981';
        if (gap <= 2) return '#eab308';
        if (gap <= 4) return '#f59e0b';
        return '#ef4444';
    };

    return (
        <div className="employee-skill-profile">
            {/* Header Section */}
            <div className="skill-profile-header">
                <div className="employee-info-card">
                    <div className="employee-avatar">
                        {employee.avatar ? (
                            <img src={employee.avatar} alt={employee.user?.name} />
                        ) : (
                            <div className="avatar-placeholder">
                                {employee.user?.name?.charAt(0) || 'E'}
                            </div>
                        )}
                    </div>
                    <div className="employee-details">
                        <h1>{employee.user?.name}</h1>
                        <div className="employee-meta">
                            <span className="meta-item">
                                <FiUser size={14} />
                                {employee.employeeId}
                            </span>
                            <span className="meta-item">
                                <FiBriefcase size={14} />
                                {employee.designation}
                            </span>
                            <span className="meta-item">
                                <FiUsers size={14} />
                                {employee.department}
                            </span>
                        </div>
                        <div className="employee-secondary">
                            <span>Employment Type: <strong>{employee.employmentType}</strong></span>
                            {employee.manager && (
                                <span>Reports to: <strong>{employee.manager.user?.name || 'N/A'}</strong></span>
                            )}
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn btn-primary" onClick={() => navigate(`/hrm/skills/add?employeeId=${employeeId}`)}>
                            <FiPlus /> Add Skill
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Overview */}
            <div className="skill-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                        <FiAward size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Skills</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f0fdf4', color: '#10b981' }}>
                        <FiCheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.verified}</div>
                        <div className="stat-label">Verified Skills</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                        <FiTrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.expert + stats.advanced}</div>
                        <div className="stat-label">Expert/Advanced</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#fee2e2', color: '#ef4444' }}>
                        <FiAlertCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.withGaps}</div>
                        <div className="stat-label">Skill Gaps</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>
                        <FiCalendar size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.certifications}</div>
                        <div className="stat-label">Certifications</div>
                    </div>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="skill-tabs">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Skills ({skills.length})
                </button>
                {Object.keys(skillsByCategory).map(category => (
                    <button
                        key={category}
                        className={`tab-btn ${activeTab === category ? 'active' : ''}`}
                        onClick={() => setActiveTab(category)}
                    >
                        {categoryLabels[category]} ({skillsByCategory[category].length})
                    </button>
                ))}
            </div>

            {/* Skills Grid */}
            <div className="skills-grid">
                {filteredSkills.length === 0 ? (
                    <div className="empty-state">
                        <FiAward size={48} style={{ color: '#d1d5db' }} />
                        <h3>No skills in this category</h3>
                        <p>Add skills to track proficiency and progress</p>
                    </div>
                ) : (
                    filteredSkills.map(skill => (
                        <div key={skill._id} className="skill-card">
                            <div className="skill-card-header">
                                <div className="skill-name-section">
                                    <h3>{skill.skillName}</h3>
                                    <span className="skill-category-badge">{categoryLabels[skill.category]}</span>
                                </div>
                                <div className="skill-actions">
                                    {skill.verified && (
                                        <span className="verified-badge">
                                            <FiCheckCircle size={16} /> Verified
                                        </span>
                                    )}
                                    <button
                                        className="icon-btn"
                                        onClick={() => navigate(`/hrm/skills/edit/${skill._id}`)}
                                        title="Edit Skill"
                                    >
                                        <FiEdit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="skill-card-body">
                                {/* Proficiency Level */}
                                <div className="skill-metric">
                                    <label>Proficiency</label>
                                    <div className="proficiency-display">
                                        <div className="proficiency-bar">
                                            <div
                                                className="proficiency-fill"
                                                style={{
                                                    width: `${(skill.proficiencyLevel / 10) * 100}%`,
                                                    background: getProficiencyColor(skill.proficiency),
                                                }}
                                            />
                                        </div>
                                        <span className="proficiency-label" style={{ color: getProficiencyColor(skill.proficiency) }}>
                                            {skill.proficiency} ({skill.proficiencyLevel}/10)
                                        </span>
                                    </div>
                                </div>

                                {/* Gap Analysis */}
                                {skill.requiredLevel && (
                                    <div className="skill-metric">
                                        <label>Gap Analysis</label>
                                        <div className="gap-display">
                                            <div className="gap-levels">
                                                <span>Current: <strong>{skill.currentLevel || skill.proficiencyLevel}</strong></span>
                                                <span>Required: <strong>{skill.requiredLevel}</strong></span>
                                            </div>
                                            {skill.gap > 0 && (
                                                <span className="gap-badge" style={{ background: getGapColor(skill.gap) }}>
                                                    Gap: {skill.gap} levels
                                                </span>
                                            )}
                                            {skill.gap <= 0 && (
                                                <span className="gap-badge" style={{ background: '#10b981' }}>
                                                    ✓ Meets Requirement
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Skill Details */}
                                <div className="skill-details-grid">
                                    {skill.skillSource && (
                                        <div className="detail-item">
                                            <span className="detail-label">Source:</span>
                                            <span className="detail-value">{skill.skillSource.replace('-', ' ')}</span>
                                        </div>
                                    )}
                                    {skill.yearsOfExperience > 0 && (
                                        <div className="detail-item">
                                            <span className="detail-label">Experience:</span>
                                            <span className="detail-value">{skill.yearsOfExperience} years</span>
                                        </div>
                                    )}
                                    {skill.skillStatus && (
                                        <div className="detail-item">
                                            <span className="detail-label">Status:</span>
                                            <span className={`status-badge status-${skill.skillStatus}`}>
                                                {skill.skillStatus.replace('-', ' ')}
                                            </span>
                                        </div>
                                    )}
                                    {skill.priority && (
                                        <div className="detail-item">
                                            <span className="detail-label">Priority:</span>
                                            <span className={`priority-badge priority-${skill.priority}`}>
                                                {skill.priority}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Certifications */}
                                {skill.certifications && skill.certifications.length > 0 && (
                                    <div className="skill-certifications">
                                        <label>Certifications</label>
                                        {skill.certifications.map((cert, idx) => (
                                            <div key={idx} className="certification-item">
                                                <div className="cert-info">
                                                    <strong>{cert.name}</strong>
                                                    <span className="cert-issuer">{cert.issuer}</span>
                                                </div>
                                                {cert.expiryDate && (
                                                    <span className={`cert-status cert-${cert.renewalStatus}`}>
                                                        {cert.renewalStatus === 'expired' && 'Expired'}
                                                        {cert.renewalStatus === 'expiring-soon' && 'Expiring Soon'}
                                                        {cert.renewalStatus === 'active' && 'Active'}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Last Assessed */}
                                {skill.lastAssessedDate && (
                                    <div className="skill-footer">
                                        <small>
                                            Last assessed: {new Date(skill.lastAssessedDate).toLocaleDateString()}
                                            {skill.assessedBy && ` by ${skill.assessedBy.name}`}
                                        </small>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EmployeeSkillProfile;
