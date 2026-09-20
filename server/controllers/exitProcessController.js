const Employee = require('../models/Employee');
const Asset = require('../models/Asset');
const logActivity = require('../utils/activityLogger');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Submit resignation
// @route   POST /api/employees/:id/resignation
// @access  Private
exports.submitResignation = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check if user is the employee themselves or admin
    if (req.user.role === 'employee') {
      const empRecord = await Employee.findOne({ user: req.user._id });
      if (!empRecord || empRecord._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    // Check if already resigned
    if (employee.exitProcess?.resignationDate) {
      return res.status(400).json({
        success: false,
        message: 'Resignation has already been submitted',
      });
    }

    const { resignationDate, lastWorkingDate, noticePeriod, exitReason } = req.body;

    if (!resignationDate || !lastWorkingDate || !noticePeriod) {
      return res.status(400).json({
        success: false,
        message: 'Resignation date, last working date, and notice period are required',
      });
    }

    const resignationDateObj = new Date(resignationDate);
    const lastWorkingDateObj = new Date(lastWorkingDate);
    const noticePeriodStart = new Date(resignationDateObj);
    const noticePeriodEnd = new Date(lastWorkingDateObj);

    // Calculate final settlement (approximate - can be refined)
    const daysInMonth = 30;
    const dailySalary = employee.salary / daysInMonth;
    const remainingDays = Math.ceil((lastWorkingDateObj - resignationDateObj) / (1000 * 60 * 60 * 24));
    const finalSettlementAmount = dailySalary * remainingDays;

    employee.exitProcess = {
      resignationDate: resignationDateObj,
      lastWorkingDate: lastWorkingDateObj,
      noticePeriod: noticePeriod || 30,
      noticePeriodStart: noticePeriodStart,
      noticePeriodEnd: noticePeriodEnd,
      exitReason: exitReason || '',
      exitChecklist: {
        assetReturned: false,
        accessRevoked: false,
        documentsSubmitted: false,
        finalSettlement: false,
        exitInterview: false,
      },
      finalSettlementAmount: finalSettlementAmount || 0,
    };

    employee.status = 'resigned';
    await employee.save();

    logActivity(req.user._id, 'update', 'employee', 'Employee', employee._id, { action: 'resignation', exitProcess: employee.exitProcess }, req.ip).catch(console.error);

    // Notify HR/Admin about resignation
    // This would typically notify HR managers - for now we'll skip specific notification

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error submitting resignation:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update exit checklist
// @route   PUT /api/employees/:id/exit-checklist
// @access  Private (Admin, Super Admin)
exports.updateExitChecklist = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!employee.exitProcess?.resignationDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee has not submitted resignation',
      });
    }

    const { exitChecklist, finalSettlementAmount, feedback } = req.body;

    if (exitChecklist) {
      employee.exitProcess.exitChecklist = {
        ...employee.exitProcess.exitChecklist,
        ...exitChecklist,
      };
    }

    if (finalSettlementAmount !== undefined) {
      employee.exitProcess.finalSettlementAmount = finalSettlementAmount;
    }

    if (feedback !== undefined) {
      employee.exitProcess.feedback = feedback;
    }

    await employee.save();

    logActivity(req.user._id, 'update', 'employee', 'Employee', employee._id, { action: 'exit-checklist', exitChecklist }, req.ip).catch(console.error);

    // Check if all checklist items are completed
    const checklist = employee.exitProcess.exitChecklist;
    const allCompleted = Object.values(checklist).every(item => item === true);

    if (allCompleted) {
      // Notify employee that exit process is complete
      if (employee.user) {
        createNotification(
          employee.user,
          'Exit Process Complete',
          'All exit checklist items have been completed. Your exit process is finalized.',
          'info',
          { entityType: 'Employee', entityId: employee._id }
        ).catch(console.error);
      }
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error updating exit checklist:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Calculate final settlement
// @route   POST /api/employees/:id/calculate-settlement
// @access  Private (Admin, Super Admin)
exports.calculateSettlement = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!employee.exitProcess?.resignationDate) {
      return res.status(400).json({
        success: false,
        message: 'Employee has not submitted resignation',
      });
    }

    const resignationDate = new Date(employee.exitProcess.resignationDate);
    const lastWorkingDate = new Date(employee.exitProcess.lastWorkingDate);

    // Calculate days between resignation and last working date
    const daysDifference = Math.ceil((lastWorkingDate - resignationDate) / (1000 * 60 * 60 * 24));

    // Calculate settlement components
    const monthlySalary = employee.salary || 0;
    const dailySalary = monthlySalary / 30;
    const earnedSalary = dailySalary * daysDifference;

    // Add outstanding leave encashment (if any)
    // This is a simplified calculation - actual calculation would consider leave balance
    const leaveEncashment = 0; // Can be enhanced with leave balance calculation

    // Deductions (if any pending)
    const pendingDeductions = 0; // Can be enhanced with actual pending deductions

    const finalSettlement = {
      earnedSalary: Math.round(earnedSalary * 100) / 100,
      leaveEncashment: leaveEncashment,
      pendingDeductions: pendingDeductions,
      netSettlement: Math.round((earnedSalary + leaveEncashment - pendingDeductions) * 100) / 100,
      days: daysDifference,
    };

    // Update employee's final settlement amount
    employee.exitProcess.finalSettlementAmount = finalSettlement.netSettlement;
    await employee.save();

    logActivity(req.user._id, 'update', 'employee', 'Employee', employee._id, { action: 'calculate-settlement', settlement: finalSettlement }, req.ip).catch(console.error);

    res.status(200).json({
      success: true,
      data: {
        employee: employee._id,
        settlement: finalSettlement,
        exitProcess: employee.exitProcess,
      },
    });
  } catch (error) {
    console.error('Error calculating settlement:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get exit process status
// @route   GET /api/employees/:id/exit-process
// @access  Private
exports.getExitProcess = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('manager', 'employeeId user designation').populate('manager.user', 'name email');

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

    // Get assigned assets
    const assignedAssets = await Asset.find({
      assignedTo: employee._id,
      currentStatus: 'assigned',
    }).select('assetId name type');

    const exitProcessData = {
      ...employee.exitProcess,
      assignedAssets: assignedAssets,
      employeeName: employee.user?.name,
      employeeId: employee.employeeId,
      manager: employee.manager,
    };

    res.status(200).json({
      success: true,
      data: exitProcessData,
    });
  } catch (error) {
    console.error('Error getting exit process:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel resignation (Admin only)
// @route   POST /api/employees/:id/cancel-resignation
// @access  Private (Admin, Super Admin)
exports.cancelResignation = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    if (!employee.exitProcess?.resignationDate) {
      return res.status(400).json({
        success: false,
        message: 'No resignation found to cancel',
      });
    }

    // Reset exit process
    employee.exitProcess = {
      resignationDate: null,
      lastWorkingDate: null,
      noticePeriod: null,
      noticePeriodStart: null,
      noticePeriodEnd: null,
      exitChecklist: {
        assetReturned: false,
        accessRevoked: false,
        documentsSubmitted: false,
        finalSettlement: false,
        exitInterview: false,
      },
      finalSettlementAmount: null,
      exitReason: '',
      feedback: '',
    };

    employee.status = 'active';
    await employee.save();

    logActivity(req.user._id, 'update', 'employee', 'Employee', employee._id, { action: 'cancel-resignation' }, req.ip).catch(console.error);

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    console.error('Error canceling resignation:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

