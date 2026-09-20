import { FiX, FiPlus, FiClock, FiMapPin, FiEdit2 } from 'react-icons/fi';
import dayjs from 'dayjs';
import './EventDetailsDrawer.css';

const EventDetailsDrawer = ({ isOpen, onClose, selectedDate, events, onCreateEvent, onEditEvent }) => {
    if (!isOpen) return null;

    const formatTime = (date) => {
        return dayjs(date).format('h:mm A');
    };

    const formatDate = (date) => {
        return dayjs(date).format('dddd, MMMM D, YYYY');
    };

    const getEventTypeLabel = (type) => {
        const labels = {
            meeting: 'Meeting',
            personal: 'Personal',
            holiday: 'Holiday',
            interview: 'Interview',
            training: 'Training',
            appraisal: 'Appraisal',
            payroll: 'Payroll',
            task: 'Task',
            leave: 'Leave',
            other: 'Other'
        };
        return labels[type] || type;
    };

    return (
        <>
            <div className="details-drawer-overlay" onClick={onClose}></div>
            <div className={`details-drawer ${isOpen ? 'open' : ''}`}>
                {/* Header */}
                <div className="details-drawer-header">
                    <div>
                        <h2>{selectedDate ? formatDate(selectedDate) : 'Events'}</h2>
                        <p>{events.length} {events.length === 1 ? 'event' : 'events'}</p>
                    </div>
                    <button className="details-close-btn" onClick={onClose}>
                        <FiX />
                    </button>
                </div>

                {/* Content */}
                <div className="details-drawer-content">
                    {events.length === 0 ? (
                        <div className="no-events">
                            <div className="no-events-icon">📅</div>
                            <h3>No events scheduled</h3>
                            <p>Create an event for this day</p>
                            <button className="add-event-btn" onClick={onCreateEvent}>
                                <FiPlus />
                                Add Event
                            </button>
                        </div>
                    ) : (
                        <div className="events-list">
                            {events.map((event, index) => (
                                <div
                                    key={event.id || index}
                                    className="event-card"
                                    style={{ borderLeftColor: event.color }}
                                >
                                    <div className="event-card-header">
                                        <div className="event-header-left" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                            <div
                                                className="event-type-badge"
                                                style={{ backgroundColor: event.color }}
                                            >
                                                {getEventTypeLabel(event.type)}
                                            </div>
                                            {event.extendedProps?.status && (
                                                <span className={`event-status status-${event.extendedProps.status.toLowerCase()}`}>
                                                    {event.extendedProps.status}
                                                </span>
                                            )}
                                        </div>
                                        <div className="event-actions">
                                            <button
                                                className="icon-btn-small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEditEvent(event);
                                                }}
                                                title="Edit Event"
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                            >
                                                <FiEdit2 />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="event-title">{event.title}</h3>

                                    {event.desc && (
                                        <p className="event-description">{event.desc}</p>
                                    )}

                                    <div className="event-meta">
                                        <div className="event-time">
                                            <FiClock />
                                            <span>
                                                {event.allDay
                                                    ? 'All day'
                                                    : `${formatTime(event.start)} - ${formatTime(event.end)}`
                                                }
                                            </span>
                                        </div>

                                        {event.extendedProps?.createdBy && (
                                            <div className="event-creator">
                                                <span>Created by {event.extendedProps.createdBy}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {events.length > 0 && (
                    <div className="details-drawer-footer">
                        <button className="add-event-btn-footer" onClick={onCreateEvent}>
                            <FiPlus />
                            Add Event
                        </button>
                    </div>
                )}
            </div>
        </>
    );
};

export default EventDetailsDrawer;
