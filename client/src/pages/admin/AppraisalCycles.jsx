import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { employeeService } from '../../services/employeeService';
import { FiCalendar, FiPlus, FiCheckCircle, FiClock, FiXCircle } from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { formatDate } from '../../utils/format';
import '../../styles/performance.css';

/**
 * Appraisal Cycles Page - Admin View
 * Manage appraisal cycles
 */
const AppraisalCycles = () => {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cycles, setCycles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'quarterly',
    startDate: '',
    endDate: '',
    status: 'draft',
  });

  useEffect(() => {
    fetchCycles();
  }, []);

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const response = await employeeService.getCycles();
      if (response.data.success) {
        setCycles(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      name: '',
      type: 'quarterly',
      startDate: '',
      endDate: '',
      status: 'draft',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date');
      return;
    }

    try {
      await employeeService.createCycle(formData);
      alert('Appraisal cycle created successfully!');
      setShowModal(false);
      fetchCycles();
    } catch (error) {
      console.error('Error creating cycle:', error);
      alert(error.response?.data?.message || 'Error creating cycle');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-secondary', text: 'Draft', icon: FiClock },
      active: { class: 'badge-success', text: 'Active', icon: FiCheckCircle },
      completed: { class: 'badge-info', text: 'Completed', icon: FiCheckCircle },
      cancelled: { class: 'badge-error', text: 'Cancelled', icon: FiXCircle },
    };
    return badges[status] || badges.draft;
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <h1 className="page-title">Access Denied</h1>
          <p className="page-subtitle">You do not have permission to view this page</p>
        </div>
      </div>
    );
  }

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 className="page-title">Appraisal Cycles</h1>
            <p className="page-subtitle">Manage performance appraisal cycles</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreate}>
            <FiPlus /> Create Cycle
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Cycles Grid */}
        {cycles.length > 0 ? (
          <div className="cycles-grid">
            {cycles.map(cycle => {
              const badge = getStatusBadge(cycle.status);
              const BadgeIcon = badge.icon;

              return (
                <div key={cycle._id} className="cycle-card">
                  <div className="cycle-header">
                    <div>
                      <h3 className="cycle-title">{cycle.name}</h3>
                      <p className="cycle-type">{cycle.type.replace('_', '-')}</p>
                    </div>
                    <span className={`badge ${badge.class}`}>
                      <BadgeIcon size={14} style={{ marginRight: '4px' }} />
                      {badge.text}
                    </span>
                  </div>

                  <div className="cycle-dates">
                    <div className="cycle-date-item">
                      <FiCalendar size={16} />
                      <div>
                        <strong>Start:</strong> {formatDate(cycle.startDate)}
                      </div>
                    </div>
                    <div className="cycle-date-item">
                      <FiCalendar size={16} />
                      <div>
                        <strong>End:</strong> {formatDate(cycle.endDate)}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                    Created by: {cycle.createdBy?.name || 'N/A'}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <FiCalendar className="empty-state-icon" />
            <h3 className="empty-state-title">No Appraisal Cycles</h3>
            <p className="empty-state-text">
              No appraisal cycles have been created yet. Create one to get started.
            </p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create Appraisal Cycle"
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Cycle Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Q1 2025 Appraisal"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cycle Type *</label>
              <select
                className="form-select"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                required
              >
                <option value="quarterly">Quarterly</option>
                <option value="half_yearly">Half-Yearly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Create Cycle
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AppraisalCycles;

