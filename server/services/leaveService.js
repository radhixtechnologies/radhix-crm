const leaveRepository = require('../repositories/leaveRepository');
const leaveBalanceRepository = require('../repositories/leaveBalanceRepository');
const leaveBalanceService = require('../services/leaveBalanceService');
const employeeRepository = require('../repositories/employeeRepository');
const AppError = require('../utils/AppError');
const buildQuery = require('../utils/buildQuery');

/**
 * Leave Service
 * Handles business logic for leave operations
 */
class LeaveService {
  /**
   * Calculate days between dates
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Boolean} halfDay - Is half day
   * @returns {Number}
   */
  calculateDays(startDate, endDate, halfDay = false) {
    if (halfDay) {
      return 0.5;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Exclude weekends
    let days = 0;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        days += 1;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  /**
   * Create leave request
   * @param {String} employeeId - Employee ID
   * @param {Object} data - Leave data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async createLeave(employeeId, data, user) {
    // Verify employee exists
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check access
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
        roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
        roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (!currentEmployee) {
        throw new AppError('Employee record not found', 404);
      }
      // Convert both to strings for reliable comparison
      const currentEmployeeId = currentEmployee._id.toString();
      const requestedEmployeeId = employeeId && employeeId.toString ? employeeId.toString() : String(employeeId);
      if (currentEmployeeId !== requestedEmployeeId) {
        throw new AppError('Not authorized', 403);
      }
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Calculate days (excluding weekends)
    const days = this.calculateDays(startDate, endDate, data.halfDay);

    if (days <= 0) {
      throw new AppError('Invalid date range', 400);
    }

    // Check for overlapping leaves
    const overlapping = await leaveRepository.findOverlapping(
      employeeId,
      startDate,
      endDate
    );

    if (overlapping.length > 0) {
      throw new AppError('Leave dates overlap with existing approved/pending leave', 400);
    }

    // Check leave balance
    const leaveBalance = await leaveBalanceRepository.getBalance(employeeId);
    const leaveType = data.type;

    if (leaveType !== 'unpaid') {
      if (!leaveBalance || !leaveBalance.balances) {
        throw new AppError('Leave balance not initialized', 500);
      }
      
      const balance = leaveBalance.balances[leaveType];
      
      if (!balance) {
        throw new AppError(`Leave balance not found for type: ${leaveType}`, 400);
      }

      // Available = total - used - pending
      const available = balance.available || 0;

      if (days > available) {
        throw new AppError(
          `Insufficient leave balance. Available: ${available} days, Requested: ${days} days`,
          400
        );
      }
    }

    // Create leave request
    const leaveData = {
      employee: employeeId,
      type: leaveType,
      startDate,
      endDate,
      days,
      halfDay: data.halfDay || false,
      halfDayType: data.halfDayType,
      reason: data.reason,
      documentUrl: data.documentUrl || '',
      status: 'pending',
    };

    const leave = await leaveRepository.create(leaveData);

    // Update pending balance
    if (leaveType !== 'unpaid') {
      if (!leaveBalance || !leaveBalance.balances) {
        throw new AppError('Leave balance not initialized', 500);
      }
      
      const balance = leaveBalance.balances[leaveType];
      if (!balance) {
        throw new AppError(`Leave balance not found for type: ${leaveType}`, 400);
      }
      
      const newPending = (balance.pending || 0) + days;
      const newAvailable = (balance.total || 0) - (balance.used || 0) - newPending;
      
      await leaveBalanceRepository.updateLeaveType(employeeId, leaveType, {
        pending: newPending,
        available: newAvailable,
      });
    }

    // Populate and return
    const populated = await leaveRepository.findById(leave._id, {
      populate: 'employee',
    });

    return {
      success: true,
      data: populated,
      message: 'Leave request created successfully',
    };
  }

  /**
   * Approve leave request
   * @param {String} leaveId - Leave ID
   * @param {Object} data - Approval data (comments)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async approveLeave(leaveId, data, user) {
    const leave = await leaveRepository.findById(leaveId);
    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    // Check if Admin is trying to approve Super Admin leave
    if (leave.employee) {
      const { canAccessEmployeeResource } = require('../utils/roleFilter');
      const canAccess = await canAccessEmployeeResource(leave.employee, user);
      if (!canAccess) {
        throw new AppError('Not authorized to approve this leave request', 403);
      }
    }

    if (leave.status !== 'pending') {
      throw new AppError(`Leave request is already ${leave.status}`, 400);
    }

    // Update leave status
    const updated = await leaveRepository.updateById(leaveId, {
      status: 'approved',
      approvedBy: user._id,
      approvedAt: new Date(),
      comments: data.comments || '',
    });

    // Update leave balance - deduct from pending, add to used
    if (leave.type !== 'unpaid') {
      await leaveBalanceService.deductLeave(leave.employee, leave.type, leave.days);
    }

    return {
      success: true,
      data: updated,
      message: 'Leave request approved',
    };
  }

  /**
   * Reject leave request
   * @param {String} leaveId - Leave ID
   * @param {Object} data - Rejection data (rejectionReason, comments)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async rejectLeave(leaveId, data, user) {
    const leave = await leaveRepository.findById(leaveId);
    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    // Check if Admin is trying to reject Super Admin leave
    if (leave.employee) {
      const { canAccessEmployeeResource } = require('../utils/roleFilter');
      const canAccess = await canAccessEmployeeResource(leave.employee, user);
      if (!canAccess) {
        throw new AppError('Not authorized to reject this leave request', 403);
      }
    }

    if (leave.status !== 'pending') {
      throw new AppError(`Leave request is already ${leave.status}`, 400);
    }

    if (!data.rejectionReason) {
      throw new AppError('Rejection reason is required', 400);
    }

    // Update leave status
    const updated = await leaveRepository.updateById(leaveId, {
      status: 'rejected',
      rejectedBy: user._id,
      rejectedAt: new Date(),
      rejectionReason: data.rejectionReason,
      comments: data.comments || '',
    });

    // Update leave balance - restore from pending (leave was rejected)
    if (leave.type !== 'unpaid') {
      await leaveBalanceService.restoreLeave(leave.employee, leave.type, leave.days, 'pending');
    }

    return {
      success: true,
      data: updated,
      message: 'Leave request rejected',
    };
  }

  /**
   * Get leaves with filters
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getLeaves(filters = {}, options = {}, user) {
    // Separate filter fields from option fields
    const filterFields = { ...filters };
    const optionFields = { ...options };
    
    // Remove option fields from filterFields if they exist
    ['page', 'limit', 'skip', 'sortBy', 'sortOrder', 'sort', 'populate'].forEach(key => {
      if (filterFields[key]) {
        optionFields[key] = filterFields[key];
        delete filterFields[key];
      }
    });
    
    // Use query builder to build advanced filters
    const { query, options: queryOptions } = buildQuery.buildLeaveQuery({ ...filterFields, ...optionFields });
    
    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Employees can only see their own leaves
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
        roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
        roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const employee = await employeeRepository.findByUserId(user._id);
      if (!employee) {
        throw new AppError('Employee record not found', 404);
      }
      query.employee = employee._id;
    } else if (filterFields.employeeId) {
      // Admins can filter by employeeId (convert to ObjectId if needed)
      const employee = await employeeRepository.findById(filterFields.employeeId);
      if (!employee) {
        throw new AppError('Employee not found', 404);
      }
      query.employee = employee._id;
    }

    // Department filtering - need to populate employee first, then filter
    let leaves;
    let total;

    if (filterFields.department && 
        (roleSlug === 'admin' || roleSlug === 'super_admin' || 
         roleSlug === 'sales_manager' || roleSlug === 'hrm_admin' || 
         roleSlug === 'finance_manager' || roleSlug === 'operations_manager' || 
         roleSlug === 'management_admin')) {
      // Need to filter by employee's department
      // This requires aggregation or post-filtering
      const allLeaves = await leaveRepository.findAll(query, {
        ...queryOptions,
        populate: 'employee',
      });

      // Filter by department if specified
      const departments = Array.isArray(filterFields.department)
        ? filterFields.department
        : filterFields.department.split(',').map(d => d.trim());

      leaves = allLeaves.filter(leave => {
        const empDept = leave.employee?.department || leave.employee?.department;
        return departments.includes(empDept);
      });

      total = leaves.length;
    } else {
      leaves = await leaveRepository.findAll(query, {
        ...queryOptions,
        populate: 'employee',
      });

      total = await leaveRepository.count(query);
    }

    // Filter out Super Admin leaves for Admin users
    const { filterSuperAdminData } = require('../utils/roleFilter');
    leaves = await filterSuperAdminData(leaves, user);
    total = Array.isArray(leaves) ? leaves.length : total;

    return {
      success: true,
      data: leaves,
      meta: {
        page: queryOptions.page,
        limit: queryOptions.limit,
        total,
        pages: Math.ceil(total / queryOptions.limit),
      },
    };
  }

  /**
   * Get leave by ID
   * @param {String} leaveId - Leave ID
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getLeaveById(leaveId, user) {
    const leave = await leaveRepository.findById(leaveId);

    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check access
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
        roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
        roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const employee = await employeeRepository.findByUserId(user._id);
      if (!employee) {
        throw new AppError('Employee record not found', 404);
      }
      // Convert both to strings for reliable comparison
      const currentEmployeeId = employee._id.toString();
      const leaveEmployeeId = leave.employee && leave.employee.toString ? leave.employee.toString() : String(leave.employee);
      if (currentEmployeeId !== leaveEmployeeId) {
        throw new AppError('Not authorized', 403);
      }
    }

    // Check if Admin is trying to access Super Admin leave
    if (leave.employee) {
      const { canAccessEmployeeResource } = require('../utils/roleFilter');
      const canAccess = await canAccessEmployeeResource(leave.employee, user);
      if (!canAccess) {
        throw new AppError('Not authorized to view this leave request', 403);
      }
    }

    return {
      success: true,
      data: leave,
    };
  }

  /**
   * Cancel leave request
   * @param {String} leaveId - Leave ID
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async cancelLeave(leaveId, user) {
    const leave = await leaveRepository.findById(leaveId);
    if (!leave) {
      throw new AppError('Leave request not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check access
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' || 
        roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
        roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const employee = await employeeRepository.findByUserId(user._id);
      if (!employee) {
        throw new AppError('Employee record not found', 404);
      }
      const currentEmployeeId = employee._id.toString();
      const leaveEmployeeId = leave.employee && leave.employee.toString ? leave.employee.toString() : String(leave.employee);
      if (currentEmployeeId !== leaveEmployeeId) {
        throw new AppError('Not authorized to cancel this leave', 403);
      }
    }

    // Check if Admin is trying to cancel Super Admin leave
    if (leave.employee) {
      const { canAccessEmployeeResource } = require('../utils/roleFilter');
      const canAccess = await canAccessEmployeeResource(leave.employee, user);
      if (!canAccess) {
        throw new AppError('Not authorized to cancel this leave request', 403);
      }
    }

    if (leave.status === 'cancelled') {
      throw new AppError('Leave request is already cancelled', 400);
    }

    if (leave.status === 'approved') {
      // Can only cancel pending leaves (or need admin approval for approved leaves)
      throw new AppError('Cannot cancel approved leave. Please contact administrator.', 400);
    }

    // Update leave status
    const updated = await leaveRepository.updateById(leaveId, {
      status: 'cancelled',
      cancelledAt: new Date(),
    });

    // Restore balance based on current status
    if (leave.type !== 'unpaid') {
      await leaveBalanceService.restoreLeave(leave.employee, leave.type, leave.days, leave.status);
    }

    return {
      success: true,
      data: updated,
      message: 'Leave request cancelled successfully',
    };
  }
}

module.exports = new LeaveService();

