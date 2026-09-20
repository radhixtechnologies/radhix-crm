import { useEffect, useState } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import { salesService } from '../../services/salesService';
import '../../styles/sales/lead-form.css';

const AddLead = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loadingExisting, setLoadingExisting] = useState(Boolean(id));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    source: 'website',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    salesService
      .getLead(id)
      .then((response) => {
        const lead = response.data?.data;
        if (lead) setForm(lead);
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.message || 'Unable to load lead.');
      })
      .finally(() => setLoadingExisting(false));
  }, [id]);

  const update = (event) =>
    setForm({ ...form, [event.target.name]: event.target.value });

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (id) {
        await salesService.updateLead(id, form);
      } else {
        await salesService.createLead(form);
      }
      navigate('/sales/leads');
    } catch (requestError) {
      setError(requestError.response?.data?.message || `Unable to ${id ? 'update' : 'create'} lead.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingExisting) {
    return <div className="loading-container">Loading lead...</div>;
  }

  return (
    <div className="lead-form-page-wrapper add-lead-page">
      <div className="page-header-compact">
        <div className="header-left">
          <button
            className="btn-back"
            type="button"
            onClick={() => navigate('/sales/leads')}
            aria-label="Back to Leads"
          >
            <FiArrowLeft size={20} />
          </button>
          <div className="header-title-section">
            <h1 className="page-title-compact">
              {id ? 'Edit Lead' : 'Add Lead'}
            </h1>
            <p className="page-subtitle-compact">
              {id ? 'Update sales lead details' : 'Create a new sales lead'}
            </p>
          </div>
        </div>
      </div>

      <div className="lead-form-content">
        <form className="lead-form" onSubmit={submit}>
          {error && <div className="alert alert-warning">{error}</div>}

          <div className="form-grid">
            {[
              { key: 'name', label: 'Name', type: 'text', required: true },
              { key: 'email', label: 'Email', type: 'email', required: true },
              { key: 'phone', label: 'Phone', type: 'tel', required: false },
              { key: 'company', label: 'Company', type: 'text', required: false },
              { key: 'source', label: 'Source', type: 'select', required: false },
            ].map((field) => (
              <div className="form-group" key={field.key}>
                <label htmlFor={field.key}>{field.label}{field.required ? ' *' : ''}</label>

                {field.type === 'select' ? (
                  <select
                    id={field.key}
                    name={field.key}
                    className="form-select"
                    value={form[field.key] || 'website'}
                    onChange={update}
                  >
                    <option value="website">Website</option>
                    <option value="referral">Referral</option>
                    <option value="social-media">Social Media</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="campaign">Campaign</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <input
                    id={field.key}
                    name={field.key}
                    type={field.type}
                    className="form-input"
                    value={form[field.key] || ''}
                    onChange={update}
                    required={field.required}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button className="btn btn-secondary" type="button" onClick={() => navigate('/sales/leads')}>
              Cancel
            </button>
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : id ? 'Update Lead' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLead;
