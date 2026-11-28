import { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiPhone, FiUser } from 'react-icons/fi';
import dayjs from 'dayjs';
import { salesService } from '../../services/salesService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../common/Modal';

const ScheduleFollowUpModal = ({ isOpen, onClose, onSuccess, prefilledData = {} }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    type: prefilledData.type || 'lead',
    relatedId: prefilledData.relatedId || '',
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    typeOfFollowUp: 'call',
    assignedTo: '',
  });

  const [employees, setEmployees] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const getEmployeeLabel = (employee) => {
    if (!employee) return 'Unassigned';
    const name = employee.user?.name || employee.employeeId || 'Unknown Employee';
    return employee.department ? `${name} (${employee.department})` : name;
  };

  useEffect(() => {
    if (isOpen) {
      setSubmitError('');
      setFormData({
        type: prefilledData.type || 'lead',
        relatedId: prefilledData.relatedId || '',
        title: prefilledData.title || '',
        description: prefilledData.description || '',
        scheduledDate: prefilledData.scheduledDate || '',
        scheduledTime: prefilledData.scheduledTime || '',
        typeOfFollowUp: prefilledData.typeOfFollowUp || 'call',
        assignedTo: prefilledData.assignedTo || '',
      });
      setErrors({});
    }
  }, [
    isOpen,
    prefilledData.type,
    prefilledData.relatedId,
    prefilledData.title,
    prefilledData.description,
    prefilledData.scheduledDate,
    prefilledData.scheduledTime,
    prefilledData.typeOfFollowUp,
    prefilledData.assignedTo,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    employeeService.getEmployees({ limit: 200 })
      .then((res) => {
        if (!cancelled && res.data?.success) {
          setEmployees(res.data.data || []);
        }
      })
      .catch((error) => {
        console.error('Error fetching employees:', error);
      });
    return () => { cancelled = true; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.type) return;
    let cancelled = false;
    const fetchEntities = async () => {
      try {
        let res;
        if (formData.type === 'lead') {
          res = await salesService.getLeads({ limit: 200 });
        } else if (formData.type === 'client') {
          res = await salesService.getClients({ limit: 200 });
        } else if (formData.type === 'deal') {
          res = await salesService.getDeals({ limit: 200 });
        }
        if (!cancelled && res?.data?.success) {
          setEntities(res.data.data || []);
        }
      } catch (error) {
        console.error('Error fetching entities:', error);
        if (!cancelled) setEntities([]);
      }
    };
    fetchEntities();
    return () => { cancelled = true; };
  }, [isOpen, formData.type]);

  // Auto-default assignedTo from selected Lead owner or current user's employee profile
  useEffect(() => {
    if (!isOpen || formData.assignedTo || employees.length === 0) return;

    const selectedEntity = entities.find((e) => e._id === formData.relatedId);
    const ownerId = selectedEntity?.assignedTo?._id || selectedEntity?.assignedTo;
    if (ownerId && employees.some((emp) => emp._id === ownerId)) {
      setFormData((prev) => ({
        ...prev,
        assignedTo: ownerId,
        title: prev.title || (selectedEntity?.name ? `Follow-up: ${selectedEntity.name}` : prev.title),
      }));
      return;
    }

    const currentUserId = user?._id || user?.id;
    const selfEmp = employees.find((emp) => String(emp.user?._id || emp.user) === String(currentUserId));
    if (selfEmp) {
      setFormData((prev) => ({ ...prev, assignedTo: selfEmp._id }));
    }
  }, [isOpen, formData.relatedId, formData.assignedTo, entities, employees, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'type') {
        next.relatedId = '';
      }
      if (name === 'relatedId' && value) {
        const picked = entities.find((item) => item._id === value);
        if (picked) {
          const pickedOwner = picked.assignedTo?._id || picked.assignedTo;
          if (pickedOwner) next.assignedTo = pickedOwner;
          if (!prev.title.trim()) {
            const label = picked.name || picked.title || '';
            if (label) next.title = `Follow-up: ${label}`;
          }
        }
      }
      return next;
    });
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const applyDatePreset = (days, time = '11:00') => {
    setFormData((prev) => ({
      ...prev,
      scheduledDate: dayjs().add(days, 'day').format('YYYY-MM-DD'),
      scheduledTime: time,
    }));
    if (errors.scheduledDate) setErrors((prev) => ({ ...prev, scheduledDate: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.type) newErrors.type = 'Type is required';
    if (!formData.relatedId) newErrors.relatedId = 'Please select a related entity';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Date is required';
    if (!formData.assignedTo) newErrors.assignedTo = 'Please assign to an employee';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await salesService.scheduleFollowUp(formData);
      await onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      setSubmitError(error.response?.data?.message || 'Failed to schedule follow-up');
    } finally {
      setLoading(false);
    }
  };

  const getEntityName = (entity) => {
    if (formData.type === 'deal') return entity.title || entity.name;
    return entity.company ? `${entity.name} (${entity.company})` : entity.name;
  };

  const selectedEntity = entities.find((e) => e._id === formData.relatedId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Schedule Follow-up">
      <form onSubmit={handleSubmit} className="followup-form">
        {submitError && (
          <div className="alert alert-error" role="alert" style={{ marginBottom: 0 }}>
            {submitError}
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label>Type *</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={errors.type ? 'error' : ''}
            >
              <option value="lead">Lead</option>
              <option value="client">Client</option>
              <option value="deal">Deal</option>
            </select>
            {errors.type && <span className="error-message">{errors.type}</span>}
          </div>

          <div className="form-group">
            <label>Follow-up Mode</label>
            <select
              name="typeOfFollowUp"
              value={formData.typeOfFollowUp}
              onChange={handleChange}
            >
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
              <option value="task">Task</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Related {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} *</label>
          <select
            name="relatedId"
            value={formData.relatedId}
            onChange={handleChange}
            className={errors.relatedId ? 'error' : ''}
          >
            <option value="">Select {formData.type}</option>
            {entities.map((entity) => (
              <option key={entity._id} value={entity._id}>
                {getEntityName(entity)}
              </option>
            ))}
          </select>
          {errors.relatedId && <span className="error-message">{errors.relatedId}</span>}
          {selectedEntity && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', marginTop: '4px' }}>
              {selectedEntity.phone && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiPhone size={12} /> {selectedEntity.phone}
                </span>
              )}
              {selectedEntity.assignedTo && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FiUser size={12} /> Lead Owner: {selectedEntity.assignedTo?.user?.name || selectedEntity.assignedTo?.employeeId}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Title *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Follow up on proposal discussion"
            className={errors.title ? 'error' : ''}
          />
          {errors.title && <span className="error-message">{errors.title}</span>}
        </div>

        <div className="form-group">
          <label>Client Remark / Discussion Context</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Client asked to call back regarding..."
            rows="3"
          />
        </div>

        <div className="form-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
            <label style={{ margin: 0 }}>Next Call Date &amp; Time *</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => applyDatePreset(0, '17:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Today 5 PM</button>
              <button type="button" onClick={() => applyDatePreset(1, '11:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Tomorrow 11 AM</button>
              <button type="button" onClick={() => applyDatePreset(3, '11:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>+3 Days</button>
              <button type="button" onClick={() => applyDatePreset(7, '11:00')} style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>Next Week</button>
            </div>
          </div>
          <div className="form-row">
            <div>
              <div className="input-with-icon">
                <FiCalendar />
                <input
                  type="date"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  className={errors.scheduledDate ? 'error' : ''}
                  style={{ width: '100%' }}
                />
              </div>
              {errors.scheduledDate && <span className="error-message">{errors.scheduledDate}</span>}
            </div>
            <div className="input-with-icon">
              <FiClock />
              <input
                type="time"
                name="scheduledTime"
                value={formData.scheduledTime}
                onChange={handleChange}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Assign To Employee *</label>
          <select
            name="assignedTo"
            value={formData.assignedTo}
            onChange={handleChange}
            className={errors.assignedTo ? 'error' : ''}
          >
            <option value="">Select employee</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>
                {getEmployeeLabel(emp)}
              </option>
            ))}
          </select>
          {errors.assignedTo && <span className="error-message">{errors.assignedTo}</span>}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Scheduling...' : 'Schedule Follow-up'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleFollowUpModal;
