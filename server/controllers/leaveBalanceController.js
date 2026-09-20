const Employee = require('../models/Employee');
const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const leaveBalanceService = require('../services/leaveBalanceService');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/activityLogger');

// @desc    Get leave balance for employee
// @route   GET /api/employees/leave-balance
// @route   GET /api/employees/:id/leave-balance
// @access  Private
exports.getLeaveBalance = asyncHandler(async (req, res) => {
  // Employee ID is now required in the URL path (/:id)
  console.log('getLeaveBalance request params:', req.params);
  console.log('getLeaveBalance request query:', req.query);

  if (!req.params.id) {
    console.log('Missing ID in params');
    throw new AppError('Employee ID is required in the URL path. Expected: /api/employees/leave-balance/:id', 400);
  }

  let employeeId = req.params.id;
  if (employeeId && typeof employeeId !== 'string' && employeeId.toString) {
    employeeId = employeeId.toString();
  }

  console.log('Processed employeeId:', employeeId);

  // Ensure employeeId is a valid string
  if (!employeeId || typeof employeeId !== 'string') {
    console.log('Invalid employeeId format or type');
    throw new AppError('Invalid employee ID format. Must be a valid ObjectId string', 400);
  }

  // Check authorization: employees can only view their own balance
  if (req.user.role === 'employee') {
    const currentEmployee = await Employee.findOne({ user: req.user._id });
    if (!currentEmployee) {
      throw new AppError('Employee record not found for current user', 404);
    }
    const currentEmployeeId = currentEmployee._id.toString();
    if (currentEmployeeId !== employeeId) {
      throw new AppError('Not authorized to view this employee\'s leave balance', 403);
    }
  }

  // Parse year from query string, defaulting to current year
  let year = null;
  if (req.query.year && req.query.year !== 'undefined' && req.query.year !== 'null') {
    const parsedYear = parseInt(req.query.year, 10);
    // Ignore invalid instead of throw
    if (!isNaN(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100) {
      year = parsedYear;
    }
  }

  // Get leave balance (this will create balance if it doesn't exist)
  const result = await leaveBalanceService.getLeaveBalance(employeeId, year, req.user);

  // Recalculate balances based on actual leave records to ensure accuracy
  const balanceYear = year || new Date().getFullYear();
  try {
    await recalculateLeaveBalance(employeeId, balanceYear);
  } catch (error) {
    // Log recalculation error but don't fail the request
    console.error('Error recalculating leave balance:', error);
  }

  // Refresh from database after recalculation to get updated values
  const refreshed = await leaveBalanceService.getLeaveBalance(employeeId, year, req.user);

  res.status(200).json(refreshed);
});

// @desc    Update leave balance (for policy changes)
// @route   PUT /api/employees/:id/leave-balance
// @access  Private (Admin, Super Admin)
exports.updateLeaveBalance = asyncHandler(async (req, res) => {
  let employeeId = req.params.id;

  // Ensure employeeId is a string
  if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
    employeeId = employeeId.toString();
  }

  const result = await leaveBalanceService.updateLeaveBalance(employeeId, req.body, req.user);

  logActivity(req.user._id, 'update', 'employee', 'LeaveBalance', result.data._id, req.body, req.ip).catch(console.error);

  res.status(200).json(result);
});

// @desc    Reset leave balance for new year
// @route   POST /api/employees/:id/leave-balance/reset
// @access  Private (Admin, Super Admin)
exports.resetLeaveBalance = asyncHandler(async (req, res) => {
  let employeeId = req.params.id;

  // Ensure employeeId is a string
  if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
    employeeId = employeeId.toString();
  }

  const { year } = req.body;
  const newYear = year || new Date().getFullYear();

  const result = await leaveBalanceService.resetLeaveBalance(employeeId, newYear, req.user);

  logActivity(req.user._id, 'create', 'employee', 'LeaveBalance', result.data._id, { year: newYear }, req.ip).catch(console.error);

  res.status(201).json(result);
});

