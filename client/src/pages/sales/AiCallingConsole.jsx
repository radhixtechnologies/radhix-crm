import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  FiPhoneCall,
  FiSettings,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiCopy,
  FiCheck,
  FiClock,
  FiCalendar,
  FiFileText,
  FiX,
  FiCpu,
  FiTrendingUp,
  FiPlay,
  FiZap,
} from 'react-icons/fi';
import { aiCallingService, OUTCOME_META, formatCallDuration } from '../../services/aiCallingService';
import { useAuth } from '../../context/AuthContext';
import AiCallTranscriptView from '../../components/Sales/AiCallTranscriptView';
import '../../components/Sales/LogCallModal.css';
import './AiCallingConsole.css';

const FALLBACK_PROVIDERS = [
  {
    id: 'bolna',
    name: 'Bolna AI (Recommended for India / Hinglish)',
    description: 'Native Hindi, Hinglish & Indian English voices with Plivo/Vobiz/Twilio +91 numbers.',
  },
  {
    id: 'retell',
    name: 'Retell AI',
    description: 'Ultra-low latency voice agents with flat webhooks and built-in call analytics.',
  },
  {
    id: 'vapi',
    name: 'Vapi AI',
    description: 'Modular assistant orchestration with Twilio/SIP phoneNumberId routing.',
  },
  {
    id: 'simulator',
    name: 'CRM Built-in Simulator (Instant Test Mode)',
    description: 'Test AI Calling -> Transcript -> Auto-Remark -> Follow-up loop without phone KYC.',
  },
];

