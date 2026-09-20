import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiAward, FiBook, FiCheckCircle, FiActivity } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/skills.css';

const SkillDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [skill, setSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSkillDetails();
    }, [id]);

    const fetchSkillDetails = async () => {
        try {
            setLoading(true);
            const res = await hrmService.getSkill(id);
            setSkill(res.data.data);
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const getProficiencyColor = (level) => {
        if (level >= 8) return '#10b981';
        if (level >= 6) return '#3b82f6';
        if (level >= 4) return '#f59e0b';
        return '#6b7280';
    };

    if (loading) return <Loader />;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (!skill) return <div>Skill not found</div>;

    return (
        <div className="skill-details-page">
            <button className="btn-back" onClick={() => navigate('/hrm/skills/my')}>
                <FiArrowLeft /> Back to My Skills
            </button>

            <div className="skill-header-card">
                <div className="skill-title-section">
                    <h1>{skill.skillName}</h1>
                    <span className="skill-category-badge">{skill.category}</span>
                </div>
                <div className="skill-status-section">
                    {skill.verified ? (
                        <div className="status-pill verified">
                            <FiCheckCircle /> Verified
                        </div>
                    ) : (
                        <div className="status-pill pending">Pending Verification</div>
                    )}
                </div>
            </div>

            <div className="skill-details-grid">
                {/* Proficiency Card */}
                <div className="detail-card">
                    <h3><FiActivity /> Proficiency</h3>
                    <div className="proficiency-display-large">
                        <div className="score" style={{ color: getProficiencyColor(skill.proficiencyLevel) }}>
                            {skill.proficiencyLevel || 0}<span className="max">/10</span>
                        </div>
                        <div className="level-label">{skill.proficiency || 'Intermediate'}</div>
                        <div className="proficiency-bar-large">
                            <div
                                className="fill"
                                style={{
                                    width: `${(skill.proficiencyLevel || 0) * 10}%`,
                                    backgroundColor: getProficiencyColor(skill.proficiencyLevel)
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Experience Card */}
                <div className="detail-card">
                    <h3><FiAward /> Experience</h3>
                    <div className="info-list">
                        <div className="info-item">
                            <label>Years of Experience</label>
                            <span>{skill.yearsOfExperience || 0} Years</span>
                        </div>
                        <div className="info-item">
                            <label>Last Assessed</label>
                            <span>{skill.lastAssessedDate ? new Date(skill.lastAssessedDate).toLocaleDateString() : 'Not assessed yet'}</span>
                        </div>
                        <div className="info-item">
                            <label>Source</label>
                            <span>{skill.skillSource || 'On the job'}</span>
                        </div>
                    </div>
                </div>

                {/* Training Recommendations */}
                <div className="detail-card full-width">
                    <h3><FiBook /> Recommended Training</h3>
                    {skill.trainingRecommendations && skill.trainingRecommendations.length > 0 ? (
                        <div className="training-list">
                            {skill.trainingRecommendations.map((training, index) => (
                                <div key={index} className="training-item">
                                    <h4>{training.title}</h4>
                                    <p>{training.description}</p>
                                    <button className="btn-sm btn-outline">View Course</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-data">No specific training recommendations available.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SkillDetails;
