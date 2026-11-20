import { useState, useEffect } from 'react';
import {
  FiCheck,
  FiRotateCcw,
  FiImage,
  FiEye,
  FiLayers,
  FiFileText,
  FiCreditCard,
  FiGlobe,
} from 'react-icons/fi';
import { useBranding } from '../../context/BrandingContext';
import './BrandingSettings.css';

const COLOR_PRESETS = [
  { name: 'Royal Indigo', hex: '#6366f1' },
  { name: 'Deep Sapphire', hex: '#1d4ed8' },
  { name: 'Emerald Forest', hex: '#059669' },
  { name: 'Ocean Teal', hex: '#0d9488' },
  { name: 'Crimson Ruby', hex: '#e11d48' },
  { name: 'Sunset Amber', hex: '#d97706' },
  { name: 'Midnight Violet', hex: '#7c3aed' },
  { name: 'Slate Executive', hex: '#334155' },
];

const BrandingSettings = () => {
  const { branding, updateBranding, resetBranding, loading } = useBranding();

  const [formData, setFormData] = useState({
    brandColor: '#6366f1',
    accentColor: '#8b5cf6',
    logo: '',
    favicon: '',
    companyDisplayName: 'Radhix CRM',
    tagline: 'Modern Unified Sales & Business Management Platform',
    supportEmail: 'support@radhix.com',
    supportPhone: '+91 98765 43210',
    customDomain: '',
    companyName: '',
    gstin: '',
    upiId: '',
    upiName: '',
    invoiceHeaderNote: 'Thank you for your business! We appreciate your partnership.',
    invoiceFooterTerms: 'Payment is due within 15 days of invoice date. All disputes subject to local jurisdiction.',
    signatureUrl: '',
  });

  const [activeTab, setActiveTab] = useState('theme');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (branding) {
      setFormData(prev => ({
        ...prev,
        ...branding,
      }));
    }
  }, [branding]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (hex) => {
    setFormData(prev => ({ ...prev, brandColor: hex }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSaveSuccess(false);

    const result = await updateBranding(formData);
    if (result.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } else {
      setErrorMessage(result.message || 'Failed to save branding settings');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all branding settings to default Radhix theme?')) {
      const result = await resetBranding();
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    }
  };

  return (
    <div className="branding-settings-container">
      {/* Header */}
      <div className="branding-header">
        <div>
          <h2>White-Label &amp; Brand Customization</h2>
          <p>Personalize the CRM theme, company logo, domain settings, and invoice branding</p>
        </div>
        <div className="branding-header-actions">
          <button
            type="button"
            className="btn-reset-theme"
            onClick={handleReset}
            disabled={loading}
          >
            <FiRotateCcw /> Reset Default
          </button>
          <button
            type="button"
            className="btn-save-theme"
            onClick={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: formData.brandColor }}
          >
            {loading ? 'Saving...' : <><FiCheck /> Save &amp; Apply</>}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="branding-alert success">
          <FiCheck /> Branding updated successfully! Theme changes applied live across the CRM.
        </div>
      )}

      {errorMessage && (
        <div className="branding-alert error">
          {errorMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="branding-tabs">
        <button
          className={`branding-tab-btn ${activeTab === 'theme' ? 'active' : ''}`}
          onClick={() => setActiveTab('theme')}
        >
          <FiLayers /> Theme Colors &amp; Styling
        </button>
        <button
          className={`branding-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          <FiImage /> Logo &amp; Identity
        </button>
        <button
          className={`branding-tab-btn ${activeTab === 'invoice' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoice')}
        >
          <FiFileText /> Invoice &amp; Payment Branding
        </button>
        <button
          className={`branding-tab-btn ${activeTab === 'domain' ? 'active' : ''}`}
          onClick={() => setActiveTab('domain')}
        >
          <FiGlobe /> Custom Domain
        </button>
      </div>

      <div className="branding-content-grid">
        {/* Form Column */}
        <div className="branding-form-col">
          <form onSubmit={handleSubmit}>
            {/* TAB 1: THEME & COLOR */}
            {activeTab === 'theme' && (
              <div className="settings-section">
                <h3>Primary Theme Color</h3>
                <p className="section-hint">Select a curated palette or enter your exact brand hex color.</p>

                <div className="color-presets-grid">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      className={`preset-swatch ${formData.brandColor.toLowerCase() === preset.hex.toLowerCase() ? 'active' : ''}`}
                      style={{ backgroundColor: preset.hex }}
                      onClick={() => handleColorSelect(preset.hex)}
                      title={preset.name}
                    >
                      {formData.brandColor.toLowerCase() === preset.hex.toLowerCase() && <FiCheck color="#fff" />}
                    </button>
                  ))}
                </div>

                <div className="custom-color-picker-row">
                  <label>Custom Hex Color:</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      name="brandColorPicker"
                      value={formData.brandColor}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="native-color-picker"
                    />
                    <input
                      type="text"
                      name="brandColor"
                      value={formData.brandColor}
                      onChange={handleChange}
                      placeholder="#6366f1"
                      className="hex-text-input"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label>Accent / Highlight Color</label>
                  <input
                    type="text"
                    name="accentColor"
                    value={formData.accentColor}
                    onChange={handleChange}
                    placeholder="#8b5cf6"
                    className="form-control"
                  />
                  <small>Used for subtle badge backgrounds, focus states, and secondary gradients.</small>
                </div>
              </div>
            )}

            {/* TAB 2: IDENTITY */}
            {activeTab === 'identity' && (
              <div className="settings-section">
                <h3>Brand Identity &amp; Assets</h3>
                <p className="section-hint">These details appear on your login screen, sidebar header, and browser tabs.</p>

                <div className="form-group">
                  <label>Company Display Name *</label>
                  <input
                    type="text"
                    name="companyDisplayName"
                    value={formData.companyDisplayName}
                    onChange={handleChange}
                    placeholder="e.g. Acme Corp / Radhix Technologies"
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Tagline / Motto</label>
                  <input
                    type="text"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="e.g. Empowering Enterprise Growth"
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Custom Logo Image URL</label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleChange}
                    placeholder="https://example.com/logo.png"
                    className="form-control"
                  />
                  <small>Recommended: Transparent PNG or SVG, minimum height 40px.</small>
                </div>

                <div className="form-group">
                  <label>Custom Browser Favicon URL</label>
                  <input
                    type="url"
                    name="favicon"
                    value={formData.favicon}
                    onChange={handleChange}
                    placeholder="https://example.com/favicon.ico"
                    className="form-control"
                  />
                  <small>Appears in the browser tab icon next to your company title.</small>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Support Email</label>
                    <input
                      type="email"
                      name="supportEmail"
                      value={formData.supportEmail}
                      onChange={handleChange}
                      placeholder="support@yourcompany.com"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>Support Phone / WhatsApp</label>
                    <input
                      type="text"
                      name="supportPhone"
                      value={formData.supportPhone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="form-control"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: INVOICE & PAYMENTS */}
            {activeTab === 'invoice' && (
              <div className="settings-section">
                <h3>Invoice, Receipt &amp; Quotation Styling</h3>
                <p className="section-hint">Customize what your clients see when downloading invoices and fee receipts.</p>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Legal Company / Billing Name</label>
                    <input
                      type="text"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      placeholder="e.g. Radhix Technologies Pvt Ltd"
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label>GSTIN / Tax Registration No.</label>
                    <input
                      type="text"
                      name="gstin"
                      value={formData.gstin}
                      onChange={handleChange}
                      placeholder="e.g. 29AAAAA0000A1Z5"
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>UPI ID (VPA for QR Code)</label>
                    <input
                      type="text"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="e.g. yourcompany@okaxis"
                      className="form-control"
                    />
                    <small>Used for instant NPCI dynamic QR code generation.</small>
                  </div>
                  <div className="form-group">
                    <label>UPI Payee Display Name</label>
                    <input
                      type="text"
                      name="upiName"
                      value={formData.upiName}
                      onChange={handleChange}
                      placeholder="e.g. Your Company Name"
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Invoice Header Note</label>
                  <input
                    type="text"
                    name="invoiceHeaderNote"
                    value={formData.invoiceHeaderNote}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Thank you for your business!"
                  />
                </div>

                <div className="form-group">
                  <label>Invoice Terms &amp; Conditions / Footer</label>
                  <textarea
                    rows={3}
                    name="invoiceFooterTerms"
                    value={formData.invoiceFooterTerms}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Payment is due within 15 days..."
                  />
                </div>

                <div className="form-group">
                  <label>Authorized Signatory / Stamp Image URL</label>
                  <input
                    type="url"
                    name="signatureUrl"
                    value={formData.signatureUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/signature-stamp.png"
                    className="form-control"
                  />
                  <small>Appears in the bottom-right of generated PDF invoices and quotations.</small>
                </div>
              </div>
            )}

            {/* TAB 4: DOMAIN */}
            {activeTab === 'domain' && (
              <div className="settings-section">
                <h3>Custom CNAME &amp; White-Label Domain</h3>
                <p className="section-hint">Point your custom domain (e.g. `crm.yourbrand.com`) to this application.</p>

                <div className="form-group">
                  <label>Custom CNAME Domain</label>
                  <input
                    type="text"
                    name="customDomain"
                    value={formData.customDomain}
                    onChange={handleChange}
                    placeholder="crm.yourbrand.com"
                    className="form-control"
                  />
                  <small>Create a CNAME record in your DNS provider pointing to `app.radhixcrm.com`.</small>
                </div>

                <div className="cname-info-box">
                  <div className="cname-row">
                    <span>Record Type:</span>
                    <strong>CNAME</strong>
                  </div>
                  <div className="cname-row">
                    <span>Host / Subdomain:</span>
                    <strong>{formData.customDomain || 'crm.yourcompany.com'}</strong>
                  </div>
                  <div className="cname-row">
                    <span>Target Destination:</span>
                    <strong>app.radhixcrm.com</strong>
                  </div>
                  <div className="cname-row">
                    <span>SSL Certificate:</span>
                    <strong style={{ color: '#10b981' }}>Automatic Let&apos;s Encrypt Wildcard</strong>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Live Interactive Preview Column */}
        <div className="branding-preview-col">
          <div className="preview-card">
            <div className="preview-header">
              <FiEye />
              <span>Live White-Label Preview</span>
            </div>

            {/* Sidebar Header Preview */}
            <div className="preview-sidebar-box">
              <div className="preview-brand-row">
                {formData.logo ? (
                  <img src={formData.logo} alt="Brand Logo" className="preview-logo-img" />
                ) : (
                  <div className="preview-logo-fallback" style={{ backgroundColor: formData.brandColor }}>
                    {(formData.companyDisplayName || 'R').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="preview-brand-name">{formData.companyDisplayName || 'Your Company CRM'}</div>
                  <div className="preview-brand-tagline">{formData.tagline || 'Business Platform'}</div>
                </div>
              </div>

              <div className="preview-nav-mockup">
                <div className="preview-nav-item active" style={{ color: formData.brandColor, background: `${formData.brandColor}15` }}>
                  <span className="dot" style={{ backgroundColor: formData.brandColor }}></span>
                  Sales Dashboard
                </div>
                <div className="preview-nav-item">Leads &amp; Pipeline</div>
                <div className="preview-nav-item">Invoices &amp; Billing</div>
              </div>
            </div>

            {/* UI Button & Badge Preview */}
            <div className="preview-elements-box">
              <h5>Branded Buttons &amp; Badges</h5>
              <div className="preview-button-row">
                <button
                  type="button"
                  className="preview-btn-sample"
                  style={{ backgroundColor: formData.brandColor }}
                >
                  Action Button
                </button>
                <span
                  className="preview-badge-sample"
                  style={{ color: formData.brandColor, borderColor: formData.brandColor }}
                >
                  Active Plan
                </span>
              </div>
            </div>

            {/* Invoice Header Preview */}
            <div className="preview-invoice-box">
              <div className="preview-invoice-top">
                <div>
                  <h4 style={{ color: formData.brandColor }}>INVOICE</h4>
                  <small>#INV-2026-089</small>
                </div>
                <div className="text-right">
                  <strong>{formData.companyName || formData.companyDisplayName || 'Your Company'}</strong>
                  {formData.gstin && <div style={{ fontSize: '10px' }}>GST: {formData.gstin}</div>}
                </div>
              </div>
              <div className="preview-invoice-note">
                &ldquo;{formData.invoiceHeaderNote}&rdquo;
              </div>
              {formData.upiId && (
                <div className="preview-upi-strip">
                  <FiCreditCard /> UPI Payee: <strong>{formData.upiId}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingSettings;

