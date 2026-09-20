import { useState, useEffect } from 'react';
import { FiCalendar, FiClock } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { employeeService } from '../../services/employeeService';
import Modal from '../common/Modal';

const EditFollowUpModal = ({ isOpen, onClose, followup, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledDate: '',
        scheduledTime: '',
        typeOfFollowUp: 'call',
        assignedTo: '',
        status: 'pending',
    });

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-populate form when followup changes
    useEffect(() => {
        if (followup) {
            setFormData({
                title: followup.title || '',
                description: followup.description || '',
                scheduledDate: followup.scheduledDate ? new Date(followup.scheduledDate).toISOString().split('T')[0] : '',
                scheduledTime: followup.scheduledTime || '',
                typeOfFollowUp: followup.typeOfFollowUp || 'call',
                assignedTo: followup.assignedTo?._id || '',
                status: followup.status || 'pending',
            });
        }
    }, [followup]);

    // Fetch employees
    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await employeeService.getEmployees({ limit: 100 });
                if (res.data.success) {
                    setEmployees(res.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching employees:', error);
            }
        };
        if (isOpen) {
            fetchEmployees();
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.scheduledDate) newErrors.scheduledDate = 'Date is required';
        if (!formData.assignedTo) newErrors.assignedTo = 'Please assign to an employee';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            await salesService.updateFollowUp(followup._id, formData);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error updating follow-up:', error);
            alert(error.response?.data?.message || 'Failed to update follow-up');
        } finally {
            setLoading(false);
        }
    };

    if (!followup) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit Follow-up">
            <form onSubmit={handleSubmit} className="followup-form">
                {/* Title */}
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

                {/* Description */}
                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Additional notes or context..."
                        rows="3"
                    />
                </div>

                {/* Date and Time */}
                <div className="form-row">
                    <div className="form-group">
                        <label>Scheduled Date *</label>
                        <div className="input-with-icon">
                            <FiCalendar />
                            <input
                                type="date"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                className={errors.scheduledDate ? 'error' : ''}
                            />
                        </div>
                        {errors.scheduledDate && <span className="error-message">{errors.scheduledDate}</span>}
                    </div>

                    <div className="form-group">
                        <label>Time (Optional)</label>
                        <div className="input-with-icon">
                            <FiClock />
                            <input
                                type="time"
                                name="scheduledTime"
                                value={formData.scheduledTime}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Type of Follow-up */}
                <div className="form-group">
                    <label>Follow-up Type</label>
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

                {/* Assigned To */}
                <div className="form-group">
                    <label>Assign To *</label>
                    <select
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleChange}
                        className={errors.assignedTo ? 'error' : ''}
                    >
                        <option value="">Select employee</option>
                        {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                                {emp.user?.name || emp.employeeId}
                            </option>
                        ))}
                    </select>
                    {errors.assignedTo && <span className="error-message">{errors.assignedTo}</span>}
                </div>

                {/* Status */}
                <div className="form-group">
                    <label>Status</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>

                {/* Actions */}
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
                        {loading ? 'Updating...' : 'Update Follow-up'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default EditFollowUpModal;
