import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiClock,
  FiCalendar,
  FiAlertCircle,
  FiCheckCircle,
  FiSearch,
  FiPlus,
  FiPhone,
  FiMail,
  FiUsers,
  FiCheck,
  FiRefreshCw,
} from 'react-icons/fi';
import { instituteService } from '../../services/instituteService';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './InstituteCommon.css';

const InstituteFollowups = () => {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    dueToday: 0,
    overdue: 0,
    upcoming: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'all' | 'due_today' | 'overdue' | 'upcoming' | 'completed' | 'pending'
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reschedule / Update modal
  const [editingFollowup, setEditingFollowup] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    scheduledDate: '',
    scheduledTime: '',
    status: 'pending',
    outcome: '',
    typeOfFollowUp: 'call',
  });
  const [savingReschedule, setSavingReschedule] = useState(false);

  const fetchFollowups = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await instituteService.getFollowUps({
        status: statusFilter === 'all' ? '' : statusFilter,
        search: search.trim(),
        limit: 100,
      });
      setFollowups(res.data?.data || []);
      if (res.data?.stats) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error fetching follow-ups:', err);
      setError(err.response?.data?.message || 'Failed to load follow-up reminders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchFollowups, 250);
    return () => clearTimeout(timer);
  }, [fetchFollowups]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleQuickComplete = async (item) => {
    try {
      await instituteService.updateFollowUp(item._id, {
        status: 'completed',
        outcome: 'Completed follow-up',
      });
      showNotification('Follow-up marked as completed!');
      fetchFollowups();
    } catch (err) {
      console.error('Error completing follow-up:', err);
      setError(err.response?.data?.message || 'Could not update follow-up.');
    }
  };

  const handleOpenReschedule = (item) => {
    setEditingFollowup(item);
    setRescheduleForm({
      scheduledDate: item.scheduledDate ? new Date(item.scheduledDate).toISOString().slice(0, 10) : '',
      scheduledTime: item.scheduledTime || '10:00',
      status: item.status,
      outcome: item.outcome || '',
      typeOfFollowUp: item.typeOfFollowUp || 'call',
    });
  };

  const handleSaveReschedule = async (e) => {
    e.preventDefault();
    setSavingReschedule(true);
    try {
      await instituteService.updateFollowUp(editingFollowup._id, rescheduleForm);
      showNotification('Follow-up updated successfully!');
      setEditingFollowup(null);
      fetchFollowups();
    } catch (err) {
      console.error('Error saving follow-up:', err);
      setError(err.response?.data?.message || 'Could not reschedule follow-up.');
    } finally {
      setSavingReschedule(false);
    }
  };

  const handleDeleteFollowup = async (item) => {
    if (!window.confirm('Delete this follow-up reminder?')) return;
    try {
      await instituteService.deleteFollowUp(item._id);
      showNotification('Follow-up deleted.');
      fetchFollowups();
    } catch (err) {
      console.error('Error deleting follow-up:', err);
      setError(err.response?.data?.message || 'Could not delete follow-up.');
    }
  };

  return (
    <div className="institute-page">
      <header className="institute-header">
        <div>
          <span className="institute-eyebrow"><FiClock /> ADMISSIONS PIPELINE</span>
          <h1>Follow-ups & Reminders</h1>
          <p>Track inquiry counseling dates, overdue follow-ups, and scheduled reminders.</p>
        </div>
        <div className="institute-header__actions">
          <button className="institute-btn-secondary" onClick={() => fetchFollowups()}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="institute-btn-primary" onClick={() => navigate('/institute/admissions')}>
            <FiPlus /> New Inquiry
          </button>
        </div>
      </header>

      {successMsg && <div className="institute-alert institute-alert--success">{successMsg}</div>}
      {error && <div className="institute-alert institute-alert--danger">{error}</div>}

      {/* Pulse Summary Cards */}
      <div className="institute-stats-grid">
        <div
          className="institute-stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'overdue' ? '4px solid #f43f5e' : '' }}
          onClick={() => setStatusFilter('overdue')}
        >
          <div className="institute-stat-icon institute-stat-icon--rose">
            <FiAlertCircle />
          </div>
          <div className="institute-stat-content">
            <h4>Overdue Follow-ups</h4>
            <div className="stat-value" style={{ color: '#e11d48' }}>{stats.overdue}</div>
          </div>
        </div>

        <div
          className="institute-stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'due_today' ? '4px solid #f59e0b' : '' }}
          onClick={() => setStatusFilter('due_today')}
        >
          <div className="institute-stat-icon institute-stat-icon--amber">
            <FiClock />
          </div>
          <div className="institute-stat-content">
            <h4>Due Today</h4>
            <div className="stat-value" style={{ color: '#d97706' }}>{stats.dueToday}</div>
          </div>
        </div>

        <div
          className="institute-stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'upcoming' ? '4px solid #4f46e5' : '' }}
          onClick={() => setStatusFilter('upcoming')}
        >
          <div className="institute-stat-icon institute-stat-icon--indigo">
            <FiCalendar />
          </div>
          <div className="institute-stat-content">
            <h4>Upcoming</h4>
            <div className="stat-value" style={{ color: '#4f46e5' }}>{stats.upcoming}</div>
          </div>
        </div>

        <div
          className="institute-stat-card"
          style={{ cursor: 'pointer', borderLeft: statusFilter === 'completed' ? '4px solid #10b981' : '' }}
          onClick={() => setStatusFilter('completed')}
        >
          <div className="institute-stat-icon institute-stat-icon--emerald">
            <FiCheckCircle />
          </div>
          <div className="institute-stat-content">
            <h4>Completed</h4>
            <div className="stat-value" style={{ color: '#059669' }}>{stats.completed}</div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="institute-toolbar">
        <div className="institute-search-box">
          <FiSearch />
          <input
            type="search"
            placeholder="Search prospective student, phone, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="institute-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Follow-ups</option>
          <option value="overdue">Overdue ({stats.overdue})</option>
          <option value="due_today">Due Today ({stats.dueToday})</option>
          <option value="upcoming">Upcoming ({stats.upcoming})</option>
          <option value="pending">All Pending ({stats.pending})</option>
          <option value="completed">Completed ({stats.completed})</option>
        </select>
      </div>

      {/* Table */}
      <div className="institute-table-card">
        {loading ? (
          <Loader />
        ) : followups.length === 0 ? (
          <div className="institute-empty-state">
            <FiCalendar />
            <h3>No Follow-ups Found</h3>
            <p>
              {statusFilter === 'overdue'
                ? 'Great! There are no overdue follow-ups.'
                : 'No follow-up reminders match the current filters.'}
            </p>
            <button className="institute-btn-secondary" onClick={() => setStatusFilter('all')}>
              Show All Follow-ups
            </button>
          </div>
        ) : (
          <div className="institute-table-scroll">
            <table className="institute-table">
              <thead>
                <tr>
                  <th>Prospective Student</th>
                  <th>Course / Inquiry</th>
                  <th>Scheduled Date & Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((item) => {
                  const inquiry = item.inquiry;
                  return (
                    <tr
                      key={item._id}
                      style={{
                        background: item.isOverdue ? '#fffbfb' : item.isDueToday ? '#fffdf7' : '',
                      }}
                    >
                      <td>
                        <strong>{inquiry?.name || item.title}</strong>
                        {inquiry?.phone && (
                          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <FiPhone size={11} /> {inquiry.phone}
                          </div>
                        )}
                      </td>
                      <td>
                        <span>{inquiry?.courseInterested || 'General Inquiry'}</span>
                        {inquiry?.preferredBatch && (
                          <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
                            Batch: {inquiry.preferredBatch}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600 }}>
                            {new Date(item.scheduledDate).toLocaleDateString()}
                          </span>
                          {item.scheduledTime && (
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              at {item.scheduledTime}
                            </span>
                          )}
                        </div>
                        {item.isOverdue && (
                          <span className="institute-badge institute-badge--danger" style={{ marginTop: '3px' }}>
                            <FiAlertCircle size={10} /> Overdue
                          </span>
                        )}
                        {item.isDueToday && (
                          <span className="institute-badge institute-badge--warning" style={{ marginTop: '3px' }}>
                            <FiClock size={10} /> Due Today
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="institute-badge institute-badge--neutral">
                          {item.typeOfFollowUp === 'call' ? (
                            <>
                              <FiPhone size={10} /> Call
                            </>
                          ) : item.typeOfFollowUp === 'meeting' ? (
                            <>
                              <FiUsers size={10} /> Counselling
                            </>
                          ) : (
                            item.typeOfFollowUp
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`institute-badge ${
                            item.status === 'completed'
                              ? 'institute-badge--success'
                              : item.isOverdue
                              ? 'institute-badge--danger'
                              : item.isDueToday
                              ? 'institute-badge--warning'
                              : 'institute-badge--info'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ maxWidth: '240px', fontSize: '12px', color: '#475569' }}>
                          {item.description || item.outcome || '—'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {item.status === 'pending' && (
                          <button
                            type="button"
                            className="institute-btn-success institute-btn-sm"
                            style={{ marginRight: '6px' }}
                            onClick={() => handleQuickComplete(item)}
                            title="Mark as completed"
                          >
                            <FiCheck /> Done
                          </button>
                        )}
                        <button
                          type="button"
                          className="institute-btn-secondary institute-btn-sm"
                          style={{ marginRight: '6px' }}
                          onClick={() => handleOpenReschedule(item)}
                        >
                          Reschedule
                        </button>
                        <button
                          type="button"
                          className="institute-btn-danger institute-btn-sm"
                          onClick={() => handleDeleteFollowup(item)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESCHEDULE / UPDATE MODAL */}
      {editingFollowup && (
        <Modal
          isOpen={!!editingFollowup}
          onClose={() => setEditingFollowup(null)}
          title={`Update Follow-up: ${editingFollowup.inquiry?.name || editingFollowup.title}`}
          size="sm"
        >
          <form className="institute-form" onSubmit={handleSaveReschedule}>
            <div className="institute-form-row">
              <label>
                Scheduled Date *
                <input
                  type="date"
                  required
                  value={rescheduleForm.scheduledDate}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduledDate: e.target.value })}
                />
              </label>
              <label>
                Time
                <input
                  type="time"
                  value={rescheduleForm.scheduledTime}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduledTime: e.target.value })}
                />
              </label>
            </div>

            <div className="institute-form-row">
              <label>
                Follow-up Type
                <select
                  value={rescheduleForm.typeOfFollowUp}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, typeOfFollowUp: e.target.value })}
                >
                  <option value="call">Phone Call</option>
                  <option value="meeting">In-person Counselling</option>
                  <option value="email">Email Follow-up</option>
                  <option value="task">General Task</option>
                </select>
              </label>
              <label>
                Status
                <select
                  value={rescheduleForm.status}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
            </div>

            <label>
              Outcome / Discussion Notes
              <textarea
                value={rescheduleForm.outcome}
                onChange={(e) => setRescheduleForm({ ...rescheduleForm, outcome: e.target.value })}
                placeholder="Student requested fee installment details, interested in joining weekend batch..."
              />
            </label>

            <div className="institute-form-actions">
              <button
                type="button"
                className="institute-btn-secondary"
                onClick={() => setEditingFollowup(null)}
                disabled={savingReschedule}
              >
                Cancel
              </button>
              <button type="submit" className="institute-btn-primary" disabled={savingReschedule}>
                {savingReschedule ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default InstituteFollowups;
