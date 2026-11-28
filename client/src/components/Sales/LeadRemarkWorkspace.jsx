import { useState, useEffect, useMemo } from 'react';
import {
  FiPhone, FiMessageSquare, FiCalendar, FiClock, FiCheck,
  FiUser, FiMail, FiUsers, FiFileText, FiRefreshCw, FiSend,
  FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import dayjs from 'dayjs';
import { salesService } from '../../services/salesService';
import { useAuth } from '../../context/AuthContext';
import './LeadRemarkWorkspace.css';

const REMARK_CHANNELS = [
  { value: 'call', label: 'Phone Call', icon: FiPhone },
  { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
  { value: 'meeting', label: 'Meeting', icon: FiUsers },
  { value: 'email', label: 'Email', icon: FiMail },
  { value: 'remark', label: 'General Note', icon: FiFileText },
];

const OUTCOME_CHIPS = [
  { value: 'connected', label: 'Connected & Interested', color: '#059669' },
  { value: 'callback_requested', label: 'Callback Requested', color: '#d97706' },
  { value: 'proposal_sent', label: 'Proposal / Quote Sent', color: '#2563eb' },
  { value: 'busy', label: 'Busy / Not Reachable', color: '#ef4444' },
  { value: 'following_up', label: 'Following Up', color: '#7c3aed' },
  { value: 'not_interested', label: 'Not Interested', color: '#64748b' },
];

const OUTCOME_LABELS = Object.fromEntries(OUTCOME_CHIPS.map((c) => [c.value, c.label]));

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const getFollowUpUrgency = (dateVal, timeVal) => {
  if (!dateVal) return { state: 'none', label: 'Not Scheduled', sub: 'Set next call date below' };
  const dateStr = dayjs(dateVal).format('YYYY-MM-DD');
  const todayStr = dayjs().format('YYYY-MM-DD');
  const tomorrowStr = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const formattedDate = dayjs(dateVal).format('DD MMM YYYY');
  const timeSuffix = timeVal ? ` • ${timeVal}` : '';

  if (dateStr < todayStr) {
    const daysLate = dayjs(todayStr).diff(dayjs(dateStr), 'day');
    return {
      state: 'overdue',
      label: `Overdue by ${daysLate}d`,
      sub: `${formattedDate}${timeSuffix}`,
    };
  }
  if (dateStr === todayStr) {
    return {
      state: 'today',
      label: 'Due Today',
      sub: `Today${timeSuffix || ' (Call Pending)'}`,
    };
  }
  if (dateStr === tomorrowStr) {
    return {
      state: 'upcoming',
      label: 'Tomorrow',
      sub: `Tomorrow${timeSuffix}`,
    };
  }
  return {
    state: 'upcoming',
    label: formattedDate,
    sub: `${formattedDate}${timeSuffix}`,
  };
};

export const LeadFollowUpStrip = ({ lead, onLeadUpdated, onShowToast }) => {
  const { roleSlug, isAdmin, isSuperAdmin } = useAuth();
  const canAssign = isAdmin || isSuperAdmin || roleSlug === 'sales_manager' || roleSlug?.endsWith('_admin') || roleSlug?.endsWith('_manager');

  const [owners, setOwners] = useState([]);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!canAssign) return;
    let cancelled = false;
    salesService.getLeadOwners()
      .then((res) => {
        if (!cancelled && res.data?.success) {
          setOwners(res.data.data || []);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [canAssign]);

  const notesList = Array.isArray(lead?.notes) ? lead.notes : [];
  const latestNote = notesList.length > 0 ? notesList[notesList.length - 1] : null;
  const latestRemark = lead?.lastRemark?.content ? lead.lastRemark : latestNote;
  const urgency = getFollowUpUrgency(lead?.followUpDate, lead?.followUpTime);
  const assignedEmployeeName = lead?.assignedTo?.user?.name || lead?.assignedTo?.employeeId || 'Unassigned';

  const handleOwnerChange = async (employeeId) => {
    try {
      setAssigning(true);
      await salesService.assignLead(lead._id, employeeId || null);
      if (onLeadUpdated) await onLeadUpdated();
      onShowToast?.('Lead owner updated!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reassign lead owner');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="lrw-summary-strip" style={{ marginBottom: '18px' }}>
      <div className="lrw-summary-cell">
        <div className="lrw-cell-icon lrw-icon-indigo">
          <FiUser />
        </div>
        <div className="lrw-cell-body">
          <span className="lrw-cell-label">Handling Employee</span>
          <div className="lrw-owner-row">
            <span className="lrw-mini-avatar">{getInitials(assignedEmployeeName)}</span>
            <strong className="lrw-cell-value">{assignedEmployeeName}</strong>
            {lead?.assignedTo?.department && (
              <span className="lrw-dept-tag">{lead.assignedTo.department}</span>
            )}
          </div>
          {canAssign && owners.length > 0 && (
            <select
              className="lrw-reassign-select"
              value={lead?.assignedTo?._id || ''}
              onChange={(e) => handleOwnerChange(e.target.value)}
              disabled={assigning}
              aria-label="Reassign handling employee"
            >
              <option value="">-- Unassigned --</option>
              {owners.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.user?.name || emp.employeeId} ({emp.employeeId})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="lrw-summary-cell">
        <div className={`lrw-cell-icon lrw-icon-${urgency.state}`}>
          <FiCalendar />
        </div>
        <div className="lrw-cell-body">
          <span className="lrw-cell-label">Next Call / Follow-up</span>
          <div className="lrw-followup-status-row">
            <span className={`lrw-urgency-pill lrw-pill-${urgency.state}`}>
              {urgency.state === 'overdue' && <FiAlertCircle size={12} />}
              {urgency.label}
            </span>
          </div>
          <span className="lrw-cell-sub">{urgency.sub}</span>
        </div>
      </div>

      <div className="lrw-summary-cell lrw-summary-cell--wide">
        <div className="lrw-cell-icon lrw-icon-emerald">
          <FiMessageSquare />
        </div>
        <div className="lrw-cell-body">
          <span className="lrw-cell-label">
            Latest Client Remark ({notesList.length} total)
          </span>
          {latestRemark?.content ? (
            <>
              <strong className="lrw-remark-preview" title={latestRemark.content}>
                {latestRemark.content}
              </strong>
              <span className="lrw-cell-sub">
                by {latestRemark.addedBy?.name || latestRemark.addedByName || latestRemark.addedByEmployeeName || 'Team Member'}
                {latestRemark.addedAt ? ` • ${dayjs(latestRemark.addedAt).format('DD MMM, hh:mm A')}` : ''}
              </span>
            </>
          ) : (
            <span className="lrw-cell-sub">No conversation remarks added yet. Add the first update below.</span>
          )}
        </div>
      </div>
    </div>
  );
};

const LeadRemarkWorkspace = ({ lead, onLeadUpdated, onFollowUpChanged, onShowToast }) => {
  const [remarkType, setRemarkType] = useState('call');
  const [outcome, setOutcome] = useState('connected');
  const [content, setContent] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [nextFollowUpTime, setNextFollowUpTime] = useState('');
  const [nextFollowUpTitle, setNextFollowUpTitle] = useState('');
  const [nextStatus, setNextStatus] = useState(lead?.status || 'new');
  const [nextTemp, setNextTemp] = useState(lead?.leadTemperature || 'cold');
  const [completePrev, setCompletePrev] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setNextStatus(lead?.status || 'new');
    setNextTemp(lead?.leadTemperature || 'cold');
  }, [lead?._id, lead?.status, lead?.leadTemperature]);

  const sortedRemarks = useMemo(() => {
    const notes = Array.isArray(lead?.notes) ? lead.notes : [];
    return notes
      .map((note, idx) => ({ ...note, seqNumber: idx + 1 }))
      .sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
  }, [lead?.notes]);

  const assignedEmployeeName = lead?.assignedTo?.user?.name || lead?.assignedTo?.employeeId || 'Unassigned';

  const applyPreset = (preset) => {
    const now = dayjs();
    if (preset === 'today_evening') {
      setNextFollowUpDate(now.format('YYYY-MM-DD'));
      setNextFollowUpTime('17:00');
    } else if (preset === 'tomorrow') {
      setNextFollowUpDate(now.add(1, 'day').format('YYYY-MM-DD'));
      setNextFollowUpTime('11:00');
    } else if (preset === '3days') {
      setNextFollowUpDate(now.add(3, 'day').format('YYYY-MM-DD'));
      setNextFollowUpTime('11:00');
    } else if (preset === 'nextweek') {
      setNextFollowUpDate(now.add(7, 'day').format('YYYY-MM-DD'));
      setNextFollowUpTime('11:00');
    } else if (preset === 'clear') {
      setNextFollowUpDate('');
      setNextFollowUpTime('');
    }
  };

  const handleSaveRemark = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!content.trim() && !nextFollowUpDate) {
      setFormError('Please enter what the client discussed or pick a next follow-up date.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        content: content.trim() || `Follow-up scheduled for ${nextFollowUpDate}`,
        remarkType,
        outcome,
        nextFollowUpDate: nextFollowUpDate || null,
        nextFollowUpTime: nextFollowUpDate ? nextFollowUpTime : '',
        nextFollowUpTitle: nextFollowUpTitle.trim() || '',
        status: nextStatus !== lead.status ? nextStatus : undefined,
        leadTemperature: nextTemp !== lead.leadTemperature ? nextTemp : undefined,
        completePreviousPending: Boolean(nextFollowUpDate && completePrev),
      };

      const res = await salesService.addLeadNote(lead._id, payload);
      if (res.data?.success) {
        setContent('');
        setNextFollowUpDate('');
        setNextFollowUpTime('');
        setNextFollowUpTitle('');
        if (onLeadUpdated) await onLeadUpdated(res.data.data);
        if (onFollowUpChanged) await onFollowUpChanged();
        onShowToast?.(
          payload.nextFollowUpDate
            ? 'Remark saved & next follow-up scheduled!'
            : 'Remark saved to lead trail!'
        );
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save remark. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lead-remark-workspace">
      {/* Add New Remark + Schedule Next Follow-up Card */}
      <div className="card details-card lrw-composer-card">
        <div className="card-header-sm lrw-composer-header">
          <div>
            <h3>
              <FiMessageSquare size={16} /> Add Follow-up Remark &amp; Next Call Schedule
            </h3>
            <p className="lrw-composer-sub">
              Log what the client discussed and set when to call next — builds complete trail till closing
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveRemark} className="lrw-composer-form">
          {formError && (
            <div className="lrw-form-error" role="alert">
              <FiAlertCircle size={15} />
              <span>{formError}</span>
            </div>
          )}

          {/* Channel & Outcome Row */}
          <div className="lrw-row-split">
            <div>
              <label className="lrw-field-label">Interaction Mode</label>
              <div className="lrw-chip-group">
                {REMARK_CHANNELS.map((ch) => {
                  const Icon = ch.icon;
                  return (
                    <button
                      type="button"
                      key={ch.value}
                      className={`lrw-chip ${remarkType === ch.value ? 'active' : ''}`}
                      onClick={() => setRemarkType(ch.value)}
                    >
                      <Icon size={13} /> {ch.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="lrw-field-label">Client Response / Outcome</label>
              <div className="lrw-chip-group">
                {OUTCOME_CHIPS.map((item) => (
                  <button
                    type="button"
                    key={item.value}
                    className={`lrw-chip lrw-chip--outcome ${outcome === item.value ? 'active' : ''}`}
                    style={outcome === item.value ? { borderColor: item.color, color: item.color, background: `${item.color}12` } : undefined}
                    onClick={() => setOutcome(item.value)}
                  >
                    <span className="lrw-dot" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Remark Textarea */}
          <div className="lrw-field-block">
            <label className="lrw-field-label" htmlFor="lrw-remark-input">
              Client Remark / Discussion Notes
            </label>
            <textarea
              id="lrw-remark-input"
              rows={3}
              className="lrw-textarea"
              placeholder="e.g., Spoke with client regarding pricing & site visit. Client asked to call tomorrow at 4:00 PM after internal approval..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          {/* Next Follow-up Date/Time + Quick Stage Update */}
          <div className="lrw-schedule-box">
            <div className="lrw-schedule-top">
              <span className="lrw-field-label" style={{ marginBottom: 0 }}>
                <FiCalendar size={13} /> Client Callback / Next Follow-up Date &amp; Time
              </span>
              <div className="lrw-presets">
                <button type="button" onClick={() => applyPreset('today_evening')}>Today 5 PM</button>
                <button type="button" onClick={() => applyPreset('tomorrow')}>Tomorrow 11 AM</button>
                <button type="button" onClick={() => applyPreset('3days')}>+3 Days</button>
                <button type="button" onClick={() => applyPreset('nextweek')}>Next Week</button>
                {nextFollowUpDate && (
                  <button type="button" className="lrw-preset-clear" onClick={() => applyPreset('clear')}>
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="lrw-schedule-inputs">
              <div>
                <label className="lrw-mini-label">Next Call Date</label>
                <input
                  type="date"
                  className="lrw-input"
                  value={nextFollowUpDate}
                  min={dayjs().format('YYYY-MM-DD')}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                />
              </div>
              <div>
                <label className="lrw-mini-label">Preferred Time</label>
                <input
                  type="time"
                  className="lrw-input"
                  value={nextFollowUpTime}
                  onChange={(e) => setNextFollowUpTime(e.target.value)}
                  disabled={!nextFollowUpDate}
                />
              </div>
              <div>
                <label className="lrw-mini-label">Pipeline Stage</label>
                <select
                  className="lrw-input"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                >
                  <option value="new">New Lead</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="converted">Converted (Won)</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="lrw-mini-label">Lead Temperature</label>
                <select
                  className="lrw-input"
                  value={nextTemp}
                  onChange={(e) => setNextTemp(e.target.value)}
                >
                  <option value="cold">Cold</option>
                  <option value="warm">Warm</option>
                  <option value="hot">Hot</option>
                  <option value="qualified">Qualified</option>
                </select>
              </div>
            </div>

            {nextFollowUpDate && (
              <div className="lrw-schedule-extra">
                <input
                  type="text"
                  className="lrw-input"
                  placeholder={`Follow-up reminder title (default: Follow-up: ${lead?.name})`}
                  value={nextFollowUpTitle}
                  onChange={(e) => setNextFollowUpTitle(e.target.value)}
                />
                <label className="lrw-checkbox-label">
                  <input
                    type="checkbox"
                    checked={completePrev}
                    onChange={(e) => setCompletePrev(e.target.checked)}
                  />
                  <span>Close earlier open reminders for this lead</span>
                </label>
              </div>
            )}
          </div>

          <div className="lrw-composer-footer">
            <span className="lrw-footer-hint">
              Saved under: <strong>{assignedEmployeeName}</strong>
            </span>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FiSend size={14} /> {saving ? 'Saving...' : nextFollowUpDate ? 'Save Remark & Set Next Call' : 'Add Remark'}
            </button>
          </div>
        </form>
      </div>

      {/* Continuous Remark Trail (Last Tak History) */}
      <div className="card details-card lrw-trail-card">
        <div className="card-header-sm lrw-trail-header">
          <h3>
            <FiTrendingUp size={16} /> Complete Follow-up Remark Trail ({sortedRemarks.length})
          </h3>
          <span className="lrw-trail-badge">Latest First</span>
        </div>

        <div className="card-body">
          {sortedRemarks.length === 0 ? (
            <div className="lrw-empty-trail">
              <FiMessageSquare size={32} />
              <p>No remarks recorded yet for {lead?.name}.</p>
              <span>Use the form above after every call or client conversation so the whole team can track progress end-to-end.</span>
            </div>
          ) : (
            <div className="lrw-timeline">
              {sortedRemarks.map((note, idx) => {
                const authorName =
                  note.addedBy?.name ||
                  note.addedByEmployeeName ||
                  note.addedBy?.email ||
                  'Team Member';
                const outcomeText = OUTCOME_LABELS[note.outcome] || note.outcome;
                return (
                  <div key={note._id || idx} className={`lrw-timeline-item ${idx === 0 ? 'is-latest' : ''}`}>
                    <div className="lrw-timeline-marker">
                      <span>#{note.seqNumber}</span>
                    </div>
                    <div className="lrw-timeline-card">
                      <div className="lrw-timeline-top">
                        <div className="lrw-author-pill">
                          <span className="lrw-author-avatar">{getInitials(authorName)}</span>
                          <strong>{authorName}</strong>
                          <span className="lrw-type-tag">{note.remarkType || 'remark'}</span>
                          {outcomeText && (
                            <span className="lrw-outcome-tag">{outcomeText}</span>
                          )}
                        </div>
                        <span className="lrw-time-meta">
                          <FiClock size={12} /> {note.addedAt ? dayjs(note.addedAt).format('DD MMM YYYY, hh:mm A') : 'Recorded'}
                        </span>
                      </div>

                      <p className="lrw-remark-body">{note.content}</p>

                      {(note.nextFollowUpDate || note.statusSnapshot) && (
                        <div className="lrw-timeline-tags">
                          {note.nextFollowUpDate && (
                            <span className="lrw-next-call-chip">
                              <FiCalendar size={12} /> Next Call: {dayjs(note.nextFollowUpDate).format('DD MMM YYYY')}
                              {note.nextFollowUpTime ? ` at ${note.nextFollowUpTime}` : ''}
                            </span>
                          )}
                          {note.statusSnapshot && (
                            <span className="lrw-snapshot-chip">
                              <FiRefreshCw size={11} /> Stage: {note.statusSnapshot}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadRemarkWorkspace;
