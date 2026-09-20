const Activity = require('../models/Activity');
const User = require('../models/User');

// @desc    Get all activities with filtering
// @route   GET /api/activities
// @access  Private
exports.getActivities = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            type,
            status,
            assignedTo,
            relatedToEntity,
            relatedToId,
            sortBy = 'scheduledAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};

        if (type) query.type = type;
        if (status) query.status = status;
        if (assignedTo) query.assignedTo = assignedTo;

        // Filter by Related Entity (e.g. Lead, Contact)
        if (relatedToEntity && relatedToId) {
            query['relatedTo.entityType'] = relatedToEntity;
            query['relatedTo.entityId'] = relatedToId;
        }

        // Role-based access
        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const Employee = require('../models/Employee');

        if (roleSlug === 'super_admin') {
            // Super Admin can see all activities - no additional filter
        } else if (roleSlug?.includes('employee')) {
            const employee = await Employee.findOne({ user: req.user._id });
            if (employee) {
                query.$or = [{ assignedTo: employee._id }, { 'participants': employee._id }];
            }
        } else if (roleSlug === 'admin' || roleSlug?.endsWith('_admin')) {
            // Admins see activities of employees in their related department
            const employee = await Employee.findOne({ user: req.user._id });
            const dept = employee ? employee.department : req.user.department;

            if (dept) {
                const deptEmployees = await Employee.find({ department: dept }).select('_id');
                const deptEmpIds = deptEmployees.map(e => e._id);

                query.$or = [
                    { assignedTo: { $in: deptEmpIds } },
                    { participants: { $in: deptEmpIds } },
                    { createdBy: req.user._id }
                ];
            } else {
                // Fallback: only see their own/created activities
                query.$or = [
                    { assignedTo: employee ? employee._id : null },
                    { createdBy: req.user._id }
                ];
            }
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const activities = await Activity.find(query)
            .populate('assignedTo', 'user employeeId designation')
            .populate('participants', 'user employeeId')
            .sort({ createdAt: -1, scheduledAt: -1 })  // Most recent first
            .skip(skip)
            .limit(parseInt(limit));

        // Populate createdBy
        await Activity.populate(activities, { path: 'createdBy', select: 'name' });
        await Activity.populate(activities, { path: 'assignedTo.user', select: 'name email' });

        const totalItems = await Activity.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                activities,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ success: false, message: 'Error fetching activities' });
    }
};

// @desc    Create new activity
// @route   POST /api/activities
// @access  Private
exports.createActivity = async (req, res) => {
    try {
        // Find employee record for current user
        const Employee = require('../models/Employee');
        const employee = await Employee.findOne({ user: req.user._id });

        if (!employee) {
            return res.status(400).json({
                success: false,
                error: { code: 'NO_EMPLOYEE_PROFILE', message: 'No employee profile found for current user' },
            });
        }

        const activityData = {
            ...req.body,
            createdBy: req.user._id,
            assignedTo: req.body.assignedTo || employee._id // Use provided assignedTo or default to current user's employee ID
        };

        const activity = await Activity.create(activityData);

        // Populate for immediate return
        const populatedActivity = await Activity.findById(activity._id)
            .populate('assignedTo', 'user')
            .populate('assignedTo.user', 'name');

        res.status(201).json({
            success: true,
            message: 'Activity created successfully',
            data: populatedActivity,
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: error.message },
        });
    }
};

// @desc    Update activity
// @route   PUT /api/activities/:id
// @access  Private
exports.updateActivity = async (req, res) => {
    try {
        const updates = req.body;

        // If setting status to completed, mark completedAt
        if (updates.status === 'completed' && !updates.completedAt) {
            updates.completedAt = new Date();
        }

        const activity = await Activity.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        );

        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }

        res.status(200).json({
            success: true,
            message: 'Activity updated successfully',
            data: activity,
        });
    } catch (error) {
        console.error('Error updating activity:', error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Delete activity
// @route   DELETE /api/activities/:id
// @access  Private
exports.deleteActivity = async (req, res) => {
    try {
        const activity = await Activity.findByIdAndDelete(req.params.id);

        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity not found' });
        }

        res.status(200).json({ success: true, message: 'Activity deleted successfully' });
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get upcoming activities for dashboard/reminders
// @route   GET /api/activities/upcoming
// @access  Private
exports.getUpcomingActivities = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        // Logic to get activities that are 'scheduled' and sorted by date asc (nearest first)
        // Filter by assignedTo current user typically

        // Find employee ID for current user
        // const employee = await Employee.findOne({ user: req.user._id }); ... logic needed if strict

        const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
        const Employee = require('../models/Employee');
        const query = {
            status: { $in: ['scheduled', 'in-progress'] },
            scheduledAt: { $gte: new Date() }
        };

        // Role-based filtering
        if (roleSlug === 'super_admin') {
            // No additional filter
        } else if (roleSlug?.includes('employee')) {
            const employee = await Employee.findOne({ user: req.user._id });
            if (employee) {
                query.$or = [{ assignedTo: employee._id }, { 'participants': employee._id }];
            }
        } else if (roleSlug === 'admin' || roleSlug?.endsWith('_admin')) {
            const employee = await Employee.findOne({ user: req.user._id });
            const dept = employee ? employee.department : req.user.department;

            if (dept) {
                const deptEmployees = await Employee.find({ department: dept }).select('_id');
                const deptEmpIds = deptEmployees.map(e => e._id);

                query.$or = [
                    { assignedTo: { $in: deptEmpIds } },
                    { participants: { $in: deptEmpIds } },
                    { createdBy: req.user._id }
                ];
            } else {
                query.$or = [
                    { assignedTo: employee ? employee._id : null },
                    { createdBy: req.user._id }
                ];
            }
        }

        const activities = await Activity.find(query)
            .sort({ scheduledAt: 1 })
            .limit(parseInt(limit))
            .populate('relatedTo.entityId', 'firstName lastName company name title subject'); // Polymorphic populate is tricky in Mongoose without proper refPath options often needing manual population or explicit ref paths. 
        // Since 'refPath' is 'relatedTo.entityType', it should work if model names match.

        res.status(200).json({
            success: true,
            data: activities
        });

    } catch (error) {
        console.error('Error fetching upcoming activities:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
