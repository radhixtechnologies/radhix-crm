import React, { useState, useEffect } from 'react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import {
  FiCopy,
  FiCheck,
  FiExternalLink,
  FiX,
  FiSend,
  FiZap,
  FiInfo,
  FiSliders,
  FiBookOpen,
  FiShield
} from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { triggerConfetti } from '../../utils/confetti';
import './MetaAdsModal.css';

const MetaAdsModal = ({ isOpen, onClose, onLeadCreated }) => {
  const [activeTab, setActiveTab] = useState('webhook'); // 'webhook' | 'test' | 'guide'
  const [config, setConfig] = useState({
    webhookUrl: `${window.location.protocol}//${window.location.hostname}:5000/api/webhooks/meta`,
    verifyToken: 'radhix_meta_token_2026',
    hasSecret: true,
    hasToken: true,
    pageId: null,
  });
  const [copiedField, setCopiedField] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Form state for test lead simulator
  const [testForm, setTestForm] = useState({
    name: 'Pooja Verma',
    email: 'pooja.meta@example.com',
    phone: '+91 98111 22334',
    campaignName: 'High Intent Home Buyers 2026',
    adName: 'Instagram Stories - Exclusive Walkthrough',
    platform: 'ig',
    company: 'Verma Interior Design',
    industry: 'Real Estate',
  });

  useEffect(() => {
    if (isOpen) {
      loadMetaConfig();
      setTestResult(null);
    }
  }, [isOpen]);

  const loadMetaConfig = async () => {
    try {
      const res = await salesService.getMetaConfig();
      if (res.data?.success && res.data?.data) {
        setConfig(prev => ({
          ...prev,
          ...res.data.data
        }));
      }
    } catch (err) {
      console.warn('Could not load dynamic Meta config, using defaults:', err.message);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handleSendTestLead = async (e) => {
    e.preventDefault();
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await salesService.sendMetaTestLead(testForm);
      if (res.data?.success) {
        setTestResult({
          success: true,
          lead: res.data.data,
          message: 'Lead simulated successfully! Ingested into CRM with Meta attribution.'
        });
        triggerConfetti({ particleCount: 80, duration: 2500 });
        if (onLeadCreated) onLeadCreated();
      } else {
        setTestResult({
          success: false,
          message: res.data?.message || 'Failed to simulate Meta lead'
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Network error simulating Meta lead'
      });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="meta-modal-backdrop" onClick={onClose}>
      <div className="meta-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="meta-modal-header">
          <div className="meta-header-left">
            <div className="meta-brand-icons">
              <div className="meta-icon-badge meta-icon-fb">
                <FaFacebook />
              </div>
              <div className="meta-icon-badge meta-icon-ig">
                <FaInstagram />
              </div>
            </div>
            <div>
              <div className="meta-header-title">
                Meta Ads Lead Sync
                <span className="meta-ready-badge">
                  <span className="meta-dot"></span> Ready
                </span>
              </div>
              <p className="meta-header-subtitle">
                Capture instant form leads from Facebook & Instagram Ads in real time
              </p>
            </div>
          </div>
          <button className="meta-close-btn" onClick={onClose} title="Close">
            <FiX />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="meta-nav-tabs">
          <button
            className={`meta-tab-btn ${activeTab === 'webhook' ? 'active' : ''}`}
            onClick={() => setActiveTab('webhook')}
          >
            <FiShield /> Webhook Credentials
          </button>
          <button
            className={`meta-tab-btn ${activeTab === 'test' ? 'active' : ''}`}
            onClick={() => setActiveTab('test')}
          >
            <FiZap /> Send Test Lead
          </button>
          <button
            className={`meta-tab-btn ${activeTab === 'guide' ? 'active' : ''}`}
            onClick={() => setActiveTab('guide')}
          >
            <FiBookOpen /> Setup Guide
          </button>
        </div>

        {/* Body Content */}
        <div className="meta-modal-body">
          {/* TAB 1: WEBHOOK CREDENTIALS */}
          {activeTab === 'webhook' && (
            <div>
              <div className="meta-field-group">
                <div className="meta-field-label">
                  <span>Meta Webhook Callback URL</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Paste in Meta Developer Dashboard</span>
                </div>
                <div className="meta-copy-box">
                  <input
                    type="text"
                    readOnly
                    value={config.webhookUrl}
                    className="meta-copy-input"
                  />
                  <button
                    className={`meta-copy-btn ${copiedField === 'url' ? 'copied' : ''}`}
                    onClick={() => handleCopy(config.webhookUrl, 'url')}
                  >
                    {copiedField === 'url' ? <><FiCheck /> Copied</> : <><FiCopy /> Copy URL</>}
                  </button>
                </div>
              </div>

              <div className="meta-field-group">
                <div className="meta-field-label">
                  <span>Verify Token (hub.verify_token)</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Used by Meta to handshake</span>
                </div>
                <div className="meta-copy-box">
                  <input
                    type="text"
                    readOnly
                    value={config.verifyToken}
                    className="meta-copy-input"
                  />
                  <button
                    className={`meta-copy-btn ${copiedField === 'token' ? 'copied' : ''}`}
                    onClick={() => handleCopy(config.verifyToken, 'token')}
                  >
                    {copiedField === 'token' ? <><FiCheck /> Copied</> : <><FiCopy /> Copy Token</>}
                  </button>
                </div>
              </div>

              <div className="meta-field-group">
                <div className="meta-field-label">
                  <span>Subscribed Webhook Field</span>
                </div>
                <div className="meta-copy-box" style={{ background: '#f1f5f9' }}>
                  <input
                    type="text"
                    readOnly
                    value="leadgen (Page Object)"
                    className="meta-copy-input"
                    style={{ fontWeight: 600, color: '#1e293b' }}
                  />
                </div>
              </div>

              <div className="meta-info-banner">
                <FiInfo style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Production HTTPS Notice:</strong> Meta Graph API requires public HTTPS endpoints to deliver production webhooks. When deploying or testing locally, map this URL using ngrok or deploy to your cloud domain with SSL.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TEST LEAD SIMULATOR */}
          {activeTab === 'test' && (
            <div>
              <p style={{ fontSize: '13px', color: '#64748b', marginTop: 0, marginBottom: '16px' }}>
                Simulate an incoming Meta Instant Form lead to test your CRM attribution, auto-scoring, and lead workflows instantly.
              </p>

              <form onSubmit={handleSendTestLead}>
                <div className="meta-sim-grid">
                  <div className="meta-form-group">
                    <label className="meta-form-label">Prospect Name</label>
                    <input
                      type="text"
                      className="meta-form-control"
                      value={testForm.name}
                      onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="meta-form-group">
                    <label className="meta-form-label">Phone Number</label>
                    <input
                      type="text"
                      className="meta-form-control"
                      value={testForm.phone}
                      onChange={(e) => setTestForm({ ...testForm, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="meta-sim-grid">
                  <div className="meta-form-group">
                    <label className="meta-form-label">Email Address</label>
                    <input
                      type="email"
                      className="meta-form-control"
                      value={testForm.email}
                      onChange={(e) => setTestForm({ ...testForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="meta-form-group">
                    <label className="meta-form-label">Company / Organization</label>
                    <input
                      type="text"
                      className="meta-form-control"
                      value={testForm.company}
                      onChange={(e) => setTestForm({ ...testForm, company: e.target.value })}
                    />
                  </div>
                </div>

                <div className="meta-sim-grid">
                  <div className="meta-form-group">
                    <label className="meta-form-label">Ad Campaign Name</label>
                    <input
                      type="text"
                      className="meta-form-control"
                      value={testForm.campaignName}
                      onChange={(e) => setTestForm({ ...testForm, campaignName: e.target.value })}
                    />
                  </div>
                  <div className="meta-form-group">
                    <label className="meta-form-label">Ad Creative Title</label>
                    <input
                      type="text"
                      className="meta-form-control"
                      value={testForm.adName}
                      onChange={(e) => setTestForm({ ...testForm, adName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="meta-form-group" style={{ marginBottom: '16px' }}>
                  <label className="meta-form-label">Platform Origin</label>
                  <div className="meta-platform-selector">
                    <div
                      className={`meta-platform-option ${testForm.platform === 'fb' ? 'selected-fb' : ''}`}
                      onClick={() => setTestForm({ ...testForm, platform: 'fb' })}
                    >
                      <FaFacebook style={{ color: '#1877f2', fontSize: '18px' }} />
                      <span>Facebook Feed / Story</span>
                    </div>
                    <div
                      className={`meta-platform-option ${testForm.platform === 'ig' ? 'selected-ig' : ''}`}
                      onClick={() => setTestForm({ ...testForm, platform: 'ig' })}
                    >
                      <FaInstagram style={{ color: '#e1306c', fontSize: '18px' }} />
                      <span>Instagram Reels / Explore</span>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="meta-submit-btn"
                  disabled={sendingTest}
                >
                  {sendingTest ? (
                    <>Processing Ingestion...</>
                  ) : (
                    <>
                      <FiSend /> Fire Simulated Meta Lead
                    </>
                  )}
                </button>
              </form>

              {testResult && (
                <div
                  className="meta-success-card"
                  style={{
                    background: testResult.success ? '#ecfdf5' : '#fef2f2',
                    borderColor: testResult.success ? '#6ee7b7' : '#fca5a5',
                    color: testResult.success ? '#065f46' : '#991b1b',
                  }}
                >
                  <div>
                    <strong>{testResult.success ? 'Success!' : 'Simulation Failed:'}</strong>{' '}
                    {testResult.message}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP SETUP GUIDE */}
          {activeTab === 'guide' && (
            <div className="meta-guide-list">
              <div className="meta-guide-step">
                <div className="meta-step-number">1</div>
                <div className="meta-step-content">
                  <h4 className="meta-step-title">Create or Open Meta for Developers App</h4>
                  <p className="meta-step-desc">
                    Go to <strong>developers.facebook.com</strong>, create a 'Business' type App or select your existing CRM app.
                  </p>
                </div>
              </div>

              <div className="meta-guide-step">
                <div className="meta-step-number">2</div>
                <div className="meta-step-content">
                  <h4 className="meta-step-title">Configure Webhooks Product</h4>
                  <p className="meta-step-desc">
                    Add the <strong>Webhooks</strong> product, choose the <strong>Page</strong> object, and click 'Subscribe to this object'.
                  </p>
                </div>
              </div>

              <div className="meta-guide-step">
                <div className="meta-step-number">3</div>
                <div className="meta-step-content">
                  <h4 className="meta-step-title">Paste Callback URL & Verify Token</h4>
                  <p className="meta-step-desc">
                    Paste the Callback URL and Verify Token from the first tab. Click 'Verify and save'.
                  </p>
                </div>
              </div>

              <div className="meta-guide-step">
                <div className="meta-step-number">4</div>
                <div className="meta-step-content">
                  <h4 className="meta-step-title">Subscribe to 'leadgen' and Test</h4>
                  <p className="meta-step-desc">
                    Subscribe your Facebook Page to the <strong>leadgen</strong> field. Use Meta's Lead Ads Testing Tool to test live forms!
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <a
                  href="https://developers.facebook.com/tools/lead-ads-testing"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#1877f2',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Open Meta Lead Ads Testing Tool <FiExternalLink />
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaAdsModal;
