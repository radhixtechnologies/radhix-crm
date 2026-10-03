import { useState, useEffect } from 'react';
import { FiX, FiCalendar, FiClock, FiUsers, FiBell, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { activityService } from '../../services/activityService';
import './NewEventDrawer.css';

const NewEventDrawer = ({ isOpen, onClose, onEventCreated, eventToEdit, onEventUpdated, onEventDeleted }) => {
    const { user, isAdmin, isSuperAdmin } = useAuth();

    const [formData, setFormData] = useState({
        subject: '',
        type: 'call',
        priority: 'medium',
        description: '',
        startDate: '',
        startTime: '',
        duration: 60,
        relatedToType: '',
        relatedToId: '',
        reminderTime: '15',
        reminderEnabled: true,
        reminderInApp: true,
        reminderEmail: false
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Populate form when editing
    useEffect(() => {
        if (eventToEdit) {
            setFormData({
                title: eventToEdit.title || '',
                type: eventToEdit.type || 'meeting',
                priority: eventToEdit.priority || 'normal',
                description: eventToEdit.desc || '', // Note: 'desc' from mapping vs 'description'
                startDate: eventToEdit.start ? new Date(eventToEdit.start).toISOString().split('T')[0] : '',
                startTime: eventToEdit.start ? new Date(eventToEdit.start).toTimeString().slice(0, 5) : '',
                endDate: eventToEdit.end ? new Date(eventToEdit.end).toISOString().split('T')[0] : '',
                endTime: eventToEdit.end ? new Date(eventToEdit.end).toTimeString().slice(0, 5) : '',
                allDay: false, // Force false as per requirement
                repeat: eventToEdit.repeat || 'none',
                assignedTo: eventToEdit.assignedTo || [],
                visibility: 'team', // Default or map if available
                isPrivate: eventToEdit.isPrivate || false,
                reminderTime: '15',
                reminderInApp: true,
                reminderEmail: false
            });
        } else {
            // Reset for new event
            setFormData({
                title: '',
                type: 'meeting',
                priority: 'normal',
                description: '',
                startDate: '',
                startTime: '',
                endDate: '',
                endTime: '',
                allDay: false,
                repeat: 'none',
                assignedTo: [],
                visibility: 'team',
                isPrivate: false,
                reminderTime: '15',
                reminderInApp: true,
                reminderEmail: false
            });
        }
    }, [eventToEdit, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Event title is required';
        if (!formData.startDate) newErrors.startDate = 'Start date is required';
        if (!formData.endDate) newErrors.endDate = 'End date is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        try {
            // Combine date and time
            const startDateTime = formData.allDay
                ? new Date(formData.startDate)
                : new Date(`${formData.startDate}T${formData.startTime || '00:00'}`);

            const endDateTime = formData.allDay
                ? new Date(formData.endDate)
                : new Date(`${formData.endDate}T${formData.endTime || '23:59'}`);

            // Determine role visibility based on visibility setting
            let roleVisibility = [];
            if (formData.visibility === 'private') {
                roleVisibility = [];
            } else if (formData.visibility === 'team') {
                roleVisibility = ['employee', 'admin'];
            } else if (formData.visibility === 'company') {
                roleVisibility = ['employee', 'admin', 'super_admin'];
            }

            const eventData = {
                title: formData.title,
                description: formData.description,
                type: formData.type,
                startDate: startDateTime,
                endDate: endDateTime,
                allDay: false, // Enforce no all-day
                assignedTo: formData.assignedTo,
                roleVisibility,
                isPrivate: formData.visibility === 'private',
                color: getColorForType(formData.type)
            };

            if (eventToEdit) {
                const response = await calendarService.updateEvent(eventToEdit._id || eventToEdit.id, eventData);
                if (onEventUpdated) {
                    onEventUpdated(response.data);
                }
            } else {
                const response = await calendarService.createEvent(eventData);
                if (onEventCreated) {
                    onEventCreated(response.data);
                }
            }

            // Form reset via useEffect when closed/switched
            setErrors({});
            onClose();
        } catch (error) {
            console.error('Error saving event:', error);
            setErrors({ submit: 'Failed to save event. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const getColorForType = (type) => {
        const colors = {
            meeting: '#8b5cf6',
            personal: '#3b82f6',
            holiday: '#10b981',
            interview: '#f59e0b',
            training: '#06b6d4',
            appraisal: '#ec4899',
            payroll: '#14b8a6',
            other: '#6b7280'
        };
        return colors[type] || '#6b7280';
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="drawer-overlay" onClick={onClose}></div>
            <div className={`event-drawer ${isOpen ? 'open' : ''}`}>
                {/* Sticky Header */}
                <div className="drawer-header">
                    <div className="header-content">
                        <div className="header-icon">
                            <FiCalendar />
                        </div>
                        <div className="header-text">
                            <h2>{eventToEdit ? 'Edit Event' : 'New Event'}</h2>
                            <p>{eventToEdit ? 'Modify event details' : 'Create a new calendar event'}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose} type="button">
                        <FiX />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="drawer-content">
                    {/* Event Basics */}
                    <div className="section-card">
                        <h3 className="section-title">Event Basics</h3>
                        <div className="form-group">
                            <label htmlFor="title">Event Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Enter event title"
                                className={errors.title ? 'error' : ''}
                            />
                            {errors.title && <span className="error-text">{errors.title}</span>}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="type">Activity Type</label>
                                <select
                                    id="type"
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
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
                    </div>

                    {/* Description */}
                    <div className="section-card">
                        <h3 className="section-title">Description</h3>
                        <div className="form-group">
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Add event description, agenda, or notes..."
                                rows="2"
                            />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="section-card">
                        <h3 className="section-title">
                            <FiClock className="section-icon" />
                            Date & Time
                        </h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="startDate">Start Date *</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    className={errors.startDate ? 'error' : ''}
                                />
                                {errors.startDate && <span className="error-text">{errors.startDate}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="startTime">Start Time</label>
                                <input
                                    type="time"
                                    id="startTime"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    disabled={formData.allDay}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="endDate">End Date *</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className={errors.endDate ? 'error' : ''}
                                />
                                {errors.endDate && <span className="error-text">{errors.endDate}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="endTime">End Time</label>
                                <input
                                    type="time"
                                    id="endTime"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    disabled={formData.allDay}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="toggle-group">
                                <label className="toggle-label">
                                    <input
                                        type="checkbox"
                                        name="allDay"
                                        checked={formData.allDay}
                                        onChange={handleChange}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span className="toggle-text">All Day Event</span>
                                </label>
                            </div>

                            <div className="form-group">
                                <label htmlFor="repeat">Repeat</label>
                                <select
                                    id="repeat"
                                    name="repeat"
                                    value={formData.repeat}
                                    onChange={handleChange}
                                >
                                    <option value="none">Does not repeat</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Assign & Visibility */}
                    <div className="section-card">
                        <h3 className="section-title">
                            <FiUsers className="section-icon" />
                            Assign & Visibility
                        </h3>

                        <div className="form-group">
                            <label htmlFor="visibility">Event Visibility</label>
                            <select
                                id="visibility"
                                name="visibility"
                                value={formData.visibility}
                                onChange={handleChange}
                            >
                                <option value="private">Private (Only me)</option>
                                <option value="team">Team (Employees & Admins)</option>
                                {(isAdmin || isSuperAdmin) && (
                                    <option value="company">Company-wide</option>
                                )}
                            </select>
                            <small className="help-text">
                                {formData.visibility === 'private' && 'Only you can see this event'}
                                {formData.visibility === 'team' && 'Visible to all team members'}
                                {formData.visibility === 'company' && 'Visible to entire company'}
                            </small>
                        </div>
                    </div>

                    {/* Reminders */}
                    <div className="section-card">
                        <h3 className="section-title">
                            <FiBell className="section-icon" />
                            Reminders
                        </h3>

                        <div className="form-group">
                            <label htmlFor="reminderTime">Remind me</label>
                            <select
                                id="reminderTime"
                                name="reminderTime"
                                value={formData.reminderTime}
                                onChange={handleChange}
                            >
                                <option value="0">At time of event</option>
                                <option value="5">5 minutes before</option>
                                <option value="15">15 minutes before</option>
                                <option value="30">30 minutes before</option>
                                <option value="60">1 hour before</option>
                                <option value="1440">1 day before</option>
                            </select>
                        </div>

                        <div className="reminder-toggles">
                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    name="reminderInApp"
                                    checked={formData.reminderInApp}
                                    onChange={handleChange}
                                />
                                <span className="toggle-switch"></span>
                                <span className="toggle-text">In-app notification</span>
                            </label>

                            <label className="toggle-label">
                                <input
                                    type="checkbox"
                                    name="reminderEmail"
                                    checked={formData.reminderEmail}
                                    onChange={handleChange}
                                />
                                <span className="toggle-switch"></span>
                                <span className="toggle-text">Email notification</span>
                            </label>
                        </div>
                    </div>

                    {errors.submit && (
                        <div className="error-banner">
                            {errors.submit}
                        </div>
                    )}
                </form>

                {/* Sticky Footer */}
                <div className="drawer-footer">
                    {eventToEdit && (
                        <button
                            type="button"
                            className="btn btn-danger-outline"
                            onClick={async () => {
                                if (window.confirm('Are you sure you want to delete this event?')) {
                                    setLoading(true);
                                    try {
                                        await calendarService.deleteEvent(eventToEdit._id || eventToEdit.id);
                                        if (onEventDeleted) onEventDeleted(eventToEdit._id || eventToEdit.id);
                                        onClose();
                                    } catch (error) {
                                        console.error('Delete error', error);
                                        setErrors({ submit: 'Failed to delete' });
                                    } finally {
                                        setLoading(false);
                                    }
                                }
                            }}
                            disabled={loading}
                            style={{ marginRight: 'auto', color: '#ef4444', borderColor: '#ef4444' }}
                        >
                            <FiTrash2 /> Delete
                        </button>
                    )}
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
                        {loading ? 'Saving...' : (eventToEdit ? 'Update Event' : 'Save Event')}
                    </button>
                </div>
            </div>
        </>
    );
};

export default NewEventDrawer;
