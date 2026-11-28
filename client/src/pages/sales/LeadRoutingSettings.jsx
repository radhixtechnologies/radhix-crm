import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiRepeat,
  FiShield,
  FiGlobe,
  FiCopy,
  FiCheck,
  FiPlay,
  FiUsers,
  FiZap,
  FiCheckCircle,
  FiAlertCircle,
  FiRefreshCw,
} from 'react-icons/fi';
import { growthService } from '../../services/growthService';
import { useAuth } from '../../context/AuthContext';
import './LeadRoutingSettings.css';

const PORTAL_CARDS = [
  {
    key: 'indiamart',
    label: 'IndiaMART CRM Pull/Webhook',
    color: '#dbeafe',
    text: '#1d4ed8',
    hint: 'Supports IndiaMART SENDER_NAME, SENDER_MOBILE, SENDER_EMAIL, SUBJECT & QUERY_MESSAGE.',
  },
  {
    key: 'justdial',
    label: 'Justdial Lead Push',
    color: '#fef3c7',
    text: '#92400e',
    hint: 'Supports Justdial leadid, name, mobile, email, area & category fields.',
  },
  {
    key: 'tradeindia',
    label: 'TradeIndia Inquiry Sync',
    color: '#ede9fe',
    text: '#5b21b6',
    hint: 'Supports TradeIndia sender_name, sender_mobile, sender_email & product_name.',
  },
  {
    key: 'wordpress',
    label: 'WordPress / Elementor / Custom Form',
    color: '#dcfce7',
    text: '#166534',
    hint: 'Works with Elementor Forms, Contact Form 7, Pabbly, Zapier & custom JSON POSTs.',
  },
];

