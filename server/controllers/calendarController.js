const CalendarEvent = require('../models/CalendarEvent');
const Leave = require('../models/Leave'); // Assuming model exists
const Task = require('../models/Task');   // Assuming model exists
const Activity = require('../models/Activity');
// const User = require('../models/User');

// Helper to determine event color based on type
const getEventColor = (type, status) => {
    const colors = {
        // Custom Events
        meeting: '#8b5cf6', // Violet
        personal: '#3b82f6', // Blue
        holiday: '#10b981', // Emerald
        interview: '#f59e0b', // Amber
        training: '#06b6d4', // Cyan
        appraisal: '#ec4899', // Pink
        payroll: '#14b8a6', // Teal

        // Activity Types
        call: '#0ea5e9',    // Sky Blue
        email: '#a855f7',   // Purple
        task: '#6366f1',    // Indigo (shared)
        note: '#94a3b8',    // Slate
        sms: '#ec4899',     // Pink
        demo: '#f43f5e',    // Rose
        presentation: '#84cc16', // Lime
        reminder: '#eab308', // Yellow

        // Modules
        leave_pending: '#f97316', // Orange
        leave_approved: '#ef4444', // Red (Absent/Leave)
        task_pending: '#6366f1', // Indigo
        task_completed: '#9ca3af', // Gray

        // Status based overrides
        cancelled: '#ef4444', // Red
        completed: '#10b981', // Green
    };

    if (status === 'cancelled') return colors.cancelled;
    if (type === 'leave') return status === 'Approved' ? colors.leave_approved : colors.leave_pending;
    if (type === 'task') return status === 'Completed' ? colors.task_completed : colors.task_pending;
    // Fallback for activity completion if not explicitly handled
    if (['call', 'email', 'meeting', 'demo', 'presentation', 'reminder'].includes(type) && status === 'completed') {
        return colors.completed;
    }

    return colors[type] || '#6b7280';
};

// @desc    Get all calendar events (Aggegrated)
// @route   GET /api/calendar
// @access  Private
const getCalendarEvents = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const start = startDate ? new Date(startDate) : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
        const end = endDate ? new Date(endDate) : new Date(new Date().setFullYear(new Date().getFullYear() + 1));

        const events = [];

        // 1. Fetch Custom Calendar Events
        let customEventQuery = {
            startDate: { $gte: start },
            endDate: { $lte: end },
        };

        // Role-based filtering for custom events
        // Role-based filtering for custom events
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        
        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            customEventQuery.$or = [
                { createdBy: req.user._id }, // Own events
                { assignedTo: req.user._id }, // Assigned events
                { roleVisibility: 'employee', isPrivate: false }, // Public employee events
                { type: 'holiday' } // Always show holidays
            ];
        } else if (roleSlug === 'admin' || roleSlug === 'sales_manager' || 
                   roleSlug === 'hrm_admin' || roleSlug === 'finance_manager' ||
                   roleSlug === 'operations_manager' || roleSlug === 'management_admin') {
            // Admins see their own, assigned, and any event visible to admin or employee (unless private to another user)
            customEventQuery.$or = [
                { roleVisibility: { $in: ['admin', 'employee'] } },
                { createdBy: req.user._id }
            ];
        }
        // Super admin sees all (usually), handling logic later if needed.

        const customEvents = await CalendarEvent.find(customEventQuery)
            .populate('createdBy', 'name')
            .populate('assignedTo', 'name');

        customEvents.forEach(evt => {
            events.push({
                id: evt._id,
                title: evt.title,
                start: evt.startDate,
                end: evt.endDate,
                allDay: evt.allDay,
                type: evt.type,
                color: evt.color || getEventColor(evt.type),
                desc: evt.description,
                source: 'calendar',
                extendedProps: {
                    createdBy: evt.createdBy?.name,
                    assignedTo: evt.assignedTo?.name,
                    status: evt.status
                }
            });
        });

        // 2. Fetch Tasks
        // Employees see own tasks. Admins see all tasks (or dept tasks).
        let taskQuery = {
            dueDate: { $gte: start, $lte: end }
        };

        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            taskQuery.assignedTo = req.user._id;
        }

        try {
            const tasks = await Task.find(taskQuery);
            tasks.forEach(task => {
                events.push({
                    id: `task-${task._id}`,
                    title: `Task: ${task.title}`,
                    start: task.dueDate,
                    end: task.dueDate, // Tasks are point-in-time or change to deadline
                    allDay: true,
                    type: 'task',
                    color: getEventColor('task', task.status),
                    source: 'task',
                    extendedProps: {
                        status: task.status
                    }
                });
            });
        } catch (err) {
            console.log("Error fetching tasks for calendar:", err.message);
            // Continue without tasks if model/db error
        }

        // 3. Fetch Leaves
        // Employees see own leaves. Admins see all.
        let leaveQuery = {
            startDate: { $gte: start },
            endDate: { $lte: end }
        };

        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            leaveQuery.employee = req.user._id;
        }

        try {
            const leaves = await Leave.find(leaveQuery).populate('employee', 'name');
            leaves.forEach(leave => {
                events.push({
                    id: `leave-${leave._id}`,
                    title: `Leave: ${leave.employee?.name || 'Unknown'} (${leave.reason})`,
                    start: leave.startDate,
                    end: leave.endDate,
                    allDay: true,
                    type: 'leave',
                    color: getEventColor('leave', leave.status),
                    source: 'leave',
                    extendedProps: {
                        status: leave.status
                    }
                });
            });
        } catch (err) {
            console.log("Error fetching leaves for calendar:", err.message);
        }

        // 4. Fetch Activities
        let activityQuery = {
            scheduledAt: { $gte: start, $lte: end }
        };

        // User based filtering
        // If employee, show activities assigned to them OR created by them
        if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
            roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
            roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
            // For simplicity and safety, we match createdBy to the User ID.
            activityQuery.createdBy = req.user._id;
        }

        try {
            const activities = await Activity.find(activityQuery)
                .populate('relatedTo.entityId', 'firstName lastName name title subject company');

            activities.forEach(act => {
                // Determine title based on relation
                let relatedName = '';
                if (act.relatedTo && act.relatedTo.entityId) {
                    const r = act.relatedTo.entityId;
                    relatedName = ` w/ ${r.firstName ? r.firstName + ' ' + r.lastName : r.name || r.title || r.subject || r.company || ''}`;
                }

                events.push({
                    id: `activity-${act._id}`,
                    title: `${act.type.charAt(0).toUpperCase() + act.type.slice(1)}${relatedName}`,
                    start: act.scheduledAt,
                    end: act.endTime || new Date(new Date(act.scheduledAt).getTime() + (act.duration || 60) * 60000),
                    allDay: act.allDay || false,
                    type: act.type,
                    color: getEventColor(act.type, act.status),
                    source: 'activity',
                    extendedProps: {
                        status: act.status,
                        description: act.description,
                        relatedTo: relatedName.replace(' w/ ', '')
                    }
                });
            });

        } catch (err) {
            console.log("Error fetching activities for calendar:", err.message);
        }

        res.json(events);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error fetching calendar events' });
    }
};

