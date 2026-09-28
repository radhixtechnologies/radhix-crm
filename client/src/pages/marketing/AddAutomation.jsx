import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiSave, FiZap } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import Loader from '../../components/common/Loader';
import '../../styles/marketing/automation.css';

const defaultForm = {
  name: '',
  description: '',
  status: 'draft',
  triggerType: 'lead_created',
  actionType: 'email',
  segment: '',
  actionTarget: '',
};

const AddAutomation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [segments, setSegments] = useState([]);
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchSegments();
  }, []);

  const fetchSegments = async () => {
    try {
      setLoading(true);
      const res = await marketingService.getSegments({});
      if (res.data?.success) {
        setSegments(res.data.data?.segments || []);
      }
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert('Automation name is required.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
        trigger: {
          type: form.triggerType,
          source: 'manual',
        },
        filters: {
          segments: form.segment ? [form.segment] : [],
        },
        actions: [
          {
            type: form.actionType,
            target: form.actionTarget || 'default',
          },
        ],
        metrics: {
          totalExecutions: 0,
        },
      };

      const response = await marketingService.createAutomation(payload);
      if (response.data?.success) {
        alert('Automation created successfully.');
        navigate('/marketing/automations');
      } else {
        alert(response.data?.message || 'Failed to create automation.');
      }
    } catch (error) {
      console.error('Error creating automation:', error);
      alert(error.response?.data?.error?.message || error.response?.data?.message || 'Failed to create automation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-email-page">
      <div className="email-page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/marketing/automations')}>
            <FiArrowLeft /> Back
          </button>
          <h1 className="page-title">Create Automation</h1>
        </div>
        <div className="action-buttons">
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            <FiSave /> Save Automation
          </button>
        </div>
      </div>

      {loading && !segments.length ? (
        <Loader />
      ) : (
        <form className="layout-grid" onSubmit={handleSubmit}>
          <div className="left-col" style={{ maxWidth: '900px' }}>
            <div className="form-card">
              <div className="card-header">
                <div className="card-icon"><FiZap /></div>
                <h2 className="card-title">Automation Details</h2>
              </div>

              <div className="row-2">
                <div className="form-group">
                  <label className="label">Automation Name</label>
                  <input
                    className="form-input"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Welcome workflow"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  className="form-textarea"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe what this automation should do"
                />
              </div>

              <div className="row-2">
                <div className="form-group">
                  <label className="label">Trigger</label>
                  <select className="form-select" name="triggerType" value={form.triggerType} onChange={handleChange}>
                    <option value="lead_created">Lead Created</option>
                    <option value="lead_status_changed">Lead Status Changed</option>
                    <option value="contact_created">Contact Created</option>
                    <option value="email_opened">Email Opened</option>
                    <option value="campaign_joined">Campaign Joined</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Action</label>
                  <select className="form-select" name="actionType" value={form.actionType} onChange={handleChange}>
                    <option value="email">Send Email</option>
                    <option value="tag">Apply Tag</option>
                    <option value="task">Create Task</option>
                  </select>
                </div>
              </div>

              <div className="row-2">
                <div className="form-group">
                  <label className="label">Target Segment</label>
                  <select className="form-select" name="segment" value={form.segment} onChange={handleChange}>
                    <option value="">All segments</option>
                    {segments.map(segment => (
                      <option key={segment._id} value={segment._id}>{segment.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Action Target</label>
                  <input
                    className="form-input"
                    name="actionTarget"
                    value={form.actionTarget}
                    onChange={handleChange}
                    placeholder="welcome-email / follow-up / sales-task"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default AddAutomation;
