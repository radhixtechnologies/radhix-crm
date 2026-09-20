const leaveBalanceRepository = require('../repositories/leaveBalanceRepository');
const leaveRepository = require('../repositories/leaveRepository');
const employeeRepository = require('../repositories/employeeRepository');
const AppError = require('../utils/AppError');

/**
 * Leave Balance Service
 * Handles business logic for leave balance operations
 */
class LeaveBalanceService {
  /**
   * Get leave balance for employee
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year (optional)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getLeaveBalance(employeeId, year = null, user) {
    // Ensure employeeId is a string/ObjectId, not an object
    if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
      employeeId = employeeId.toString();
    }
    
    if (!employeeId || typeof employeeId !== 'string') {
      throw new AppError('Invalid employee ID', 400);
    }

    // Verify employee exists
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Check access
    if (user.role === 'employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (!currentEmployee || currentEmployee._id.toString() !== employeeId.toString()) {
        throw new AppError('Not authorized to view this leave balance', 403);
      }
    }

    const balanceYear = year || new Date().getFullYear();
    const leaveBalance = await leaveBalanceRepository.getBalance(employeeId, balanceYear);

    // Ensure leaveBalance exists
    if (!leaveBalance) {
      throw new AppError('Leave balance not found and could not be created', 500);
    }

    // Populate employee (handle gracefully if populate fails)
    try {
      await leaveBalance.populate({
        path: 'employee',
        select: 'employeeId user department',
        populate: { path: 'user', select: 'name email' },
      });
    } catch (populateError) {
      // Log but don't fail - balance data is still valid
      console.error('Error populating employee in leave balance:', populateError);
      // Try to manually populate if needed
      if (!leaveBalance.employee || typeof leaveBalance.employee === 'string') {
        // Employee is just an ID, we'll let the frontend handle it
      }
    }

    return {
      success: true,
      data: leaveBalance,
    };
  }

  /**
   * Update leave balance (admin only)
   * @param {String} employeeId - Employee ID
   * @param {Object} data - Update data (balances, year)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async updateLeaveBalance(employeeId, data, user) {
    // Ensure employeeId is a string/ObjectId
    if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
      employeeId = employeeId.toString();
    }
    
    if (!employeeId || typeof employeeId !== 'string') {
      throw new AppError('Invalid employee ID', 400);
    }

    // Only admin/super_admin can update
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AppError('Not authorized to update leave balance', 403);
    }

    const balanceYear = data.year || new Date().getFullYear();
    const { balances } = data;

    // Get existing balance
    let leaveBalance = await leaveBalanceRepository.findByEmployee(employeeId, balanceYear);

    if (!leaveBalance) {
      // Create new balance
      leaveBalance = await leaveBalanceRepository.create({
        employee: employeeId,
        year: balanceYear,
        balances: balances || this.getDefaultBalances(),
      });
    } else {
      // Update totals and recalculate available
      if (balances) {
        Object.keys(balances).forEach(leaveType => {
          if (leaveBalance.balances[leaveType]) {
            // Update total if provided
            if (balances[leaveType].total !== undefined) {
              leaveBalance.balances[leaveType].total = balances[leaveType].total;
            }
            
            // Recalculate available
            leaveBalance.balances[leaveType].available = 
              leaveBalance.balances[leaveType].total - 
              leaveBalance.balances[leaveType].used - 
              leaveBalance.balances[leaveType].pending;
            
            // Ensure available is not negative
            if (leaveBalance.balances[leaveType].available < 0) {
              leaveBalance.balances[leaveType].available = 0;
            }
          }
        });
        await leaveBalance.save();
      }
    }

    return {
      success: true,
      data: leaveBalance,
      message: 'Leave balance updated successfully',
    };
  }

  /**
   * Deduct leave from balance
   * @param {String} employeeId - Employee ID
   * @param {String} leaveType - Leave type
   * @param {Number} days - Days to deduct
   * @param {Number} year - Year (optional)
   * @returns {Promise<Object>}
   */
  async deductLeave(employeeId, leaveType, days, year = null) {
    // Ensure employeeId is a string/ObjectId
    if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
      employeeId = employeeId.toString();
    }
    
    if (!employeeId || typeof employeeId !== 'string') {
      throw new AppError('Invalid employee ID', 400);
    }

    if (leaveType === 'unpaid') {
      // Unpaid leave doesn't affect balance
      return { success: true };
    }

