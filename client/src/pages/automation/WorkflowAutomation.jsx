import { useState, useEffect } from 'react';
import {
  FiZap,
  FiPlus,
  FiPlay,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiAlertCircle,
  FiTrendingUp,
  FiUsers,
  FiBell,
  FiX,
} from 'react-icons/fi';
import { workflowService } from '../../services/workflowService';
import Loader from '../../components/common/Loader';
import './WorkflowAutomation.css';

const TRIGGER_LABELS = {
  lead_created: 'New Lead Created',
  lead_status_changed: 'Lead Status Changed',
  lead_score_high: 'Lead Score is High (≥70)',
  deal_won: 'Deal Won / Closed',
  invoice_overdue: 'Invoice Past Due Date',
};

const ACTION_LABELS = {
  round_robin_assign: 'Round-Robin Assign to Sales Reps',
  auto_schedule_followup: 'Schedule 24-Hour Follow-up Task',
  notify_sales_rep: 'Send High-Priority Alert Notification',
  set_lead_temperature: 'Mark Lead Temperature as Hot 🔥',
  send_whatsapp_alert: 'Trigger WhatsApp Notification',
};

const WorkflowAutomation = () => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerEvent: 'lead_created',
    actionType: 'round_robin_assign',
    followUpHours: 24,
    targetTemperature: 'hot',
  });

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const res = await workflowService.getWorkflows();
      if (res.data?.success) {
        setWorkflows(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await workflowService.toggleWorkflow(id);
      if (res.data?.success) {
        setWorkflows(prev =>
          prev.map(w => (w._id === id ? { ...w, isActive: res.data.data.isActive } : w))
        );
      }
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete automation "${name}"?`)) return;
    try {
      await workflowService.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w._id !== id));
      setAlertMsg('Workflow rule deleted successfully');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        triggerEvent: formData.triggerEvent,
        actionType: formData.actionType,
        actionConfig: {
          followUpHours: Number(formData.followUpHours) || 24,
          targetTemperature: formData.targetTemperature,
        },
      };

      const res = await workflowService.createWorkflow(payload);
      if (res.data?.success) {
        setWorkflows(prev => [res.data.data, ...prev]);
        setShowCreateModal(false);
        setFormData({
          name: '',
          description: '',
          triggerEvent: 'lead_created',
          actionType: 'round_robin_assign',
          followUpHours: 24,
          targetTemperature: 'hot',
        });
        setAlertMsg('Automation rule created and activated!');
        setTimeout(() => setAlertMsg(null), 3000);
      }
    } catch (err) {
      console.error('Create failed:', err);
      alert(err.response?.data?.message || 'Failed to create workflow');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExecutions = workflows.reduce((sum, w) => sum + (w.executionCount || 0), 0);
  const activeCount = workflows.filter(w => w.isActive).length;

  return (
    <div className="workflow-page-container">
      {/* Header */}
      <div className="workflow-page-header">
        <div>
          <h2>Automated Workflows &amp; Drip Sequences</h2>
          <p>Zero-manual-work automation engine for round-robin assignment, follow-up scheduling, and instant alerts</p>
        </div>
        <button
          className="btn-create-workflow"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus /> Create Automation
        </button>
      </div>

      {alertMsg && (
        <div className="workflow-alert-banner">
          <FiCheckCircle /> {alertMsg}
        </div>
      )}

      {/* Metrics Row */}
      <div className="workflow-metrics-grid">
        <div className="wf-metric-card">
          <div className="wf-metric-icon green">
            <FiZap />
          </div>
          <div>
            <div className="wf-metric-val">{activeCount} / {workflows.length}</div>
            <div className="wf-metric-label">Active Automations</div>
          </div>
        </div>

        <div className="wf-metric-card">
          <div className="wf-metric-icon blue">
            <FiPlay />
          </div>
          <div>
            <div className="wf-metric-val">{totalExecutions}</div>
            <div className="wf-metric-label">Total Actions Executed</div>
          </div>
        </div>

        <div className="wf-metric-card">
          <div className="wf-metric-icon purple">
            <FiUsers />
          </div>
          <div>
            <div className="wf-metric-val">100% Automated</div>
            <div className="wf-metric-label">Round-Robin Distribution</div>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="workflow-list-section">
        <h3>Configured Automation Rules</h3>
        {loading ? (
          <Loader />
        ) : workflows.length === 0 ? (
          <div className="wf-empty-state">
            <FiZap size={48} color="#94a3b8" />
            <p>No automation rules configured yet. Click above to create one.</p>
          </div>
        ) : (
          <div className="workflow-cards-grid">
            {workflows.map((wf) => (
              <div key={wf._id} className={`workflow-card ${wf.isActive ? 'active' : 'inactive'}`}>
                <div className="wf-card-top">
                  <div className="wf-name-group">
                    <span className={`wf-status-pill ${wf.isActive ? 'live' : 'paused'}`}>
                      {wf.isActive ? 'Active' : 'Paused'}
                    </span>
                    <h4>{wf.name}</h4>
                  </div>
                  <div className="wf-card-actions">
                    <button
                      className="wf-toggle-btn"
                      onClick={() => handleToggle(wf._id)}
                      title={wf.isActive ? 'Pause rule' : 'Activate rule'}
                    >
                      {wf.isActive ? (
                        <FiToggleRight size={26} color="#10b981" />
                      ) : (
                        <FiToggleLeft size={26} color="#9ca3af" />
                      )}
                    </button>
                    <button
                      className="wf-delete-btn"
                      onClick={() => handleDelete(wf._id, wf.name)}
                      title="Delete rule"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="wf-desc">{wf.description || 'Executes automatically when trigger conditions are met.'}</p>

                {/* Visual Flow diagram */}
                <div className="wf-flow-diagram">
                  <div className="wf-flow-step trigger">
                    <small>WHEN</small>
                    <span>{TRIGGER_LABELS[wf.triggerEvent] || wf.triggerEvent}</span>
                  </div>
                  <div className="wf-flow-arrow">
                    <FiArrowRight />
                  </div>
                  <div className="wf-flow-step action">
                    <small>THEN DO</small>
                    <span>{ACTION_LABELS[wf.actionType] || wf.actionType}</span>
                  </div>
                </div>

                <div className="wf-card-footer">
                  <div className="wf-exec-count">
                    <FiPlay size={12} /> Executed: <strong>{wf.executionCount || 0} times</strong>
                  </div>
                  {wf.lastExecutedAt && (
                    <div className="wf-last-run">
                      <FiClock size={12} /> Last run: {new Date(wf.lastExecutedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="wf-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="wf-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="wf-modal-header">
              <h3>Create Automation Rule</h3>
              <button className="wf-close-btn" onClick={() => setShowCreateModal(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreate} className="wf-modal-body">
              <div className="form-group">
                <label>Rule Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Instant Sales Team Follow-up"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Brief note about what this automation does"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Trigger Event (WHEN) *</label>
                <select
                  className="form-control"
                  value={formData.triggerEvent}
                  onChange={(e) => setFormData({ ...formData, triggerEvent: e.target.value })}
                >
                  <option value="lead_created">New Lead is Created</option>
                  <option value="lead_score_high">Lead Score is High (≥ 70 / Hot)</option>
                  <option value="deal_won">Deal Won / Converted</option>
                  <option value="invoice_overdue">Invoice Due Date Overdue</option>
                </select>
              </div>

              <div className="form-group">
                <label>Action to Execute (THEN DO) *</label>
                <select
                  className="form-control"
                  value={formData.actionType}
                  onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                >
                  <option value="round_robin_assign">Round-Robin Assign to Active Sales Reps</option>
                  <option value="auto_schedule_followup">Schedule Automatic Follow-up Task</option>
                  <option value="notify_sales_rep">Send High-Priority In-App Alert</option>
                  <option value="set_lead_temperature">Mark Lead Temperature as Hot 🔥</option>
                </select>
              </div>

              {formData.actionType === 'auto_schedule_followup' && (
                <div className="form-group">
                  <label>Follow-up Delay (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    className="form-control"
                    value={formData.followUpHours}
                    onChange={(e) => setFormData({ ...formData, followUpHours: e.target.value })}
                  />
                  <small style={{ color: '#64748b' }}>e.g. 24 = schedule exactly 24 hours after creation</small>
                </div>
              )}

              <div className="wf-modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Creating...' : 'Activate Automation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowAutomation;

