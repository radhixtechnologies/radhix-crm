import { useCallback, useEffect, useState } from 'react';
import { FiCpu, FiCalendar, FiClock, FiFileText, FiPlay, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { aiCallingService, OUTCOME_META, formatCallDuration } from '../../services/aiCallingService';
import AiCallTranscriptView from './AiCallTranscriptView';
import '../../pages/sales/AiCallingConsole.css';

const AiCallHistoryPanel = ({ leadId, refreshKey = 0, onCallUpdated }) => {
  const [calls, setCalls] = useState([]);
  const [expandedCallId, setExpandedCallId] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);

  const loadCalls = useCallback(async () => {
    if (!leadId) return;
    try {
      const res = await aiCallingService.getCalls({ leadId, limit: 8 });
      if (res.data?.success) {
        setCalls(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading lead AI calls:', err);
    }
  }, [leadId]);

  useEffect(() => {
    loadCalls();
  }, [loadCalls, refreshKey]);

  if (!calls.length) return null;

  const handleQuickSimulate = async (callId) => {
    try {
      setSimulatingId(callId);
      await aiCallingService.simulateCallComplete(callId, { scenario: 'interested_callback' });
      await loadCalls();
      if (onCallUpdated) await onCallUpdated();
    } catch (err) {
      console.error('Error completing simulated call:', err);
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '18px 20px',
        marginTop: '18px',
        marginBottom: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiCpu color="#2563eb" /> AI Voice Call History ({calls.length})
        </h3>
        <span style={{ fontSize: '12px', color: '#64748b' }}>
          Summaries, transcripts & callbacks auto-sync into Remarks
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {calls.map((call) => {
          const isExpanded = expandedCallId === call._id;
          const isTerminal = ['completed', 'no-answer', 'busy', 'failed'].includes(call.status);
          const outcomeMeta = call.outcome ? OUTCOME_META[call.outcome] || OUTCOME_META.other : null;

          return (
            <div
              key={call._id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px 14px',
                background: '#f8fafc',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                    {call.provider?.toUpperCase()}
                  </span>
                  <span className={`ai-badge ai-badge-${call.status}`}>{call.status}</span>
                  {outcomeMeta && <span className={`ai-badge ${outcomeMeta.cls}`}>{outcomeMeta.label}</span>}
                  <span style={{ fontSize: '12px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FiClock size={12} /> {formatCallDuration(call.durationSeconds)}
                  </span>
                  {call.nextFollowUpDate && (
                    <span style={{ fontSize: '12px', color: '#0369a1', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiCalendar size={12} /> Callback: {new Date(call.nextFollowUpDate).toLocaleDateString('en-IN')}{' '}
                      {call.nextFollowUpTime || ''}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    {new Date(call.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  {call.provider === 'simulator' && !isTerminal && (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={simulatingId === call._id}
                      onClick={() => handleQuickSimulate(call._id)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
                    >
                      <FiPlay size={11} />
                      {simulatingId === call._id ? 'Completing...' : 'Simulate Complete'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setExpandedCallId(isExpanded ? null : call._id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', fontSize: '12px' }}
                  >
                    <FiFileText size={12} />
                    {isExpanded ? 'Hide Details' : 'Transcript'}
                    {isExpanded ? <FiChevronUp size={12} /> : <FiChevronDown size={12} />}
                  </button>
                </div>
              </div>

              {call.summary && (
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#334155', lineHeight: 1.45 }}>
                  {call.summary}
                </div>
              )}

              {isExpanded && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {call.recordingUrl && (
                    <audio controls src={call.recordingUrl} style={{ width: '100%', height: '36px' }} />
                  )}
                  <AiCallTranscriptView
                    turns={call.transcriptTurns}
                    transcriptText={call.transcriptText}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AiCallHistoryPanel;
