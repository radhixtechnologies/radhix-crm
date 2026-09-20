import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiSearch, FiZap, FiPause, FiPlay, FiTarget, FiCheckCircle, FiActivity } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import { formatNumber, formatDate } from '../../utils/format';
import '../../styles/marketing/automation.css';

const AutomationList = () => {
    const navigate = useNavigate();
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ status: '', search: '' });

    useEffect(() => {
        fetchAutomations();
    }, [filters]);

    const fetchAutomations = async () => {
        try {
            setLoading(true);
            const res = await marketingService.getAutomations(filters);
            if (res.data.success) {
                setAutomations(res.data.data.automations || []);
            }
        } catch (error) {
            console.error('Error fetching automations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (automationId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'active' ? 'paused' : 'active';
            await marketingService.toggleAutomationStatus(automationId, newStatus);
            fetchAutomations();
        } catch (error) {
            console.error('Error toggling automation status:', error);
        }
    };

    const getTriggerLabel = (trigger) => {
        const labels = {
            lead_created: 'Lead Created',
            lead_status_changed: 'Lead Status Changed',
            contact_created: 'Contact Created',
            form_submitted: 'Form Submitted',
            email_opened: 'Email Opened',
            email_clicked: 'Email Clicked',
            campaign_joined: 'Campaign Joined',
            tag_added: 'Tag Added',
        };
        return labels[trigger] || trigger;
    };

    return (
        <div className="automation-list-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Marketing Automations</h1>
                    <p className="page-subtitle">Automate your marketing workflows with trigger-based rules</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/marketing/automations/new')}
                >
                    <FiPlus /> Create Automation
                </button>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Automations */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiZap />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {automations.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Automations
                        </div>
                    </div>
                </div>

                {/* Active */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCheckCircle />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {automations.filter(a => a.status === 'active').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Active
                        </div>
                    </div>
                </div>

                {/* Paused */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiPause />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {automations.filter(a => a.status === 'paused').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Paused
                        </div>
                    </div>
                </div>

                {/* Total Executions */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiActivity />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {automations.reduce((sum, a) => sum + (a.metrics?.totalExecutions || 0), 0)}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Executions
                        </div>
                    </div>
                </div>
            </div>

            <div className="filters-section">
                <div className="search-bar">
                    <FiSearch />
                    <input
                        type="text"
                        placeholder="Search automations..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
                <select
                    className="form-select"
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="draft">Draft</option>
                </select>
            </div>

            {loading ? (
                <Loader />
            ) : (
                <div className="automations-grid">
                    {automations.length > 0 ? (
                        automations.map((automation) => (
                            <div
                                key={automation._id}
                                className="automation-card"
                                onClick={() => navigate(`/marketing/automations/${automation._id}`)}
                            >
                                <div className="automation-header">
                                    <span className={`automation-status status-${automation.status}`}>
                                        {automation.status}
                                    </span>
                                    {automation.status !== 'draft' && (
                                        <button
                                            className="toggle-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleToggleStatus(automation._id, automation.status);
                                            }}
                                            title={automation.status === 'active' ? 'Pause' : 'Activate'}
                                        >
                                            {automation.status === 'active' ? (
                                                <FiPause size={14} />
                                            ) : (
                                                <FiPlay size={14} />
                                            )}
                                        </button>
                                    )}
                                </div>

                                <h3 className="automation-name">{automation.name}</h3>
                                <p className="automation-description">{automation.description || 'No description'}</p>

                                <div className="automation-flow">
                                    <div className="flow-step">
                                        <div className="flow-label">Trigger</div>
                                        <div className="flow-value">{getTriggerLabel(automation.trigger.type)}</div>
                                    </div>
                                    <div className="flow-arrow">→</div>
                                    <div className="flow-step">
                                        <div className="flow-label">Actions</div>
                                        <div className="flow-value">{automation.actions.length} action(s)</div>
                                    </div>
                                </div>

                                <div className="automation-stats">
                                    <div className="stat-item">
                                        <div className="stat-label">Executions</div>
                                        <div className="stat-value">{formatNumber(automation.metrics.totalExecutions)}</div>
                                    </div>
                                    <div className="stat-item">
                                        <div className="stat-label">Success Rate</div>
                                        <div className="stat-value">
                                            {automation.metrics.totalExecutions > 0
                                                ? ((automation.metrics.successfulExecutions / automation.metrics.totalExecutions) * 100).toFixed(1)
                                                : 0}%
                                        </div>
                                    </div>
                                    {automation.metrics.lastExecuted && (
                                        <div className="stat-item">
                                            <div className="stat-label">Last Run</div>
                                            <div className="stat-value">{formatDate(automation.metrics.lastExecuted)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state">
                            <FiZap size={64} />
                            <h3>No automations found</h3>
                            <p>Create your first automation to streamline your marketing workflows</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/marketing/automations/new')}
                            >
                                <FiPlus /> Create Automation
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AutomationList;
