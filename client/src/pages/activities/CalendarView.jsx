import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Calendar, dayjsLocalizer } from 'react-big-calendar';
import dayjs from 'dayjs';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { activityService } from '../../services/activityService';
import Loader from '../../components/common/Loader';
import { FiPlus, FiChevronLeft, FiChevronRight, FiFilter, FiCalendar, FiSearch, FiChevronDown, FiChevronUp, FiList } from 'react-icons/fi';
import '../../styles/employee/employees.css'; // Use unified employee styles
import './Calendar.css'; // Keep specific calendar overrides if any
import ActivityForm from '../../components/activities/ActivityForm';
import EventDetailsDrawer from '../../components/calendar/EventDetailsDrawer';
import EventTable from '../../components/calendar/EventTable';
import { useAuth } from '../../context/AuthContext';

const localizer = dayjsLocalizer(dayjs);

const CustomWeekHeader = ({ date, events, label, localizer }) => {
    const dayEvents = events.filter(evt =>
        dayjs(evt.start).isSame(date, 'day')
    );
    const count = dayEvents.length;
    const isToday = dayjs().isSame(date, 'day');

    return (
        <div className={`custom-header-cell ${isToday ? 'header-today' : ''}`}>
            <div className="header-top">
                <span className="header-dayname">{dayjs(date).format('ddd').toUpperCase()}</span>
                <span className={`header-date ${isToday ? 'date-today-circle' : ''}`}>
                    {dayjs(date).format('D')}
                </span>
            </div>
            {count > 0 && (
                <div className="header-badge">
                    {count} {count === 1 ? 'event' : 'events'}
                </div>
            )}
        </div>
    );
};

