import { useState, useEffect, useCallback } from 'react';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiCalendar,
  FiPlus,
  FiSearch,
  FiUsers,
  FiUser,
  FiMessageSquare,
  FiEdit2,
  FiTrash2,
  FiActivity,
  FiBriefcase,
  FiAlertTriangle,
} from 'react-icons/fi';
import { dailyUpdateService } from '../../services/dailyUpdateService';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import './DailyWorkUpdates.css';

const departmentList = ['All', 'IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations'];

const DailyWorkUpdates = () => {
  const { user, isAdmin, isSuperAdmin } = useAuth();
  const isManagerOrAdmin = isAdmin || isSuperAdmin || user?.role?.slug === 'manager' || /_manager$/.test(user?.role?.slug || user?.role || '');

  // Tab: 'my_updates' | 'team_feed'
  const [activeTab, setActiveTab] = useState(isManagerOrAdmin ? 'team_feed' : 'my_updates');

  // Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Today's submission status for logged-in user
  const [todayUpdate, setTodayUpdate] = useState(null);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);

  // My updates history
  const [myUpdates, setMyUpdates] = useState([]);
  const [myTotal, setMyTotal] = useState(0);
  const [mySearch, setMySearch] = useState('');

  // Team feed & tracker state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedDept, setSelectedDept] = useState('All');
  const [blockersOnly, setBlockersOnly] = useState(false);
  const [teamUpdates, setTeamUpdates] = useState([]);
  const [trackerData, setTrackerData] = useState({
    totalActiveEmployees: 0,
    submittedCount: 0,
    pendingCount: 0,
    blockersCount: 0,
    submissionRate: 0,
    submitted: [],
    pending: [],
  });
  const [showPendingDrawer, setShowPendingDrawer] = useState(false);

  // Active Projects for dropdown
  const [projects, setProjects] = useState([]);

  // Submission / Edit Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState(null);
  const [savingUpdate, setSavingUpdate] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    tasksDone: '',
    planForTomorrow: '',
    blockers: '',
    hoursWorked: 8,
    project: '',
  });

  // Manager Feedback Modal
  const [feedbackModalTarget, setFeedbackModalTarget] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Helper notification
  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Load today's submission status
  const checkTodayStatus = useCallback(async () => {
    try {
      const res = await dailyUpdateService.getTodayUpdate();
      setTodayUpdate(res.data?.data || null);
      setHasSubmittedToday(Boolean(res.data?.hasSubmitted));
    } catch (err) {
      console.error('Error checking today status:', err);
    }
  }, []);

  // Load projects for linking
  useEffect(() => {
    projectService.getProjects({ status: 'active' })
      .then((res) => setProjects(res.data?.data || []))
      .catch(() => {});
    checkTodayStatus();
  }, [checkTodayStatus]);

  // Load My Updates history
  const fetchMyUpdates = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await dailyUpdateService.getDailyUpdates({
        search: mySearch.trim(),
        limit: 50,
      });
      setMyUpdates(res.data?.data || []);
      setMyTotal(res.data?.total || 0);
    } catch (err) {
      console.error('Error fetching my updates:', err);
      setError(err.response?.data?.message || 'Could not load your work updates history.');
    } finally {
      setLoading(false);
    }
  }, [mySearch]);

  // Load Team Feed & Tracker
  const fetchTeamFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [feedRes, trackerRes] = await Promise.all([
        dailyUpdateService.getDailyUpdates({
          date: selectedDate,
          department: selectedDept === 'All' ? undefined : selectedDept,
          hasBlockers: blockersOnly ? 'true' : undefined,
          limit: 100,
        }),
        dailyUpdateService.getSubmissionTracker({
          date: selectedDate,
          department: selectedDept === 'All' ? undefined : selectedDept,
        }),
      ]);

      setTeamUpdates(feedRes.data?.data || []);
      if (trackerRes.data?.data) {
        setTrackerData(trackerRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching team updates:', err);
      setError(err.response?.data?.message || 'Could not load team daily updates.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDept, blockersOnly]);

  useEffect(() => {
    if (activeTab === 'my_updates') {
      const timer = setTimeout(fetchMyUpdates, 200);
      return () => clearTimeout(timer);
    } else {
      fetchTeamFeed();
    }
  }, [activeTab, fetchMyUpdates, fetchTeamFeed]);

  // Open modal for new submission or editing
  const handleOpenSubmit = (updateToEdit = null) => {
    setEditingUpdate(updateToEdit);
    if (updateToEdit) {
      setFormData({
        date: updateToEdit.date ? new Date(updateToEdit.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        tasksDone: updateToEdit.tasksDone || '',
        planForTomorrow: updateToEdit.planForTomorrow || '',
        blockers: updateToEdit.blockers || '',
        hoursWorked: updateToEdit.hoursWorked || 8,
        project: updateToEdit.project?._id || updateToEdit.project || '',
      });
    } else {
      setFormData({
        date: new Date().toISOString().slice(0, 10),
        tasksDone: '',
        planForTomorrow: '',
        blockers: '',
        hoursWorked: 8,
        project: '',
      });
    }
    setIsSubmitModalOpen(true);
  };

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    if (!formData.tasksDone.trim()) {
      setError('Please describe the work tasks completed today.');
      return;
    }
    setSavingUpdate(true);
    setError('');

    try {
      await dailyUpdateService.saveDailyUpdate({
        ...formData,
        hoursWorked: Number(formData.hoursWorked) || 8,
        project: formData.project || null,
      });

      showNotification('Daily work update saved successfully!');
      setIsSubmitModalOpen(false);
      await checkTodayStatus();
      if (activeTab === 'my_updates') {
        fetchMyUpdates();
      } else {
        fetchTeamFeed();
      }
    } catch (err) {
      console.error('Error saving daily update:', err);
      setError(err.response?.data?.message || 'Failed to submit daily update.');
    } finally {
      setSavingUpdate(false);
    }
  };

  // Open feedback modal for manager
  const handleOpenFeedback = (update) => {
    setFeedbackModalTarget(update);
    setFeedbackComment(update.managerFeedback?.comment || '');
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackComment.trim() || !feedbackModalTarget) return;
    setSavingFeedback(true);
    setError('');

    try {
      await dailyUpdateService.submitFeedback(feedbackModalTarget._id, {
        comment: feedbackComment.trim(),
      });
      showNotification('Feedback posted successfully!');
      setFeedbackModalTarget(null);
      setFeedbackComment('');
      fetchTeamFeed();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(err.response?.data?.message || 'Could not submit feedback.');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleDeleteUpdate = async (updateId) => {
    if (!window.confirm('Are you sure you want to delete this daily update?')) return;
    try {
      await dailyUpdateService.deleteDailyUpdate(updateId);
      showNotification('Daily update deleted.');
      checkTodayStatus();
      if (activeTab === 'my_updates') fetchMyUpdates();
      else fetchTeamFeed();
    } catch (err) {
      console.error('Error deleting update:', err);
      setError(err.response?.data?.message || 'Could not delete update.');
    }
  };

  return (
    <main className="daily-updates-page">
      {/* Page Header */}
      <header className="daily-updates-header">
        <div>
          <span className="daily-updates-eyebrow">
            <FiActivity /> DAILY WORK LOG & STANDUP
          </span>
          <h1>Daily Work Updates</h1>
          <p>Share your daily accomplishments, tomorrow's plan, and raise any roadblocks with your team.</p>
        </div>
        <div className="daily-updates-header-actions">
          <button
            type="button"
            className="daily-btn-primary"
            onClick={() => handleOpenSubmit(todayUpdate)}
          >
            <FiPlus /> {hasSubmittedToday ? "Edit Today's Update" : "Submit Today's Update"}
          </button>
        </div>
      </header>

      {/* Notifications */}
      {successMsg && (
        <div className="daily-status-banner daily-status-banner--success">
          <div className="daily-status-banner-content">
            <FiCheckCircle className="daily-status-banner-icon" />
            <div className="daily-status-banner-text">
              <h3>Success</h3>
              <p>{successMsg}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="daily-status-banner daily-status-banner--warning">
          <div className="daily-status-banner-content">
            <FiAlertTriangle className="daily-status-banner-icon" />
            <div className="daily-status-banner-text">
              <h3>Attention</h3>
              <p>{error}</p>
            </div>
          </div>
          <button type="button" className="daily-btn-secondary daily-btn-sm" onClick={() => setError('')}>
            Dismiss
          </button>
        </div>
      )}

      {/* Today's Submission Reminder Banner */}
      {hasSubmittedToday ? (
        <div className="daily-status-banner daily-status-banner--success">
          <div className="daily-status-banner-content">
            <FiCheckCircle className="daily-status-banner-icon" />
            <div className="daily-status-banner-text">
              <h3>You have submitted today's work update!</h3>
              <p>Logged {todayUpdate?.hoursWorked || 8} hours · {todayUpdate?.hasBlockers ? '⚠️ Blocker reported' : 'No blockers reported'}</p>
            </div>
          </div>
          <button
            type="button"
            className="daily-btn-secondary daily-btn-sm"
            onClick={() => handleOpenSubmit(todayUpdate)}
          >
            <FiEdit2 /> View / Edit Today's Update
          </button>
        </div>
      ) : (
        <div className="daily-status-banner daily-status-banner--warning">
          <div className="daily-status-banner-content">
            <FiClock className="daily-status-banner-icon" />
            <div className="daily-status-banner-text">
              <h3>You haven't submitted your daily update for today yet.</h3>
              <p>Take 2 minutes to summarize your accomplishments and keep your team aligned.</p>
            </div>
          </div>
          <button
            type="button"
            className="daily-btn-primary daily-btn-sm"
            onClick={() => handleOpenSubmit()}
          >
            <FiPlus /> Submit Today's Update
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="daily-updates-tabs">
        <button
          type="button"
          className={`daily-updates-tab-btn ${activeTab === 'my_updates' ? 'active' : ''}`}
          onClick={() => setActiveTab('my_updates')}
        >
          <FiUser /> My Updates History ({myTotal})
        </button>
        {isManagerOrAdmin && (
          <button
            type="button"
            className={`daily-updates-tab-btn ${activeTab === 'team_feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('team_feed')}
          >
            <FiUsers /> Team Feed & Submission Tracker
          </button>
        )}
      </div>

      {/* TAB 1: MY UPDATES */}
      {activeTab === 'my_updates' && (
        <section>
          {/* Toolbar */}
          <div className="daily-updates-toolbar">
            <div className="daily-updates-toolbar-left">
              <div className="daily-search-box">
                <FiSearch />
                <input
                  type="search"
                  placeholder="Search in your past updates..."
                  value={mySearch}
                  onChange={(e) => setMySearch(e.target.value)}
                />
              </div>
            </div>
            <div className="daily-updates-toolbar-right">
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Total Submissions: <strong>{myTotal}</strong>
              </span>
            </div>
          </div>

          {loading ? (
            <Loader />
          ) : myUpdates.length === 0 ? (
            <div className="daily-empty-state">
              <FiActivity />
              <h3>No daily updates found</h3>
              <p>Submit your first daily work update to start tracking your daily progress and accomplishments.</p>
              <button
                type="button"
                className="daily-btn-primary"
                onClick={() => handleOpenSubmit()}
              >
                <FiPlus /> Submit Today's Update
              </button>
            </div>
          ) : (
            <div className="daily-feed-list">
              {myUpdates.map((item) => {
                const updateDate = new Date(item.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                return (
                  <article key={item._id} className={`daily-feed-card ${item.hasBlockers ? 'has-blocker' : ''}`}>
                    <div className="daily-feed-card-header">
                      <div className="daily-feed-author">
                        <div className="daily-feed-avatar">
                          {item.employee?.user?.name ? item.employee.user.name.charAt(0).toUpperCase() : 'ME'}
                        </div>
                        <div className="daily-feed-author-info">
                          <h3>{updateDate}</h3>
                          <div className="daily-feed-author-meta">
                            <span><FiClock /> {item.hoursWorked} hrs logged</span>
                            {item.project && (
                              <span className="daily-feed-badge daily-feed-badge--dept">
                                <FiBriefcase /> {item.project.name}
                              </span>
                            )}
                            <span className={`daily-feed-badge ${item.status === 'reviewed' ? 'daily-feed-badge--reviewed' : 'daily-feed-badge--submitted'}`}>
                              {item.status === 'reviewed' ? '✓ Manager Reviewed' : 'Submitted'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="daily-btn-secondary daily-btn-sm"
                          onClick={() => handleOpenSubmit(item)}
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          type="button"
                          className="daily-btn-danger"
                          onClick={() => handleDeleteUpdate(item._id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <div className="daily-feed-content">
                      <div>
                        <div className="daily-section-title">
                          <FiCheckCircle color="#16a34a" /> Tasks Completed Today
                        </div>
                        <div className="daily-section-body">{item.tasksDone}</div>
                      </div>

                      {item.planForTomorrow && (
                        <div>
                          <div className="daily-section-title">
                            <FiCalendar color="#3b82f6" /> Plan for Tomorrow
                          </div>
                          <div className="daily-section-body">{item.planForTomorrow}</div>
                        </div>
                      )}

                      {item.hasBlockers && item.blockers && (
                        <div className="daily-blocker-callout">
                          <div className="daily-section-title">
                            <FiAlertTriangle /> Blockers / Roadblocks
                          </div>
                          <div className="daily-section-body">{item.blockers}</div>
                        </div>
                      )}

                      {item.managerFeedback?.comment && (
                        <div className="daily-feedback-box">
                          <h5>
                            <FiMessageSquare /> Feedback from {item.managerFeedback.reviewedBy?.name || 'Manager'}
                          </h5>
                          <p>{item.managerFeedback.comment}</p>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: TEAM FEED & TRACKER (For Admins/Managers) */}
      {activeTab === 'team_feed' && (
        <section>
          {/* Tracker KPI Summary Grid */}
          <div className="daily-tracker-grid">
            <div className="daily-tracker-card">
              <div className="daily-tracker-icon daily-tracker-icon--blue">
                <FiUsers />
              </div>
              <div className="daily-tracker-info">
                <h4>Active Team</h4>
                <div className="daily-tracker-value">{trackerData.totalActiveEmployees}</div>
              </div>
            </div>

            <div className="daily-tracker-card">
              <div className="daily-tracker-icon daily-tracker-icon--green">
                <FiCheckCircle />
              </div>
              <div className="daily-tracker-info">
                <h4>Submitted Updates</h4>
                <div className="daily-tracker-value" style={{ color: '#16a34a' }}>
                  {trackerData.submittedCount} ({trackerData.submissionRate}%)
                </div>
              </div>
            </div>

            <div
              className="daily-tracker-card"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowPendingDrawer(!showPendingDrawer)}
              title="Click to view pending employees"
            >
              <div className="daily-tracker-icon daily-tracker-icon--amber">
                <FiClock />
              </div>
              <div className="daily-tracker-info">
                <h4>Pending Submissions</h4>
                <div className="daily-tracker-value" style={{ color: '#d97706' }}>
                  {trackerData.pendingCount}
                </div>
              </div>
            </div>

            <div className="daily-tracker-card">
              <div className="daily-tracker-icon daily-tracker-icon--red">
                <FiAlertTriangle />
              </div>
              <div className="daily-tracker-info">
                <h4>Blockers Reported</h4>
                <div className="daily-tracker-value" style={{ color: trackerData.blockersCount > 0 ? '#dc2626' : '#1e293b' }}>
                  {trackerData.blockersCount}
                </div>
              </div>
            </div>
          </div>

          {/* Pending Employees Box (if opened or if pending exist) */}
          {trackerData.pendingCount > 0 && (
            <div className="daily-pending-box">
              <div className="daily-pending-header">
                <h4>
                  <FiAlertCircle /> Pending Updates for {new Date(selectedDate).toLocaleDateString()} ({trackerData.pendingCount})
                </h4>
                <button
                  type="button"
                  className="daily-btn-secondary daily-btn-sm"
                  onClick={() => setShowPendingDrawer(!showPendingDrawer)}
                >
                  {showPendingDrawer ? 'Hide' : 'Show List'}
                </button>
              </div>
              {showPendingDrawer && (
                <div className="daily-pending-chips">
                  {trackerData.pending.map((item) => (
                    <span key={item.employee?._id} className="daily-pending-chip">
                      {item.employee?.user?.name || item.employee?.employeeId} ({item.employee?.department || 'General'})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Team Feed Toolbar */}
          <div className="daily-updates-toolbar">
            <div className="daily-updates-toolbar-left">
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600 }}>
                <FiCalendar color="#4f46e5" /> Date:
                <input
                  type="date"
                  className="daily-select"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </label>

              <button
                type="button"
                className="daily-btn-secondary daily-btn-sm"
                onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}
              >
                Today
              </button>

              <select
                className="daily-select"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
              >
                {departmentList.map((dept) => (
                  <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>
                ))}
              </select>
            </div>

            <div className="daily-updates-toolbar-right">
              <label className="daily-checkbox-label">
                <input
                  type="checkbox"
                  checked={blockersOnly}
                  onChange={(e) => setBlockersOnly(e.target.checked)}
                />
                <FiAlertTriangle /> Show Blockers Only ({trackerData.blockersCount})
              </label>
            </div>
          </div>

          {/* Team Feed List */}
          {loading ? (
            <Loader />
          ) : teamUpdates.length === 0 ? (
            <div className="daily-empty-state">
              <FiActivity />
              <h3>No updates found for this date</h3>
              <p>No team members have submitted work updates matching the selected date and filters.</p>
            </div>
          ) : (
            <div className="daily-feed-list">
              {teamUpdates.map((item) => (
                <article key={item._id} className={`daily-feed-card ${item.hasBlockers ? 'has-blocker' : ''}`}>
                  <div className="daily-feed-card-header">
                    <div className="daily-feed-author">
                      <div className="daily-feed-avatar">
                        {item.employee?.user?.name ? item.employee.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div className="daily-feed-author-info">
                        <h3>{item.employee?.user?.name || 'Employee'}</h3>
                        <div className="daily-feed-author-meta">
                          <span>{item.employee?.designation || 'Staff'}</span>
                          <span className="daily-feed-badge daily-feed-badge--dept">
                            {item.employee?.department || 'General'}
                          </span>
                          <span><FiClock /> {item.hoursWorked} hrs</span>
                          {item.project && (
                            <span className="daily-feed-badge daily-feed-badge--dept">
                              <FiBriefcase /> {item.project.name}
                            </span>
                          )}
                          <span className={`daily-feed-badge ${item.status === 'reviewed' ? 'daily-feed-badge--reviewed' : 'daily-feed-badge--submitted'}`}>
                            {item.status === 'reviewed' ? '✓ Reviewed' : 'Pending Review'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        className="daily-btn-secondary daily-btn-sm"
                        onClick={() => handleOpenFeedback(item)}
                      >
                        <FiMessageSquare /> {item.managerFeedback?.comment ? 'Edit Feedback' : 'Give Feedback'}
                      </button>
                    </div>
                  </div>

                  <div className="daily-feed-content">
                    <div>
                      <div className="daily-section-title">
                        <FiCheckCircle color="#16a34a" /> Tasks Completed Today
                      </div>
                      <div className="daily-section-body">{item.tasksDone}</div>
                    </div>

                    {item.planForTomorrow && (
                      <div>
                        <div className="daily-section-title">
                          <FiCalendar color="#3b82f6" /> Plan for Tomorrow
                        </div>
                        <div className="daily-section-body">{item.planForTomorrow}</div>
                      </div>
                    )}

                    {item.hasBlockers && item.blockers && (
                      <div className="daily-blocker-callout">
                        <div className="daily-section-title">
                          <FiAlertTriangle /> Blocker / Help Needed
                        </div>
                        <div className="daily-section-body">{item.blockers}</div>
                      </div>
                    )}

                    {item.managerFeedback?.comment && (
                      <div className="daily-feedback-box">
                        <h5>
                          <FiMessageSquare /> Feedback from {item.managerFeedback.reviewedBy?.name || 'Manager'}
                        </h5>
                        <p>{item.managerFeedback.comment}</p>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SUBMIT / EDIT MODAL */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={editingUpdate ? "Edit Daily Work Update" : "Submit Daily Work Update"}
        size="md"
      >
        <form className="daily-modal-form" onSubmit={handleSubmitUpdate}>
          <div className="daily-form-row">
            <div className="daily-form-group">
              <label>Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            <div className="daily-form-group">
              <label>Hours Worked</label>
              <input
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.hoursWorked}
                onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })}
              />
            </div>
          </div>

          <div className="daily-form-group">
            <label>Tasks Completed Today *</label>
            <textarea
              required
              rows={4}
              placeholder="Describe what you worked on, milestones achieved, code pushed, client tickets resolved..."
              value={formData.tasksDone}
              onChange={(e) => setFormData({ ...formData, tasksDone: e.target.value })}
            />
          </div>

          <div className="daily-form-group">
            <label>Plan for Tomorrow</label>
            <textarea
              rows={3}
              placeholder="What are your key goals or tasks planned for the next working day?"
              value={formData.planForTomorrow}
              onChange={(e) => setFormData({ ...formData, planForTomorrow: e.target.value })}
            />
          </div>

          <div className="daily-form-group has-blocker">
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626' }}>
              <FiAlertTriangle /> Blockers / Roadblocks (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Any dependencies, API failures, approvals, or roadblocks preventing progress?"
              value={formData.blockers}
              onChange={(e) => setFormData({ ...formData, blockers: e.target.value })}
            />
          </div>

          {projects.length > 0 && (
            <div className="daily-form-group">
              <label>Link to Project (Optional)</label>
              <select
                value={formData.project}
                onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              >
                <option value="">No specific project</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="daily-form-actions">
            <button
              type="button"
              className="daily-btn-secondary"
              onClick={() => setIsSubmitModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="daily-btn-primary"
              disabled={savingUpdate}
            >
              {savingUpdate ? 'Saving...' : editingUpdate ? 'Update Work Log' : 'Submit Daily Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MANAGER FEEDBACK MODAL */}
      <Modal
        isOpen={!!feedbackModalTarget}
        onClose={() => setFeedbackModalTarget(null)}
        title={`Review Update: ${feedbackModalTarget?.employee?.user?.name || 'Employee'}`}
        size="sm"
      >
        <form className="daily-modal-form" onSubmit={handleSubmitFeedback}>
          <div className="daily-form-group">
            <label>Manager Note / Feedback *</label>
            <textarea
              required
              rows={4}
              placeholder="Write feedback, acknowledgement, or reply to blockers (e.g. 'Good job, unblocked now')..."
              value={feedbackComment}
              onChange={(e) => setFeedbackComment(e.target.value)}
            />
          </div>

          <div className="daily-form-actions">
            <button
              type="button"
              className="daily-btn-secondary"
              onClick={() => setFeedbackModalTarget(null)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="daily-btn-primary"
              disabled={savingFeedback}
            >
              {savingFeedback ? 'Posting...' : 'Save Feedback'}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
};

export default DailyWorkUpdates;
