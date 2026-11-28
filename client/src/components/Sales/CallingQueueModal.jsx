import { useState, useEffect, useCallback } from 'react';
import {
  FiX, FiPhone, FiChevronLeft, FiChevronRight, FiCheckCircle,
  FiCalendar, FiClock, FiMessageSquare, FiUser, FiExternalLink
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { salesService } from '../../services/salesService';
import WhatsAppModal from '../common/WhatsAppModal';
import './CallingQueueModal.css';

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected & Interested', color: '#059669' },
  { value: 'callback_requested', label: 'Callback Requested', color: '#d97706' },
  { value: 'proposal_sent', label: 'Proposal / Quote Asked', color: '#2563eb' },
  { value: 'busy', label: 'Busy / No Answer', color: '#ef4444' },
  { value: 'not_interested', label: 'Not Interested', color: '#64748b' },
];

const CallingQueueModal = ({ isOpen, onClose, initialFilterAssignedTo = '', onQueueUpdated }) => {
  const navigate = useNavigate();
  const [queueScope, setQueueScope] = useState('priority'); // 'priority' (due today + overdue) | 'all'
  const [queue, setQueue] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [leadDetails, setLeadDetails] = useState(null);
  const [loadingLead, setLoadingLead] = useState(false);

  const [selectedOutcome, setSelectedOutcome] = useState('Connected & Interested');
  const [remark, setRemark] = useState('');
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [leadStatus, setLeadStatus] = useState('');
  const [leadTemperature, setLeadTemperature] = useState('');
  const [saving, setSaving] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [waModalOpen, setWaModalOpen] = useState(false);

  const loadQueue = useCallback(async () => {
    try {
      setLoadingQueue(true);
      const baseParams = {
        limit: 100,
        ...(initialFilterAssignedTo ? { assignedTo: initialFilterAssignedTo } : {}),
      };

      let items = [];
      if (queueScope === 'priority') {
        const [overdueRes, todayRes] = await Promise.all([
          salesService.getFollowUps({ ...baseParams, bucket: 'overdue' }),
          salesService.getFollowUps({ ...baseParams, bucket: 'today' }),
        ]);
        const overdueList = overdueRes.data?.data || [];
        const todayList = todayRes.data?.data || [];
        const seen = new Set();
        [...overdueList, ...todayList].forEach((item) => {
          if (!seen.has(item._id)) {
            seen.add(item._id);
            items.push(item);
          }
        });
      } else {
        const res = await salesService.getFollowUps({ ...baseParams, status: 'pending' });
        const pendingList = res.data?.data || [];
        const overdueRes = await salesService.getFollowUps({ ...baseParams, bucket: 'overdue' });
        const overdueList = overdueRes.data?.data || [];
        const seen = new Set();
        [...overdueList, ...pendingList].forEach((item) => {
          if (!seen.has(item._id)) {
            seen.add(item._id);
            items.push(item);
          }
        });
      }

      setQueue(items);
      setCurrentIndex(0);
    } catch (err) {
      console.error('Failed to load calling queue:', err);
      setQueue([]);
    } finally {
      setLoadingQueue(false);
    }
  }, [queueScope, initialFilterAssignedTo]);

  useEffect(() => {
    if (isOpen) {
      setCompletedCount(0);
      loadQueue();
    }
  }, [isOpen, loadQueue]);

  const currentItem = queue[currentIndex] || null;

  useEffect(() => {
    setSelectedOutcome('Connected & Interested');
    setRemark('');
    setNextDate('');
    setNextTime('');

    if (!isOpen || !currentItem) {
      setLeadDetails(null);
      setLeadStatus('');
      setLeadTemperature('');
      return;
    }

    const related = currentItem.relatedId && typeof currentItem.relatedId === 'object' ? currentItem.relatedId : null;
    if (currentItem.type === 'lead' && related?._id) {
      setLeadStatus(related.status || '');
      setLeadTemperature(related.leadTemperature || '');
      setLoadingLead(true);
      salesService.getLead(related._id)
        .then((res) => {
          if (res.data?.success) {
            setLeadDetails(res.data.data);
            setLeadStatus(res.data.data.status || '');
            setLeadTemperature(res.data.data.leadTemperature || '');
          }
        })
        .catch(() => setLeadDetails(related))
        .finally(() => setLoadingLead(false));
    } else {
      setLeadDetails(related);
      setLeadStatus('');
      setLeadTemperature('');
    }
  }, [isOpen, currentItem]);

  if (!isOpen) return null;

  const related = leadDetails || (currentItem?.relatedId && typeof currentItem.relatedId === 'object' ? currentItem.relatedId : null);
  const clientName = related?.name || related?.title || 'Client';
  const clientPhone = related?.phone || '';
  const ownerName = currentItem?.assignedTo?.user?.name || currentItem?.assignedTo?.employeeId || 'Team Member';
  const notes = Array.isArray(leadDetails?.notes)
    ? [...leadDetails.notes].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))
    : [];

  const applyPreset = (days, time = '11:00') => {
    setNextDate(dayjs().add(days, 'day').format('YYYY-MM-DD'));
    setNextTime(time);
  };

  const handleCompleteAndNext = async (e) => {
    e.preventDefault();
    if (!currentItem) return;

    const finalOutcome = remark.trim()
      ? `${selectedOutcome}: ${remark.trim()}`
      : selectedOutcome;

    try {
      setSaving(true);
      await salesService.updateFollowUp(currentItem._id, {
        status: 'completed',
        outcome: finalOutcome,
        nextFollowUp: nextDate || null,
        nextFollowUpTime: nextDate ? nextTime : '',
        ...(currentItem.type === 'lead' && leadStatus ? { leadStatus } : {}),
        ...(currentItem.type === 'lead' && leadTemperature ? { leadTemperature } : {}),
      });

      setCompletedCount((c) => c + 1);
      if (onQueueUpdated) await onQueueUpdated();

      // Remove completed item from queue & stay on same index (which advances cleanly!)
      setQueue((prev) => {
        const nextList = prev.filter((_, idx) => idx !== currentIndex);
        if (currentIndex >= nextList.length) {
          setCurrentIndex(Math.max(0, nextList.length - 1));
        }
        return nextList;
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save call outcome');
    } finally {
      setSaving(false);
    }
  };

  const handleWhatsAppLogged = async ({ message }) => {
    if (currentItem?.type === 'lead' && related?._id) {
      try {
        await salesService.addCommunication(related._id, {
          type: 'whatsapp',
          outcome: 'whatsapp_sent',
          notes: `WhatsApp sent: ${message}`,
        });
        const refreshed = await salesService.getLead(related._id);
        if (refreshed.data?.success) setLeadDetails(refreshed.data.data);
      } catch (err) {
        console.warn('Could not log WhatsApp message to remark trail:', err);
      }
    }
  };

  return (
    <div className="cq-overlay" onClick={onClose}>
      <div className="cq-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="cq-header">
          <div className="cq-header-left">
            <div className="cq-header-badge">
              <FiPhone /> Calling Queue
            </div>
            <div className="cq-scope-switch">
              <button
                type="button"
                className={queueScope === 'priority' ? 'active' : ''}
                onClick={() => setQueueScope('priority')}
              >
                Due Today &amp; Overdue
              </button>
              <button
                type="button"
                className={queueScope === 'all' ? 'active' : ''}
                onClick={() => setQueueScope('all')}
              >
                All Open Follow-ups
              </button>
            </div>
            {completedCount > 0 && (
              <span className="cq-completed-pill">
                <FiCheckCircle size={13} /> {completedCount} done this session
              </span>
            )}
          </div>

          <div className="cq-header-right">
            {queue.length > 0 && (
              <div className="cq-pager">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  title="Previous client"
                >
                  <FiChevronLeft />
                </button>
                <span>{currentIndex + 1} / {queue.length}</span>
                <button
                  type="button"
                  disabled={currentIndex >= queue.length - 1}
                  onClick={() => setCurrentIndex((i) => Math.min(queue.length - 1, i + 1))}
                  title="Skip to next"
                >
                  <FiChevronRight />
                </button>
              </div>
            )}
            <button type="button" className="cq-close-btn" onClick={onClose} aria-label="Close calling queue">
              <FiX />
            </button>
          </div>
        </header>

        {/* Body */}
        {loadingQueue ? (
          <div className="cq-empty">Loading calling queue...</div>
        ) : !currentItem ? (
          <div className="cq-empty">
            <FiCheckCircle size={42} color="#10b981" />
            <h3>All caught up!</h3>
            <p>
              {queueScope === 'priority'
                ? 'No overdue or due-today follow-ups pending right now.'
                : 'No open follow-ups left in the queue.'}
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              {queueScope === 'priority' && (
                <button type="button" className="btn btn-outline" onClick={() => setQueueScope('all')}>
                  View All Upcoming Follow-ups
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="cq-split">
            {/* Left Pane: Client Context & Past Remarks */}
            <section className="cq-left">
              <div className="cq-client-card">
                <div className="cq-client-top">
                  <div>
                    <span className={`cq-due-tag cq-due-${currentItem.status === 'overdue' ? 'overdue' : 'today'}`}>
                      {currentItem.status === 'overdue' ? 'Overdue' : 'Scheduled'} • {dayjs(currentItem.scheduledDate).format('DD MMM')}
                      {currentItem.scheduledTime ? ` at ${currentItem.scheduledTime}` : ''}
                    </span>
                    <h2>{clientName}</h2>
                    <p>{related?.company || currentItem.title}</p>
                  </div>
                  {currentItem.type === 'lead' && related?._id && (
                    <button
                      type="button"
                      className="cq-open-link"
                      onClick={() => { onClose(); navigate(`/sales/leads/${related._id}`); }}
                    >
                      Open Lead <FiExternalLink size={12} />
                    </button>
                  )}
                </div>

                <div className="cq-contact-actions">
                  {clientPhone ? (
                    <a href={`tel:${clientPhone}`} className="cq-call-btn">
                      <FiPhone /> Dial {clientPhone}
                    </a>
                  ) : (
                    <span className="cq-no-phone">No phone number</span>
                  )}
                  <button
                    type="button"
                    className="cq-wa-btn"
                    disabled={!clientPhone}
                    onClick={() => setWaModalOpen(true)}
                  >
                    <FaWhatsapp /> WhatsApp
                  </button>
                </div>

                <div className="cq-meta-grid">
                  <div>
                    <span>Handling Employee</span>
                    <strong><FiUser size={12} /> {ownerName}</strong>
                  </div>
                  <div>
                    <span>Follow-up Topic</span>
                    <strong>{currentItem.title}</strong>
                  </div>
                </div>
              </div>

              <div className="cq-remarks-box">
                <h4>
                  <FiMessageSquare size={14} /> Previous Remarks ({notes.length})
                </h4>
                {loadingLead ? (
                  <p className="cq-muted">Loading history...</p>
                ) : notes.length > 0 ? (
                  <div className="cq-remark-list">
                    {notes.map((n, idx) => (
                      <div key={n._id || idx} className="cq-remark-item">
                        <div className="cq-remark-meta">
                          <strong>{n.addedBy?.name || n.addedByEmployeeName || 'Team Member'}</strong>
                          <span>{n.addedAt ? dayjs(n.addedAt).format('DD MMM, hh:mm A') : ''}</span>
                        </div>
                        <p>{n.content}</p>
                        {n.nextFollowUpDate && (
                          <span className="cq-remark-next">
                            <FiCalendar size={11} /> Next Call: {dayjs(n.nextFollowUpDate).format('DD MMM YYYY')}
                            {n.nextFollowUpTime ? ` at ${n.nextFollowUpTime}` : ''}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="cq-muted">
                    {currentItem.description || 'No previous remarks logged yet for this client.'}
                  </p>
                )}
              </div>
            </section>

            {/* Right Pane: Log Outcome & Schedule Next Call */}
            <form onSubmit={handleCompleteAndNext} className="cq-right">
              <div className="cq-form-group">
                <label>Call Outcome *</label>
                <div className="cq-outcomes">
                  {CALL_OUTCOMES.map((item) => (
                    <button
                      type="button"
                      key={item.value}
                      className={`cq-outcome-chip ${selectedOutcome === item.label ? 'active' : ''}`}
                      style={selectedOutcome === item.label ? { borderColor: item.color, color: item.color, background: `${item.color}14` } : undefined}
                      onClick={() => setSelectedOutcome(item.label)}
                    >
                      <span className="cq-dot" style={{ backgroundColor: item.color }} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="cq-form-group">
                <label>What Did Client Say? (New Remark)</label>
                <textarea
                  rows={3}
                  placeholder="Write summary of today's call and client instructions..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>

              <div className="cq-schedule-card">
                <div className="cq-schedule-head">
                  <label style={{ margin: 0 }}><FiCalendar /> Next Follow-up Date &amp; Time</label>
                  <div className="cq-presets">
                    <button type="button" onClick={() => applyPreset(0, '17:00')}>Today 5 PM</button>
                    <button type="button" onClick={() => applyPreset(1, '11:00')}>Tomorrow</button>
                    <button type="button" onClick={() => applyPreset(3, '11:00')}>+3 Days</button>
                    <button type="button" onClick={() => applyPreset(7, '11:00')}>Next Week</button>
                  </div>
                </div>
                <div className="cq-two-col">
                  <input
                    type="date"
                    min={dayjs().format('YYYY-MM-DD')}
                    value={nextDate}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                  <div className="cq-time-wrap">
                    <FiClock size={14} />
                    <input
                      type="time"
                      value={nextTime}
                      disabled={!nextDate}
                      onChange={(e) => setNextTime(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {currentItem.type === 'lead' && (
                <div className="cq-two-col">
                  <div className="cq-form-group">
                    <label>Lead Stage</label>
                    <select value={leadStatus} onChange={(e) => setLeadStatus(e.target.value)}>
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted (Won)</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div className="cq-form-group">
                    <label>Temperature</label>
                    <select value={leadTemperature} onChange={(e) => setLeadTemperature(e.target.value)}>
                      <option value="cold">Cold</option>
                      <option value="warm">Warm</option>
                      <option value="hot">Hot</option>
                      <option value="qualified">Qualified</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="cq-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setCurrentIndex((i) => (i + 1 < queue.length ? i + 1 : 0))}
                  disabled={saving || queue.length <= 1}
                >
                  Skip for Now
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <FiCheckCircle /> {saving ? 'Saving...' : 'Complete & Next Call →'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {waModalOpen && (
        <WhatsAppModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          recipientName={clientName}
          recipientPhone={clientPhone}
          defaultTemplateId={nextDate ? 'callback_confirmation' : 'general_followup'}
          contextVariables={{
            date: nextDate ? dayjs(nextDate).format('DD MMM YYYY') : 'tomorrow',
            time: nextTime || 'our scheduled slot',
          }}
          onSent={handleWhatsAppLogged}
        />
      )}
    </div>
  );
};

export default CallingQueueModal;
