import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import Loader from '../../components/common/Loader';
import '../../styles/sales/lead-form.css';

const AddClient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    status: 'active',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await salesService.createClient(formData);
      navigate('/sales/clients');
    } catch {
      alert('Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="lead-form-page-wrapper">
      {/* Compact Professional Header */}
      <div className="page-header-compact">
        <div className="header-left">
          <button
            className="btn-back"
            onClick={() => navigate('/sales/clients')}
            title="Back to Clients"
            type="button"
          >
            <FiArrowLeft size={20} style={{ strokeWidth: 2.5 }} />
          </button>
          <div className="header-title-section">
            <h1 className="page-title-compact">Create Client</h1>
            <p className="page-subtitle-compact">
              Add a new client to your portfolio
            </p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="lead-form-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <form className="lead-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label>Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Company *</label>
              <input
                type="text"
                className="form-input"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Industry</label>
              <input
                type="text"
                className="form-input"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="prospect">Prospect</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/sales/clients')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Create Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClient;


