const CalendarView = () => {
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [events, setEvents] = useState([]);
    // State for Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // UI State for inputs
    const [filterInputs, setFilterInputs] = useState({
        type: '',
        owner: '',
        status: '',
        dateRange: '',
        date: new Date() // Buffered date for navigation
    });

    // API State for active filters
    const [activeFilters, setActiveFilters] = useState({
        type: '',
        owner: '',
        status: '',
        dateRange: '',
        search: ''
    });

    // Loading state
    const [loading, setLoading] = useState(true);
    // View state
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());

    // Drawer states
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDetailsDrawerOpen, setIsDetailsDrawerOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [filterCount, setFilterCount] = useState(0);
    const [eventToEdit, setEventToEdit] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const filterRef = useRef(null);
    const buttonRef = useRef(null);

    // Close filters on outside click


    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Handle activity query parameter from notifications
    useEffect(() => {
        const activityId = searchParams.get('activity');
        if (activityId && events.length > 0) {
            // Find the activity in events
            const activity = events.find(e => e._id === activityId);
            if (activity) {
                // Open the activity details
                setSelectedEvents([activity]);
                setIsDetailsDrawerOpen(true);
                // Remove the query parameter
                searchParams.delete('activity');
                setSearchParams(searchParams);
            }
        }
    }, [searchParams, events, setSearchParams]);

    // Fetch on filter change
    useEffect(() => {
        fetchEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [debouncedSearch, activeFilters]);

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: debouncedSearch,
                type: activeFilters.type
            };
            const res = await activityService.getActivities(params);
            if (res.data && res.data.success) {
                const activities = res.data.data.activities || []; // Fixed: activities are nested in data.data.activities
                const parsedEvents = activities.map(activity => {
                    // Map Activity to Calendar Event format
                    const displayTitle = activity.type
                        ? `${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)} - ${activity.subject}`
                        : activity.subject;

                    // Use scheduledAt or completedAt for event time
                    let start = activity.scheduledAt ? new Date(activity.scheduledAt) : new Date(activity.completedAt || activity.createdAt);
                    let end = new Date(start.getTime() + (activity.duration || 60) * 60 * 1000); // Duration in minutes

                    // Safety: Validate dates
                    if (isNaN(end.getTime()) || end <= start) {
                        end = new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
                    }

                    return {
                        id: activity._id,
                        title: displayTitle,
                        originalTitle: activity.subject,
                        description: activity.description,
                        type: activity.type,
                        start: start,
                        end: end,
                        allDay: false,
                        extendedProps: {
                            status: activity.status,
                            priority: activity.priority,
                            assignedTo: activity.assignedTo?.user?.name,
                            createdBy: activity.createdBy?.name,
                            relatedTo: activity.relatedTo
                        }
                    };
                });

                // Client-side filtering
                let filtered = parsedEvents;
                if (debouncedSearch) {
                    const lowSearch = debouncedSearch.toLowerCase();
                    filtered = filtered.filter(e =>
                        e.title.toLowerCase().includes(lowSearch) ||
                        e.originalTitle?.toLowerCase().includes(lowSearch) ||
                        e.description?.toLowerCase().includes(lowSearch)
                    );
                }
                if (activeFilters.type) {
                    filtered = filtered.filter(e => e.type === activeFilters.type);
                }
                if (activeFilters.owner === 'me') {
                    if (user?.name) {
                        filtered = filtered.filter(e =>
                            e.extendedProps?.assignedTo === user.name ||
                            e.extendedProps?.createdBy === user.name
                        );
                    }
                }
                if (activeFilters.status) {
                    filtered = filtered.filter(e =>
                        e.extendedProps?.status?.toLowerCase() === activeFilters.status.toLowerCase() ||
                        (activeFilters.status === 'upcoming' && new Date(e.start) > new Date()) ||
                        (activeFilters.status === 'completed' && new Date(e.end) < new Date()) ||
                        (activeFilters.status === 'cancelled' && e.extendedProps?.status === 'cancelled')
                    );
                }
                if (activeFilters.dateRange) {
                    const now = dayjs();
                    if (activeFilters.dateRange === 'today') {
                        filtered = filtered.filter(e => dayjs(e.start).isSame(now, 'day'));
                    } else if (activeFilters.dateRange === 'week') {
                        filtered = filtered.filter(e => dayjs(e.start).isSame(now, 'week'));
                    } else if (activeFilters.dateRange === 'month') {
                        filtered = filtered.filter(e => dayjs(e.start).isSame(now, 'month'));
                    }
                }
                setEvents(filtered);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, activeFilters, user]);

    const handleApplyFilters = () => {
        setActiveFilters({
            ...activeFilters,
            type: filterInputs.type,
            owner: filterInputs.owner,
            status: filterInputs.status,
            dateRange: filterInputs.dateRange
        });
        setDate(filterInputs.date); // Apply buffered date
        setShowFilters(false);
    };

    const handleClearFilters = () => {
        setFilterInputs({ type: '', owner: '', status: '', dateRange: '' });
        setSearchQuery('');
        setActiveFilters({ type: '', owner: '', status: '', dateRange: '', search: '' });
    };

    const getActiveCount = () => {
        let count = 0;
        if (filterInputs.type) count++;
        if (filterInputs.owner) count++;
        if (filterInputs.status) count++;
        if (filterInputs.dateRange) count++;
        if (searchQuery) count++;
        return count;
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        let backgroundColor = 'var(--evt-default-bg)';

        // Exact Color System
        const type = event.type ? event.type.toLowerCase() : '';
        if (type === 'call') backgroundColor = 'var(--evt-call-bg)';
        else if (type === 'email') backgroundColor = 'var(--evt-email-bg)';
        else if (type === 'meeting') backgroundColor = 'var(--evt-meeting-bg)';
        else if (type.includes('follow')) backgroundColor = 'var(--evt-followup-bg)';

        return {
            style: {
                background: backgroundColor, // Use 'background' for gradients, not 'backgroundColor'
                borderRadius: '6px',
                opacity: 1,
                color: 'white',
                border: 'none',
                // Removed inline layout styles to allow CSS flexibility
            }
        };
    };

    const handleSelectEvent = (event) => {
        setSelectedEvents([event]);
        setSelectedDate(event.start);
        setIsDetailsDrawerOpen(true);
    };

    const handleSelectSlot = (slotInfo) => {
        const dayEvents = events.filter(evt =>
            dayjs(evt.start).isSame(slotInfo.start, 'day')
        );
        setSelectedEvents(dayEvents);
        setSelectedDate(slotInfo.start);
        setIsDetailsDrawerOpen(true);
    };

    const handleEventCreated = (newEvent) => {
        fetchEvents();
        handleCloseDrawer();
    };

    const handleEventUpdated = (updatedEvent) => {
        fetchEvents();
        handleCloseDrawer();
    };

    const handleEventDeleted = (eventId) => {
        fetchEvents();
        handleCloseDrawer();
    };

    const handleEditEvent = (event) => {
        setEventToEdit(event);
        setIsDetailsDrawerOpen(false); // Close details
        setIsDrawerOpen(true); // Open form
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setEventToEdit(null);
    };

    const handleNavigate = (newDate) => {
        setDate(newDate);
    };

    const handleViewChange = (newView) => {
        setView(newView);
    };

    const navigatePrev = () => {
        let newDate;
        if (view === 'month') {
            newDate = dayjs(date).subtract(1, 'month').toDate();
        } else if (view === 'week') {
            newDate = dayjs(date).subtract(1, 'week').toDate();
        } else {
            newDate = dayjs(date).subtract(1, 'day').toDate();
        }
        setDate(newDate);
    };

    const navigateNext = () => {
        let newDate;
        if (view === 'month') {
            newDate = dayjs(date).add(1, 'month').toDate();
        } else if (view === 'week') {
            newDate = dayjs(date).add(1, 'week').toDate();
        } else {
            newDate = dayjs(date).add(1, 'day').toDate();
        }
        setDate(newDate);
    };

    const navigateToday = () => {
        setDate(new Date());
    };

    const getDateLabel = () => {
        if (view === 'month') {
            return dayjs(date).format('MMMM YYYY');
        } else if (view === 'week') {
            const start = dayjs(date).startOf('week');
            const end = dayjs(date).endOf('week');
            return `${start.format('MMM D')} - ${end.format('MMM D, YYYY')}`;
        } else if (view === 'day') {
            return dayjs(date).format('MMMM D, YYYY');
        } else {
            return dayjs(date).format('MMMM YYYY');
        }
    };

    return (
        <div className="employee-list-page fade-in">
            {/* Header Row */}
            <div className="employee-page-header">
                <div className="header-title-group">
                    <h1 className="page-title">Calendar</h1>
                    <p className="page-subtitle">Schedule and manage team events and tasks</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => { setEventToEdit(null); setIsDrawerOpen(true); }}>
                        <FiPlus /> Create Event
                    </button>
                    <button
                        ref={buttonRef}
                        className="btn filter-btn-mobile"
                        onClick={() => setShowFilters(!showFilters)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '100px',
                            justifyContent: 'center',
                            background: showFilters ? '#eff6ff' : 'white',
                            border: showFilters ? '1px solid #3b82f6' : '1px solid #d1d5db',
                            color: showFilters ? '#2563eb' : '#374151',
                            transition: 'all 0.2s'
                        }}
                    >
                        <FiFilter style={{ color: showFilters ? '#2563eb' : '#6b7280' }} />
                        <span style={{ fontWeight: 500 }}>Filters</span>
                        {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                        {(getActiveCount() > 0) && (
                            <span style={{
                                background: '#3b82f6',
                                color: 'white',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700
                            }}>
                                {getActiveCount()}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Search Bar Section */}
            <div className="search-bar-section" style={{ marginBottom: '16px' }}>
                <div className="toolbar-search" style={{ margin: 0, width: '100%', maxWidth: '280px' }}>
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search events..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Toolbar Container - Relative for Filter Panel positioning */}
            <div style={{ position: 'relative', zIndex: 50 }}>

                {/* 2. Filter Panel (Absolute Overlay matching News & Updates) */}
                {showFilters && (
                    <div className="filter-panel-overlay fade-in" ref={filterRef} style={{
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        width: '100%',
                        background: '#f9fafb', // Changed from 'white' to '#f9fafb'
                        padding: '24px', // More padding
                        marginTop: '8px', // Slight offset
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px', // Rounded corners
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // Deeper shadow
                        zIndex: 2000,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px'
                    }}>


                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '32px', width: '100%', flexWrap: 'wrap' }}>

                            {/* Date Range - Matching LeadList Pattern */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Range</label>
                                <div style={{ position: 'relative', width: '150px' }}>
                                    <select
                                        value={filterInputs.dateRange}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, dateRange: e.target.value })}
                                        style={{
                                            appearance: 'none',
                                            width: '100%',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 32px 0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            height: '38px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">All Dates</option>
                                        <option value="today">Today</option>
                                        <option value="week">This Week</option>
                                        <option value="month">This Month</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Section 2: Event Type */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Event Type</label>
                                <div style={{ position: 'relative', width: '140px' }}>
                                    <select
                                        value={filterInputs.type}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, type: e.target.value })}
                                        style={{
                                            appearance: 'none',
                                            width: '100%',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 32px 0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            height: '38px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">All Types</option>
                                        <option value="call">Call</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="email">Email</option>
                                        <option value="task">Task</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Section 3: Status */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</label>
                                <div style={{ position: 'relative', width: '140px' }}>
                                    <select
                                        value={filterInputs.status}
                                        onChange={(e) => setFilterInputs({ ...filterInputs, status: e.target.value })}
                                        style={{
                                            appearance: 'none',
                                            width: '100%',
                                            background: 'white',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '6px',
                                            padding: '0 32px 0 12px',
                                            fontSize: '13px',
                                            color: '#374151',
                                            height: '38px',
                                            cursor: 'pointer',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                            outline: 'none'
                                        }}
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="upcoming">Upcoming</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <FiChevronDown style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Section 4: Calendar View (Toggle) */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>View</label>
                                <button
                                    onClick={() => handleViewChange(view === 'list' ? 'month' : 'list')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        background: 'white',
                                        border: '1px solid #d1d5db',
                                        borderRadius: '6px',
                                        padding: '0 16px',
                                        fontSize: '13px',
                                        color: '#374151',
                                        height: '38px',
                                        cursor: 'pointer',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                        minWidth: '110px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.borderColor = '#9ca3af'}
                                    onMouseOut={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                                >
                                    {view === 'list' ? <FiCalendar /> : <FiList style={{ fontSize: '14px' }} />}
                                    <span style={{ fontWeight: 500 }}>{view === 'list' ? 'Calendar' : 'List View'}</span>
                                </button>
                            </div>

                            {/* Section 5: Actions (Aligned Right) */}
                            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px', height: '38px' }}>
                                <button
                                    onClick={handleClearFilters}
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#6b7280',
                                        background: 'transparent',
                                        border: '1px solid transparent', // Subtle alignment fix
                                        cursor: 'pointer',
                                        padding: '0 12px',
                                        borderRadius: '6px',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        transition: 'color 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#111827';
                                        e.currentTarget.style.background = '#f3f4f6'; // Add bg hover
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#6b7280';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    Clear All
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleApplyFilters}
                                    style={{
                                        padding: '0 20px',
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        borderRadius: '6px',
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                        height: '100%',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Visual Divider between Controls and Grid */}
            <div style={{ height: '1px', background: '#e5e7eb', margin: '0' }}></div>

            {/* Content Wrapper */}
            <div className="employee-content-wrapper" style={{ height: 'calc(100vh - 200px)', padding: '0', overflowY: view === 'list' ? 'auto' : 'hidden' }}>
                {loading ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Loader />
                    </div>
                ) : (
                    <div style={{ height: '100%', position: 'relative' }}>
                        {/* Empty State Overlay */}
                        {events.length === 0 && (
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                zIndex: 5,
                                pointerEvents: 'none', // Allow clicking through to create events if needed
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.9)',
                                    padding: '16px 24px',
                                    borderRadius: '12px',
                                    border: '1px solid #f3f4f6',
                                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                                }}>
                                    <p style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500, margin: 0 }}>No events scheduled</p>
                                </div>
                            </div>
                        )}
                        {view === 'list' ? (
                            <EventTable events={events} onEventClick={handleSelectEvent} />
                        ) : (
                            <div style={{ height: '100%', padding: '20px' }}>
                                <Calendar
                                    localizer={localizer}
                                    events={events}
                                    startAccessor="start"
                                    endAccessor="end"
                                    style={{ height: '100%' }}
                                    eventPropGetter={eventStyleGetter}
                                    onSelectEvent={handleSelectEvent}
                                    onSelectSlot={handleSelectSlot}
                                    selectable
                                    views={['month', 'day']}
                                    view={view}
                                    onView={handleViewChange}
                                    date={date}
                                    onNavigate={handleNavigate}
                                    popup={true}
                                    toolbar={false}
                                    // Enterprise Configurations
                                    allDaySlot={false}
                                    min={dayjs().startOf('day').toDate()} // Start at 00:00 to render all events correctly
                                    max={dayjs().endOf('day').toDate()}   // End at 23:59
                                    scrollToTime={dayjs().set('hour', 8).set('minute', 0).toDate()} // Auto-scroll to 8 AM
                                    tooltipAccessor="title"
                                    components={{
                                        week: {
                                            header: (props) => <CustomWeekHeader {...props} events={events} localizer={localizer} />
                                        },
                                        day: {
                                            header: (props) => <CustomWeekHeader {...props} events={events} localizer={localizer} />
                                        }
                                    }}
                                    formats={{
                                        dateFormat: 'D',
                                        dayFormat: (date, culture, localizer) => localizer.format(date, 'ddd D', culture),
                                        weekdayFormat: 'ddd',
                                        monthHeaderFormat: 'MMMM YYYY',
                                        dayHeaderFormat: 'dddd, MMMM D',
                                        dayRangeHeaderFormat: ({ start, end }) =>
                                            `${dayjs(start).format('MMM D')} - ${dayjs(end).format('MMM D, YYYY')}`,
                                    }}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Drawers */}
            <ActivityForm
                isOpen={isDrawerOpen}
                onClose={handleCloseDrawer}
                onActivityCreated={handleEventCreated}
                activityToEdit={eventToEdit}
            />

            <EventDetailsDrawer
                isOpen={isDetailsDrawerOpen}
                onClose={() => setIsDetailsDrawerOpen(false)}
                selectedDate={selectedDate}
                events={selectedEvents}
                onCreateEvent={() => {
                    setIsDetailsDrawerOpen(false);
                    setEventToEdit(null);
                    setIsDrawerOpen(true);
                }}
                onEditEvent={handleEditEvent}
            />
        </div>
    );
};

export default CalendarView;
