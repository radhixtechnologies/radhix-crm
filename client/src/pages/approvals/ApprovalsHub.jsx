import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiDollarSign,
  FiActivity,
  FiLogOut,
  FiSearch,
  FiAlertTriangle,
  FiClock,
  FiInbox,
} from 'react-icons/fi';
import { approvalService } from '../../services/approvalService';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { formatCurrency } from '../../utils/format';
import './ApprovalsHub.css';

const ApprovalsHub = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'leave' | 'expense' | 'standup' | 'exit'
  const [search, setSearch] = useState('');

  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    leave: 0,
    expense: 0,
    standup: 0,
    exit: 0,
  });

  // Action Modal State
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' | 'reject'
  const [remarks, setRemarks] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await approvalService.getPendingApprovals(activeTab);
      if (res.data?.success) {
        setItems(res.data.data.items || []);
        setCounts(res.data.data.counts || { total: 0, leave: 0, expense: 0, standup: 0, exit: 0 });
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError(err.response?.data?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Open action modal
  const openActionModal = (item, action) => {
    setSelectedItem(item);
    setActionType(action);
    setRemarks(action === 'approve' ? 'Approved' : '');
  };

  const closeActionModal = () => {
    setSelectedItem(null);
    setActionType(null);
    setRemarks('');
  };

  // Submit action
  const handleProcessAction = async (e) => {
    e.preventDefault();
    if (!selectedItem || !actionType) return;

    if (actionType === 'reject' && !remarks.trim()) {
      alert('Please provide a reason / remark for rejection.');
      return;
    }

    try {
      setProcessing(true);
      const res = await approvalService.processAction(
        selectedItem.type,
        selectedItem.id,
        actionType,
        remarks.trim()
      );

      if (res.data?.success) {
        setSuccessMsg(res.data.message || `Request ${actionType}d successfully`);
        setTimeout(() => setSuccessMsg(''), 4000);
        closeActionModal();
        fetchApprovals();
      }
    } catch (err) {
      console.error('Action processing failed:', err);
      alert(err.response?.data?.message || 'Failed to process action');
    } finally {
      setProcessing(false);
    }
  };

  // Client search filter
  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      (item.applicantName || '').toLowerCase().includes(term) ||
      (item.applicantDepartment || '').toLowerCase().includes(term) ||
      (item.title || '').toLowerCase().includes(term) ||
      (item.reason || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="approvals-hub-page">
      {/* Header */}
      <div className="approvals-header">
        <div>
          <h1 className="approvals-header-title">Approvals &amp; Action Center</h1>
          <p className="approvals-header-desc">
            Single unified inbox for pending leaves, expense claims, standup reviews &amp; resignations.
          </p>
        </div>
      </div>

      {/* Success / Error notification */}
      {successMsg && (
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#ecfdf5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: '8px' }}>
          ✓ {successMsg}
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px' }}>
          ✕ {error}
        </div>
      )}

      {/* Top KPI Grid */}
      <div className="approvals-kpi-grid">
        <div
          className={`approvals-kpi-card ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="approvals-kpi-icon all">
            <FiInbox />
          </div>
          <div>
            <div className="approvals-kpi-val">{counts.total}</div>
            <div className="approvals-kpi-label">Total Pending</div>
          </div>
        </div>

        <div
          className={`approvals-kpi-card ${activeTab === 'leave' ? 'active' : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          <div className="approvals-kpi-icon leave">
            <FiCalendar />
          </div>
          <div>
            <div className="approvals-kpi-val">{counts.leave}</div>
            <div className="approvals-kpi-label">Leaves to Approve</div>
          </div>
        </div>

        <div
          className={`approvals-kpi-card ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          <div className="approvals-kpi-icon expense">
            <FiDollarSign />
          </div>
          <div>
            <div className="approvals-kpi-val">{counts.expense}</div>
            <div className="approvals-kpi-label">Expense Claims</div>
          </div>
        </div>

        <div
          className={`approvals-kpi-card ${activeTab === 'standup' ? 'active' : ''}`}
          onClick={() => setActiveTab('standup')}
        >
          <div className="approvals-kpi-icon standup">
            <FiActivity />
          </div>
          <div>
            <div className="approvals-kpi-val">{counts.standup}</div>
            <div className="approvals-kpi-label">Standups to Review</div>
          </div>
        </div>

        <div
          className={`approvals-kpi-card ${activeTab === 'exit' ? 'active' : ''}`}
          onClick={() => setActiveTab('exit')}
        >
          <div className="approvals-kpi-icon exit">
            <FiLogOut />
          </div>
          <div>
            <div className="approvals-kpi-val">{counts.exit}</div>
            <div className="approvals-kpi-label">Exit Requests</div>
          </div>
        </div>
      </div>

      {/* Toolbar & Filter Tabs */}
      <div className="approvals-toolbar">
        <div className="approvals-tabs">
          <button
            className={`approvals-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Pending
            <span className="approvals-tab-pill">{counts.total}</span>
          </button>
          <button
            className={`approvals-tab-btn ${activeTab === 'leave' ? 'active' : ''}`}
            onClick={() => setActiveTab('leave')}
          >
            Leaves
            <span className="approvals-tab-pill">{counts.leave}</span>
          </button>
          <button
            className={`approvals-tab-btn ${activeTab === 'expense' ? 'active' : ''}`}
            onClick={() => setActiveTab('expense')}
          >
            Expenses
            <span className="approvals-tab-pill">{counts.expense}</span>
          </button>
          <button
            className={`approvals-tab-btn ${activeTab === 'standup' ? 'active' : ''}`}
            onClick={() => setActiveTab('standup')}
          >
            Daily Standups
            <span className="approvals-tab-pill">{counts.standup}</span>
          </button>
          <button
            className={`approvals-tab-btn ${activeTab === 'exit' ? 'active' : ''}`}
            onClick={() => setActiveTab('exit')}
          >
            Exits
            <span className="approvals-tab-pill">{counts.exit}</span>
          </button>
        </div>

        <div className="approvals-search-box">
          <FiSearch color="#64748b" />
          <input
            type="text"
            placeholder="Filter by name, reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <Loader message="Loading pending action items..." />
      ) : filteredItems.length === 0 ? (
        <div className="approvals-empty-box">
          <div className="approvals-empty-icon">
            <FiCheckCircle />
          </div>
          <div className="approvals-empty-title">All Caught Up!</div>
          <div className="approvals-empty-desc">
            There are no pending requests waiting for your review in this category.
          </div>
        </div>
      ) : (
        <div className="approvals-stream">
          {filteredItems.map((item) => {
            const initials = (item.applicantName || 'E')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <div key={`${item.type}-${item.id}`} className="approval-card">
                <div className="approval-card-top">
                  <div className="approval-card-profile">
                    <div className="approval-avatar">{initials}</div>
                    <div>
                      <div className="approval-emp-name">{item.applicantName}</div>
                      <div className="approval-emp-meta">
                        <span>{item.applicantDepartment}</span>
                        {item.applicantDesignation && <span>• {item.applicantDesignation}</span>}
                        {item.employeeId && <span>• {item.employeeId}</span>}
                      </div>
                    </div>
                  </div>

                  <span className={`approval-type-badge ${item.type}`}>
                    {item.categoryLabel}
                  </span>
                </div>

                <div className="approval-card-content">
                  <div className="approval-content-title">{item.title}</div>
                  <div className="approval-content-body">{item.reason}</div>

                  {item.amount != null && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <span className="approval-amount-tag">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  )}

                  {item.hasBlockers && item.blockers && (
                    <div className="approval-blockers-alert">
                      <FiAlertTriangle />
                      <span><strong>Blocker:</strong> {item.blockers}</span>
                    </div>
                  )}

                  <div className="approval-content-dates">
                    <FiClock />
                    <span>Timeline: {item.dateRange}</span>
                  </div>
                </div>

                <div className="approval-card-actions">
                  <button
                    className="btn-reject"
                    onClick={() => openActionModal(item, 'reject')}
                  >
                    <FiXCircle /> Reject
                  </button>
                  <button
                    className="btn-approve"
                    onClick={() => openActionModal(item, 'approve')}
                  >
                    <FiCheckCircle />
                    {item.type === 'standup' ? 'Review & Sign-off' : 'Approve'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Confirmation Modal */}
      {selectedItem && (
        <Modal
          isOpen={!!selectedItem}
          onClose={closeActionModal}
          title={`${actionType === 'approve' ? 'Approve' : 'Reject'} ${selectedItem.categoryLabel}`}
        >
          <form onSubmit={handleProcessAction}>
            <div style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#475569' }}>
              Are you sure you want to <strong>{actionType}</strong> this request from <strong>{selectedItem.applicantName}</strong>?
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                {actionType === 'approve' ? 'Manager Feedback / Notes (Optional)' : 'Rejection Reason / Remarks (Required)'}
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '0.65rem',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  minHeight: '85px',
                  fontSize: '0.9rem',
                }}
                placeholder={actionType === 'approve' ? 'Good job, approved.' : 'State reason for rejection...'}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                required={actionType === 'reject'}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeActionModal}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${actionType === 'approve' ? 'btn-success' : 'btn-danger'}`}
                style={{
                  background: actionType === 'approve' ? '#10b981' : '#e11d48',
                  color: '#ffffff',
                  fontWeight: 600,
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                }}
                disabled={processing}
              >
                {processing ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default ApprovalsHub;
