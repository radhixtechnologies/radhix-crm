import { useState, useEffect } from 'react';
import { FiEdit, FiX, FiSave, FiAlertCircle } from 'react-icons/fi';
import Modal from '../common/Modal';
import '../../styles/forms.css';

/**
 * Edit Leave Balance Modal Component
 * Allows Admin/SuperAdmin to manually edit leave balance for employees
 */
const EditLeaveBalanceModal = ({ isOpen, onClose, employee, leaveBalance, onSave, year }) => {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (leaveBalance && leaveBalance.balances) {
      const initialData = {};
      Object.keys(leaveBalance.balances).forEach(type => {
        initialData[type] = {
          total: leaveBalance.balances[type].total || 0,
          used: leaveBalance.balances[type].used || 0,
        };
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [leaveBalance, isOpen]);

  const handleChange = (leaveType, field, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [leaveType]: {
        ...prev[leaveType],
        [field]: numValue,
      },
    }));

    // Validate: used cannot exceed total
    if (field === 'used' && numValue > (prev[leaveType]?.total || 0)) {
      setErrors(prev => ({
        ...prev,
        [leaveType]: 'Used days cannot exceed total days',
      }));
    } else if (field === 'total' && numValue < (prev[leaveType]?.used || 0)) {
      setErrors(prev => ({
        ...prev,
        [leaveType]: 'Total days cannot be less than used days',
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[leaveType];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for errors
    if (Object.keys(errors).length > 0) {
      alert('Please fix the errors before saving');
      return;
    }

    setLoading(true);
    try {
      const updateData = {};
      Object.keys(formData).forEach(type => {
        updateData[type] = formData[type].total;
      });
      
      await onSave(updateData);
      onClose();
    } catch (error) {
      console.error('Error updating leave balance:', error);
      alert(error.response?.data?.message || 'Failed to update leave balance');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !leaveBalance) return null;

  const leaveTypes = ['casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Leave Balance" size="large">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            padding: '12px', 
            background: 'var(--info-light)', 
            borderRadius: '8px', 
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: 'var(--info-text)'
          }}>
            <FiAlertCircle />
            <span>
              Editing leave balance for <strong>{employee?.user?.name || employee?.employeeId}</strong> ({year})
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {leaveTypes.map(type => {
            const balance = formData[type] || { total: 0, used: 0 };
            const available = balance.total - balance.used;
            const hasError = errors[type];

            return (
              <div 
                key={type}
                style={{
                  padding: '20px',
                  border: hasError ? '2px solid var(--error)' : '1px solid var(--border)',
                  borderRadius: '12px',
                  background: 'var(--surface)',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ 
                    margin: 0, 
                    textTransform: 'capitalize', 
                    fontSize: '16px', 
                    fontWeight: 600 
                  }}>
                    {type} Leave
                  </h4>
                  {hasError && (
                    <span style={{ color: 'var(--error)', fontSize: '13px' }}>
                      {errors[type]}
                    </span>
                  )}
                </div>

                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '16px' 
                }}>
                  <div>
                    <label className="form-label">
                      Total Days
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      value={balance.total}
                      onChange={(e) => handleChange(type, 'total', e.target.value)}
                      style={{ borderColor: hasError ? 'var(--error)' : undefined }}
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Used Days
                    </label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max={balance.total}
                      value={balance.used}
                      onChange={(e) => handleChange(type, 'used', e.target.value)}
                      style={{ borderColor: hasError ? 'var(--error)' : undefined }}
                    />
                  </div>
                </div>

                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: 'var(--success-light)', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Available:
                  </span>
                  <strong style={{ fontSize: '16px', color: 'var(--success)' }}>
                    {available} days
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid var(--border)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            <FiX /> Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || Object.keys(errors).length > 0}
          >
            <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EditLeaveBalanceModal;

