import { FiCalendar, FiClock, FiMapPin, FiAlignLeft } from 'react-icons/fi';
import '../../styles/employee/employees.css';

const EventTable = ({ events, onEventClick }) => {

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getEventTypeColor = (type) => {
        switch (type) {
            case 'meeting': return '#3b82f6'; // blue
            case 'call': return '#10b981'; // green
            case 'task': return '#f59e0b'; // amber
            case 'deadline': return '#ef4444'; // red
            default: return '#6366f1'; // indigo
        }
    };

    return (
        <div className="table-container-responsive">
            <table className="table">
                <thead>
                    <tr>
                        <th style={{ width: '35%' }}>Event</th>
                        <th style={{ width: '20%' }}>Date & Time</th>
                        <th style={{ width: '15%' }}>Type</th>
                        <th style={{ width: '20%' }}>Location/Link</th>
                        <th style={{ width: '10%' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {events.length > 0 ? (
                        events.map((event) => (
                            <tr key={event._id || event.id} style={{ cursor: 'pointer' }} onClick={() => onEventClick(event)}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div
                                            className="employee-avatar-table"
                                            style={{
                                                background: event.color || getEventTypeColor(event.type),
                                                color: 'white'
                                            }}
                                        >
                                            <FiCalendar />
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span
                                                style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '14px' }}
                                            >
                                                {event.title}
                                            </span>
                                            {event.description && (
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                                    <FiAlignLeft size={10} />
                                                    {event.description.length > 30 ? event.description.substring(0, 30) + '...' : event.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', fontWeight: 500 }}>
                                            {new Date(event.start).toLocaleDateString()}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                            <FiClock size={12} />
                                            {formatTime(event.start)} - {formatTime(event.end)}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    {event.type ? (
                                        <span
                                            className="badge"
                                            style={{
                                                backgroundColor: `${getEventTypeColor(event.type)}20`,
                                                color: getEventTypeColor(event.type),
                                                textTransform: 'capitalize'
                                            }}
                                        >
                                            {event.type}
                                        </span>
                                    ) : (
                                        <span className="badge badge-secondary">General</span>
                                    )}
                                </td>
                                <td>
                                    {event.location ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            <FiMapPin size={12} />
                                            {event.location}
                                        </div>
                                    ) : (
                                        <span style={{ color: '#94a3b8', fontSize: '13px' }}>-</span>
                                    )}
                                </td>
                                <td>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                    >
                                        View
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FiCalendar size={24} color="#64748b" />
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 500 }}>No events found for this period</span>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default EventTable;