// @desc    Create a new event
// @route   POST /api/calendar
// @access  Private
const createEvent = async (req, res) => {
    try {
        const { title, description, type, startDate, endDate, allDay, assignedTo, roleVisibility, color } = req.body;

        const event = new CalendarEvent({
            title,
            description,
            type,
            startDate,
            endDate,
            allDay,
            createdBy: req.user._id,
            assignedTo,
            roleVisibility,
            color,
            status: 'confirmed'
        });

        const createdEvent = await event.save();
        res.status(201).json(createdEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error creating event' });
    }
};

// @desc    Update an event
// @route   PUT /api/calendar/:id
// @access  Private
const updateEvent = async (req, res) => {
    try {
        const event = await CalendarEvent.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check permission (Creator or Admin)
        // Check permission (Creator or Admin)
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const isAdmin = roleSlug === 'admin' || roleSlug === 'super_admin' || 
                        roleSlug === 'sales_manager' || roleSlug === 'hrm_admin' || 
                        roleSlug === 'finance_manager' || roleSlug === 'operations_manager' || 
                        roleSlug === 'management_admin';

        if (event.createdBy.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to update this event' });
        }

        const updatedEvent = await CalendarEvent.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error updating event' });
    }
};

// @desc    Delete an event
// @route   DELETE /api/calendar/:id
// @access  Private
const deleteEvent = async (req, res) => {
    try {
        const event = await CalendarEvent.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Check permission
        // Check permission
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const isAdmin = roleSlug === 'admin' || roleSlug === 'super_admin' || 
                        roleSlug === 'sales_manager' || roleSlug === 'hrm_admin' || 
                        roleSlug === 'finance_manager' || roleSlug === 'operations_manager' || 
                        roleSlug === 'management_admin';

        if (event.createdBy.toString() !== req.user._id.toString() && !isAdmin) {
            return res.status(401).json({ message: 'Not authorized to delete this event' });
        }

        await event.deleteOne();
        res.json({ message: 'Event removed' });
    } catch (error) {
        console.error('Delete Event Error:', error);
        res.status(500).json({ message: 'Server Error deleting event' });
    }
};

module.exports = {
    getCalendarEvents,
    createEvent,
    updateEvent,
    deleteEvent
};