const LeadRoutingSettings = () => {
  const { roleSlug, isAdmin, isSuperAdmin } = useAuth();
  const canEdit =
    isAdmin ||
    isSuperAdmin ||
    roleSlug === 'sales_manager' ||
    roleSlug?.endsWith('_admin') ||
    roleSlug?.endsWith('_manager');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedKey, setCopiedKey] = useState('');
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  const [config, setConfig] = useState({
    roundRobinEnabled: false,
    duplicateGuardEnabled: true,
    autoCallExternalLeads: false,
    externalWebhookSecret: '',
    hasWebhookSecret: false,
    webhookSecretMasked: '',
    webhookUrls: {},
    salesPool: [],
  });

  const [testPayload, setTestPayload] = useState({
    provider: 'indiamart',
    name: 'Vikram Patel',
    phone: '+91 98250 11223',
    email: 'vikram.patel@example.com',
    company: 'Patel Enterprises',
    message: 'Need CRM & AI Calling demo for 15 sales reps',
  });
  const [testResult, setTestResult] = useState(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await growthService.getRoutingConfig();
      if (res.data?.success) {
        const d = res.data.data;
        setConfig({
          ...d,
          externalWebhookSecret: d.webhookSecretMasked || '',
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to load routing settings.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setFeedback({ type: '', text: '' });
      const payload = {
        roundRobinEnabled: config.roundRobinEnabled,
        duplicateGuardEnabled: config.duplicateGuardEnabled,
        autoCallExternalLeads: config.autoCallExternalLeads,
      };
      if (config.externalWebhookSecret && !config.externalWebhookSecret.includes('••••')) {
        payload.externalWebhookSecret = config.externalWebhookSecret.trim();
      }
      const res = await growthService.updateRoutingConfig(payload);
      if (res.data?.success) {
        setFeedback({ type: 'success', text: res.data.message || 'Settings saved!' });
        await loadConfig();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Failed to save routing config.' });
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateSecret = () => {
    const token = `radhix_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
    setConfig((c) => ({ ...c, externalWebhookSecret: token }));
  };

  const handleCopyUrl = async (key, url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 1800);
    } catch {
      // Clipboard blocked fallback ignored
    }
  };

  const handleRunTest = async (e) => {
    e.preventDefault();
    try {
      setTesting(true);
      setTestResult(null);
      const res = await growthService.testRoutingWebhook(testPayload);
      if (res.data?.success) {
        setTestResult(res.data);
        await loadConfig();
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err.response?.data?.message || 'Test webhook simulation failed.' });
    } finally {
      setTesting(false);
    }
  };

  const maxLoad = Math.max(1, ...(config.salesPool || []).map((r) => r.openLeads || 0));

  return (
    <div className="routing-page">
      <div className="routing-hero">
        <div>
          <h1>
            <FiRepeat /> Smart Lead Routing & Portal Integrations
          </h1>
          <p>
            Automatically distribute inbound leads equally across Sales reps, block duplicate leads with Re-inquiry alerts, and sync IndiaMART, Justdial & Website forms in real time.
          </p>
        </div>
        <div className="routing-hero-pills">
          <span className="routing-pill">
            Round-Robin: {config.roundRobinEnabled ? 'ACTIVE' : 'OFF'}
          </span>
          <span className="routing-pill">
            Duplicate Guard: {config.duplicateGuardEnabled ? 'ON' : 'OFF'}
          </span>
          <span className="routing-pill">
            Sales Pool: {config.salesPool?.length || 0} Active Reps
          </span>
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

      {loading ? (
        <div className="routing-card">Loading Smart Routing & Portal Config...</div>
      ) : (
        <>
          <div className="routing-grid-2">
            <div className="routing-card">
              <div className="routing-card-head">
                <div>
                  <h3 className="routing-card-title">
                    <FiRepeat color="#2563eb" /> Round-Robin Auto Assignment
                  </h3>
                  <p className="routing-card-sub">
                    New unassigned leads from CRM, Meta Ads, Web Forms & IndiaMART rotate equally across active Sales reps.
                  </p>
                </div>
                <label className={`routing-switch ${config.roundRobinEnabled ? 'on' : ''}`}>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.roundRobinEnabled}
                    onChange={(e) => setConfig((c) => ({ ...c, roundRobinEnabled: e.target.checked }))}
                  />
                  {config.roundRobinEnabled ? 'Enabled' : 'Disabled'}
                </label>
              </div>

              <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiUsers /> Active Sales Pool & Current Load
              </div>
              <div className="routing-pool-list">
                {config.salesPool?.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '10px' }}>
                    No active employees found with Sales department.
                  </div>
                ) : (
                  config.salesPool.map((rep) => {
                    const initials = rep.name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    const pct = Math.round(((rep.openLeads || 0) / maxLoad) * 100);
                    return (
                      <div key={rep._id} className="routing-pool-item">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="routing-avatar">{initials}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>{rep.name}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                              {rep.designation} • {rep.employeeId}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: '100px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b' }}>
                            {rep.openLeads} Open Leads
                          </div>
                          <div style={{ height: '5px', background: '#e2e8f0', borderRadius: '99px', marginTop: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="routing-card">
              <div className="routing-card-head">
                <div>
                  <h3 className="routing-card-title">
                    <FiShield color="#059669" /> Duplicate Guard & Auto AI Dispatch
                  </h3>
                  <p className="routing-card-sub">
                    Matches last 10 phone digits or email before creating a duplicate lead — automatically appends a Re-inquiry remark and notifies the owner.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '18px' }}>
                <label className={`routing-switch ${config.duplicateGuardEnabled ? 'on' : ''}`} style={{ justifyContent: 'space-between' }}>
                  <span>Duplicate Lead Guard (Re-Inquiry Remark)</span>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.duplicateGuardEnabled}
                    onChange={(e) => setConfig((c) => ({ ...c, duplicateGuardEnabled: e.target.checked }))}
                  />
                </label>

                <label className={`routing-switch ${config.autoCallExternalLeads ? 'on' : ''}`} style={{ justifyContent: 'space-between' }}>
                  <span>
                    <FiZap style={{ verticalAlign: 'middle' }} /> Auto-Call External Portal Leads (IndiaMART / Web)
                  </span>
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={config.autoCallExternalLeads}
                    onChange={(e) => setConfig((c) => ({ ...c, autoCallExternalLeads: e.target.checked }))}
                  />
                </label>
              </div>

              <div className="routing-field" style={{ marginBottom: '14px' }}>
                <label>External Webhook Security Secret</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    disabled={!canEdit}
                    value={config.externalWebhookSecret}
                    onChange={(e) => setConfig((c) => ({ ...c, externalWebhookSecret: e.target.value }))}
                    placeholder="Optional secret token for webhook URLs"
                    style={{ flex: 1 }}
                  />
                  {canEdit && (
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleGenerateSecret}>
                      <FiRefreshCw /> Generate
                    </button>
                  )}
                </div>
              </div>

              {canEdit && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-primary" disabled={saving} onClick={handleSave}>
                    {saving ? 'Saving...' : 'Save Routing Settings'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="routing-card" style={{ marginBottom: '20px' }}>
            <h3 className="routing-card-title">
              <FiGlobe color="#4f46e5" /> Ready-to-Use Inbound Lead Webhook Endpoints
            </h3>
            <p className="routing-card-sub">
              Paste any URL below directly into your portal webhook integration settings. Leads flow straight into Duplicate Guard -&gt; Round-Robin -&gt; AI Auto-Call!
            </p>

            <div className="routing-portals-grid">
              {PORTAL_CARDS.map((p) => {
                const url = config.webhookUrls?.[p.key] || '';
                return (
                  <div key={p.key} className="routing-portal-box">
                    <span className="routing-portal-badge" style={{ background: p.color, color: p.text }}>
                      {p.label}
                    </span>
                    <div style={{ fontSize: '12px', color: '#475569' }}>{p.hint}</div>
                    <div className="routing-url-preview">{url || 'Loading URL...'}</div>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleCopyUrl(p.key, url)}
                      style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {copiedKey === p.key ? <FiCheck color="#16a34a" /> : <FiCopy />}
                      {copiedKey === p.key ? 'Copied!' : 'Copy Webhook URL'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="routing-card">
            <h3 className="routing-card-title">
              <FiPlay color="#2563eb" /> Test Portal Lead Capture, Round-Robin & Duplicate Guard
            </h3>
            <p className="routing-card-sub" style={{ marginBottom: '14px' }}>
              Simulate an incoming IndiaMART / Justdial / WordPress webhook lead right now — run it twice with the same phone number to see Duplicate Guard in action!
            </p>

            <form onSubmit={handleRunTest}>
              <div className="routing-form-row">
                <div className="routing-field">
                  <label>Source Portal</label>
                  <select
                    value={testPayload.provider}
                    onChange={(e) => setTestPayload((p) => ({ ...p, provider: e.target.value }))}
                  >
                    <option value="indiamart">IndiaMART</option>
                    <option value="justdial">Justdial</option>
                    <option value="tradeindia">TradeIndia</option>
                    <option value="wordpress">WordPress / Website</option>
                  </select>
                </div>
                <div className="routing-field">
                  <label>Lead Name</label>
                  <input
                    type="text"
                    value={testPayload.name}
                    onChange={(e) => setTestPayload((p) => ({ ...p, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="routing-field">
                  <label>Phone Number</label>
                  <input
                    type="text"
                    value={testPayload.phone}
                    onChange={(e) => setTestPayload((p) => ({ ...p, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="routing-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={testPayload.email}
                    onChange={(e) => setTestPayload((p) => ({ ...p, email: e.target.value }))}
                  />
                </div>
              </div>

              <div className="routing-form-row">
                <div className="routing-field">
                  <label>Company</label>
                  <input
                    type="text"
                    value={testPayload.company}
                    onChange={(e) => setTestPayload((p) => ({ ...p, company: e.target.value }))}
                  />
                </div>
                <div className="routing-field">
                  <label>Requirement / Message</label>
                  <input
                    type="text"
                    value={testPayload.message}
                    onChange={(e) => setTestPayload((p) => ({ ...p, message: e.target.value }))}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={testing}>
                <FiPlay /> {testing ? 'Simulating...' : 'Simulate Inbound Lead'}
              </button>
            </form>

            {testResult && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: testResult.isDuplicate ? '#fef3c7' : '#dcfce7',
                  color: testResult.isDuplicate ? '#92400e' : '#166534',
                  fontSize: '13.5px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                <span>{testResult.message}</span>
                {testResult.leadId && (
                  <Link
                    to={`/sales/leads/${testResult.leadId}`}
                    style={{ fontWeight: 700, color: '#1d4ed8', textDecoration: 'underline' }}
                  >
                    Open Lead Profile -&gt;
                  </Link>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default LeadRoutingSettings;
