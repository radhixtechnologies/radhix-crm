import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAward, FiTrendingUp, FiAlertCircle, FiPlus, FiCheckCircle } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import '../../../styles/hrm/skills.css';

const MySkills = () => {
    const navigate = useNavigate();
    const [skills, setSkills] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchMySkills();
    }, []);

    const fetchMySkills = async () => {
        try {
            setLoading(true);
            const [skillsRes, requestsRes] = await Promise.all([
                hrmService.getMySkills(),
                hrmService.getMySkillRequests({ status: 'pending' })
            ]);

            setSkills(skillsRes.data.data || []);
            setStats(skillsRes.data.stats || {});
            setRequests(requestsRes.data.data || []);
        } catch (err) {
            setError(err?.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    const getProficiencyColor = (level) => {
        if (level >= 8) return '#10b981'; // Expert - green
        if (level >= 6) return '#3b82f6'; // Advanced - blue
        if (level >= 4) return '#f59e0b'; // Intermediate - orange
        return '#6b7280'; // Beginner - gray
    };

    const getGapColor = (gap) => {
        if (gap >= 4) return '#ef4444'; // Critical - red
        if (gap >= 2) return '#f59e0b'; // Warning - orange
        return '#10b981'; // Good - green
    };

    const filteredSkills = selectedCategory === 'all'
        ? skills
        : skills.filter(s => s.category === selectedCategory);

    const categories = ['all', ...new Set(skills.map(s => s.category))];

    if (loading) return <Loader />;

    return (
        <div className="employee-list-page">
            {/* Header */}
            <div className="employee-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">My Skills</h1>
                    <p className="page-subtitle">Track and manage your professional skills</p>
                </div>
                <div className="header-actions">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/hrm/skills/add')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <FiPlus /> Request New Skill
                    </button>
                </div>
            </div>

            {error && (
                <div className="alert alert-error" style={{ marginBottom: '24px' }}>
                    {error}
                </div>
            )}

            {/* Statistics Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiAward style={{ color: 'white', width: '20px', height: '20px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.total || 0}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Skills</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiTrendingUp style={{ color: 'white', width: '20px', height: '20px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.avgProficiency || 0}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Avg Proficiency</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiAlertCircle style={{ color: 'white', width: '20px', height: '20px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.withGaps || 0}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Skills with Gaps</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiCheckCircle style={{ color: 'white', width: '20px', height: '20px' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stats.total - (stats.withGaps || 0)}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>On Track</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pending Requests Section */}
            {requests.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '16px' }}>Pending Requests ({requests.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                        {requests.map(req => (
                            <div key={req._id} style={{ background: '#fffbeb', border: '1px dashed #f59e0b', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#92400e', margin: 0 }}>{req.skillName}</h3>
                                    <span style={{ background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500' }}>
                                        Pending Approval
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#b45309' }}>
                                        <span>Requested Level</span>
                                        <span style={{ fontWeight: '500' }}>{req.requestedLevel}/10</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#b45309' }}>
                                        <span>Date Requested</span>
                                        <span>{new Date(req.requestDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}



            {/* Category Tabs */}
            {skills.length > 0 && (
                <div className="category-tabs" style={{ marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                border: selectedCategory === cat ? '1px solid #2563eb' : '1px solid #e2e8f0',
                                background: selectedCategory === cat ? '#2563eb' : 'white',
                                color: selectedCategory === cat ? 'white' : '#64748b',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {cat === 'all' ? 'All Skills' : cat.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            {cat !== 'all' && stats?.byCategory?.[cat] && (
                                <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px', fontSize: '11px' }}>
                                    {stats.byCategory[cat]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {/* Skills Grid */}
            {filteredSkills.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <FiAward size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No Approved Skills Yet</h3>
                    <p style={{ color: 'var(--text-muted)' }}>Skills you add will appear here after approval.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                    {filteredSkills.map(skill => (
                        <div key={skill._id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: 0, flex: 1 }}>{skill.skillName}</h3>
                                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '500', background: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }}>
                                    {skill.category?.replace('-', ' ')}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                                {/* Proficiency Level */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Proficiency</span>
                                        <span style={{ fontWeight: '600', color: getProficiencyColor(skill.proficiencyLevel || skill.currentLevel || 0) }}>
                                            {skill.proficiencyLevel || skill.currentLevel || 0}/10
                                        </span>
                                    </div>
                                    <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${(skill.proficiencyLevel || skill.currentLevel || 0) * 10}%`,
                                            background: getProficiencyColor(skill.proficiencyLevel || skill.currentLevel || 0),
                                            height: '100%'
                                        }} />
                                    </div>
                                </div>

                                {/* Gap Analysis */}
                                {skill.gap !== undefined && skill.gap !== null && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Status</span>
                                        {skill.gap > 0 ? (
                                            <span style={{ color: '#ef4444', fontWeight: '600', padding: '2px 8px', background: '#fee2e2', borderRadius: '6px' }}>
                                                {skill.gap} levels behind
                                            </span>
                                        ) : (
                                            <span style={{ color: '#10b981', fontWeight: '600', padding: '2px 8px', background: '#d1fae5', borderRadius: '6px' }}>
                                                On track
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer Buttons */}
                            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button
                                    onClick={() => navigate(`/hrm/skills/${skill._id}`)}
                                    style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: 0 }}
                                    onMouseOver={(e) => e.target.style.color = '#0f172a'}
                                    onMouseOut={(e) => e.target.style.color = '#64748b'}
                                >
                                    View Details
                                </button>
                                {skill.gap > 0 && (
                                    <button
                                        style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '13px', fontWeight: '500', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        View Training <FiTrendingUp size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MySkills;
