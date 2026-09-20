import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import '../../../styles/hrm/policies.css';
import { FiArrowLeft, FiEdit2, FiClock, FiCalendar, FiCheckCircle, FiDownload, FiInfo, FiFileText, FiUsers, FiLayers } from 'react-icons/fi';

const PolicyDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('content');

    useEffect(() => {
        fetchPolicy();
    }, [id]);

    const fetchPolicy = async () => {
        try {
            setLoading(true);
            const response = await hrmService.getPolicy(id);
            setPolicy(response.data.data);
        } catch (error) {
            console.error('Error fetching policy:', error);
            setError(error.response?.data?.message || 'Failed to load policy');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="policy-list-container">
                <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                    Loading details...
                </div>
            </div>
        );
    }

    if (error || !policy) {
        return (
            <div className="policy-list-container">
                <div className="error-message">
                    <FiInfo size={24} />
                    <h2>{error || 'Policy not found'}</h2>
                    <button className="btn-sm-primary" onClick={() => navigate('/hrm/policies')}>
                        Back to Policies
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="policy-list-container">
            {/* Clean Header */}
            <div className="policy-details-header">
                <div className="header-top-row">
                    <button className="btn-back-clean" onClick={() => navigate('/hrm/policies')}>
                        <FiArrowLeft /> Back
                    </button>
                    <div className="header-actions">
                        <button
                            className="btn-sm-secondary"
                            onClick={() => navigate(`/hrm/policies/${id}/versions`)}
                        >
                            <FiClock /> Version History
                        </button>
                        <button
                            className="btn-sm-primary"
                            onClick={() => navigate(`/hrm/policies/${id}/edit`)}
                        >
                            <FiEdit2 /> Edit Policy
                        </button>
                    </div>
                </div>

                <div className="header-title-row">
                    <div className="title-group">
                        <h1>{policy.title}</h1>
                        <div className="badge-group">
                            <span className={`policy-status-badge status-${policy.status}`}>
                                {policy.status}
                            </span>
                            <span className="meta-pill">
                                <FiLayers /> {policy.category}
                            </span>
                            <span className="meta-pill">v{policy.version}</span>
                            {policy.isMandatory && (
                                <span className="meta-pill mandatory">Mandatory</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="policy-details-layout">
                {/* Left Column: Main Content */}
                <div className="details-main-content">
                    <div className="policy-card content-card">
                        <div className="content-tabs">
                            <button
                                className={`tab-btn-clean ${activeTab === 'content' ? 'active' : ''}`}
                                onClick={() => setActiveTab('content')}
                            >
                                <FiFileText /> Content
                            </button>
                            <button
                                className={`tab-btn-clean ${activeTab === 'scope' ? 'active' : ''}`}
                                onClick={() => setActiveTab('scope')}
                            >
                                <FiUsers /> Scope
                            </button>
                        </div>

                        <div className="tab-content-area">
                            {activeTab === 'content' && (
                                <>
                                    {policy.description && (
                                        <div className="policy-intro">
                                            <h3>Overview</h3>
                                            <p>{policy.description}</p>
                                        </div>
                                    )}
                                    <div className="policy-body-html" dangerouslySetInnerHTML={{ __html: policy.content }} />
                                </>
                            )}

                            {activeTab === 'scope' && (
                                <div className="scope-view">
                                    <h3>Applicability</h3>
                                    {policy.applicableTo?.allEmployees ? (
                                        <div className="info-notice">
                                            <FiUsers />
                                            <p>This policy applies to <strong>All Employees</strong> across the organization.</p>
                                        </div>
                                    ) : (
                                        <div className="scope-lists">
                                            {policy.applicableTo?.departments?.length > 0 && (
                                                <div className="scope-item">
                                                    <label>Departments</label>
                                                    <div className="tag-cloud">
                                                        {policy.applicableTo.departments.map(d => <span key={d} className="tag-clean">{d}</span>)}
                                                    </div>
                                                </div>
                                            )}
                                            {policy.applicableTo?.locations?.length > 0 && (
                                                <div className="scope-item">
                                                    <label>Locations</label>
                                                    <div className="tag-cloud">
                                                        {policy.applicableTo.locations.map(l => <span key={l} className="tag-clean">{l}</span>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar Info */}
                <div className="details-sidebar">
                    <div className="policy-card sidebar-card">
                        <h3>Quick Info</h3>
                        <div className="info-list-clean">
                            <div className="info-row">
                                <span className="label"><FiCalendar /> Effective Date</span>
                                <span className="value">{new Date(policy.effectiveDate).toLocaleDateString()}</span>
                            </div>
                            {policy.expiryDate && (
                                <div className="info-row">
                                    <span className="label"><FiCalendar /> Expiry Date</span>
                                    <span className="value">{new Date(policy.expiryDate).toLocaleDateString()}</span>
                                </div>
                            )}
                            <div className="info-row">
                                <span className="label"><FiCheckCircle /> Acknowledgment</span>
                                <span className="value">{policy.requiresAcknowledgment ? 'Required' : 'Optional'}</span>
                            </div>
                        </div>
                    </div>

                    {policy.acknowledgmentStats && (
                        <div className="policy-card sidebar-card">
                            <h3>Compliance</h3>
                            <div className="compliance-stat-big">
                                <div className="percent">{policy.acknowledgmentStats.percentage}%</div>
                                <div className="sub-text">Completed</div>
                            </div>
                            <div className="progress-track-clean">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${policy.acknowledgmentStats.percentage}%` }}
                                ></div>
                            </div>
                            <div className="stat-row">
                                <span>{policy.acknowledgmentStats.total} / {policy.acknowledgmentStats.applicable} employees</span>
                            </div>
                        </div>
                    )}

                    {policy.documentUrl && (
                        <div className="policy-card sidebar-card">
                            <h3>Attachments</h3>
                            <a href={policy.documentUrl} target="_blank" rel="noopener noreferrer" className="attachment-link">
                                <div className="icon-box"><FiFileText /></div>
                                <div className="file-info">
                                    <span className="name">Policy Document.pdf</span>
                                    <span className="action">Download</span>
                                </div>
                                <FiDownload />
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PolicyDetails;
