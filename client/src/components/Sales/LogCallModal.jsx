import { useState } from 'react';
import { FiPhone, FiX, FiCheck, FiClock, FiFileText } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import './LogCallModal.css';

const CALL_OUTCOMES = [
  { value: 'connected', label: 'Connected & Discussed', color: '#10b981' },
  { value: 'callback_requested', label: 'Callback Requested', color: '#f59e0b' },
  { value: 'busy', label: 'Line Busy', color: '#ef4444' },
  { value: 'no_answer', label: 'No Answer / Not Reachable', color: '#6b7280' },
  { value: 'voicemail', label: 'Left Voicemail', color: '#8b5cf6' },
  { value: 'wrong_number', label: 'Wrong Number / Invalid', color: '#dc2626' },
];

const LogCallModal = ({ isOpen, onClose, lead, onCallLogged }) => {
  const [outcome, setOutcome] = useState('connected');
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead) return;

    try {
      setSaving(true);
      setError(null);

      const payload = {
        type: 'call',
        direction: 'outbound',
        phoneNumber: lead.phone || '',
        status: 'completed',
        duration: Number(durationMinutes) || 1,
        outcome,
        notes: notes || `Call completed with outcome: ${outcome}`,
        timestamp: new Date(),
      };

      const res = await salesService.addCommunication(lead._id, payload);
      if (res.data?.success) {
        if (onCallLogged) onCallLogged();
        onClose();
      }
    } catch (err) {
      console.error('Error logging call:', err);
      setError(err.response?.data?.message || 'Failed to log call');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="log-call-modal-overlay" onClick={onClose}>
      <div className="log-call-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="log-call-modal-header">
          <div className="header-title-flex">
            <div className="call-header-icon">
              <FiPhone />
            </div>
            <div>
              <h3>Log Phone Interaction</h3>
              <p>Record call outcome, duration and discussion summary for {lead.name}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {error && <div className="call-modal-alert error">{error}</div>}

        <form onSubmit={handleSubmit} className="log-call-body">
          {/* Outcome Grid */}
          <div className="form-group">
            <label className="section-label">Call Outcome *</label>
            <div className="outcome-grid">
              {CALL_OUTCOMES.map((item) => (
                <button
                  type="button"
                  key={item.value}
                  className={`outcome-pill ${outcome === item.value ? 'selected' : ''}`}
                  onClick={() => setOutcome(item.value)}
                >
                  <span className="dot" style={{ backgroundColor: item.color }}></span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label><FiPhone /> Dialed Number</label>
              <input
                type="text"
                className="form-control"
                value={lead.phone || 'No phone recorded'}
                disabled
              />
            </div>
            <div className="form-group">
              <label><FiClock /> Duration (Minutes)</label>
              <input
                type="number"
                min={1}
                max={300}
                className="form-control"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label><FiFileText /> Discussion Notes &amp; Next Steps</label>
            <textarea
              rows={4}
              className="form-control"
              placeholder="e.g. Discussed pricing requirements. Customer asked for quotation by tomorrow evening..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="log-call-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-save-call" disabled={saving}>
              {saving ? 'Logging...' : <><FiCheck /> Save Call Log</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LogCallModal;

