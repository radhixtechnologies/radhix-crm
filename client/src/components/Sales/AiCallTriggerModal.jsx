import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPhoneCall,
  FiX,
  FiCpu,
  FiCheckCircle,
  FiAlertCircle,
  FiPlay,
  FiSettings,
  FiCalendar,
} from 'react-icons/fi';
import { aiCallingService, OUTCOME_META } from '../../services/aiCallingService';
import AiCallTranscriptView from './AiCallTranscriptView';
import './LogCallModal.css';
import '../../pages/sales/AiCallingConsole.css';

const getTomorrowIso = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const AiCallTriggerModal = ({ isOpen, onClose, lead, onCallCompleted }) => {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [useSimulator, setUseSimulator] = useState(true);
  const [customScript, setCustomScript] = useState('');
  const [calling, setCalling] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');
  const [activeCall, setActiveCall] = useState(null);

  const [scenario, setScenario] = useState('interested_callback');
  const [callbackDate, setCallbackDate] = useState(getTomorrowIso);
  const [callbackTime, setCallbackTime] = useState('16:00');
  const [customSummary, setCustomSummary] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setActiveCall(null);
    setCustomSummary('');
    setCallbackDate(getTomorrowIso());
    setCallbackTime('16:00');
    setScenario('interested_callback');

    const defaultTopic = lead?.requirements || lead?.company || 'your recent inquiry';
    setCustomScript(
      `Ask ${lead?.name || 'the customer'} politely in Hinglish about ${defaultTopic}, share pricing & demo availability, and book a convenient callback slot.`
    );

    const loadCfg = async () => {
      try {
        setLoadingConfig(true);
        const res = await aiCallingService.getConfig();
        if (res.data?.success) {
          const cfg = res.data.data;
          setConfig(cfg);
          const readyLive = Boolean(cfg.enabled && cfg.provider !== 'simulator' && cfg.hasApiKey && cfg.agentId);
          setUseSimulator(!readyLive);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load AI Calling configuration.');
      } finally {
        setLoadingConfig(false);
      }
    };
    loadCfg();
  }, [isOpen, lead]);

  if (!isOpen || !lead) return null;

  const isLiveReady = Boolean(
    config?.enabled && config?.provider !== 'simulator' && config?.hasApiKey && config?.agentId
  );

  const handleStartCall = async (e) => {
    e.preventDefault();
    try {
      setCalling(true);
      setError('');
      const res = await aiCallingService.triggerLeadCall(lead._id, {
        customScript,
        simulate: useSimulator,
      });
      if (res.data?.success) {
        setActiveCall(res.data.data);
        if (onCallCompleted) onCallCompleted();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initiate AI Call');
    } finally {
      setCalling(false);
    }
  };

  const handleSimulateComplete = async () => {
    if (!activeCall?._id) return;
    try {
      setSimulating(true);
      setError('');
      const res = await aiCallingService.simulateCallComplete(activeCall._id, {
        scenario,
        callbackDate,
        callbackTime,
        customSummary,
      });
      if (res.data?.success) {
        setActiveCall(res.data.data);
        if (onCallCompleted) onCallCompleted();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to simulate webhook callback');
    } finally {
      setSimulating(false);
    }
  };

  const isTerminal = activeCall && ['completed', 'no-answer', 'busy', 'failed'].includes(activeCall.status);
  const outcomeInfo = activeCall?.outcome ? OUTCOME_META[activeCall.outcome] || OUTCOME_META.other : null;

  return (
    <div className="log-call-modal-overlay" onClick={onClose}>
      <div
        className="log-call-modal-content"
        style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="log-call-modal-header">
          <div className="header-title-flex">
            <div className="call-header-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
              <FiCpu />
            </div>
            <div>
              <h3>AI Voice Agent Call</h3>
              <p>
                {lead.name} ({lead.phone || 'No phone number'})
              </p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        <div className="log-call-body">
          {error && (
            <div
              className="call-modal-alert error"
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '14px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <FiAlertCircle /> {error}
            </div>
          )}

          {!activeCall ? (
            <form onSubmit={handleStartCall}>
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '13px', color: '#334155' }}>
                  <strong>Active Provider:</strong>{' '}
                  {loadingConfig
                    ? 'Checking...'
                    : useSimulator
                      ? 'CRM Instant Simulator (Dry Run)'
                      : `${(config?.provider || 'bolna').toUpperCase()} Live Voice`}
                </div>
                <Link
                  to="/sales/ai-calling?tab=settings"
                  style={{
                    fontSize: '12.5px',
                    color: '#2563eb',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'none',
                  }}
                >
                  <FiSettings size={13} /> Provider Settings
                </Link>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '10px',
                  border: useSimulator ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                  background: useSimulator ? '#eff6ff' : '#ffffff',
                  marginBottom: '16px',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={useSimulator}
                  onChange={(e) => setUseSimulator(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <div style={{ fontSize: '13px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>
                    Run in CRM Test Simulator Mode (No Live Call / No Phone KYC Required)
                  </div>
                  <div style={{ color: '#475569', marginTop: '2px', fontSize: '12px' }}>
                    {isLiveReady
                      ? `Uncheck this box to dial ${lead.phone} live using ${config?.provider?.toUpperCase()}.`
                      : 'Live provider key/agent is not configured yet — simulator lets you test transcript & auto-followup sync instantly.'}
                  </div>
                </div>
              </label>

              <div className="ai-field-group" style={{ marginBottom: '18px' }}>
                <label>Call Objective / Custom Prompt Context</label>
                <textarea
                  rows={3}
                  value={customScript}
                  onChange={(e) => setCustomScript(e.target.value)}
                  placeholder="Enter key points for the AI agent to cover on this call..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={calling || !lead.phone}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <FiPhoneCall />
                  {calling ? 'Initiating...' : useSimulator ? 'Start Simulated AI Call' : 'Dial Lead via AI'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <div
                style={{
                  padding: '14px',
                  borderRadius: '10px',
                  background: isTerminal ? '#f0fdf4' : '#eff6ff',
                  border: `1px solid ${isTerminal ? '#bbf7d0' : '#bfdbfe'}`,
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiCheckCircle color={isTerminal ? '#16a34a' : '#2563eb'} />
                    {isTerminal ? 'AI Call Completed & Synced to Lead' : 'AI Call Dispatched'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                    Provider: <strong>{activeCall.provider?.toUpperCase()}</strong> • To: {activeCall.toNumber} • Ref: {activeCall.externalCallId}
                  </div>
                </div>
                <span className={`ai-badge ai-badge-${activeCall.status}`}>{activeCall.status}</span>
              </div>

              {activeCall.provider === 'simulator' && !isTerminal && (
                <div
                  style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '16px',
                    background: '#f8fafc',
                    marginBottom: '14px',
                  }}
                >
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#0f172a' }}>
                    Simulate Webhook Result
                  </h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12.5px', color: '#64748b' }}>
                    Preview how Bolna/Retell/Vapi automatically updates the Lead Remark Trail, Lead Temperature, Follow-up Calendar, and Bell Notifications:
                  </p>

                  <div className="ai-settings-form-grid" style={{ marginBottom: '12px' }}>
                    <div className="ai-field-group">
                      <label>Call Outcome Scenario</label>
                      <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
                        <option value="interested_callback">Interested & Callback Requested</option>
                        <option value="not_interested">Not Interested (Cold)</option>
                        <option value="no_answer">No Answer / Ringing Unanswered</option>
                      </select>
                    </div>
                    {scenario === 'interested_callback' && (
                      <>
                        <div className="ai-field-group">
                          <label>Callback Date</label>
                          <input
                            type="date"
                            value={callbackDate}
                            onChange={(e) => setCallbackDate(e.target.value)}
                          />
                        </div>
                        <div className="ai-field-group">
                          <label>Callback Time</label>
                          <input
                            type="time"
                            value={callbackTime}
                            onChange={(e) => setCallbackTime(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="ai-field-group" style={{ marginBottom: '14px' }}>
                    <label>Optional Custom Summary</label>
                    <input
                      type="text"
                      value={customSummary}
                      onChange={(e) => setCustomSummary(e.target.value)}
                      placeholder="Leave blank to use realistic auto-generated Hinglish AI summary"
                    />
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={simulating}
                    onClick={handleSimulateComplete}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FiPlay /> {simulating ? 'Processing Webhook...' : 'Simulate Completed Call & Sync CRM'}
                  </button>
                </div>
              )}

              {isTerminal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {outcomeInfo && (
                      <span className={`ai-badge ${outcomeInfo.cls}`}>{outcomeInfo.label}</span>
                    )}
                    {activeCall.nextFollowUpDate && (
                      <span className="ai-badge ai-outcome-callback_requested">
                        <FiCalendar size={11} /> Next Callback:{' '}
                        {new Date(activeCall.nextFollowUpDate).toLocaleDateString('en-IN')}{' '}
                        {activeCall.nextFollowUpTime || ''}
                      </span>
                    )}
                  </div>

                  {activeCall.summary && (
                    <div
                      style={{
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '13px',
                        color: '#1e293b',
                      }}
                    >
                      <strong>AI Summary:</strong> {activeCall.summary}
                    </div>
                  )}

                  {activeCall.recordingUrl && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                        Call Recording
                      </div>
                      <audio controls src={activeCall.recordingUrl} style={{ width: '100%' }} />
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                      Conversation Transcript
                    </div>
                    <AiCallTranscriptView
                      turns={activeCall.transcriptTurns}
                      transcriptText={activeCall.transcriptText}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiCallTriggerModal;
