import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiEdit, FiCheckCircle, FiArchive, FiUserPlus, FiFileText, FiClock, FiMapPin, FiBriefcase, FiCalendar } from 'react-icons/fi';
import { hrmService } from '../../../services/hrmService';
import Loader from '../../../components/common/Loader';
import { formatDate } from '../../../utils/format';
import '../../../styles/hrm/recruitment.css';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [applicants, setApplicants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('applicants'); // 'applicants', 'interviews', 'offers', 'activity'

    useEffect(() => {
        fetchJob();
        fetchApplicants();
    }, [id]);

    const fetchJob = async () => {
        try {
            const res = await hrmService.getJobPosting(id);
            if (res.data.success) {
                setJob(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching job:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchApplicants = async () => {
        if (!job) return; // Optimization
        try {
            const res = await hrmService.getApplicants({ jobId: id });
            if (res.data.success) {
                setApplicants(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching applicants:', error);
        }
    };

    // Refetch applicants once job is loaded (ensures correct ID usage if not available immediately)
    useEffect(() => {
        if (job) fetchApplicants();
    }, [job]);

    const handleStatusChange = async (applicantId, status) => {
        try {
            await hrmService.updateApplicantStatus(applicantId, { status });
            // Optimistic update
            setApplicants(prev => prev.map(app =>
                app._id === applicantId ? { ...app, status } : app
            ));
        } catch (error) {
            alert('Failed to update status');
            fetchApplicants(); // Revert on failure
        }
    };

    const handleCloseJob = async () => {
        if (!window.confirm('Are you sure you want to close this job posting?')) return;
        try {
            await hrmService.updateJobPosting(id, { status: 'closed' });
            setJob(prev => ({ ...prev, status: 'closed' }));
        } catch (error) {
            alert('Failed to close job');
        }
    };

    if (loading) return <Loader />;
    if (!job) return <div>Job not found</div>;

    const tabs = [
        { id: 'applicants', label: 'Applicants', count: applicants.length },
        { id: 'interviews', label: 'Interviews' },
        { id: 'offers', label: 'Offers' },
        { id: 'activity', label: 'Activity Log' }
    ];

    return (
        <div className="job-details-page fade-in" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: '48px' }}>

            {/* 1. Header Section */}
            <div className="page-header-modern">
                <div className="header-content">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <h1 className="job-title-large">{job.title}</h1>
                        <span className={`status-badge status-${job.status}`}>{job.status}</span>
                    </div>

                    <div className="job-meta-row">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiBriefcase size={14} /> {job.department}
                        </span>
                        <span className="meta-divider">•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiMapPin size={14} /> {job.location || 'Remote'}
                        </span>
                        <span className="meta-divider">•</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiClock size={14} /> {job.type}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    {job.status !== 'closed' && (
                        <button className="btn btn-secondary" onClick={handleCloseJob} style={{ color: '#ef4444', borderColor: '#fecaca' }}>
                            <FiArchive /> Close Job
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => navigate(`/hrm/recruitment/jobs/${id}/edit`)}>
                        <FiEdit /> Edit Job
                    </button>
                </div>
            </div>

            {/* 2. Job Overview Cards */}
            <div className="job-overview-section">
                <div className="section-heading">Job Overview</div>
                <div className="meta-cards-row">
                    <div className="meta-card">
                        <div className="meta-card-label">Department</div>
                        <div className="meta-card-value">{job.department}</div>
                    </div>
                    <div className="meta-card">
                        <div className="meta-card-label">Location</div>
                        <div className="meta-card-value">{job.location || 'Remote'}</div>
                    </div>
                    <div className="meta-card">
                        <div className="meta-card-label">Job Type</div>
                        <div className="meta-card-value">{job.type}</div>
                    </div>
                    <div className="meta-card">
                        <div className="meta-card-label">Posted Date</div>
                        <div className="meta-card-value">{formatDate(job.postedDate)}</div>
                    </div>
                    {job.closingDate && (
                        <div className="meta-card">
                            <div className="meta-card-label">Closing Date</div>
                            <div className="meta-card-value">{formatDate(job.closingDate)}</div>
                        </div>
                    )}
                </div>

                {/* 3. Job Description */}
                <div className="job-description-full">
                    <div className="section-heading">Description</div>
                    <div className="description-content">
                        <p>{job.description}</p>
                        {job.requirements && job.requirements.length > 0 && (
                            <>
                                <h4>Requirements</h4>
                                <ul>
                                    {job.requirements.map((req, index) => (
                                        <li key={index}>{req}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* 4. Tabs Navigation */}
            <div className="tabs-container">
                <div className="tabs-navigation">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            {tab.count !== undefined && <span className="applicants-count">{tab.count}</span>}
                        </button>
                    ))}
                </div>

                {/* 5. Tab Content: Applicants */}
                {activeTab === 'applicants' && (
                    <div className="applicants-tab fade-in">
                        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: '600', color: '#1e293b' }}>All Applicants</div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="Search applicants..."
                                        style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                                    />
                                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/hrm/recruitment/applicants?jobId=${id}`)}>
                                        <FiUserPlus /> Manage
                                    </button>
                                </div>
                            </div>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>CANDIDATE</th>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>APPLIED DATE</th>
                                        <th style={{ textAlign: 'left', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>STATUS</th>
                                        <th style={{ textAlign: 'right', padding: '12px 24px', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applicants.length > 0 ? (
                                        applicants.map((applicant) => (
                                            <tr key={applicant._id} style={{ borderBottom: '1px solid #e2e8f0', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '600' }}>
                                                            {applicant.applicantName.charAt(0)}
                                                        </div>
                                                        <div
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => navigate(`/hrm/recruitment/applicants/${applicant._id}`)}
                                                        >
                                                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '14px', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{applicant.applicantName}</div>
                                                            <div style={{ color: '#64748b', fontSize: '13px' }}>{applicant.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '16px 24px', color: '#334155', fontSize: '14px' }}>{formatDate(applicant.createdAt)}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span className={`status-badge status-${applicant.status}`}>
                                                        {applicant.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button
                                                            onClick={() => navigate(`/hrm/recruitment/applicants/${applicant._id}`)}
                                                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                                                            title="View Details"
                                                        >
                                                            <FiFileText size={16} />
                                                        </button>
                                                        <select
                                                            className="status-select"
                                                            value={applicant.status}
                                                            onChange={(e) => handleStatusChange(applicant._id, e.target.value)}
                                                            style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                        >
                                                            <option value="applied">Applied</option>
                                                            <option value="screening">Screening</option>
                                                            <option value="interview">Interview</option>
                                                            <option value="offer">Offer</option>
                                                            <option value="hired">Hired</option>
                                                            <option value="rejected">Rejected</option>
                                                        </select>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                                <div style={{ marginBottom: '16px', background: '#f1f5f9', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                                    <FiUserPlus size={24} color="#94a3b8" />
                                                </div>
                                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>No applicants yet</h3>
                                                <p style={{ fontSize: '14px', marginBottom: '24px' }}>There are no candidates for this job posting yet.</p>
                                                <button className="btn btn-primary btn-sm" onClick={() => {/* Share Job Logic */ }}>
                                                    Share Job Link
                                                </button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Placeholders for other tabs */}
                {activeTab !== 'applicants' && (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <FiCalendar size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                        <div style={{ fontSize: '16px', fontWeight: '500' }}>{tabs.find(t => t.id === activeTab)?.label} Module Coming Soon</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetails;