    const balanceYear = year || new Date().getFullYear();
    const leaveBalance = await leaveBalanceRepository.getBalance(employeeId, balanceYear);

    if (!leaveBalance || !leaveBalance.balances || !leaveBalance.balances[leaveType]) {
      throw new AppError(`Leave balance not found for type: ${leaveType}`, 404);
    }

    const balance = leaveBalance.balances[leaveType];
    const newUsed = (balance.used || 0) + days;
    const newPending = Math.max(0, (balance.pending || 0) - days); // Reduce pending when approved
    const newAvailable = balance.total - newUsed - newPending;

    // Prevent negative balance
    if (newAvailable < 0) {
      throw new AppError(`Cannot deduct ${days} days. Would result in negative balance.`, 400);
    }

    // Update both legacy balances structure and new used structure
    await leaveBalanceRepository.updateLeaveType(employeeId, leaveType, {
      used: newUsed,
      pending: newPending,
      available: newAvailable,
    }, balanceYear);

    // Also update the new used structure
    const LeaveBalance = require('../models/LeaveBalance');
    await LeaveBalance.findOneAndUpdate(
      { employee: employeeId, year: balanceYear },
      { 
        [`used.${leaveType}`]: newUsed,
        updatedAt: new Date(),
      }
    );

    return { success: true };
  }

  /**
   * Restore leave to balance (when leave is cancelled/rejected)
   * @param {String} employeeId - Employee ID
   * @param {String} leaveType - Leave type
   * @param {Number} days - Days to restore
   * @param {String} currentStatus - Current leave status
   * @param {Number} year - Year (optional)
   * @returns {Promise<Object>}
   */
  async restoreLeave(employeeId, leaveType, days, currentStatus, year = null) {
    // Ensure employeeId is a string/ObjectId
    if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
      employeeId = employeeId.toString();
    }
    
    if (!employeeId || typeof employeeId !== 'string') {
      throw new AppError('Invalid employee ID', 400);
    }

    if (leaveType === 'unpaid') {
      // Unpaid leave doesn't affect balance
      return { success: true };
    }

    const balanceYear = year || new Date().getFullYear();
    const leaveBalance = await leaveBalanceRepository.getBalance(employeeId, balanceYear);

    if (!leaveBalance || !leaveBalance.balances || !leaveBalance.balances[leaveType]) {
      return { success: true }; // If balance doesn't exist, nothing to restore
    }

    const balance = leaveBalance.balances[leaveType];
    let updates = {};

    if (currentStatus === 'approved') {
      // Was approved, so restore from used
      updates.used = Math.max(0, (balance.used || 0) - days);
    } else if (currentStatus === 'pending') {
      // Was pending, so restore from pending
      updates.pending = Math.max(0, (balance.pending || 0) - days);
    }

    // Recalculate available
    const newUsed = updates.used !== undefined ? updates.used : balance.used;
    const newPending = updates.pending !== undefined ? updates.pending : balance.pending;
    updates.available = balance.total - newUsed - newPending;

    // Ensure available doesn't exceed total
    if (updates.available > balance.total) {
      updates.available = balance.total;
    }

    await leaveBalanceRepository.updateLeaveType(employeeId, leaveType, updates, balanceYear);

    // Also update the new used structure
    const LeaveBalance = require('../models/LeaveBalance');
    await LeaveBalance.findOneAndUpdate(
      { employee: employeeId, year: balanceYear },
      { 
        [`used.${leaveType}`]: newUsed,
        updatedAt: new Date(),
      }
    );

    return { success: true };
  }

  /**
   * Get leave balance summary (admin view)
   * @param {Object} filters - Filters (department, year)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getLeaveBalanceSummary(filters = {}, user) {
    // Only admin/super_admin can view summary
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AppError('Not authorized to view leave balance summary', 403);
    }

    const balanceYear = filters.year || new Date().getFullYear();
    let query = { year: balanceYear };

    // Filter by department if provided
    let employees = [];
    if (filters.department) {
      employees = await employeeRepository.findAll({ department: filters.department });
      const employeeIds = employees.map(e => e._id);
      query.employee = { $in: employeeIds };
    }

    // Get all leave balances
    const LeaveBalance = require('../models/LeaveBalance');
    const leaveBalances = await LeaveBalance.find(query)
      .populate({
        path: 'employee',
        select: 'employeeId user department',
        populate: { path: 'user', select: 'name email' },
      })
      .exec();

    // Calculate summary statistics
    const summary = {
      totalEmployees: leaveBalances.length,
      totalLeavesAllocated: { casual: 0, sick: 0, annual: 0, maternity: 0, paternity: 0, unpaid: 0 },
      totalLeavesUsed: { casual: 0, sick: 0, annual: 0, maternity: 0, paternity: 0, unpaid: 0 },
      totalLeavesAvailable: { casual: 0, sick: 0, annual: 0, maternity: 0, paternity: 0, unpaid: 0 },
      totalLeavesPending: { casual: 0, sick: 0, annual: 0, maternity: 0, paternity: 0, unpaid: 0 },
      lowBalanceEmployees: [],
    };

    leaveBalances.forEach(balance => {
      if (!balance.balances) return;

      Object.keys(balance.balances).forEach(leaveType => {
        const balanceType = balance.balances[leaveType];
        summary.totalLeavesAllocated[leaveType] += balanceType.total || 0;
        summary.totalLeavesUsed[leaveType] += balanceType.used || 0;
        summary.totalLeavesAvailable[leaveType] += balanceType.available || 0;
        summary.totalLeavesPending[leaveType] += balanceType.pending || 0;

        // Check for low balance (less than 20% remaining)
        const availablePercent = balanceType.total > 0 
          ? (balanceType.available / balanceType.total) * 100 
          : 100;
        
        if (availablePercent < 20 && balanceType.total > 0) {
          summary.lowBalanceEmployees.push({
            employee: balance.employee,
            leaveType,
            available: balanceType.available,
            total: balanceType.total,
            percent: Math.round(availablePercent),
          });
        }
      });
    });

    return {
      success: true,
      data: {
        summary,
        year: balanceYear,
        leaveBalances,
      },
    };
  }

  /**
   * Reset leave balance for new year
   * @param {String} employeeId - Employee ID
   * @param {Number} year - Year
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async resetLeaveBalance(employeeId, year, user) {
    // Ensure employeeId is a string/ObjectId
    if (typeof employeeId !== 'string' && employeeId && employeeId.toString) {
      employeeId = employeeId.toString();
    }
    
    if (!employeeId || typeof employeeId !== 'string') {
      throw new AppError('Invalid employee ID', 400);
    }

    // Only admin/super_admin can reset
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      throw new AppError('Not authorized to reset leave balance', 403);
    }

    // Check if balance for year already exists
    const existingBalance = await leaveBalanceRepository.findByEmployee(employeeId, year);
    if (existingBalance) {
      throw new AppError(`Leave balance for year ${year} already exists`, 400);
    }

    // Get previous year balance for carry-forward
    const prevYear = year - 1;
    const prevBalance = await leaveBalanceRepository.findByEmployee(employeeId, prevYear);

    // Create new balance with carry-forward rules
    const defaultBalances = this.getDefaultBalances();
    
    // Carry forward available annual leaves (up to a maximum, e.g., 5 days)
    if (prevBalance && prevBalance.balances && prevBalance.balances.annual) {
      const carryForwardMax = 5; // Max days to carry forward
      const availableAnnual = prevBalance.balances.annual.available || 0;
      const carryForward = Math.min(availableAnnual, carryForwardMax);
      
      defaultBalances.annual.total = defaultBalances.annual.total + carryForward;
      defaultBalances.annual.available = defaultBalances.annual.total;
    }

    const newBalance = await leaveBalanceRepository.create({
      employee: employeeId,
      year,
      balances: defaultBalances,
      lastResetDate: new Date(),
    });

    return {
      success: true,
      data: newBalance,
      message: `Leave balance reset successfully for year ${year}`,
    };
  }

  /**
   * Get default leave balances
   * @returns {Object}
   */
  getDefaultBalances() {
    return {
      casual: { total: 12, used: 0, available: 12, pending: 0 },
      sick: { total: 10, used: 0, available: 10, pending: 0 },
      annual: { total: 15, used: 0, available: 15, pending: 0 },
      maternity: { total: 0, used: 0, available: 0, pending: 0 },
      paternity: { total: 0, used: 0, available: 0, pending: 0 },
      unpaid: { total: 0, used: 0, available: 0, pending: 0 },
    };
  }
}

module.exports = new LeaveBalanceService();
