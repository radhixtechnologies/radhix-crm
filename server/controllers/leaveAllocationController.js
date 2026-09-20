const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');
const leaveBalanceRepository = require('../repositories/leaveBalanceRepository');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logActivity = require('../utils/activityLogger');

/**
 * @desc    Allocate leave to a specific employee
 * @route   POST /api/employees/:id/leave-allocation
 * @access  Private (Admin, Super Admin)
 */
exports.allocateLeaveToEmployee = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const { casual, sick, annual, maternity, paternity, unpaid, year, carryForward } = req.body;

  // Validate employee exists
  const employee = await Employee.findById(employeeId);
  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  // Use provided year or current year
  const allocationYear = year || new Date().getFullYear();

  // Find or create leave balance
  let leaveBalance = await LeaveBalance.findOne({
    employee: employeeId,
    year: allocationYear,
  });

  const allocationData = {};

  // Update leave allocations if provided
  if (casual !== undefined) allocationData.casual = Math.max(0, casual);
  if (sick !== undefined) allocationData.sick = Math.max(0, sick);
  if (annual !== undefined) allocationData.annual = Math.max(0, annual);
  if (maternity !== undefined) allocationData.maternity = Math.max(0, maternity);
  if (paternity !== undefined) allocationData.paternity = Math.max(0, paternity);
  if (unpaid !== undefined) allocationData.unpaid = Math.max(0, unpaid);

  // Update carry forward
  if (carryForward !== undefined) {
    allocationData['carryForward.casual'] = carryForward.casual || 0;
    allocationData['carryForward.annual'] = carryForward.annual || 0;
  }

  // Update balances structure for backward compatibility
  if (leaveBalance) {
    // Update existing balance
    if (casual !== undefined) {
      leaveBalance.casual = casual;
      leaveBalance.balances.casual.total = casual;
      leaveBalance.balances.casual.available = casual - (leaveBalance.balances.casual.used || 0) - (leaveBalance.balances.casual.pending || 0);
    }
    if (sick !== undefined) {
      leaveBalance.sick = sick;
      leaveBalance.balances.sick.total = sick;
      leaveBalance.balances.sick.available = sick - (leaveBalance.balances.sick.used || 0) - (leaveBalance.balances.sick.pending || 0);
    }
    if (annual !== undefined) {
      leaveBalance.annual = annual;
      leaveBalance.balances.annual.total = annual;
      leaveBalance.balances.annual.available = annual - (leaveBalance.balances.annual.used || 0) - (leaveBalance.balances.annual.pending || 0);
    }
    if (maternity !== undefined) {
      leaveBalance.maternity = maternity;
      leaveBalance.balances.maternity.total = maternity;
      leaveBalance.balances.maternity.available = maternity - (leaveBalance.balances.maternity.used || 0) - (leaveBalance.balances.maternity.pending || 0);
    }
    if (paternity !== undefined) {
      leaveBalance.paternity = paternity;
      leaveBalance.balances.paternity.total = paternity;
      leaveBalance.balances.paternity.available = paternity - (leaveBalance.balances.paternity.used || 0) - (leaveBalance.balances.paternity.pending || 0);
    }
    if (unpaid !== undefined) {
      leaveBalance.unpaid = unpaid;
      leaveBalance.balances.unpaid.total = unpaid;
      leaveBalance.balances.unpaid.available = unpaid - (leaveBalance.balances.unpaid.used || 0) - (leaveBalance.balances.unpaid.pending || 0);
    }
    if (carryForward) {
      leaveBalance.carryForward = {
        casual: carryForward.casual || 0,
        annual: carryForward.annual || 0,
      };
    }

    leaveBalance.updatedAt = new Date();
    await leaveBalance.save();
  } else {
    // Create new leave balance
    leaveBalance = await LeaveBalance.create({
      employee: employeeId,
      year: allocationYear,
      casual: casual || 12,
      sick: sick || 10,
      annual: annual || 15,
      maternity: maternity || 0,
      paternity: paternity || 0,
      unpaid: unpaid || 0,
      used: {
        casual: 0,
        sick: 0,
        annual: 0,
        maternity: 0,
        paternity: 0,
      },
      carryForward: {
        casual: (carryForward && carryForward.casual) || 0,
        annual: (carryForward && carryForward.annual) || 0,
      },
      balances: {
        casual: { total: casual || 12, used: 0, available: casual || 12, pending: 0 },
        sick: { total: sick || 10, used: 0, available: sick || 10, pending: 0 },
        annual: { total: annual || 15, used: 0, available: annual || 15, pending: 0 },
        maternity: { total: maternity || 0, used: 0, available: maternity || 0, pending: 0 },
        paternity: { total: paternity || 0, used: 0, available: paternity || 0, pending: 0 },
        unpaid: { total: unpaid || 0, used: 0, available: unpaid || 0, pending: 0 },
      },
    });
  }

  // Populate employee
  await leaveBalance.populate({
    path: 'employee',
    select: 'employeeId user department',
    populate: { path: 'user', select: 'name email' },
  });

  logActivity(
    req.user._id,
    'update',
    'employee',
    'LeaveBalance',
    leaveBalance._id,
    allocationData,
    req.ip
  ).catch(console.error);

  res.status(200).json({
    success: true,
    message: 'Leave allocated successfully',
    data: leaveBalance,
  });
});

