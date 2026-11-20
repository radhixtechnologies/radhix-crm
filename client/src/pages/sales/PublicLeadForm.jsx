import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheckCircle, FiSend, FiAlertCircle } from 'react-icons/fi';
import { leadFormService } from '../../services/leadFormService';
import Loader from '../../components/common/Loader';
import './PublicLeadForm.css';

const PublicLeadForm = () => {
  const { id } = useParams();
  const [formConfig, setFormConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    message: '',
    customAnswer: '',
  });

  useEffect(() => {
    const fetchForm = async () => {
      try {
        setLoading(true);
        const res = await leadFormService.getPublicForm(id);
        if (res.data?.data) {
          setFormConfig(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load public form:', err);
        setErrorMsg(err.response?.data?.message || 'Form is not available');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await leadFormService.submitPublicForm(id, formData);
      setSubmitted(true);
      setSuccessMsg(res.data?.message || 'Thank you! Your inquiry has been submitted.');
      if (res.data?.redirectUrl) {
        setTimeout(() => {
          window.location.href = res.data.redirectUrl;
        }, 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-form-wrap loading">
        <Loader />
        <p>Loading form...</p>
      </div>
    );
  }

  if (errorMsg && !formConfig) {
    return (
      <div className="public-form-wrap error-state">
        <FiAlertCircle className="err-icon" />
        <h3>Form Unavailable</h3>
        <p>{errorMsg}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="public-form-wrap success-state animate-fade-in">
        <div className="success-icon-wrap" style={{ color: formConfig?.themeColor || '#10b981' }}>
          <FiCheckCircle />
        </div>
        <h2>Inquiry Received!</h2>
        <p className="success-msg">{successMsg}</p>
        <span className="powered-by">Powered by Radhix Business Cloud</span>
      </div>
    );
  }

  const fields = formConfig?.fields || {};
  const themeColor = formConfig?.themeColor || '#6366f1';

  return (
    <div className="public-form-page">
      <div className="public-form-card animate-fade-in">
        <div className="form-card-header" style={{ borderTopColor: themeColor }}>
          <span className="form-industry-tag">{formConfig?.industry || 'Inquiry'}</span>
          <h2 className="form-title">{formConfig?.title || 'Get in Touch'}</h2>
          <p className="form-desc">
            Please fill in your details below and our team will get in touch shortly.
          </p>
        </div>

        {errorMsg && (
          <div className="form-error-banner">
            <FiAlertCircle />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="public-capture-form">
          {fields.askName && (
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          )}

          <div className="form-row">
            {fields.askPhone && (
              <div className="form-group">
                <label>Phone / WhatsApp *</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required={!fields.askEmail}
                />
              </div>
            )}

            {fields.askEmail && (
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required={!fields.askPhone}
                />
              </div>
            )}
          </div>

          {fields.askBudget && (
            <div className="form-group">
              <label>Estimated Budget (₹)</label>
              <input
                type="number"
                placeholder="e.g. 50000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>
          )}

          {fields.customQuestion && (
            <div className="form-group">
              <label>{fields.customQuestion}</label>
              <input
                type="text"
                placeholder="Your response"
                value={formData.customAnswer}
                onChange={(e) => setFormData({ ...formData, customAnswer: e.target.value })}
              />
            </div>
          )}

          {fields.askMessage && (
            <div className="form-group">
              <label>Requirements or Message</label>
              <textarea
                rows={3}
                placeholder="Tell us what you are looking for..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              />
            </div>
          )}

          <button
            type="submit"
            className="btn-form-submit"
            style={{ backgroundColor: themeColor }}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : formConfig?.submitButtonText || 'Submit Inquiry'}
            <FiSend />
          </button>
        </form>

        <div className="form-card-footer">
          <span>🔒 256-bit encrypted submission</span>
        </div>
      </div>
    </div>
  );
};

export default PublicLeadForm;

