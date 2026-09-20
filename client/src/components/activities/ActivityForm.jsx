import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiBell } from 'react-icons/fi';
import { activityService } from '../../services/activityService';
import { salesService } from '../../services/salesService';
import { contactService } from '../../services/contactService';
import './ActivityForm.css';

const ActivityForm = ({ isOpen, onClose, onActivityCreated, relatedTo, activityToEdit }) => {
    const [formData, setFormData] = useState({
        type: 'call',
        subject: '',
        description: '',
        scheduledAt: '',
        duration: 60,
        priority: 'medium',
        status: 'scheduled',
        relatedTo: relatedTo || { entityType: '', entityId: '' },
        reminder: {
            enabled: true,
            reminderTime: null,
            reminderSent: false
        }
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [leads, setLeads] = useState([]);
    const [contacts, setContacts] = useState([]);

    // Fetch leads and contacts for linking
    useEffect(() => {
        const fetchEntities = async () => {
            try {
                const [leadsRes, contactsRes] = await Promise.all([
                    salesService.getLeads({ limit: 100 }),
                    contactService.getContacts({ limit: 100 })
                ]);
                setLeads(leadsRes.data.data || []);
                setContacts(contactsRes.data.data || []);
            } catch (error) {
                console.error('Error fetching entities:', error);
            }
        };
        if (isOpen && !relatedTo) {
            fetchEntities();
        }
    }, [isOpen, relatedTo]);

    // Populate form when editing
    useEffect(() => {
        if (activityToEdit) {
            const scheduledDate = activityToEdit.scheduledAt ? new Date(activityToEdit.scheduledAt) : null;
            setFormData({
                type: activityToEdit.type || 'call',
                subject: activityToEdit.subject || '',
                description: activityToEdit.description || '',
                scheduledAt: scheduledDate ? scheduledDate.toISOString().slice(0, 16) : '',
                duration: activityToEdit.duration || 60,
                priority: activityToEdit.priority || 'medium',
                status: activityToEdit.status || 'scheduled',
                relatedTo: activityToEdit.relatedTo || { entityType: '', entityId: '' },
                reminder: activityToEdit.reminder || {
                    enabled: true,
                    reminderTime: null,
                    reminderSent: false
                }
            });
        } else if (relatedTo) {
            setFormData(prev => ({ ...prev, relatedTo }));
        }
    }, [activityToEdit, relatedTo]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name.startsWith('relatedTo.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                relatedTo: { ...prev.relatedTo, [field]: value }
            }));
        } else if (name.startsWith('reminder.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                reminder: { ...prev.reminder, [field]: type === 'checkbox' ? checked : value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        // Enforce scheduling for call, meeting, task
        if (['call', 'meeting', 'task'].includes(formData.type) && !formData.scheduledAt) {
            newErrors.scheduledAt = `${formData.type} must be scheduled`;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);
        try {
            // Prepare activity data
            const activityData = {
                type: formData.type,
                subject: formData.subject,
                description: formData.description,
                scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt) : null,
                duration: formData.duration,
                priority: formData.priority,
                status: formData.status,
                reminder: formData.reminder
            };

            // Only include relatedTo if both fields are provided
            if (formData.relatedTo.entityType && formData.relatedTo.entityId) {
                activityData.relatedTo = {
                    entityType: formData.relatedTo.entityType,
                    entityId: formData.relatedTo.entityId
                };
            }

            // Calculate reminder time (1 minute before)
            if (activityData.reminder.enabled && activityData.scheduledAt) {
                const reminderTime = new Date(activityData.scheduledAt);
                reminderTime.setMinutes(reminderTime.getMinutes() - 1);
                activityData.reminder.reminderTime = reminderTime;
            }

            let response;
            if (activityToEdit) {
                response = await activityService.updateActivity(activityToEdit._id, activityData);
            } else {
                response = await activityService.createActivity(activityData);
            }

            if (onActivityCreated) {
                onActivityCreated(response.data.data);
            }

            onClose();
        } catch (error) {
            console.error('Error saving activity:', error);
            const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || 'Failed to save activity';
            setErrors({ submit: errorMessage });
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={onClose}></div>
            <div className={`activity-drawer ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="drawer-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <FiCalendar />
                        </div>
                        <div className="header-text">
                            <h2>{activityToEdit ? 'Edit Activity' : 'Schedule Activity'}</h2>
                            <p>{activityToEdit ? 'Update activity details' : 'Create a new sales activity'}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} type="button">
                        <FiX />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="drawer-content">
                    {/* Activity Type & Subject */}
                    <div className="section-card">
                        <h3 className="section-title">Activity Details</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="type">Activity Type *</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="call">Call</option>
                                    <option value="email">Email</option>
                                    <option value="meeting">Meeting</option>
                                    <option value="task">Task</option>
                                    <option value="note">Note</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="priority">Priority</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                >
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="subject">Subject *</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder={`e.g., Follow-up call with client`}
                                className={errors.subject ? 'error' : ''}
                                required
                            />
                            {errors.subject && <span className="error-text">{errors.subject}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Add notes, agenda, or details..."
                                rows="3"
                            />
                        </div>
                    </div>

                    {/* Schedule */}
                    {['call', 'meeting', 'task', 'email'].includes(formData.type) && (
                        <div className="section-card">
                            <h3 className="section-title">
                                <FiClock className="section-icon" />
                                Schedule
                            </h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="scheduledAt">
                                        Date & Time {['call', 'meeting', 'task'].includes(formData.type) && '*'}
                                    </label>
                                    <input
                                        type="datetime-local"
                                        id="scheduledAt"
                                        name="scheduledAt"
                                        value={formData.scheduledAt}
                                        onChange={handleChange}
                                        className={errors.scheduledAt ? 'error' : ''}
                                        required={['call', 'meeting', 'task'].includes(formData.type)}
                                    />
                                    {errors.scheduledAt && <span className="error-text">{errors.scheduledAt}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="duration">Duration (minutes)</label>
                                    <input
                                        type="number"
                                        id="duration"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleChange}
                                        min="5"
                                        step="5"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Related To */}
                    {!relatedTo && (
                        <div className="section-card">
                            <h3 className="section-title">Link to</h3>

                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="relatedTo.entityType">Entity Type</label>
                                    <select
                                        id="relatedTo.entityType"
                                        name="relatedTo.entityType"
                                        value={formData.relatedTo.entityType}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select type...</option>
                                        <option value="Lead">Lead</option>
                                        <option value="Contact">Contact</option>
                                        <option value="Deal">Deal</option>
                                    </select>
                                </div>

                                {formData.relatedTo.entityType && (
                                    <div className="form-group">
                                        <label htmlFor="relatedTo.entityId">
                                            {formData.relatedTo.entityType}
                                        </label>
                                        <select
                                            id="relatedTo.entityId"
                                            name="relatedTo.entityId"
                                            value={formData.relatedTo.entityId}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select {formData.relatedTo.entityType.toLowerCase()}...</option>
                                            {formData.relatedTo.entityType === 'Lead' && leads.map(lead => (
                                                <option key={lead._id} value={lead._id}>
                                                    {lead.name} - {lead.company}
                                                </option>
                                            ))}
                                            {formData.relatedTo.entityType === 'Contact' && contacts.map(contact => (
                                                <option key={contact._id} value={contact._id}>
                                                    {contact.firstName} {contact.lastName}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reminder */}
                    {formData.scheduledAt && (
                        <div className="section-card">
                            <h3 className="section-title">
                                <FiBell className="section-icon" />
                                Reminder
                            </h3>

                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        name="reminder.enabled"
                                        checked={formData.reminder.enabled}
                                        onChange={handleChange}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span className="toggle-text">Remind me 1 minute before</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {errors.submit && (
                        <div className="error-banner">
                            {errors.submit}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="drawer-footer">
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
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Saving...' : (activityToEdit ? 'Update Activity' : 'Schedule Activity')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ActivityForm;