// @desc    Get leave reports (monthly history, team overview)
// @route   GET /api/employees/leave-reports
// @access  Private
exports.getLeaveReports = async (req, res) => {
  try {
    const { month, year, employeeId, department } = req.query;
    const reportYear = year ? parseInt(year) : new Date().getFullYear();
    const reportMonth = month ? parseInt(month) : null;

    let query = {};

    // Build date range - use startDate (when leave actually starts) instead of createdAt
    if (reportMonth) {
      // Filter by specific month
      const startDate = new Date(reportYear, reportMonth - 1, 1);
      const endDate = new Date(reportYear, reportMonth, 0, 23, 59, 59);
      query.startDate = {
        $gte: startDate,
        $lte: endDate,
      };
    } else {
      // Filter by entire year when no month is specified
      const yearStart = new Date(reportYear, 0, 1);
      const yearEnd = new Date(reportYear, 11, 31, 23, 59, 59);
      query.startDate = {
        $gte: yearStart,
        $lte: yearEnd,
      };
    }

    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found',
        });
      }
      query.employee = employee._id;
    } else {
      if (employeeId) {
        query.employee = employeeId;
      }
      if (department) {
        const employees = await Employee.find({ department }).select('_id');
        const employeeIds = employees.map(e => e._id);
        query.employee = { $in: employeeIds };
      }
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'employeeId department designation user')
      .populate('employee.user', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ startDate: -1 });

    // Calculate statistics
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      byType: {
        casual: leaves.filter(l => l.type === 'casual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        sick: leaves.filter(l => l.type === 'sick' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        annual: leaves.filter(l => l.type === 'annual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        maternity: leaves.filter(l => l.type === 'maternity' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        paternity: leaves.filter(l => l.type === 'paternity' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        unpaid: leaves.filter(l => l.type === 'unpaid' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
    };

    // Team overview (only for admins)
    let teamOverview = null;
    if ((req.user.role === 'admin' || req.user.role === 'super_admin') && !employeeId) {
      const allEmployees = await Employee.find({ status: 'active' })
        .populate('user', 'name email');

      teamOverview = await Promise.all(
        allEmployees.map(async (emp) => {
          const empBalance = await LeaveBalance.findOne({ employee: emp._id, year: reportYear });
          const empLeaves = leaves.filter(l => l.employee._id.toString() === emp._id.toString());

          return {
            employee: {
              _id: emp._id,
              employeeId: emp.employeeId,
              name: emp.user?.name,
              department: emp.department,
            },
            balance: empBalance?.balances || null,
            leavesThisMonth: empLeaves.length,
            daysThisMonth: empLeaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
          };
        })
      );
    }

    res.status(200).json({
      success: true,
      data: {
        leaves,
        stats,
        teamOverview,
        month: reportMonth || null,
        year: reportYear,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper function to recalculate leave balance
async function recalculateLeaveBalance(employeeId, year) {
  try {
    const leaveBalance = await LeaveBalance.findOne({ employee: employeeId, year });
    if (!leaveBalance) return;

    // Get all leaves for this employee in this year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const leaves = await Leave.find({
      employee: employeeId,
      startDate: { $gte: yearStart, $lte: yearEnd },
    });

    // Reset counts
    Object.keys(leaveBalance.balances).forEach(leaveType => {
      leaveBalance.balances[leaveType].used = 0;
      leaveBalance.balances[leaveType].pending = 0;
    });

    // Calculate used and pending
    leaves.forEach(leave => {
      const leaveType = leave.type;
      if (leaveBalance.balances[leaveType]) {
        if (leave.status === 'approved') {
          leaveBalance.balances[leaveType].used += leave.days;
        } else if (leave.status === 'pending') {
          leaveBalance.balances[leaveType].pending += leave.days;
        }
      }
    });

    // Recalculate available
    Object.keys(leaveBalance.balances).forEach(leaveType => {
      leaveBalance.balances[leaveType].available =
        leaveBalance.balances[leaveType].total -
        leaveBalance.balances[leaveType].used -
        leaveBalance.balances[leaveType].pending;
    });

    await leaveBalance.save();
  } catch (error) {
    console.error('Error recalculating leave balance:', error);
  }
}

// @desc    Deduct leave from balance
// @route   POST /api/employees/:id/leave-balance/deduct
// @access  Private (Admin, Super Admin)
exports.deductLeave = asyncHandler(async (req, res) => {
  let employeeId = req.params.id;

  // Ensure employeeId is a string
  if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
    employeeId = employeeId.toString();
  }

  const { leaveType, days, year } = req.body;

  if (!leaveType || !days) {
    throw new AppError('Leave type and days are required', 400);
  }

  const result = await leaveBalanceService.deductLeave(
    employeeId,
    leaveType,
    parseFloat(days),
    year || null
  );

  res.status(200).json({
    success: true,
    message: `${days} day(s) deducted from ${leaveType} leave`,
    ...result,
  });
});

// @desc    Get leave balance summary (admin view)
// @route   GET /api/employees/leaves/summary
// @access  Private (Admin, Super Admin)
exports.getLeaveBalanceSummary = asyncHandler(async (req, res) => {
  const result = await leaveBalanceService.getLeaveBalanceSummary(req.query, req.user);
  res.status(200).json(result);
});

// Export helper function for use in leave controller
exports.recalculateLeaveBalance = recalculateLeaveBalance;