/**
 * @desc    Allocate leave to all employees in a department
 * @route   POST /api/employees/department/:dept/leave-allocation
 * @access  Private (Admin, Super Admin)
 */
exports.allocateLeaveToDepartment = asyncHandler(async (req, res) => {
  const department = req.params.dept;
  const { casual, sick, annual, maternity, paternity, unpaid, year, carryForward } = req.body;

  // Find all employees in the department
  const employees = await Employee.find({ department, status: 'active' });
  
  if (employees.length === 0) {
    throw new AppError(`No active employees found in department: ${department}`, 404);
  }

  const allocationYear = year || new Date().getFullYear();
  const allocatedEmployees = [];
  const errors = [];

  // Allocate leave to each employee
  for (const employee of employees) {
    try {
      let leaveBalance = await LeaveBalance.findOne({
        employee: employee._id,
        year: allocationYear,
      });

      if (leaveBalance) {
        // Update existing balance
        if (casual !== undefined) {
          leaveBalance.casual = casual;
          leaveBalance.balances.casual.total = casual;
          leaveBalance.balances.casual.available = casual - (leaveBalance.balances.casual.used || 0) - (leaveBalance.balances.casual.pending || 0);
        }
        if (sick !== undefined) {
          leaveBalance.sick = sick;
          leaveBalance.balances.sick.total = sick;
          leaveBalance.balances.sick.available = sick - (leaveBalance.balances.sick.used || 0) - (leaveBalance.balances.sick.pending || 0);
        }
        if (annual !== undefined) {
          leaveBalance.annual = annual;
          leaveBalance.balances.annual.total = annual;
          leaveBalance.balances.annual.available = annual - (leaveBalance.balances.annual.used || 0) - (leaveBalance.balances.annual.pending || 0);
        }
        if (maternity !== undefined) {
          leaveBalance.maternity = maternity;
          leaveBalance.balances.maternity.total = maternity;
          leaveBalance.balances.maternity.available = maternity - (leaveBalance.balances.maternity.used || 0) - (leaveBalance.balances.maternity.pending || 0);
        }
        if (paternity !== undefined) {
          leaveBalance.paternity = paternity;
          leaveBalance.balances.paternity.total = paternity;
          leaveBalance.balances.paternity.available = paternity - (leaveBalance.balances.paternity.used || 0) - (leaveBalance.balances.paternity.pending || 0);
        }
        if (unpaid !== undefined) {
          leaveBalance.unpaid = unpaid;
          leaveBalance.balances.unpaid.total = unpaid;
          leaveBalance.balances.unpaid.available = unpaid - (leaveBalance.balances.unpaid.used || 0) - (leaveBalance.balances.unpaid.pending || 0);
        }
        if (carryForward) {
          leaveBalance.carryForward = {
            casual: carryForward.casual || 0,
            annual: carryForward.annual || 0,
          };
        }
        leaveBalance.updatedAt = new Date();
        await leaveBalance.save();
      } else {
        // Create new balance
        leaveBalance = await LeaveBalance.create({
          employee: employee._id,
          year: allocationYear,
          casual: casual || 12,
          sick: sick || 10,
          annual: annual || 15,
          maternity: maternity || 0,
          paternity: paternity || 0,
          unpaid: unpaid || 0,
          used: {
            casual: 0,
            sick: 0,
            annual: 0,
            maternity: 0,
            paternity: 0,
          },
          carryForward: {
            casual: (carryForward && carryForward.casual) || 0,
            annual: (carryForward && carryForward.annual) || 0,
          },
          balances: {
            casual: { total: casual || 12, used: 0, available: casual || 12, pending: 0 },
            sick: { total: sick || 10, used: 0, available: sick || 10, pending: 0 },
            annual: { total: annual || 15, used: 0, available: annual || 15, pending: 0 },
            maternity: { total: maternity || 0, used: 0, available: maternity || 0, pending: 0 },
            paternity: { total: paternity || 0, used: 0, available: paternity || 0, pending: 0 },
            unpaid: { total: unpaid || 0, used: 0, available: unpaid || 0, pending: 0 },
          },
        });
      }

      allocatedEmployees.push({
        employeeId: employee._id,
        employeeIdStr: employee.employeeId,
        name: employee.user?.name || 'N/A',
      });
    } catch (error) {
      errors.push({
        employeeId: employee._id,
        employeeIdStr: employee.employeeId,
        error: error.message,
      });
    }
  }

  logActivity(
    req.user._id,
    'create',
    'employee',
    'LeaveBalance',
    null,
    { department, allocationYear, employeesAllocated: allocatedEmployees.length },
    req.ip
  ).catch(console.error);

  res.status(200).json({
    success: true,
    message: `Leave allocated to ${allocatedEmployees.length} employees in ${department} department`,
    data: {
      department,
      year: allocationYear,
      allocatedEmployees,
      errors: errors.length > 0 ? errors : undefined,
    },
  });
});

