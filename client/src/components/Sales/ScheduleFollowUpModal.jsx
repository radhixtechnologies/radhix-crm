import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { employeeService } from '../../services/employeeService';
import Modal from '../common/Modal';

const ScheduleFollowUpModal = ({ isOpen, onClose, onSuccess, prefilledData = {} }) => {
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

    // Initialize form data when modal opens with prefilled data
    useEffect(() => {
        if (isOpen) {
            setFormData({
                type: prefilledData.type || 'lead',
                relatedId: prefilledData.relatedId || '',
                title: '',
                description: '',
                scheduledDate: '',
                scheduledTime: '',
                typeOfFollowUp: 'call',
                assignedTo: '',
            });
            setErrors({});
        }
    }, [isOpen, prefilledData.type, prefilledData.relatedId]);

    // Fetch employees for assignment
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

    // Fetch entities based on type
    useEffect(() => {
        const fetchEntities = async () => {
            try {
                let res;
                if (formData.type === 'lead') {
                    res = await salesService.getLeads({ limit: 100 });
                } else if (formData.type === 'client') {
                    res = await salesService.getClients({ limit: 100 });
                } else if (formData.type === 'deal') {
                    res = await salesService.getDeals({ limit: 100 });
                }

                if (res?.data?.success) {
                    setEntities(res.data.data || []);
                }
            } catch (error) {
                console.error('Error fetching entities:', error);
                setEntities([]);
            }
        };

        if (isOpen && formData.type) {
            fetchEntities();
        }
    }, [isOpen, formData.type]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
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

        if (!validate()) return;

        setLoading(true);
        try {
            await salesService.scheduleFollowUp(formData);
            onSuccess?.();
            onClose();
            // Reset form
            setFormData({
                type: 'lead',
                relatedId: '',
                title: '',
                description: '',
                scheduledDate: '',
                scheduledTime: '',
                typeOfFollowUp: 'call',
                assignedTo: '',
            });
        } catch (error) {
            console.error('Error scheduling follow-up:', error);
            alert(error.response?.data?.message || 'Failed to schedule follow-up');
        } finally {
            setLoading(false);
        }
    };

    const getEntityName = (entity) => {
        if (formData.type === 'deal') {
            return entity.title || entity.name;
        }
        return entity.name;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Schedule Follow-up">
            <form onSubmit={handleSubmit} className="followup-form">
                {/* Type Selection */}
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

                {/* Related Entity */}
                <div className="form-group">
                    <label>Related {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} *</label>
                    <select
                        name="relatedId"
                        value={formData.relatedId}
                        onChange={handleChange}
                        className={errors.relatedId ? 'error' : ''}
                    >
                        <option value="">Select {formData.type}</option>
                        {entities.map(entity => (
                            <option key={entity._id} value={entity._id}>
                                {getEntityName(entity)}
                            </option>
                        ))}
                    </select>
                    {errors.relatedId && <span className="error-message">{errors.relatedId}</span>}
                </div>

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
                        {loading ? 'Scheduling...' : 'Schedule Follow-up'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleFollowUpModal;
