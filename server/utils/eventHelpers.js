const dayjs = require('dayjs');

/**
 * Event Color Mapping
 * Returns default color for each event type
 */
const EVENT_COLORS = {
    meeting: '#3b82f6',      // Blue
    call: '#10b981',         // Green
    task: '#8b5cf6',         // Purple
    leave: '#f59e0b',        // Orange
    interview: '#ef4444',    // Red
    reminder: '#6b7280',     // Gray
    email: '#06b6d4',        // Cyan
    demo: '#ec4899',         // Pink
    holiday: '#14b8a6',      // Teal
    announcement: '#f97316', // Orange-Red
    sms: '#84cc16',          // Lime
    note: '#64748b',         // Slate
    presentation: '#a855f7', // Purple
    default: '#6366f1'       // Indigo
};

/**
 * Get event color based on type and priority
 * @param {String} type - Event type
 * @param {String} priority - Event priority
 * @param {String} customColor - Custom color override
 * @returns {String} Hex color code
 */
exports.getEventColor = (type, priority, customColor) => {
    if (customColor) return customColor;

    // Priority-based color override for high/urgent
    if (priority === 'urgent') return '#dc2626'; // Red
    if (priority === 'high') return '#ea580c'; // Orange

    return EVENT_COLORS[type] || EVENT_COLORS.default;
};

/**
 * Check if user can access event based on visibility and role
 * @param {Object} user - User object with role
 * @param {Object} event - Event object
 * @returns {Boolean}
 */
exports.canUserAccessEvent = (user, event) => {
    // SuperAdmin can access everything
    if (user.role === 'super-admin') return true;

    // Creator can always access their own events
    if (event.createdBy?.toString() === user._id.toString()) return true;

    // Assigned user can access
    if (event.assignedTo?.toString() === user._id.toString()) return true;

    // Check visibility
    if (event.visibility === 'company') return true;

    if (event.visibility === 'team') {
        // Admin can see team events
        if (user.role === 'admin') return true;

        // Check if user is in same team/department
        // This would need team/department logic
        return false;
    }

    // Private events only visible to creator and assigned
    return false;
};

/**
 * Check if user can edit event
 * @param {Object} user - User object with role
 * @param {Object} event - Event object
 * @returns {Boolean}
 */
exports.canUserEditEvent = (user, event) => {
    // SuperAdmin can edit everything
    if (user.role === 'super-admin') return true;

    // Creator can edit their own events
    if (event.createdBy?.toString() === user._id.toString()) return true;

    // Admin can edit team events
    if (user.role === 'admin' && event.visibility === 'team') return true;

    return false;
};

/**
 * Check if user can delete event
 * @param {Object} user - User object with role
 * @param {Object} event - Event object
 * @returns {Boolean}
 */
exports.canUserDeleteEvent = (user, event) => {
    // SuperAdmin can delete everything
    if (user.role === 'super-admin') return true;

    // Creator can delete their own events
    if (event.createdBy?.toString() === user._id.toString()) return true;

    // Admin can delete team events
    if (user.role === 'admin' && event.visibility === 'team') return true;

    return false;
};

/**
 * Check if user can create event of specific type
 * @param {Object} user - User object with role
 * @param {String} eventType - Type of event
 * @returns {Boolean}
 */
exports.canUserCreateEventType = (user, eventType) => {
    // SuperAdmin can create any type
    if (user.role === 'super-admin') return true;

    // Company-wide events only for SuperAdmin
    const companyEvents = ['holiday', 'announcement'];
    if (companyEvents.includes(eventType)) return false;

    // Admin can create most types
    if (user.role === 'admin') {
        const adminAllowed = ['meeting', 'call', 'task', 'interview', 'demo', 'presentation', 'email'];
        return adminAllowed.includes(eventType);
    }

    // Employees can create limited types
    const employeeAllowed = ['reminder', 'task', 'note'];
    return employeeAllowed.includes(eventType);
};

/**
 * Generate recurring event instances
 * @param {Object} parentEvent - Parent recurring event
 * @param {Date} startDate - Start date for generation
 * @param {Date} endDate - End date for generation
 * @returns {Array} Array of event instances
 */
