import { useState, useEffect } from 'react';
import { FiCheckCircle, FiCalendar, FiClock, FiUser, FiPhone } from 'react-icons/fi';
import dayjs from 'dayjs';
import { salesService } from '../../services/salesService';
import Modal from '../common/Modal';

const QUICK_OUTCOMES = [
  'Connected & Interested',
  'Callback Requested',
  'Proposal / Quotation Asked',
  'Busy / No Answer',
  'Need More Time',
  'Not Interested',
];

const CompleteFollowUpModal = ({ isOpen, onClose, followup, onSuccess }) => {
  const [formData, setFormData] = useState({
    outcome: '',
    nextFollowUp: '',
    nextFollowUpTime: '',
    leadStatus: '',
    leadTemperature: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && followup) {
      setError('');
      const related = followup.relatedId && typeof followup.relatedId === 'object' ? followup.relatedId : null;
      setFormData({
        outcome: followup.outcome || '',
        nextFollowUp: '',
        nextFollowUpTime: '',
        leadStatus: related?.status || '',
        leadTemperature: related?.leadTemperature || '',
      });
    }
  }, [isOpen, followup]);

  const applyDatePreset = (days, time = '11:00') => {
    setFormData((prev) => ({
      ...prev,
      nextFollowUp: dayjs().add(days, 'day').format('YYYY-MM-DD'),
      nextFollowUpTime: time,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.outcome.trim()) {
      setError('Please enter what happened on this follow-up (client remark / outcome).');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status: 'completed',
        outcome: formData.outcome.trim(),
        nextFollowUp: formData.nextFollowUp || null,
        nextFollowUpTime: formData.nextFollowUp ? formData.nextFollowUpTime : '',
      };

      if (followup.type === 'lead') {
        if (formData.leadStatus) payload.leadStatus = formData.leadStatus;
        if (formData.leadTemperature) payload.leadTemperature = formData.leadTemperature;
      }

      await salesService.updateFollowUp(followup._id, payload);
      await onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error completing follow-up:', err);
      setError(err.response?.data?.message || 'Failed to complete follow-up');
    } finally {
      setLoading(false);
    }
  };

  if (!followup) return null;

  const related = followup.relatedId && typeof followup.relatedId === 'object' ? followup.relatedId : null;
  const relatedName = related?.name || related?.title || '';
  const relatedPhone = related?.phone || '';
  const ownerName = followup.assignedTo?.user?.name || followup.assignedTo?.employeeId || 'Team Member';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Complete Follow-up & Log Client Remark">
      <form onSubmit={handleSubmit} className="followup-form">
        {error && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 0 }}>
            {error}
          </div>
        )}

        {/* Follow-up Info */}
        <div className="followup-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h4>{followup.title}</h4>
              <p className="text-muted">
                {followup.type.charAt(0).toUpperCase() + followup.type.slice(1)} Follow-up
                {relatedName ? ` • Client: ${relatedName}` : ''}
              </p>
              {relatedPhone && (
                <p className="text-muted" style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FiPhone size={12} /> {relatedPhone}
                </p>
              )}
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, background: '#eef2ff', color: '#4338ca', padding: '4px 10px', borderRadius: '999px' }}>
              <FiUser size={12} /> {ownerName}
            </span>
          </div>
        </div>

        {/* Quick Outcome Chips + Remark */}
        <div className="form-group">
          <label>Client Remark / Call Outcome *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
            {QUICK_OUTCOMES.map((text) => (
              <button
                type="button"
                key={text}
                onClick={() => setFormData((prev) => ({
                  ...prev,
                  outcome: prev.outcome ? (prev.outcome.includes(text) ? prev.outcome : `${text} — ${prev.outcome}`) : `${text}: `,
                }))}
                style={{
                  fontSize: '11.5px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid #cbd5e1',
                  background: formData.outcome.startsWith(text) ? '#eef2ff' : '#ffffff',
                  color: formData.outcome.startsWith(text) ? '#4338ca' : '#475569',
                  cursor: 'pointer',
                }}
              >
                {text}
              </button>
            ))}
          </div>
          <textarea
            name="outcome"
            value={formData.outcome}
            onChange={(e) => setFormData((prev) => ({ ...prev, outcome: e.target.value }))}
            placeholder="Write what the client discussed & when they asked to call next..."
            rows="3"
            required
          />
          <small className="form-hint">
            This remark will be saved permanently in the lead&apos;s follow-up trail.
          </small>
        </div>

        {/* Next Follow-up Date & Time */}
        <div className="form-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
            <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiCalendar /> Schedule Next Follow-up (Optional)
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => applyDatePreset(0, '17:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Today 5 PM</button>
              <button type="button" onClick={() => applyDatePreset(1, '11:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Tomorrow 11 AM</button>
              <button type="button" onClick={() => applyDatePreset(3, '11:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>+3 Days</button>
              <button type="button" onClick={() => applyDatePreset(7, '11:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Next Week</button>
            </div>
          </div>

          <div className="form-row">
            <div className="input-with-icon">
              <FiCalendar />
              <input
                type="date"
                name="nextFollowUp"
                value={formData.nextFollowUp}
                onChange={(e) => setFormData((prev) => ({ ...prev, nextFollowUp: e.target.value }))}
                min={dayjs().format('YYYY-MM-DD')}
                style={{ width: '100%' }}
              />
            </div>
            <div className="input-with-icon">
              <FiClock />
              <input
                type="time"
                name="nextFollowUpTime"
                value={formData.nextFollowUpTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, nextFollowUpTime: e.target.value }))}
                disabled={!formData.nextFollowUp}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <small className="form-hint">
            Automatically creates the next follow-up reminder &amp; updates the lead&apos;s Next Call date.
          </small>
        </div>

        {/* Optional Lead Stage & Temp update */}
        {followup.type === 'lead' && (
          <div className="form-row">
            <div className="form-group">
              <label>Update Lead Stage</label>
              <select
                value={formData.leadStatus}
                onChange={(e) => setFormData((prev) => ({ ...prev, leadStatus: e.target.value }))}
              >
                <option value="">Keep unchanged</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted (Won)</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            <div className="form-group">
              <label>Lead Temperature</label>
              <select
                value={formData.leadTemperature}
                onChange={(e) => setFormData((prev) => ({ ...prev, leadTemperature: e.target.value }))}
              >
                <option value="">Keep unchanged</option>
                <option value="cold">Cold</option>
                <option value="warm">Warm</option>
                <option value="hot">Hot</option>
                <option value="qualified">Qualified</option>
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-success"
            disabled={loading}
          >
            <FiCheckCircle className="mr-1" />
            {loading ? 'Saving...' : formData.nextFollowUp ? 'Complete & Schedule Next' : 'Mark as Complete'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CompleteFollowUpModal;
