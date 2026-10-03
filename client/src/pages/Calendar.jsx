import { useState, useEffect, useRef } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiClock, FiMapPin, FiUser, FiFilter, FiChevronDown, FiChevronUp, FiCalendar as FiCalendarIcon, FiUsers as FiUsersIcon, FiCheckSquare, FiSun } from 'react-icons/fi';
import { calendarService } from '../services/calendarService';
import '../styles/employee/timesheets.css';
import '../styles/calendar.css';

const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState('month');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [activities, setActivities] = useState([]); // Filtered events for display
    const [rawEvents, setRawEvents] = useState([]); // Original events from API
    const [loading, setLoading] = useState(false);

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [showMyEventsOnly, setShowMyEventsOnly] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    const [filterInputs, setFilterInputs] = useState({
        type: '',
        status: '',
        priority: ''
    });

    const [activeFilters, setActiveFilters] = useState({
        type: '',
        status: '',
        priority: ''
    });

    useEffect(() => {
        fetchActivities();
    }, [currentDate]);

    // Apply Filters Effect
    useEffect(() => {
        let filtered = [...rawEvents];

        if (showMyEventsOnly) {
            // Assuming 'personal' or events created by user. 
            // Since we don't have robust user ID checking here without context, 
            // we'll rely on a client-side property if available, or just filter 'personal' types for now mock-wise
            // actually we should probably skip this if we can't robustly checks ownership
            // But let's check strict equality on 'attendees' or createdBy if we had it.
            // For now, let's just filter if it's 'personal' type as a proxy or skip?
            // Better: Filter if evt.extendedProps?.assignedTo matches current user name? (We don't have current user name)
            // Let's filter out 'holiday' for "My Events"? No.
            // Let's leave it as a placeholder or filter strictly by 'personal' type for demo
            // filtered = filtered.filter(e => e.type === 'personal' || e.type === 'meeting');
        }

        if (activeFilters.type) {
            filtered = filtered.filter(e => e.type === activeFilters.type);
        }

        if (activeFilters.status) {
            filtered = filtered.filter(e => e.extendedProps?.status === activeFilters.status);
        }

        setActivities(filtered);
    }, [rawEvents, activeFilters, showMyEventsOnly]);

    const handleApplyFilters = () => {
        setActiveFilters(filterInputs);
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        const reset = { type: '', status: '', priority: '' };
        setFilterInputs(reset);
        setActiveFilters(reset);
        setShowMyEventsOnly(false);
    };

    const getActiveCount = () => {
        let count = 0;
        if (showMyEventsOnly) count++;
        if (filterInputs.type) count++;
        if (filterInputs.status) count++;
        return count;
    };

    const fetchActivities = async () => {
        setLoading(true);
        try {
            // Calculate date range: Previous month start to Next month end to cover all views comfortably
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month + 2, 0);

            const response = await calendarService.getEvents(start.toISOString(), end.toISOString());

            // Map API events to component state format
            const mappedEvents = response.data.map(evt => {
                const startTime = new Date(evt.start);
                const endTime = evt.end ? new Date(evt.end) : new Date(startTime.getTime() + 60 * 60000); // default 1h
                const durationMinutes = (endTime - startTime) / 60000;

                return {
                    id: evt.id,
                    title: evt.title,
                    date: startTime, // Component expects Date object
                    type: evt.type || 'personal',
                    color: evt.color,
                    duration: Math.round(durationMinutes),
                    location: evt.extendedProps?.location || evt.extendedProps?.relatedTo || '',
                    attendees: evt.extendedProps?.assignedTo ? [evt.extendedProps.assignedTo] : [],
                    description: evt.desc,
                    extendedProps: evt.extendedProps
                };
            });

            setRawEvents(mappedEvents);
            // Activities will be set by the useEffect
        } catch (error) {
            console.error("Failed to fetch calendar events:", error);
        } finally {
            setLoading(false);
        }
    };

    const goToPrevious = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() - 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const goToNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') {
            newDate.setDate(newDate.getDate() + 1);
        } else if (view === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const getCalendarTitle = () => {
        if (view === 'day') {
            return currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (view === 'week') {
            const weekStart = getWeekStart(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    };

    const getActivitiesForDate = (date) => {
        return activities.filter(activity => {
            const activityDate = new Date(activity.date);
            return activityDate.toDateString() === date.toDateString();
        });
    };

    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = getWeekStart(firstDay);

        const weeks = [];
        let currentWeekStart = new Date(startDate);

        while (currentWeekStart <= lastDay || weeks.length < 5) {
            const week = Array.from({ length: 7 }, (_, i) => {
                const day = new Date(currentWeekStart);
                day.setDate(day.getDate() + i);
                return day;
            });
            weeks.push(week);
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            if (weeks.length >= 6) break;
        }

        return (
            <div className="month-view-modern">
                <div className="month-weekdays">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <div key={day} className="weekday-label">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="month-grid">
                    {weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="month-week">
                            {week.map(day => {
                                const dayActivities = getActivitiesForDate(day);
                                const isCurrentMonth = day.getMonth() === month;
                                const isToday = day.toDateString() === new Date().toDateString();
                                const isSelected = day.toDateString() === selectedDate.toDateString();

                                return (
                                    <div
                                        key={day.toISOString()}
                                        className={`month-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}`}
                                        onClick={() => {
                                            setSelectedDate(day);
                                            setCurrentDate(day);
                                            setView('day');
                                        }}
                                    >
                                        <div className="cell-header">
                                            <span className="cell-date">{day.getDate()}</span>
                                        </div>
                                        <div className="cell-content">
                                            {dayActivities.slice(0, 3).map(activity => (
                                                <div
                                                    key={activity.id}
                                                    className={`event-pill event-${activity.type}`}
                                                    title={activity.title}
                                                    style={{
                                                        borderLeftColor: activity.color,
                                                        backgroundColor: activity.color ? `${activity.color}20` : undefined,
                                                        color: activity.color
                                                    }}
                                                >
                                                    <span className="event-time">
                                                        {new Date(activity.date).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                    <span className="event-title">{activity.title}</span>
                                                </div>
                                            ))}
                                            {dayActivities.length > 3 && (
                                                <div className="more-events">+{dayActivities.length - 3} more</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const renderWeekView = () => {
        const weekStart = getWeekStart(currentDate);
        const weekDays = Array.from({ length: 7 }, (_, i) => {
            const day = new Date(weekStart);
            day.setDate(day.getDate() + i);
            return day;
        });

        const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

        return (
            <div className="week-view-modern">
                <div className="week-grid-header">
                    <div className="time-header-cell"></div>
                    {weekDays.map(day => (
                        <div
                            key={day.toISOString()}
                            className={`day-header-cell ${day.toDateString() === new Date().toDateString() ? 'is-today' : ''}`}
                            onClick={() => {
                                setSelectedDate(day);
                                setCurrentDate(day);
                                setView('day');
                            }}
                        >
                            <div className="day-name-short">
                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="day-number-large">{day.getDate()}</div>
                        </div>
                    ))}
                </div>
                <div className="week-grid-body">
                    <div className="time-column-modern">
                        {hours.map(hour => (
                            <div key={hour} className="time-row">
                                <span className="time-text">
                                    {hour === 0
                                        ? '12 AM'
                                        : hour < 12
                                            ? `${hour} AM`
                                            : hour === 12
                                                ? '12 PM'
                                                : `${hour - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="days-grid">
                        {weekDays.map(day => {
                            const dayActivities = getActivitiesForDate(day);
                            return (
                                <div key={day.toISOString()} className="day-column-modern">
                                    {hours.map(hour => {
                                        const hourActivities = dayActivities.filter(
                                            activity => new Date(activity.date).getHours() === hour
                                        );
                                        return (
                                            <div key={hour} className="hour-slot">
                                                {hourActivities.map(activity => (
                                                    <div
                                                        key={activity.id}
                                                        className={`event-block event-${activity.type}`}
                                                        style={{
                                                            top: `${(new Date(activity.date).getMinutes() / 60) * 100}%`,
                                                            height: `${Math.min((activity.duration / 60) * 100, 100)}%`,
                                                            borderLeftColor: activity.color,
                                                            backgroundColor: activity.color ? `${activity.color}20` : undefined,
                                                            color: activity.color
                                                        }}
                                                    >
                                                        <div className="event-block-title">{activity.title}</div>
                                                        <div className="event-block-time">
                                                            {new Date(activity.date).toLocaleTimeString('en-US', {
                                                                hour: 'numeric',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderDayView = () => {
        const hours = Array.from({ length: 24 }, (_, i) => i);
        const dayActivities = getActivitiesForDate(currentDate);

        return (
            <div className="day-view-modern">
                <div className="day-view-grid">
                    <div className="time-sidebar">
                        {hours.map(hour => (
                            <div key={hour} className="time-slot-modern">
                                <span className="hour-label">
                                    {hour === 0
                                        ? '12 AM'
                                        : hour < 12
                                            ? `${hour} AM`
                                            : hour === 12
                                                ? '12 PM'
                                                : `${hour - 12} PM`}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="day-schedule">
                        {hours.map(hour => (
                            <div key={hour} className="schedule-hour">
                                {dayActivities
                                    .filter(activity => new Date(activity.date).getHours() === hour)
                                    .map(activity => (
                                        <div
                                            key={activity.id}
                                            className={`schedule-event event-${activity.type}`}
                                            style={{
                                                top: `${(new Date(activity.date).getMinutes() / 60) * 100}%`,
                                                height: `${Math.min((activity.duration / 60) * 100, 100)}%`,
                                                borderLeftColor: activity.color,
                                                backgroundColor: activity.color ? `${activity.color}20` : undefined,
                                            }}
                                        >
                                            <div className="event-header">
                                                <h4 className="event-name">{activity.title}</h4>
                                                <span className="event-duration">{activity.duration} min</span>
                                            </div>
                                            <div className="event-details">
                                                <div className="event-detail">
                                                    <FiClock size={14} />
                                                    <span>
                                                        {new Date(activity.date).toLocaleTimeString('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                {activity.location && (
                                                    <div className="event-detail">
                                                        <FiMapPin size={14} />
                                                        <span>{activity.location}</span>
                                                    </div>
                                                )}
                                                {activity.attendees && (
                                                    <div className="event-detail">
                                                        <FiUser size={14} />
                                                        <span>{activity.attendees.join(', ')}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="calendar-page fade-in">
            {/* 1. HEADER SECTION */}
            <div className="calendar-header-section">
                <div className="header-left-group">
                    <h1 className="calendar-main-title">Calendar</h1>
                    <p className="calendar-date-subtext">{getCalendarTitle()}</p>
                </div>

                <div className="header-actions-group">
                    <button
                        ref={buttonRef}
                        className={`btn-filter ${showFilters ? 'active' : ''}`}
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <FiFilter className="filter-icon" />
                        <span>Filters</span>
                        {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {(getActiveCount() > 0) && (
                            <span className="filter-badge">
                                {getActiveCount()}
                            </span>
                        )}
                    </button>

                    <button className="btn btn-primary btn-new-event">
                        <FiPlus /> New Event
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px'
            }}>
                {/* Total Events */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCalendarIcon />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {activities.length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Total Events
                        </div>
                    </div>
                </div>

                {/* Meetings */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiUsersIcon />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {activities.filter(a => a.type === 'meeting').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Meetings
                        </div>
                    </div>
                </div>

                {/* Tasks */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiCheckSquare />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {activities.filter(a => a.type === 'task').length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Tasks
                        </div>
                    </div>
                </div>

                {/* Today's Events */}
                <div style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '20px'
                    }}>
                        <FiSun />
                    </div>
                    <div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            {activities.filter(a => new Date(a.date).toDateString() === new Date().toDateString()).length}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                            Today's Events
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Panel Overlay */}
            {showFilters && (
                <div className="filter-panel-wrapper">
                    <div className="filter-panel-content fade-in" ref={filterRef}>
                        <div className="filter-row">
                            {/* My Events Toggle */}
                            <div className="filter-group">
                                <label className="filter-label">Show</label>
                                <div
                                    className="toggle-button"
                                    onClick={() => setShowMyEventsOnly(!showMyEventsOnly)}
                                >
                                    <span className="toggle-text">My Events</span>
                                    <div className="toggle-switch-ui">
                                        <input type="checkbox" checked={showMyEventsOnly} readOnly />
                                        <span className="toggle-slider"></span>
                                    </div>
                                </div>
                            </div>

                            {/* Date Filter */}
                            <div className="filter-group">
                                <label className="filter-label">Date</label>
                                <input
                                    type="date"
                                    value={currentDate.toISOString().split('T')[0]}
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            const newDate = new Date(e.target.value);
                                            setCurrentDate(newDate);
                                            setSelectedDate(newDate);
                                        }
                                    }}
                                    className="filter-input-date"
                                />
                            </div>

                            {/* Type Filter */}
                            <div className="filter-group">
                                <label className="filter-label">Type</label>
                                <div className="select-wrapper">
                                    <select
                                        value={filterInputs.type}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, type: e.target.value })}
                                        className="filter-select"
                                    >
                                        <option value="">All Types</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="call">Call</option>
                                        <option value="email">Email</option>
                                        <option value="task">Task</option>
                                        <option value="leave">Leave</option>
                                        <option value="holiday">Holiday</option>
                                    </select>
                                    <FiChevronDown className="select-arrow" />
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="filter-group">
                                <label className="filter-label">Status</label>
                                <div className="select-wrapper">
                                    <select
                                        value={filterInputs.status}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                                        className="filter-select"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                        <option value="pending">Pending</option>
                                    </select>
                                    <FiChevronDown className="select-arrow" />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="filter-actions-right">
                                <button onClick={handleClearFilters} className="btn-clear">
                                    Clear All
                                </button>
                                <button onClick={handleApplyFilters} className="btn-apply">
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. CALENDAR CONTAINER (Clean Card) */}
            <div className="calendar-card-container">
                {loading ? (
                    <div className="calendar-loader">Loading events...</div>
                ) : (
                    <>
                        {view === 'month' && renderMonthView()}
                        {view === 'week' && renderWeekView()}
                        {view === 'day' && renderDayView()}
                    </>
                )}
            </div>
        </div>
    );
};

export default Calendar;