exports.generateRecurringEvents = (parentEvent, startDate, endDate) => {
    const instances = [];

    if (!parentEvent.isRecurring || parentEvent.repeatType === 'none') {
        return instances;
    }

    let currentDate = dayjs(parentEvent.scheduledAt);
    const finalEndDate = parentEvent.repeatEndDate
        ? dayjs(parentEvent.repeatEndDate)
        : dayjs(endDate);

    const maxIterations = 365; // Safety limit
    let iterations = 0;

    while (currentDate.isBefore(finalEndDate) && iterations < maxIterations) {
        iterations++;

        // Skip if before start date
        if (currentDate.isAfter(dayjs(startDate)) || currentDate.isSame(dayjs(startDate), 'day')) {
            instances.push({
                ...parentEvent.toObject(),
                _id: undefined, // Will be generated
                scheduledAt: currentDate.toDate(),
                endTime: currentDate.add(parentEvent.duration, 'minute').toDate(),
                parentEvent: parentEvent._id,
                isRecurring: false, // Individual instances are not recurring
            });
        }

        // Move to next occurrence
        switch (parentEvent.repeatType) {
            case 'daily':
                currentDate = currentDate.add(parentEvent.repeatInterval, 'day');
                break;

            case 'weekly':
                // If specific days are set, use them
                if (parentEvent.repeatDays && parentEvent.repeatDays.length > 0) {
                    let nextDay = currentDate.add(1, 'day');
                    let found = false;

                    // Find next occurrence within the week
                    for (let i = 0; i < 7; i++) {
                        if (parentEvent.repeatDays.includes(nextDay.day())) {
                            currentDate = nextDay;
                            found = true;
                            break;
                        }
                        nextDay = nextDay.add(1, 'day');
                    }

                    // If no day found in current week, move to next week
                    if (!found) {
                        currentDate = currentDate.add(parentEvent.repeatInterval, 'week');
                        // Set to first repeat day
                        const firstDay = Math.min(...parentEvent.repeatDays);
                        currentDate = currentDate.day(firstDay);
                    }
                } else {
                    currentDate = currentDate.add(parentEvent.repeatInterval, 'week');
                }
                break;

            case 'monthly':
                currentDate = currentDate.add(parentEvent.repeatInterval, 'month');
                break;

            case 'yearly':
                currentDate = currentDate.add(parentEvent.repeatInterval, 'year');
                break;

            default:
                return instances; // Unknown repeat type
        }
    }

    return instances;
};

/**
 * Calculate end time based on start time and duration
 * @param {Date} startTime
 * @param {Number} duration - Duration in minutes
 * @returns {Date}
 */
exports.calculateEndTime = (startTime, duration) => {
    return dayjs(startTime).add(duration || 60, 'minute').toDate();
};

/**
 * Validate event time overlap
 * @param {Date} startTime
 * @param {Date} endTime
 * @param {Array} existingEvents
 * @returns {Boolean}
 */
exports.hasTimeConflict = (startTime, endTime, existingEvents) => {
    const start = dayjs(startTime);
    const end = dayjs(endTime);

    return existingEvents.some(event => {
        const eventStart = dayjs(event.scheduledAt);
        const eventEnd = dayjs(event.endTime || event.scheduledAt).add(event.duration, 'minute');

        // Check if times overlap
        return (
            (start.isBefore(eventEnd) && end.isAfter(eventStart)) ||
            (start.isSame(eventStart) || end.isSame(eventEnd))
        );
    });
};

/**
 * Format event for calendar display
 * @param {Object} event - Event object
 * @returns {Object} Formatted event
 */
exports.formatEventForCalendar = (event) => {
    const color = exports.getEventColor(event.type, event.priority, event.color);

    return {
        id: event._id,
        title: event.subject,
        description: event.description,
        type: event.type,
        start: event.scheduledAt,
        end: event.endTime || dayjs(event.scheduledAt).add(event.duration, 'minute').toDate(),
        allDay: event.allDay,
        color: color,
        priority: event.priority,
        status: event.status,
        visibility: event.visibility,
        assignedTo: event.assignedTo,
        createdBy: event.createdBy,
        isRecurring: event.isRecurring,
        parentEvent: event.parentEvent,
    };
};

module.exports = exports;