/**
 * @desc    Reset yearly leaves for all employees
 * @route   POST /api/employees/leave-allocation/reset
 * @access  Private (Admin, Super Admin)
 */
exports.resetYearlyLeaves = asyncHandler(async (req, res) => {
  const { year, defaultAllocation, carryForwardPolicy } = req.body;

  const resetYear = year || new Date().getFullYear();
  const prevYear = resetYear - 1;

  // Default allocation values
  const defaults = {
    casual: defaultAllocation?.casual || 12,
    sick: defaultAllocation?.sick || 10,
    annual: defaultAllocation?.annual || 15,
    maternity: defaultAllocation?.maternity || 0,
    paternity: defaultAllocation?.paternity || 0,
    unpaid: defaultAllocation?.unpaid || 0,
  };

  // Get all active employees
  const employees = await Employee.find({ status: 'active' });
  let resetCount = 0;
  let errorCount = 0;

  for (const employee of employees) {
    try {
      // Check if balance for reset year already exists
      const existingBalance = await LeaveBalance.findOne({
        employee: employee._id,
        year: resetYear,
      });

      if (existingBalance) {
        // Skip if already exists
        continue;
      }

      // Get previous year balance for carry forward
      const prevBalance = await LeaveBalance.findOne({
        employee: employee._id,
        year: prevYear,
      });

      // Calculate carry forward based on policy
      let carryForward = { casual: 0, annual: 0 };
      if (prevBalance && carryForwardPolicy) {
        if (carryForwardPolicy.allowCarryForward) {
          if (carryForwardPolicy.maxCarryForwardDays) {
            const maxCarryForward = carryForwardPolicy.maxCarryForwardDays;
            
            // Calculate available from previous year (using balances structure)
            const prevAnnualAvailable = prevBalance.balances?.annual?.available || 0;
            const prevCasualAvailable = prevBalance.balances?.casual?.available || 0;
            
            carryForward.annual = Math.min(prevAnnualAvailable, maxCarryForward);
            if (carryForwardPolicy.allowCasualCarryForward) {
              carryForward.casual = Math.min(prevCasualAvailable, maxCarryForward);
            }
          }
        }
      }

      // Create new balance for the year
      const newAnnual = defaults.annual + carryForward.annual;
      const newCasual = defaults.casual + carryForward.casual;

      await LeaveBalance.create({
        employee: employee._id,
        year: resetYear,
        casual: newCasual,
        sick: defaults.sick,
        annual: newAnnual,
        maternity: defaults.maternity,
        paternity: defaults.paternity,
        unpaid: defaults.unpaid,
        used: {
          casual: 0,
          sick: 0,
          annual: 0,
          maternity: 0,
          paternity: 0,
        },
        carryForward: carryForward,
        balances: {
          casual: { total: newCasual, used: 0, available: newCasual, pending: 0 },
          sick: { total: defaults.sick, used: 0, available: defaults.sick, pending: 0 },
          annual: { total: newAnnual, used: 0, available: newAnnual, pending: 0 },
          maternity: { total: defaults.maternity, used: 0, available: defaults.maternity, pending: 0 },
          paternity: { total: defaults.paternity, used: 0, available: defaults.paternity, pending: 0 },
          unpaid: { total: defaults.unpaid, used: 0, available: defaults.unpaid, pending: 0 },
        },
        lastResetDate: new Date(),
      });

      resetCount++;
    } catch (error) {
      console.error(`Error resetting leave for employee ${employee._id}:`, error);
      errorCount++;
    }
  }

  logActivity(
    req.user._id,
    'create',
    'employee',
    'LeaveBalance',
    null,
    { resetYear, resetCount, errorCount },
    req.ip
  ).catch(console.error);

  res.status(200).json({
    success: true,
    message: `Leave balance reset for ${resetCount} employees for year ${resetYear}`,
    data: {
      year: resetYear,
      resetCount,
      errorCount,
      totalEmployees: employees.length,
    },
  });
});

