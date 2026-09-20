import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../../styles/hrm/policies.css';

const EmployeePolicyView = () => {
    const navigate = useNavigate();
    const [policies, setPolicies] = useState([]);
    const [pendingPolicies, setPendingPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all'); // 'all' or 'pending'
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);

    useEffect(() => {
        fetchPolicies();
        fetchPendingPolicies();
    }, []);

    const fetchPolicies = async () => {
        try {
            const response = await axios.get('/api/hrm/policies/my');
            setPolicies(response.data.data);
        } catch (error) {
            console.error('Error fetching policies:', error);
        }
    };

    const fetchPendingPolicies = async () => {
        try {
            const response = await axios.get('/api/hrm/policies/my/pending');
            setPendingPolicies(response.data.data);
        } catch (error) {
            console.error('Error fetching pending policies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (policy) => {
        setSelectedPolicy(policy);
        setShowAcknowledgeModal(true);
    };

    const submitAcknowledgment = async (comments) => {
        try {
            await axios.post(`/api/hrm/policies/${selectedPolicy._id}/acknowledge`, {
                comments,
            });
            alert('Policy acknowledged successfully');
            setShowAcknowledgeModal(false);
            setSelectedPolicy(null);
            fetchPolicies();
            fetchPendingPolicies();
        } catch (error) {
            console.error('Error acknowledging policy:', error);
            alert(error.response?.data?.message || 'Failed to acknowledge policy');
        }
    };

    const getCategoryBadgeClass = (category) => {
        const categoryMap = {
            'HR': 'badge-hr',
            'IT': 'badge-it',
            'POSH': 'badge-posh',
            'Compliance': 'badge-compliance',
            'Leave': 'badge-leave',
            'Security': 'badge-security',
            'Code of Conduct': 'badge-conduct',
            'Expense': 'badge-expense',
            'Other': 'badge-other',
        };
        return categoryMap[category] || 'badge-other';
    };

    const renderPolicyCard = (policy) => (
        <div key={policy._id} className="employee-policy-card">
            <div className="policy-card-header">
                <div className="policy-title-row">
                    <h3>{policy.title}</h3>
                    <div className="policy-status-badges">
                        {policy.isMandatory && (
                            <span className="mandatory-badge">
                                <i className="fas fa-exclamation-circle"></i> Mandatory
                            </span>
                        )}
                        {policy.acknowledged ? (
                            <span className="acknowledged-badge">
                                <i className="fas fa-check-circle"></i> Acknowledged
                            </span>
                        ) : (
                            <span className="pending-badge">
                                <i className="fas fa-clock"></i> Pending
                            </span>
                        )}
                    </div>
                </div>
                <span className={`category-badge ${getCategoryBadgeClass(policy.category)}`}>
                    {policy.category}
                </span>
            </div>

            <div className="policy-card-body">
                <p className="policy-description">{policy.description || 'No description'}</p>

                <div className="policy-meta">
                    <div className="meta-item">
                        <i className="fas fa-calendar"></i>
                        <span>Version {policy.version}</span>
                    </div>
                    <div className="meta-item">
                        <i className="fas fa-calendar-check"></i>
                        <span>Effective: {new Date(policy.effectiveDate).toLocaleDateString()}</span>
                    </div>
                    {policy.acknowledged && policy.acknowledgmentDate && (
                        <div className="meta-item">
                            <i className="fas fa-check"></i>
                            <span>Acknowledged: {new Date(policy.acknowledgmentDate).toLocaleDateString()}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="policy-card-actions">
                <button
                    className="btn-view"
                    onClick={() => navigate(`/hrm/policies/${policy._id}/view`)}
                >
                    <i className="fas fa-eye"></i> View Policy
                </button>
                {!policy.acknowledged && policy.requiresAcknowledgment && (
                    <button
                        className="btn-acknowledge"
                        onClick={() => handleAcknowledge(policy)}
                    >
                        <i className="fas fa-check-circle"></i> Acknowledge
                    </button>
                )}
                {policy.documentUrl && (
                    <a
                        href={policy.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-download"
                    >
                        <i className="fas fa-download"></i> Download PDF
                    </a>
                )}
            </div>
        </div>
    );

    const AcknowledgeModal = () => {
        const [comments, setComments] = useState('');
        const [agreed, setAgreed] = useState(false);

        if (!showAcknowledgeModal || !selectedPolicy) return null;

        return (
            <div className="modal-overlay" onClick={() => setShowAcknowledgeModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Acknowledge Policy</h2>
                        <button
                            className="modal-close"
                            onClick={() => setShowAcknowledgeModal(false)}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="modal-body">
                        <h3>{selectedPolicy.title}</h3>
                        <p className="policy-version">Version {selectedPolicy.version}</p>

                        <div className="policy-content-preview">
                            <div dangerouslySetInnerHTML={{ __html: selectedPolicy.content.substring(0, 500) + '...' }} />
                            <button
                                className="btn-read-full"
                                onClick={() => navigate(`/hrm/policies/${selectedPolicy._id}/view`)}
                            >
                                Read Full Policy
                            </button>
                        </div>

                        <div className="acknowledgment-checkbox">
                            <input
                                type="checkbox"
                                id="agree-checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                            />
                            <label htmlFor="agree-checkbox">
                                I have read and understood this policy and agree to comply with its terms.
                            </label>
                        </div>

                        <div className="comments-section">
                            <label>Comments (Optional)</label>
                            <textarea
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Add any comments or questions..."
                                rows="3"
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            className="btn-cancel"
                            onClick={() => setShowAcknowledgeModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-submit"
                            onClick={() => submitAcknowledgment(comments)}
                            disabled={!agreed}
                        >
                            <i className="fas fa-check"></i> Acknowledge Policy
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <div className="loading">Loading policies...</div>;
    }

    return (
        <div className="employee-policy-container">
            <div className="employee-policy-header">
                <h1>My Policies</h1>
                {pendingPolicies.length > 0 && (
                    <div className="pending-alert">
                        <i className="fas fa-exclamation-triangle"></i>
                        You have {pendingPolicies.length} pending policy acknowledgment(s)
                    </div>
                )}
            </div>

            <div className="policy-tabs">
                <button
                    className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    All Policies ({policies.length})
                </button>
                <button
                    className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    Pending Acknowledgments ({pendingPolicies.length})
                </button>
            </div>

            <div className="policy-content">
                {activeTab === 'all' ? (
                    policies.length === 0 ? (
                        <div className="no-policies">
                            <i className="fas fa-file-alt"></i>
                            <p>No policies assigned to you</p>
                        </div>
                    ) : (
                        <div className="policy-grid">
                            {policies.map(renderPolicyCard)}
                        </div>
                    )
                ) : (
                    pendingPolicies.length === 0 ? (
                        <div className="no-policies">
                            <i className="fas fa-check-circle"></i>
                            <p>All policies acknowledged!</p>
                        </div>
                    ) : (
                        <div className="policy-grid">
                            {pendingPolicies.map(renderPolicyCard)}
                        </div>
                    )
                )}
            </div>

            <AcknowledgeModal />
        </div>
    );
};

export default EmployeePolicyView;
