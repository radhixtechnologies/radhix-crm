const ExitRequest = require('../../models/ExitRequest');
const ExitTask = require('../../models/ExitTask');
const ExitInterview = require('../../models/ExitInterview');
const AssetRecovery = require('../../models/AssetRecovery');
const FnFSettlement = require('../../models/FnFSettlement');
const ExitDocument = require('../../models/ExitDocument');
const FinalSettlement = require('../../models/FinalSettlement');
const Employee = require('../../models/Employee');
const LeaveBalance = require('../../models/LeaveBalance');
const Payroll = require('../../models/Payroll');
const logActivity = require('../../utils/activityLogger');

// ========== EXIT TASK MANAGEMENT ==========

// @desc    Get exit tasks for a request
// @route   GET /api/hrm/exit/:id/tasks
// @access  Private
exports.getExitTasks = async (req, res) => {
    try {
        const tasks = await ExitTask.find({ exitRequest: req.params.id })
            .populate('assignedTo', 'name email')
            .populate('completedBy', 'name')
            .populate('createdBy', 'name')
            .sort({ createdAt: 1 });

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching exit tasks:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create exit task
// @route   POST /api/hrm/exit/:id/tasks
// @access  Private (HR/Admin)
exports.createExitTask = async (req, res) => {
    try {
        const {
            taskName,
            description,
            assignedTo,
            assignedRole,
            category,
            isMandatory,
            dueDate
        } = req.body;

        // If no specific user assigned, find appropriate user based on role
        let finalAssignedTo = assignedTo;

        if (!assignedTo || assignedTo === '') {
            const User = require('../../models/User');
            const ExitRequest = require('../../models/ExitRequest');
            const Employee = require('../../models/Employee');

            if (assignedRole === 'employee') {
                // Assign to the exiting employee
                const exitRequest = await ExitRequest.findById(req.params.id).populate('employee');
                if (exitRequest && exitRequest.employee && exitRequest.employee.user) {
                    finalAssignedTo = exitRequest.employee.user;
                }
            } else {
                // Find a user with the specified role
                const roleMap = {
                    'manager': 'admin',
                    'hr': 'admin',
                    'it': 'admin',
                    'admin': 'admin',
                    'finance': 'admin'
                };

                const targetRole = roleMap[assignedRole] || 'admin';
                const user = await User.findOne({ role: targetRole, isActive: true });
                if (user) {
                    finalAssignedTo = user._id;
                }
            }

            // If still no user found, assign to current user (creator)
            if (!finalAssignedTo) {
                finalAssignedTo = req.user._id;
            }
        }

        const task = await ExitTask.create({
            exitRequest: req.params.id,
            taskName,
            description,
            assignedTo: finalAssignedTo,
            assignedRole,
            category,
            isMandatory,
            dueDate,
            createdBy: req.user._id
        });

        await logActivity(
            req.user._id,
            'create',
            'hrm',
            'ExitTask',
            task._id,
            `Created exit task: ${taskName}`,
            req.ip
        );

        res.status(201).json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error creating exit task:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update exit task
// @route   PUT /api/hrm/exit/tasks/:taskId
// @access  Private
exports.updateExitTask = async (req, res) => {
    try {
        const task = await ExitTask.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        Object.assign(task, req.body);
        await task.save();

        res.json({
            success: true,
            data: task
        });
    } catch (error) {
        console.error('Error updating exit task:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Complete exit task
// @route   POST /api/hrm/exit/tasks/:taskId/complete
// @access  Private
exports.completeExitTask = async (req, res) => {
    try {
        const { comments, attachments } = req.body;

        const task = await ExitTask.findById(req.params.taskId);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found'
            });
        }

        task.status = 'completed';
        task.completedBy = req.user._id;
        task.completedAt = new Date();
        task.comments = comments;
        if (attachments) task.attachments = attachments;

        await task.save();

        // Check if all mandatory tasks are completed
        const exitRequest = await ExitRequest.findById(task.exitRequest);
        const allTasks = await ExitTask.find({ exitRequest: task.exitRequest });
        const allMandatoryCompleted = allTasks
            .filter(t => t.isMandatory)
            .every(t => t.status === 'completed');

        if (allMandatoryCompleted) {
            exitRequest.allTasksCompleted = true;
            await exitRequest.save();
        }

        await logActivity(
            req.user._id,
            'update',
            'hrm',
            'ExitTask',
            task._id,
            `Completed exit task: ${task.taskName}`,
            req.ip
        );

        res.json({
            success: true,
            data: task,
            message: 'Task completed successfully'
        });
    } catch (error) {
        console.error('Error completing exit task:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user's assigned exit tasks
// @route   GET /api/hrm/exit/my-tasks
// @access  Private
exports.getMyExitTasks = async (req, res) => {
    try {
        const tasks = await ExitTask.find({
            assignedTo: req.user._id,
            status: { $in: ['pending', 'in_progress'] }
        })
            .populate('exitRequest')
            .populate({
                path: 'exitRequest',
                populate: { path: 'employee', select: 'firstName lastName employeeId' }
            })
            .sort({ dueDate: 1 });

        res.json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        console.error('Error fetching my exit tasks:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== ASSET RECOVERY ==========

// @desc    Get asset recovery status
// @route   GET /api/hrm/exit/:id/assets
// @access  Private
exports.getAssetRecovery = async (req, res) => {
    try {
        let assetRecovery = await AssetRecovery.findOne({ exitRequest: req.params.id })
            .populate('employee', 'firstName lastName employeeId')
            .populate('clearanceGivenBy', 'firstName lastName')
            .populate('assets.receivedBy', 'firstName lastName');

        if (!assetRecovery) {
            return res.status(404).json({
                success: false,
                message: 'Asset recovery record not found'
            });
        }

        res.json({
            success: true,
            data: assetRecovery
        });
    } catch (error) {
        console.error('Error fetching asset recovery:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update asset return status
// @route   PUT /api/hrm/exit/:id/assets
// @access  Private (HR/Admin/IT)
exports.updateAssetRecovery = async (req, res) => {
    try {
        const { assets } = req.body;

        let assetRecovery = await AssetRecovery.findOne({ exitRequest: req.params.id });

        if (!assetRecovery) {
            // Create if doesn't exist
            const exitRequest = await ExitRequest.findById(req.params.id);
            assetRecovery = await AssetRecovery.create({
                exitRequest: req.params.id,
                employee: exitRequest.employee,
                assets: assets || []
            });
        } else {
            assetRecovery.assets = assets;
        }

        // Calculate total damage charges
        assetRecovery.calculateTotalDamageCharges();

        // Check if all assets returned
        assetRecovery.checkAllAssetsReturned();

        await assetRecovery.save();

        // Update exit request
        const exitRequest = await ExitRequest.findById(req.params.id);
        exitRequest.allAssetsReturned = assetRecovery.allAssetsReturned;
        await exitRequest.save();

        res.json({
            success: true,
            data: assetRecovery
        });
    } catch (error) {
        console.error('Error updating asset recovery:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Give asset clearance
// @route   POST /api/hrm/exit/:id/assets/clearance
// @access  Private (HR/Admin)
exports.giveAssetClearance = async (req, res) => {
    try {
        const { clearanceComments } = req.body;

        const assetRecovery = await AssetRecovery.findOne({ exitRequest: req.params.id });

        if (!assetRecovery) {
            return res.status(404).json({
                success: false,
                message: 'Asset recovery record not found'
            });
        }

        assetRecovery.clearanceGiven = true;
        assetRecovery.clearanceGivenBy = req.user._id;
        assetRecovery.clearanceDate = new Date();
        assetRecovery.clearanceComments = clearanceComments;

        await assetRecovery.save();

        await logActivity(
            req.user._id,
            'update',
            'hrm',
            'AssetRecovery',
            assetRecovery._id,
            'Gave asset clearance',
            req.ip
        );

        res.json({
            success: true,
            data: assetRecovery,
            message: 'Asset clearance given successfully'
        });
    } catch (error) {
        console.error('Error giving asset clearance:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ========== ENHANCED EXIT INTERVIEW ==========

// @desc    Submit exit interview
// @route   POST /api/hrm/exit/:id/interview
// @access  Private (HR/Admin)
exports.submitExitInterview = async (req, res) => {
    try {
        const exitRequest = await ExitRequest.findById(req.params.id);

        if (!exitRequest) {
            return res.status(404).json({
                success: false,
                message: 'Exit request not found'
            });
        }

        // Check if interview already exists
        let interview = await ExitInterview.findOne({ exitRequest: req.params.id });

        if (interview) {
            // Update existing
            Object.assign(interview, req.body);
        } else {
            // Create new
            interview = await ExitInterview.create({
                exitRequest: req.params.id,
                employee: exitRequest.employee,
                interviewedBy: req.user._id,
                interviewDate: new Date(),
                ...req.body
            });
        }

        await interview.save();

        // Update exit request
        exitRequest.exitInterviewCompleted = true;
        exitRequest.exitInterviewDate = interview.interviewDate;
        exitRequest.exitInterviewBy = req.user._id;
        await exitRequest.save();

        await logActivity(
            req.user._id,
            'create',
            'hrm',
            'ExitInterview',
            interview._id,
            'Submitted exit interview',
            req.ip
        );

        res.status(201).json({
            success: true,
            data: interview,
            message: 'Exit interview submitted successfully'
        });
    } catch (error) {
        console.error('Error submitting exit interview:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get exit interview
// @route   GET /api/hrm/exit/:id/interview
// @access  Private
exports.getExitInterview = async (req, res) => {
    try {
        const interview = await ExitInterview.findOne({ exitRequest: req.params.id })
            .populate('employee', 'firstName lastName employeeId')
            .populate('interviewedBy', 'firstName lastName');

        if (!interview) {
            return res.status(404).json({
                success: false,
                message: 'Exit interview not found'
            });
        }

        res.json({
            success: true,
            data: interview
        });
    } catch (error) {
        console.error('Error fetching exit interview:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all exit interviews (for analytics)
// @route   GET /api/hrm/exit/interviews
// @access  Private (HR/Admin)
exports.getAllExitInterviews = async (req, res) => {
    try {
        const { fromDate, toDate, department } = req.query;

        const query = {};
        if (fromDate || toDate) {
            query.interviewDate = {};
            if (fromDate) query.interviewDate.$gte = new Date(fromDate);
            if (toDate) query.interviewDate.$lte = new Date(toDate);
        }

        const interviews = await ExitInterview.find(query)
            .populate({
                path: 'employee',
                select: 'firstName lastName employeeId department',
                populate: { path: 'department', select: 'name' }
            })
            .populate('interviewedBy', 'firstName lastName')
            .sort({ interviewDate: -1 });

        res.json({
            success: true,
            count: interviews.length,
            data: interviews
        });
    } catch (error) {
        console.error('Error fetching exit interviews:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = exports;