/**
 * @desc    Get leave balance for employee (already exists in leaveBalanceController)
 * @route   GET /api/employees/:id/leave-balance
 * @access  Private
 */
exports.getLeaveBalance = asyncHandler(async (req, res) => {
  const employeeId = req.params.id;
  const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

  const leaveBalance = await LeaveBalance.findOne({
    employee: employeeId,
    year: year,
  })
    .populate({
      path: 'employee',
      select: 'employeeId user department',
      populate: { path: 'user', select: 'name email' },
    });

  if (!leaveBalance) {
    // Return default structure if no balance exists
    const employee = await Employee.findById(employeeId).populate('user', 'name email');
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    return res.status(200).json({
      success: true,
      data: {
        employee: employee._id,
        employeeDetails: {
          employeeId: employee.employeeId,
          name: employee.user?.name,
          email: employee.user?.email,
          department: employee.department,
        },
        year: year,
        casual: 0,
        sick: 0,
        annual: 0,
        maternity: 0,
        paternity: 0,
        unpaid: 0,
        used: {
          casual: 0,
          sick: 0,
          annual: 0,
          maternity: 0,
          paternity: 0,
        },
        carryForward: {
          casual: 0,
          annual: 0,
        },
      },
      message: 'No leave allocation found. Please allocate leaves first.',
    });
  }

  res.status(200).json({
    success: true,
    data: leaveBalance,
  });
});
