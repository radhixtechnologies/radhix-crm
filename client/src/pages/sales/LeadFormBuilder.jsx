import { useState, useEffect, useCallback } from 'react';
import {
  FiPlus,
  FiCode,
  FiExternalLink,
  FiTrash2,
  FiCopy,
  FiCheck,
  FiLayers,
  FiGlobe,
  FiEye,
  FiCheckCircle,
} from 'react-icons/fi';
import { leadFormService } from '../../services/leadFormService';
import Loader from '../../components/common/Loader';
import './LeadFormBuilder.css';

const LeadFormBuilder = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  // Create form state
  const [newForm, setNewForm] = useState({
    title: '',
    industry: 'Real Estate',
    source: 'Website Form',
    fields: {
      askName: true,
      askEmail: true,
      askPhone: true,
      askBudget: true,
      askMessage: true,
      customQuestion: '',
    },
    themeColor: '#6366f1',
    submitButtonText: 'Submit Inquiry',
    successMessage: 'Thank you! Our advisor will contact you shortly.',
    redirectUrl: '',
  });

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const res = await leadFormService.getForms();
      if (res.data?.data) {
        setForms(res.data.data);
      }
    } catch (err) {
      console.error('Error loading lead forms:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreateForm = async (e) => {
    e.preventDefault();
    if (!newForm.title.trim()) return;

    setSaving(true);
    try {
      await leadFormService.createForm(newForm);
      setNotice('Lead capture form created successfully!');
      setShowCreateModal(false);
      setNewForm({
        title: '',
        industry: 'Real Estate',
        source: 'Website Form',
        fields: {
          askName: true,
          askEmail: true,
          askPhone: true,
          askBudget: true,
          askMessage: true,
          customQuestion: '',
        },
        themeColor: '#6366f1',
        submitButtonText: 'Submit Inquiry',
        successMessage: 'Thank you! Our advisor will contact you shortly.',
        redirectUrl: '',
      });
      await fetchForms();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create lead form');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lead form?')) return;
    try {
      await leadFormService.deleteForm(id);
      setForms((prev) => prev.filter((f) => f._id !== id));
    } catch (err) {
      alert('Failed to delete form');
    }
  };

  const getFormUrl = (id) => `${window.location.origin}/forms/${id}`;

  const getEmbedCode = (id) =>
    `<iframe src="${getFormUrl(id)}" width="100%" height="560" frameborder="0" style="border:none;border-radius:12px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);"></iframe>`;

  const totalSubmissions = forms.reduce((sum, f) => sum + (f.submissionsCount || 0), 0);

  return (
    <div className="form-builder-page animate-fade-in">
      {notice && (
        <div className="builder-notice">
          <FiCheckCircle />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')}>✕</button>
        </div>
      )}

      {/* HEADER BANNER */}
      <div className="builder-header-banner">
        <div>
          <span className="builder-badge">Lead Generation Tools</span>
          <h1>Embeddable Web Lead Forms</h1>
          <p>
            Generate no-code forms to capture leads directly from your WordPress, Shopify, or custom
            websites straight into Radhix CRM pipeline.
          </p>
        </div>
        <button
          type="button"
          className="btn-create-form"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus />
          <span>Create Capture Form</span>
        </button>
      </div>

      {/* STATS STRIP */}
      <div className="builder-stats-strip">
        <div className="stat-box">
          <span className="stat-label">Active Lead Forms</span>
          <h2>{forms.length}</h2>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-label">Total Leads Captured</span>
          <h2>{totalSubmissions}</h2>
        </div>
        <div className="stat-divider" />
        <div className="stat-box">
          <span className="stat-label">Direct Integration</span>
          <h2>100% Instant</h2>
        </div>
      </div>

      {/* FORMS LIST */}
      {loading ? (
        <div className="builder-loading">
          <Loader />
          <p>Loading your lead forms...</p>
        </div>
      ) : forms.length > 0 ? (
        <div className="forms-cards-grid">
          {forms.map((form) => (
            <div key={form._id} className="form-item-card">
              <div className="form-item-header">
                <span
                  className="form-industry-badge"
                  style={{ borderColor: form.themeColor, color: form.themeColor }}
                >
                  {form.industry}
                </span>
                <span className="form-submissions-count">
                  <strong>{form.submissionsCount || 0}</strong> inquiries
                </span>
              </div>

              <h3 className="form-item-title">{form.title}</h3>
              <p className="form-item-meta">
                Source tag: <strong>{form.source}</strong> • Created{' '}
                {new Date(form.createdAt).toLocaleDateString()}
              </p>

              <div className="form-actions-row">
                <button
                  type="button"
                  className="btn-embed"
                  onClick={() => setShowEmbedModal(form)}
                  title="Get Embed Code & Link"
                >
                  <FiCode />
                  <span>Embed Code</span>
                </button>

                <a
                  href={getFormUrl(form._id)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-preview"
                  title="Open live preview"
                >
                  <FiEye />
                  <span>Preview</span>
                  <FiExternalLink />
                </a>

                <button
                  type="button"
                  className="btn-delete-form"
                  onClick={() => handleDelete(form._id)}
                  title="Delete form"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="builder-empty-state">
          <FiGlobe className="empty-icon" />
          <h3>No Lead Capture Forms Yet</h3>
          <p>
            Create your first form to embed on your website and capture visitors directly into your
            CRM pipeline without any manual data entry.
          </p>
          <button
            type="button"
            className="btn-create-form"
            onClick={() => setShowCreateModal(true)}
          >
            <FiPlus />
            <span>Create Your First Form</span>
          </button>
        </div>
      )}

      {/* CREATE FORM MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-container animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Lead Capture Form</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateForm} className="create-form-body">
              <div className="form-group">
                <label>Form Name / Campaign Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Website Contact Us Form, Villa Booking Form"
                  value={newForm.title}
                  onChange={(e) => setNewForm({ ...newForm, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Industry Vertical</label>
                  <select
                    value={newForm.industry}
                    onChange={(e) => setNewForm({ ...newForm, industry: e.target.value })}
                  >
                    <option value="Real Estate">Real Estate</option>
                    <option value="Education">Education & Coaching</option>
                    <option value="Healthcare">Healthcare & Clinic</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Travel">Travel & Tourism</option>
                    <option value="Restaurant">Restaurant & Cafe</option>
                    <option value="Salon">Salon & Wellness</option>
                    <option value="Gym">Gym & Fitness</option>
                    <option value="Retail">Retail & E-commerce</option>
                    <option value="General">General Business</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Lead Source Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Website, Facebook Ads, Landing Page"
                    value={newForm.source}
                    onChange={(e) => setNewForm({ ...newForm, source: e.target.value })}
                  />
                </div>
              </div>

              <div className="fields-toggle-box">
                <label className="section-subtitle">Include Fields in Form:</label>
                <div className="toggles-grid">
                  <label className="toggle-label">
                    <input type="checkbox" checked disabled />
                    <span>Full Name (Mandatory)</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newForm.fields.askPhone}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          fields: { ...newForm.fields, askPhone: e.target.checked },
                        })
                      }
                    />
                    <span>Phone / WhatsApp</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newForm.fields.askEmail}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          fields: { ...newForm.fields, askEmail: e.target.checked },
                        })
                      }
                    />
                    <span>Email Address</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newForm.fields.askBudget}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          fields: { ...newForm.fields, askBudget: e.target.checked },
                        })
                      }
                    />
                    <span>Estimated Budget</span>
                  </label>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      checked={newForm.fields.askMessage}
                      onChange={(e) =>
                        setNewForm({
                          ...newForm,
                          fields: { ...newForm.fields, askMessage: e.target.checked },
                        })
                      }
                    />
                    <span>Message / Requirement</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Custom Question (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Which city are you currently located in?"
                  value={newForm.fields.customQuestion}
                  onChange={(e) =>
                    setNewForm({
                      ...newForm,
                      fields: { ...newForm.fields, customQuestion: e.target.value },
                    })
                  }
                />
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Submit Button Text</label>
                  <input
                    type="text"
                    value={newForm.submitButtonText}
                    onChange={(e) => setNewForm({ ...newForm, submitButtonText: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Theme Accent Color</label>
                  <input
                    type="color"
                    value={newForm.themeColor}
                    onChange={(e) => setNewForm({ ...newForm, themeColor: e.target.value })}
                    className="color-picker"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Form & Generate Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMBED CODE MODAL */}
      {showEmbedModal && (
        <div className="modal-overlay" onClick={() => setShowEmbedModal(null)}>
          <div className="modal-container embed-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Embed Code & Share Link</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowEmbedModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="embed-modal-body">
              <div className="embed-section">
                <label>1. Direct Share Link (For WhatsApp / Social Bio / SMS)</label>
                <div className="copy-box">
                  <input
                    type="text"
                    readOnly
                    value={getFormUrl(showEmbedModal._id)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(getFormUrl(showEmbedModal._id));
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                  >
                    {copiedLink ? <FiCheck /> : <FiCopy />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="embed-section">
                <label>2. HTML Iframe Embed Code (For WordPress, Wix, Webflow, Custom HTML)</label>
                <textarea
                  rows={3}
                  readOnly
                  value={getEmbedCode(showEmbedModal._id)}
                />
                <button
                  type="button"
                  className="btn-copy-embed"
                  onClick={() => {
                    navigator.clipboard.writeText(getEmbedCode(showEmbedModal._id));
                    setCopiedEmbed(true);
                    setTimeout(() => setCopiedEmbed(false), 2000);
                  }}
                >
                  {copiedEmbed ? <FiCheck /> : <FiCopy />}
                  <span>{copiedEmbed ? 'Copied Iframe Code' : 'Copy Iframe Code'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadFormBuilder;

