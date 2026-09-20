const Automation = require('../models/Automation');
const Lead = require('../models/Lead');
const Contact = require('../models/Contact');

// @desc    Get all automations
// @route   GET /api/marketing/automations
// @access  Private
exports.getAllAutomations = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status,
            triggerType,
            sortBy = 'createdAt',
            sortOrder = 'desc',
        } = req.query;

        const query = {};

        // Search
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Filter by status
        if (status) {
            query.status = status;
        }

        // Filter by trigger type
        if (triggerType) {
            query['trigger.type'] = triggerType;
        }

        // Pagination
        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const automations = await Automation.find(query)
            .populate('owner', 'user employeeId')
            .populate('filters.segments', 'name')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Automation.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                automations,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching automations:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching automations',
                details: error.message,
            },
        });
    }
};

// @desc    Get automation by ID
// @route   GET /api/marketing/automations/:id
// @access  Private
exports.getAutomationById = async (req, res) => {
    try {
        const automation = await Automation.findById(req.params.id)
            .populate('owner', 'user employeeId')
            .populate('filters.segments', 'name contactCount')
            .populate('actions.config.userId', 'user')
            .populate('actions.config.assignedTo', 'user');

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            data: automation,
        });
    } catch (error) {
        console.error('Error fetching automation:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching automation',
                details: error.message,
            },
        });
    }
};

// @desc    Create new automation
// @route   POST /api/marketing/automations
// @access  Private (Admin/Super Admin only)
exports.createAutomation = async (req, res) => {
    try {
        // Only admins and super admins can create automations
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to create automations',
                },
            });
        }

        const automationData = {
            ...req.body,
            createdBy: req.user._id,
        };

        const automation = await Automation.create(automationData);

        res.status(201).json({
            success: true,
            message: 'Automation created successfully',
            data: automation,
        });
    } catch (error) {
        console.error('Error creating automation:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error creating automation',
                details: error.message,
            },
        });
    }
};

// @desc    Update automation
// @route   PUT /api/marketing/automations/:id
// @access  Private (Admin/Super Admin only)
exports.updateAutomation = async (req, res) => {
    try {
        // Only admins and super admins can update automations
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to update automations',
                },
            });
        }

        const automation = await Automation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            message: 'Automation updated successfully',
            data: automation,
        });
    } catch (error) {
        console.error('Error updating automation:', error);
        res.status(400).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Error updating automation',
                details: error.message,
            },
        });
    }
};

// @desc    Delete automation
// @route   DELETE /api/marketing/automations/:id
// @access  Private (Super Admin only)
exports.deleteAutomation = async (req, res) => {
    try {
        // Only super admins can delete automations
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to delete automations',
                },
            });
        }

        const automation = await Automation.findById(req.params.id);

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        await automation.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Automation deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting automation:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error deleting automation',
                details: error.message,
            },
        });
    }
};

// @desc    Toggle automation status (active/paused)
// @route   PATCH /api/marketing/automations/:id/status
// @access  Private (Admin/Super Admin only)
exports.toggleAutomationStatus = async (req, res) => {
    try {
        // Only admins and super admins can toggle status
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to modify automation status',
                },
            });
        }

        const { status } = req.body;

        if (!['active', 'paused', 'draft'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: 'Invalid status value',
                },
            });
        }

        const automation = await Automation.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        res.status(200).json({
            success: true,
            message: `Automation ${status}`,
            data: automation,
        });
    } catch (error) {
        console.error('Error toggling automation status:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error toggling automation status',
                details: error.message,
            },
        });
    }
};

// @desc    Get automation execution history
// @route   GET /api/marketing/automations/:id/history
// @access  Private
exports.getAutomationHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const automation = await Automation.findById(req.params.id);

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        // Paginate execution history
        const skip = (page - 1) * limit;
        const history = automation.executionHistory
            .sort((a, b) => b.executedAt - a.executedAt)
            .slice(skip, skip + parseInt(limit));

        const totalItems = automation.executionHistory.length;

        res.status(200).json({
            success: true,
            data: {
                history,
                metrics: automation.metrics,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalItems / limit),
                    totalItems,
                    itemsPerPage: parseInt(limit),
                },
            },
        });
    } catch (error) {
        console.error('Error fetching automation history:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching automation history',
                details: error.message,
            },
        });
    }
};

// @desc    Test automation
// @route   POST /api/marketing/automations/:id/test
// @access  Private (Admin/Super Admin only)
exports.testAutomation = async (req, res) => {
    try {
        // Only admins and super admins can test automations
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to test automations',
                },
            });
        }

        const { entityType, entityId } = req.body;

        const automation = await Automation.findById(req.params.id);

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        // Execute automation in test mode
        const result = await automation.execute(entityType, entityId);

        res.status(200).json({
            success: true,
            message: 'Automation test completed',
            data: result,
        });
    } catch (error) {
        console.error('Error testing automation:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error testing automation',
                details: error.message,
            },
        });
    }
};

// @desc    Trigger automation manually
// @route   POST /api/marketing/automations/:id/trigger
// @access  Private (Admin/Super Admin only)
exports.triggerAutomation = async (req, res) => {
    try {
        // Only admins and super admins can manually trigger automations
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Not authorized to trigger automations',
                },
            });
        }

        const { entityType, entityId } = req.body;

        const automation = await Automation.findById(req.params.id);

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        if (automation.status !== 'active') {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'AUTOMATION_NOT_ACTIVE',
                    message: 'Automation must be active to trigger',
                },
            });
        }

        // Execute automation
        const result = await automation.execute(entityType, entityId);

        res.status(200).json({
            success: result.success,
            message: result.success ? 'Automation triggered successfully' : 'Automation execution failed',
            data: result,
        });
    } catch (error) {
        console.error('Error triggering automation:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error triggering automation',
                details: error.message,
            },
        });
    }
};

// @desc    Get automation statistics
// @route   GET /api/marketing/automations/:id/stats
// @access  Private
exports.getAutomationStats = async (req, res) => {
    try {
        const automation = await Automation.findById(req.params.id);

        if (!automation) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Automation not found',
                },
            });
        }

        const stats = {
            metrics: automation.metrics,
            successRate: automation.metrics.totalExecutions > 0
                ? (automation.metrics.successfulExecutions / automation.metrics.totalExecutions) * 100
                : 0,
            failureRate: automation.metrics.totalExecutions > 0
                ? (automation.metrics.failedExecutions / automation.metrics.totalExecutions) * 100
                : 0,
            averageActionsPerExecution: automation.executionHistory.length > 0
                ? automation.executionHistory.reduce((sum, h) => sum + h.actionsExecuted, 0) / automation.executionHistory.length
                : 0,
            recentExecutions: automation.executionHistory.slice(-10).reverse(),
        };

        res.status(200).json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching automation stats:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'SERVER_ERROR',
                message: 'Error fetching automation stats',
                details: error.message,
            },
        });
    }
};