const AiCallingConsole = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'settings' ? 'settings' : 'logs';
  const [activeTab, setActiveTab] = useState(initialTab);

  const { roleSlug, isAdmin, isSuperAdmin } = useAuth();
  const canManageSettings =
    isAdmin ||
    isSuperAdmin ||
    roleSlug === 'sales_manager' ||
    roleSlug?.endsWith('_admin') ||
    roleSlug?.endsWith('_manager');

  const [calls, setCalls] = useState([]);
  const [summary, setSummary] = useState({ totalCalls: 0, completed: 0, interested: 0, callbacksScheduled: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filters, setFilters] = useState({ status: '', outcome: '', provider: '' });
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [simulatingId, setSimulatingId] = useState(null);

  const [config, setConfig] = useState({
    enabled: false,
    provider: 'bolna',
    apiKey: '',
    apiKeyMasked: '',
    hasApiKey: false,
    agentId: '',
    fromNumber: '',
    webhookSecret: '',
    hasWebhookSecret: false,
    autoCallNewLeads: false,
    defaultLanguage: 'hi-IN',
    systemScript: '',
    webhookUrl: '',
    providers: FALLBACK_PROVIDERS,
  });
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingConn, setTestingConn] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'settings' ? { tab: 'settings' } : {});
  };

  const fetchCalls = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await aiCallingService.getCalls({
        page: pagination.page,
        limit: 15,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.outcome ? { outcome: filters.outcome } : {}),
        ...(filters.provider ? { provider: filters.provider } : {}),
      });
      if (res.data?.success) {
        setCalls(res.data.data || []);
        setSummary(res.data.summary || { totalCalls: 0, completed: 0, interested: 0, callbacksScheduled: 0 });
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
          pages: res.data.pages || 1,
        }));
      }
    } catch (err) {
      console.error('Error loading AI call logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  }, [pagination.page, filters]);

  const fetchConfig = useCallback(async () => {
    try {
      setLoadingConfig(true);
      const res = await aiCallingService.getConfig();
      if (res.data?.success) {
        const d = res.data.data;
        setConfig((prev) => ({
          ...prev,
          ...d,
          apiKey: '',
          webhookSecret: d.webhookSecret || '',
          providers: d.providers?.length ? d.providers : FALLBACK_PROVIDERS,
        }));
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Unable to load AI Calling config.' });
    } finally {
      setLoadingConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingConfig(true);
      setFeedback({ type: '', text: '' });
      const payload = {
        enabled: config.enabled,
        provider: config.provider,
        agentId: config.agentId,
        fromNumber: config.fromNumber,
        autoCallNewLeads: config.autoCallNewLeads,
        defaultLanguage: config.defaultLanguage,
        systemScript: config.systemScript,
      };
      if (config.apiKey.trim()) payload.apiKey = config.apiKey.trim();
      if (config.webhookSecret && !config.webhookSecret.includes('••••')) {
        payload.webhookSecret = config.webhookSecret.trim();
      }

      const res = await aiCallingService.updateConfig(payload);
      if (res.data?.success) {
        setFeedback({ type: 'success', text: res.data.message || 'AI Calling settings saved!' });
        await fetchConfig();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save AI Calling settings.' });
    } finally {
      setSavingConfig(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingConn(true);
      setFeedback({ type: '', text: '' });
      const res = await aiCallingService.testConnection({
        provider: config.provider,
        apiKey: config.apiKey || undefined,
        agentId: config.agentId,
      });
      if (res.data?.success) {
        setFeedback({ type: 'success', text: res.data.message });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Connection test failed — check API Key & Agent ID.',
      });
    } finally {
      setTestingConn(false);
    }
  };

  const handleCopyWebhook = async () => {
    if (!config.webhookUrl) return;
    try {
      await navigator.clipboard.writeText(config.webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const handleSimulateInTable = async (callId) => {
    try {
      setSimulatingId(callId);
      await aiCallingService.simulateCallComplete(callId, { scenario: 'interested_callback' });
      await fetchCalls();
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Simulation failed.' });
    } finally {
      setSimulatingId(null);
    }
  };

  const providerList = config.providers?.length ? config.providers : FALLBACK_PROVIDERS;

  return (
    <div className="ai-calling-page">
      <div className="ai-calling-header">
        <div className="ai-calling-title-group">
          <h1>
            <FiCpu color="#2563eb" /> AI Voice Calling Console
          </h1>
          <p>
            Automated Hinglish & English AI calls for Meta & CRM leads — synced straight into Follow-ups and Remarks.
          </p>
        </div>

        <div className="ai-calling-tabs">
          <button
            type="button"
            className={`ai-calling-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => switchTab('logs')}
          >
            <FiPhoneCall /> Call Logs & Recordings
          </button>
          <button
            type="button"
            className={`ai-calling-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => switchTab('settings')}
          >
            <FiSettings /> Provider Settings
          </button>
        </div>
      </div>

      {feedback.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13.5px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'error' ? '#fee2e2' : '#dcfce7',
            color: feedback.type === 'error' ? '#991b1b' : '#166534',
            border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
          }}
        >
          {feedback.type === 'error' ? <FiAlertCircle /> : <FiCheckCircle />}
          {feedback.text}
        </div>
      )}

      {activeTab === 'logs' ? (
        <>
          <div className="ai-kpi-grid">
            <div className="ai-kpi-card">
              <div>
                <div className="ai-kpi-label">Total AI Calls</div>
                <div className="ai-kpi-value">{summary.totalCalls}</div>
              </div>
              <div className="ai-kpi-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                <FiPhoneCall />
              </div>
            </div>

            <div className="ai-kpi-card">
              <div>
                <div className="ai-kpi-label">Connected / Completed</div>
                <div className="ai-kpi-value">{summary.completed}</div>
              </div>
              <div className="ai-kpi-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>
                <FiCheckCircle />
              </div>
            </div>

            <div className="ai-kpi-card">
              <div>
                <div className="ai-kpi-label">Interested Leads</div>
                <div className="ai-kpi-value">{summary.interested}</div>
              </div>
              <div className="ai-kpi-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <FiTrendingUp />
              </div>
            </div>

            <div className="ai-kpi-card">
              <div>
                <div className="ai-kpi-label">Callbacks Auto-Booked</div>
                <div className="ai-kpi-value">{summary.callbacksScheduled}</div>
              </div>
              <div className="ai-kpi-icon" style={{ background: '#e0f2fe', color: '#0284c7' }}>
                <FiCalendar />
              </div>
            </div>
          </div>

          <div className="ai-card">
            <div className="ai-filter-bar">
              <div className="ai-filter-controls">
                <select
                  value={filters.status}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, page: 1 }));
                    setFilters((f) => ({ ...f, status: e.target.value }));
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="queued">Queued</option>
                  <option value="ringing">Ringing</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="no-answer">No Answer</option>
                  <option value="busy">Busy</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={filters.outcome}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, page: 1 }));
                    setFilters((f) => ({ ...f, outcome: e.target.value }));
                  }}
                >
                  <option value="">All Outcomes</option>
                  <option value="interested">Interested</option>
                  <option value="callback_requested">Callback Requested</option>
                  <option value="not_interested">Not Interested</option>
                  <option value="no_answer">No Answer</option>
                  <option value="busy">Busy</option>
                </select>

                <select
                  value={filters.provider}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, page: 1 }));
                    setFilters((f) => ({ ...f, provider: e.target.value }));
                  }}
                >
                  <option value="">All Providers</option>
                  <option value="bolna">Bolna AI</option>
                  <option value="retell">Retell AI</option>
                  <option value="vapi">Vapi AI</option>
                  <option value="simulator">CRM Simulator</option>
                </select>
              </div>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={fetchCalls}
                disabled={loadingLogs}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <FiRefreshCw /> {loadingLogs ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <div className="ai-table-wrap">
              <table className="ai-calls-table">
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Outcome</th>
                    <th>Duration</th>
                    <th>Next Callback</th>
                    <th>Recording</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No AI calls found yet. Open any Lead and click <strong>AI Call</strong> (or select leads in bulk) to start!
                      </td>
                    </tr>
                  ) : (
                    calls.map((call) => {
                      const isTerminal = ['completed', 'no-answer', 'busy', 'failed'].includes(call.status);
                      const outcomeInfo = call.outcome ? OUTCOME_META[call.outcome] || OUTCOME_META.other : null;

                      return (
                        <tr key={call._id}>
                          <td>
                            {call.lead?._id ? (
                              <Link
                                to={`/sales/leads/${call.lead._id}`}
                                style={{ fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}
                              >
                                {call.lead.name}
                              </Link>
                            ) : (
                              <span>Lead</span>
                            )}
                            <div style={{ fontSize: '12px', color: '#64748b' }}>{call.toNumber}</div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, fontSize: '12.5px' }}>
                              {call.provider?.toUpperCase()}
                            </span>
                          </td>
                          <td>
                            <span className={`ai-badge ai-badge-${call.status}`}>{call.status}</span>
                          </td>
                          <td>
                            {outcomeInfo ? (
                              <span className={`ai-badge ${outcomeInfo.cls}`}>{outcomeInfo.label}</span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Pending</span>
                            )}
                          </td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12.5px' }}>
                              <FiClock size={12} /> {formatCallDuration(call.durationSeconds)}
                            </span>
                          </td>
                          <td>
                            {call.nextFollowUpDate ? (
                              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#0369a1' }}>
                                {new Date(call.nextFollowUpDate).toLocaleDateString('en-IN')} {call.nextFollowUpTime || ''}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                            )}
                          </td>
                          <td>
                            {call.recordingUrl ? (
                              <audio controls src={call.recordingUrl} style={{ height: '30px', maxWidth: '180px' }} />
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '12px' }}>No audio</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {call.provider === 'simulator' && !isTerminal && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-primary"
                                  disabled={simulatingId === call._id}
                                  onClick={() => handleSimulateInTable(call._id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                                >
                                  <FiPlay size={11} />
                                  {simulatingId === call._id ? '...' : 'Simulate Complete'}
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={() => setSelectedCall(call)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
                              >
                                <FiFileText size={12} /> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Prev
                </button>
                <span style={{ fontSize: '12.5px', fontWeight: 600 }}>
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="ai-card">
          {loadingConfig ? (
            <div style={{ padding: '24px', color: '#64748b' }}>Loading AI Calling settings...</div>
          ) : (
            <form onSubmit={handleSaveSettings}>
              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  color: '#1e3a8a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <FiZap size={18} />
                <div>
                  <strong>Recommendation:</strong> Use <strong>Bolna AI</strong> for India (+91 & Hinglish voice agents), or select{' '}
                  <strong>CRM Built-in Simulator</strong> to test the end-to-end call, transcript & follow-up loop right now without phone KYC!
                </div>
              </div>

              <div className="ai-toggle-row">
                <label className="ai-toggle-item">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    disabled={!canManageSettings}
                    onChange={(e) => setConfig((c) => ({ ...c, enabled: e.target.checked }))}
                  />
                  Enable AI Voice Calling for Workspace
                </label>

                <label className="ai-toggle-item">
                  <input
                    type="checkbox"
                    checked={config.autoCallNewLeads}
                    disabled={!canManageSettings}
                    onChange={(e) => setConfig((c) => ({ ...c, autoCallNewLeads: e.target.checked }))}
                  />
                  Auto-Call New Meta Ads Leads Instantly
                </label>
              </div>

              <div style={{ marginBottom: '10px', fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                Select Voice AI Provider
              </div>
              <div className="ai-provider-grid">
                {providerList.map((prov) => (
                  <button
                    type="button"
                    key={prov.id}
                    disabled={!canManageSettings}
                    className={`ai-provider-card ${config.provider === prov.id ? 'selected' : ''}`}
                    onClick={() => setConfig((c) => ({ ...c, provider: prov.id }))}
                  >
                    <div className="ai-provider-card-title">{prov.name}</div>
                    <div className="ai-provider-card-desc">{prov.description}</div>
                  </button>
                ))}
              </div>

              {config.provider !== 'simulator' && (
                <div className="ai-settings-form-grid" style={{ marginBottom: '18px' }}>
                  <div className="ai-field-group">
                    <label>
                      {config.provider.toUpperCase()} API Key {config.hasApiKey ? `(Saved: ${config.apiKeyMasked})` : '*'}
                    </label>
                    <input
                      type="password"
                      disabled={!canManageSettings}
                      value={config.apiKey}
                      onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
                      placeholder={config.hasApiKey ? 'Leave blank to keep existing API key' : 'Paste provider Bearer API key'}
                    />
                  </div>

                  <div className="ai-field-group">
                    <label>{config.provider === 'vapi' ? 'Assistant ID *' : 'Agent ID *'}</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={config.agentId}
                      onChange={(e) => setConfig((c) => ({ ...c, agentId: e.target.value }))}
                      placeholder="e.g. agt_1234abcd"
                    />
                  </div>

                  <div className="ai-field-group">
                    <label>{config.provider === 'vapi' ? 'Vapi Phone Number ID *' : 'From Phone Number (+91 / E.164)'}</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={config.fromNumber}
                      onChange={(e) => setConfig((c) => ({ ...c, fromNumber: e.target.value }))}
                      placeholder={config.provider === 'vapi' ? 'UUID of phoneNumberId in Vapi' : 'Optional for Bolna if default Plivo attached'}
                    />
                  </div>

                  <div className="ai-field-group">
                    <label>Webhook Secret (Optional Verification Token)</label>
                    <input
                      type="text"
                      disabled={!canManageSettings}
                      value={config.webhookSecret}
                      onChange={(e) => setConfig((c) => ({ ...c, webhookSecret: e.target.value }))}
                      placeholder="Shared secret token for webhook URL"
                    />
                  </div>
                </div>
              )}

              <div className="ai-settings-form-grid">
                <div className="ai-field-group">
                  <label>Default Voice Language</label>
                  <select
                    disabled={!canManageSettings}
                    value={config.defaultLanguage}
                    onChange={(e) => setConfig((c) => ({ ...c, defaultLanguage: e.target.value }))}
                  >
                    <option value="hi-IN">Hinglish / Hindi (India)</option>
                    <option value="en-IN">English (India)</option>
                    <option value="en-US">English (Global)</option>
                  </select>
                </div>

                <div className="ai-field-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Default AI Call Prompt / Script Context</label>
                  <textarea
                    rows={3}
                    disabled={!canManageSettings}
                    value={config.systemScript}
                    onChange={(e) => setConfig((c) => ({ ...c, systemScript: e.target.value }))}
                  />
                  <span className="ai-field-hint">
                    Passed dynamically via prompt context variables (`lead_name`, `company`, `requirements`) on every call.
                  </span>
                </div>
              </div>

              {config.webhookUrl && (
                <div className="ai-webhook-box">
                  <div>
                    <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '2px' }}>
                      Paste this Webhook URL in your Bolna / Retell / Vapi Agent Dashboard:
                    </div>
                    <code>{config.webhookUrl}</code>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={handleCopyWebhook}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedWebhook ? <FiCheck color="#10b981" /> : <FiCopy />}
                    {copiedWebhook ? 'Copied!' : 'Copy Webhook'}
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={testingConn}
                  onClick={handleTestConnection}
                >
                  {testingConn ? 'Testing...' : 'Test Connection'}
                </button>
                {canManageSettings && (
                  <button type="submit" className="btn btn-primary" disabled={savingConfig}>
                    {savingConfig ? 'Saving...' : 'Save Settings'}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {selectedCall && (
        <div className="log-call-modal-overlay" onClick={() => setSelectedCall(null)}>
          <div
            className="log-call-modal-content"
            style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="log-call-modal-header">
              <div className="header-title-flex">
                <div className="call-header-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <FiFileText />
                </div>
                <div>
                  <h3>AI Call Transcript & Summary</h3>
                  <p>
                    {selectedCall.lead?.name || 'Lead'} ({selectedCall.toNumber}) • {selectedCall.provider?.toUpperCase()}
                  </p>
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedCall(null)}>
                <FiX />
              </button>
            </div>

            <div className="log-call-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedCall.summary && (
                <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                  <strong>Summary:</strong> {selectedCall.summary}
                </div>
              )}
              {selectedCall.recordingUrl && (
                <audio controls src={selectedCall.recordingUrl} style={{ width: '100%' }} />
              )}
              <AiCallTranscriptView
                turns={selectedCall.transcriptTurns}
                transcriptText={selectedCall.transcriptText}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiCallingConsole;
