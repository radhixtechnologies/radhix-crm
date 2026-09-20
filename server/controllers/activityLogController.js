const ActivityLog = require('../models/ActivityLog');
const Employee = require('../models/Employee');

// @desc    Get activity logs for current user or employee
// @route   GET /api/employees/activity-logs
// @route   GET /api/employees/:id/activity-logs
// @access  Private
exports.getActivityLogs = async (req, res) => {
  try {
    let query = {};
    let employeeId = req.params.id;

    // If employee ID is provided, get logs for that employee
    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }

      // Get role slug
      const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
      
      // Check access - employees can only see their own logs, admins can see any
      if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
          roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
          roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
        const empRecord = await Employee.findOne({ user: req.user._id });
        if (!empRecord || empRecord._id.toString() !== employee._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        }
      }

      query.user = employee.user;
    } else {
      // If no ID provided, get logs for current user
      const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
      
      if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
          roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
          roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
        query.user = req.user._id;
      } else {
        // Admins can filter by user
        if (req.query.userId) {
          query.user = req.query.userId;
        }
      }
    }

    // Filter by module, action, date range
    if (req.query.module) {
      query.module = req.query.module;
    }
    if (req.query.action) {
      query.action = req.query.action;
    }
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const activityLogs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ActivityLog.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activityLogs.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: activityLogs,
    });
  } catch (error) {
    console.error('Error getting activity logs:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get login history
// @route   GET /api/employees/login-history
// @route   GET /api/employees/:id/login-history
// @access  Private
exports.getLoginHistory = async (req, res) => {
  try {
    let query = { action: 'login', module: 'auth' };
    let employeeId = req.params.id;

    if (employeeId) {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }

      // Get role slug
      const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;

      // Check access
      if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
          roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
          roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
        const empRecord = await Employee.findOne({ user: req.user._id });
        if (!empRecord || empRecord._id.toString() !== employee._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Access denied',
          });
        }
      }

      query.user = employee.user;
    } else {
      const roleSlug = typeof req.user.role === 'object' ? req.user.role?.slug : req.user.role;
      
      if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
          roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
          roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
        query.user = req.user._id;
      } else if (req.query.userId) {
        query.user = req.query.userId;
      }
    }

    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const loginHistory = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await ActivityLog.countDocuments(query);

    // Calculate statistics
    const lastLogin = loginHistory[0]?.createdAt || null;
    const totalLogins = total;
    
    // Group by date for login frequency
    const loginFrequency = {};
    loginHistory.forEach(log => {
      const date = new Date(log.createdAt).toDateString();
      loginFrequency[date] = (loginFrequency[date] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      count: loginHistory.length,
      total: totalLogins,
      page,
      pages: Math.ceil(total / limit),
      lastLogin,
      loginFrequency,
      data: loginHistory,
    });
  } catch (error) {
    console.error('Error getting login history:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get activity timeline for employee
// @route   GET /api/employees/:id/timeline
// @access  Private
exports.getActivityTimeline = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check access
    if (req.user.role === 'employee') {
      const empRecord = await Employee.findOne({ user: req.user._id });
      if (!empRecord || empRecord._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Get all activity logs for the employee
    const logs = await ActivityLog.find({ user: employee.user })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);

    // Group logs by date
    const timeline = {};
    logs.forEach(log => {
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      if (!timeline[date]) {
        timeline[date] = [];
      }
      timeline[date].push(log);
    });

    // Convert to array format for easier frontend consumption
    const timelineArray = Object.keys(timeline)
      .sort((a, b) => new Date(b) - new Date(a))
      .map(date => ({
        date,
        activities: timeline[date],
      }));

    res.status(200).json({
      success: true,
      count: logs.length,
      data: timelineArray,
    });
  } catch (error) {
    console.error('Error getting activity timeline:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/employees/:id/activity-stats
// @access  Private
exports.getActivityStats = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check access
    if (req.user.role === 'employee') {
      const empRecord = await Employee.findOne({ user: req.user._id });
      if (!empRecord || empRecord._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Get statistics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await ActivityLog.find({
      user: employee.user,
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate stats
    const stats = {
      totalActivities: logs.length,
      byAction: {},
      byModule: {},
      byEntity: {},
      recentActivities: logs.slice(0, 10),
    };

    logs.forEach(log => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      // Count by module
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
      // Count by entity
      stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting activity stats:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

