const attendanceRepository = require('../repositories/attendanceRepository');
const employeeRepository = require('../repositories/employeeRepository');
const AppError = require('../utils/AppError');
const buildQuery = require('../utils/buildQuery');
const { generateEmployeeId } = require('../utils/employeeHelper');
const LeaveBalance = require('../models/LeaveBalance');
const { filterSuperAdminData, canAccessEmployeeResource } = require('../utils/roleFilter');

/**
 * Attendance Service
 * Handles business logic for attendance operations
 */
class AttendanceService {
  /**
   * Check-in employee
   * @param {String} employeeId - Employee ID
   * @param {Object} data - Check-in data (location, notes, method, status)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async checkIn(employeeId, data, user) {
    // Ensure data is an object
    data = data || {};

    // Verify employee exists
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check authorization: employees can only check in for themselves
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' ||
      roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
      roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      const targetEmployeeId = employeeId?.toString?.() || String(employeeId);
      if (!currentEmployee || currentEmployee._id.toString() !== targetEmployeeId) {
        throw new AppError('Not authorized to check in for this employee', 403);
      }
    }
    // Admins and super_admins can check in for any employee (no additional check needed)

    // Auto-close any hanging unclosed sessions from previous days so employee is never blocked
    const now = new Date();
    try {
      const hangingSessions = await attendanceRepository.findAll({
        employee: employeeId,
        checkIn: { $exists: true, $ne: null },
        checkOut: null,
      }, { populate: '' });

      for (const hanging of hangingSessions) {
        if (!attendanceRepository.isSameDay(hanging.date, now) && !attendanceRepository.isSameDay(hanging.checkIn, now)) {
          const checkInMs = new Date(hanging.checkIn).getTime();
          const autoHours = 8;
          const autoCheckOut = new Date(checkInMs + autoHours * 3600000);
          hanging.checkOut = autoCheckOut;
          hanging.checkOutMethod = 'auto_system';
          hanging.hoursWorked = autoHours;
          hanging.notes = (hanging.notes ? hanging.notes + '\n' : '') + '[System: Auto-closed previous unclosed shift]';
          await hanging.save();
        }
      }
    } catch (cleanupErr) {
      console.warn('Non-blocking warning: failed to auto-close previous hanging sessions:', cleanupErr.message);
    }

    // Check if already checked in today
    const todayAttendance = await attendanceRepository.findTodayAttendance(employeeId);
    if (todayAttendance && todayAttendance.checkIn) {
      throw new AppError('Already checked in today', 400);
    }

    const checkInTime = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get employee settings
    const settings = employee.attendanceSettings || {};
    const gracePeriod = (settings.gracePeriod || 15) * 60 * 1000; // Convert to milliseconds

    // Check for late arrival (if shift timings are set)
    let isLate = false;
    let lateMinutes = 0;
    let status = 'present';

    if (settings.shiftTimings && settings.shiftTimings.startTime) {
      const [hours, minutes] = settings.shiftTimings.startTime.split(':');
      const expectedStartTime = new Date(today);
      expectedStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (checkInTime > expectedStartTime.getTime() + gracePeriod) {
        isLate = true;
        lateMinutes = Math.floor((checkInTime - expectedStartTime) / (1000 * 60));
        status = 'late';
      }
    }

    // Allow overriding status (e.g., for WFH, half_day, absent)
    if (data.status === 'wfh') {
      status = 'wfh';
      isLate = false; // WFH usually implies flexible timing or task-based, usually not marked late
      lateMinutes = 0;
    } else if (data.status === 'half-day') {
      status = 'half-day';
      isLate = false;
      lateMinutes = 0;
    } else if (data.status === 'absent') {
      const isHrmAdmin = roleSlug === 'hrm_admin' || roleSlug === 'admin' || roleSlug === 'super_admin';
      if (!isHrmAdmin) {
        throw new AppError('Only HRM Admin can mark as Absent', 403);
      }
      status = 'absent';
      isLate = false;
      lateMinutes = 0;
    }

    // Create or update attendance record
    const attendanceData = {
      employee: employeeId,
      date: today,
      checkIn: checkInTime,
      status,
      isLate,
      lateMinutes,
      notes: data.notes || '',
      checkInMethod: data.method || 'web',
    };

    if (data.location && settings.requireLocation) {
      attendanceData.checkInLocation = data.location;
    }

    let attendance;
    if (todayAttendance) {
      attendance = await attendanceRepository.updateById(todayAttendance._id, attendanceData);
    } else {
      try {
        attendance = await attendanceRepository.create(attendanceData);
      } catch (err) {
        if (err.code === 11000) {
          throw new AppError('Already checked in today', 400);
        }
        throw err;
      }
    }

    // Populate employee
    await attendance.populate({
      path: 'employee',
      select: 'employeeId designation department user',
      populate: { path: 'user', select: 'name email' },
    });

    return {
      success: true,
      data: attendance,
      message: isLate ? `Checked in late by ${lateMinutes} minutes` : 'Checked in successfully',
    };
  }

  /**
   * Check-out employee
   * @param {String} employeeId - Employee ID
   * @param {Object} data - Check-out data (location, notes, method)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async checkOut(employeeId, data, user) {
    // Ensure data is an object
    data = data || {};

    // Verify employee exists
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check authorization: employees can only check out for themselves
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' ||
      roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
      roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      const targetEmployeeId = employeeId?.toString?.() || String(employeeId);
      if (!currentEmployee || currentEmployee._id.toString() !== targetEmployeeId) {
        throw new AppError('Not authorized to check out for this employee', 403);
      }
    }
    // Admins and super_admins can check out for any employee (no additional check needed)

    // Get today's attendance or active open session (e.g. night shift)
    let todayAttendance = await attendanceRepository.findTodayAttendance(employeeId);
    if (!todayAttendance || !todayAttendance.checkIn || todayAttendance.checkOut) {
      const activeSession = await attendanceRepository.findActiveSession(employeeId);
      if (activeSession) {
        todayAttendance = activeSession;
      }
    }

    if (!todayAttendance || !todayAttendance.checkIn) {
      throw new AppError('Must check in before checking out', 400);
    }

    if (todayAttendance.checkOut) {
      throw new AppError('Already checked out today', 400);
    }

    const checkOutTime = new Date();
    const settings = employee.attendanceSettings || {};

    // Update attendance
    const updateData = {
      checkOut: checkOutTime,
      checkOutMethod: data.method || 'web',
    };

    if (data.location && settings.requireLocation) {
      updateData.checkOutLocation = data.location;
    }

    if (data.notes) {
      updateData.notes = (todayAttendance.notes ? todayAttendance.notes + '\n' : '') + data.notes;
    }

    const attendance = await attendanceRepository.updateById(todayAttendance._id, updateData);

    // Populate employee
    await attendance.populate({
      path: 'employee',
      select: 'employeeId designation department user',
      populate: { path: 'user', select: 'name email' },
    });

    return {
      success: true,
      data: attendance,
      message: 'Checked out successfully',
    };
  }

  /**
   * Get attendance for employee
   * @param {String} employeeId - Employee ID
   * @param {Object} filters - Query filters
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getAttendance(employeeId, filters = {}, user) {
    // Verify employee exists
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check access - employees can only see their own attendance
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' ||
      roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
      roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      const targetEmployeeId = employeeId?.toString?.() || String(employeeId);
      if (!currentEmployee || currentEmployee._id.toString() !== targetEmployeeId) {
        throw new AppError('Not authorized to view this attendance', 403);
      }
    }

    let startDate, endDate;

    if (filters.month) {
      // Parse YYYY-MM format
      const [year, month] = filters.month.split('-');
      startDate = new Date(year, parseInt(month) - 1, 1);
      endDate = new Date(year, parseInt(month), 0, 23, 59, 59, 999);
    } else {
      startDate = filters.startDate ? new Date(filters.startDate) : new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = filters.endDate ? new Date(filters.endDate) : new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    const attendance = await attendanceRepository.findByDateRange(employeeId, startDate, endDate, {
      populate: 'employee',
      sort: { date: -1 },
    });

    // Get statistics
    const stats = await attendanceRepository.aggregateStats(employeeId, startDate, endDate);

    return {
      success: true,
      data: attendance,
      stats,
    };
  }

  /**
   * Update attendance (admin only)
   * @param {String} attendanceId - Attendance ID
   * @param {Object} data - Update data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async updateAttendance(attendanceId, data, user) {
    const attendance = await attendanceRepository.findById(attendanceId, {
      populate: 'employee',
    });
    if (!attendance) {
      throw new AppError('Attendance record not found', 404);
    }

    // Check if Admin is trying to update Super Admin attendance
    if (attendance.employee) {
      const canAccess = await canAccessEmployeeResource(attendance.employee, user);
      if (!canAccess) {
        throw new AppError('Not authorized to update this attendance record', 403);
      }
    }

    // Update with correction tracking
    const updateData = {
      ...data,
      correctedBy: user._id,
      correctedAt: new Date(),
    };

    // Recalculate hours if both check-in and check-out are present
    if (updateData.checkIn && updateData.checkOut) {
      const diffMs = new Date(updateData.checkOut) - new Date(updateData.checkIn);
      updateData.hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    const updated = await attendanceRepository.updateById(attendanceId, updateData);

    return {
      success: true,
      data: updated,
      message: 'Attendance updated successfully',
    };
  }

  /**
   * Add or overwrite a manual / backdated ("old") attendance entry
   * @param {Object} data - { employeeId, date, status, checkIn, checkOut, checkInTime, checkOutTime, timezoneOffsetMinutes, notes, overwrite }
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async markManualAttendance(data = {}, user) {
    const { employeeId, date, status = 'present', notes = '', overwrite = false } = data;

    if (!employeeId) {
      throw new AppError('Employee is required', 400);
    }
    if (!date) {
      throw new AppError('Attendance date is required', 400);
    }

    const allowedStatuses = ['present', 'late', 'wfh', 'half-day', 'absent', 'leave'];
    if (!allowedStatuses.includes(status)) {
      throw new AppError(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`, 400);
    }

    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;
    const isAllowedRole =
      roleSlug === 'super_admin' ||
      roleSlug === 'admin' ||
      /_admin$/.test(roleSlug || '') ||
      /_manager$/.test(roleSlug || '');

    if (!isAllowedRole) {
      throw new AppError('Not authorized to add manual attendance', 403);
    }

    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const canAccess = await canAccessEmployeeResource(employee, user);
    if (!canAccess) {
      throw new AppError('Not authorized to manage attendance for this employee', 403);
    }

    const isGlobalHR = roleSlug === 'super_admin' || roleSlug === 'admin' || roleSlug === 'hrm_admin';
    if (!isGlobalHR) {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (currentEmployee?.department && employee.department && currentEmployee.department !== employee.department) {
        throw new AppError('Not authorized to manage attendance outside your department', 403);
      }
    }

    // Parse YYYY-MM-DD strictly to prevent rollover bugs (e.g. Feb 31)
    const dateStr = String(date).trim().slice(0, 10);
    const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) {
      throw new AppError('Date must be in YYYY-MM-DD format', 400);
    }
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10);
    const day = parseInt(dateMatch[3], 10);
    const utcCheck = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
    if (
      utcCheck.getUTCFullYear() !== year ||
      utcCheck.getUTCMonth() !== month - 1 ||
      utcCheck.getUTCDate() !== day
    ) {
      throw new AppError('Invalid calendar date', 400);
    }

    // Disallow future dates (allowing up to IST/UTC+14 "today")
    const offsetMin = Number.isFinite(Number(data.timezoneOffsetMinutes))
      ? Number(data.timezoneOffsetMinutes)
      : -330; // Default IST (-330 mins) if omitted
    const clientTodayStr = new Date(Date.now() - offsetMin * 60000).toISOString().slice(0, 10);
    if (dateStr > clientTodayStr) {
      throw new AppError('Cannot mark attendance for a future date', 400);
    }

    const parseDateTimeInput = (isoVal, timeVal) => {
      if (isoVal) {
        const parsed = new Date(isoVal);
        if (isNaN(parsed.getTime())) {
          throw new AppError('Invalid check-in or check-out timestamp', 400);
        }
        return parsed;
      }
      if (timeVal) {
        const tm = String(timeVal).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
        if (!tm) {
          throw new AppError('Time must be in HH:mm format', 400);
        }
        const hh = parseInt(tm[1], 10);
        const mm = parseInt(tm[2], 10);
        const ss = tm[3] ? parseInt(tm[3], 10) : 0;
        if (hh > 23 || mm > 59 || ss > 59) {
          throw new AppError('Invalid time value', 400);
        }
        return new Date(Date.UTC(year, month - 1, day, hh, mm, ss, 0) + offsetMin * 60000);
      }
      return null;
    };

    const requiresTime = !['absent', 'leave'].includes(status);
    let checkInDate = parseDateTimeInput(data.checkIn, data.checkInTime);
    let checkOutDate = parseDateTimeInput(data.checkOut, data.checkOutTime);

    if (requiresTime && !checkInDate) {
      throw new AppError('Check-in time is required for this status', 400);
    }

    let hoursWorked = 0;
    if (checkInDate && checkOutDate) {
      if (checkOutDate <= checkInDate) {
        throw new AppError('Check-out time must be after check-in time', 400);
      }
      hoursWorked = Math.round(((checkOutDate - checkInDate) / 3600000) * 100) / 100;
    }

    const isLate = status === 'late';
    let lateMinutes = 0;
    if (isLate && checkInDate && employee.attendanceSettings?.shiftTimings?.startTime) {
      const shiftStart = parseDateTimeInput(null, employee.attendanceSettings.shiftTimings.startTime);
      if (shiftStart && checkInDate > shiftStart) {
        lateMinutes = Math.floor((checkInDate - shiftStart) / 60000);
      }
    }

    // Find any existing record on that same calendar day (UTC or IST)
    const searchStart = new Date(utcCheck.getTime() - 24 * 3600000);
    const searchEnd = new Date(utcCheck.getTime() + 24 * 3600000);
    const nearbyRecords = await attendanceRepository.findByDateRange(employeeId, searchStart, searchEnd, {
      populate: '',
    });
    const existing = nearbyRecords.find((rec) => {
      if (attendanceRepository.isSameDay(rec.date, utcCheck)) return true;
      const recUtcDate = new Date(rec.date).toISOString().slice(0, 10);
      return recUtcDate === dateStr;
    });

    const trimmedNotes = String(notes || '').trim();
    const recordPayload = {
      date: utcCheck,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      hoursWorked,
      status,
      isLate,
      lateMinutes,
      checkInMethod: checkInDate ? 'manual' : '',
      checkOutMethod: checkOutDate ? 'manual' : '',
      notes: trimmedNotes,
      correctedBy: user._id,
      correctedAt: new Date(),
    };

    if (existing) {
      if (!overwrite) {
        throw new AppError(
          'Attendance record already exists for this date. Enable "Update existing record" to overwrite it.',
          409
        );
      }
      const updated = await attendanceRepository.updateById(existing._id, recordPayload);
      return {
        success: true,
        data: updated,
        message: 'Attendance updated for selected date',
      };
    }

    const created = await attendanceRepository.create({
      employee: employeeId,
      ...recordPayload,
    });
    const populated = await attendanceRepository.findById(created._id, { populate: 'employee' });

    return {
      success: true,
      data: populated || created,
      message: 'Old attendance added successfully',
    };
  }

  /**
   * Get today's attendance status
   * @param {String} employeeId - Employee ID
   * @returns {Promise<Object>}
   */
  async getTodayStatus(employeeId) {
    let attendance = await attendanceRepository.findTodayAttendance(employeeId);
    if (!attendance) {
      const activeSession = await attendanceRepository.findActiveSession(employeeId);
      if (activeSession) {
        attendance = activeSession;
      }
    }
    return {
      success: true,
      data: attendance || null,
    };
  }

  /**
   * Auto-create employee record for admin/super_admin
   * @param {Object} user - Current user
   * @returns {Promise<Object>} Created employee record
   */
  async autoCreateEmployeeForAdmin(user) {
    // Determine department and designation based on role
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;
    const department = roleSlug === 'super_admin' ? 'Management' : 'Management';
    const designation = roleSlug === 'super_admin' ? 'Super Administrator' : 'Administrator';

    // Generate employee ID
    const employeeId = await generateEmployeeId(department);

    // Create employee record
    const employeeData = {
      user: user._id,
      employeeId,
      department,
      designation,
      status: 'active',
      employmentType: 'full-time',
      accessLevel: 'admin',
      joiningDate: new Date(),
    };

    const employee = await employeeRepository.create(employeeData);

    // Create leave balance for new employee
    const currentYear = new Date().getFullYear();
    await LeaveBalance.create({
      employee: employee._id,
      year: currentYear,
      balances: {
        casual: { total: 12, used: 0, available: 12, pending: 0 },
        sick: { total: 10, used: 0, available: 10, pending: 0 },
        annual: { total: 15, used: 0, available: 15, pending: 0 },
        maternity: { total: 0, used: 0, available: 0, pending: 0 },
        paternity: { total: 0, used: 0, available: 0, pending: 0 },
        unpaid: { total: 0, used: 0, available: 0, pending: 0 },
      },
    });

    return employee;
  }

  /**
   * Check-in for current user (admin/employee)
   * Automatically finds or creates employee record for the logged-in user
   * @param {Object} data - Check-in data (location, notes)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async checkInSelf(data, user) {
    // Find employee record for current user
    let employee = await employeeRepository.findByUserId(user._id);

    // Auto-create employee record for admins/super_admins if not found
    if (!employee && (user.role === 'admin' || user.role === 'super_admin')) {
      employee = await this.autoCreateEmployeeForAdmin(user);
    } else if (!employee) {
      throw new AppError('Employee record not found. Please contact administrator to create an employee profile.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // Use the existing checkIn method with the employee's ID
    return await this.checkIn(employee._id.toString(), data, user);
  }

  /**
   * Check-out for current user (admin/employee)
   * Automatically finds or creates employee record for the logged-in user
   * @param {Object} data - Check-out data (location, notes)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async checkOutSelf(data, user) {
    // Find employee record for current user
    let employee = await employeeRepository.findByUserId(user._id);

    // Auto-create employee record for admins/super_admins if not found
    if (!employee && (user.role === 'admin' || user.role === 'super_admin')) {
      employee = await this.autoCreateEmployeeForAdmin(user);
    } else if (!employee) {
      throw new AppError('Employee record not found. Please contact administrator to create an employee profile.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // Use the existing checkOut method with the employee's ID
    return await this.checkOut(employee._id.toString(), data, user);
  }

  /**
   * Get attendance for current user (admin/employee)
   * Automatically finds or creates employee record for the logged-in user
   * @param {Object} filters - Query filters
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getAttendanceSelf(filters = {}, user) {
    // Find employee record for current user
    let employee = await employeeRepository.findByUserId(user._id);

    // Auto-create employee record for admins/super_admins if not found
    if (!employee && (user.role === 'admin' || user.role === 'super_admin')) {
      employee = await this.autoCreateEmployeeForAdmin(user);
    } else if (!employee) {
      throw new AppError('Employee record not found. Please contact administrator to create an employee profile.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    // Use the existing getAttendance method with the employee's ID
    return await this.getAttendance(employee._id.toString(), filters, user);
  }

  /**
   * Get today's attendance status for current user
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getTodayStatusSelf(user) {
    // Find employee record for current user
    let employee = await employeeRepository.findByUserId(user._id);

    // Auto-create employee record for admins/super_admins if not found
    if (!employee && (user.role === 'admin' || user.role === 'super_admin')) {
      employee = await this.autoCreateEmployeeForAdmin(user);
    } else if (!employee) {
      // For regular employees, return null instead of throwing error
      return {
        success: true,
        data: null,
      };
    }

    return await this.getTodayStatus(employee._id.toString());
  }

  /**
   * Get all employees attendance (admin and department employees)
   * - Super Admin/Admin: Can see ALL attendance
   * - Department employees: Can see attendance for their OWN department
   * @param {Object} filters - Query filters (startDate, endDate, employeeId)
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getAllAttendance(filters = {}, user) {
    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    const isSuperAdminOrAdmin = roleSlug === 'super_admin' || roleSlug === 'admin';

    const isDepartmentManager = roleSlug === 'sales_manager' || roleSlug === 'hrm_admin' ||
      roleSlug === 'finance_manager' || roleSlug === 'operations_manager' ||
      roleSlug === 'management_admin';

    const isDepartmentEmployee = roleSlug === 'employee' || roleSlug === 'sales_employee' ||
      roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
      roleSlug === 'operations_employee' || roleSlug === 'management_employee';

    // Get current user's employee record for department filtering
    let userDepartment = null;
    if (isDepartmentEmployee || isDepartmentManager) {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (currentEmployee) {
        userDepartment = currentEmployee.department;
      }
    }

    // For department employees/managers, force filter by their department
    if (!isSuperAdminOrAdmin && userDepartment) {
      filters.department = userDepartment;
    }

    // Separate filter fields from option fields
    const filterFields = { ...filters };
    const optionFields = {};

    // Extract option fields
    ['page', 'limit', 'skip', 'sortBy', 'sortOrder', 'sort', 'populate'].forEach(key => {
      if (filterFields[key]) {
        optionFields[key] = filterFields[key];
        delete filterFields[key];
      }
    });

    // Use query builder to build advanced filters
    let { query, options: queryOptions } = buildQuery.buildAttendanceQuery({ ...filterFields, ...optionFields });
    const { applyTenantScope } = require('../utils/tenantHelper');
    query = await applyTenantScope(query, user, 'attendance');

    // Handle month filter
    if (filters.month) {
      const [year, month] = filters.month.split('-');
      query.date = {
        $gte: new Date(year, parseInt(month) - 1, 1),
        $lte: new Date(year, parseInt(month), 0, 23, 59, 59, 999),
      };
    }

    // Handle department filtering
    let attendance;
    if (filters.department) {
      // Get all attendance and filter by employee's department
      const allAttendance = await attendanceRepository.findAll(query, {
        ...queryOptions,
        populate: 'employee',
        sort: { date: -1, employee: 1 },
      });

      const departments = Array.isArray(filters.department)
        ? filters.department
        : filters.department.split(',').map(d => d.trim());

      attendance = allAttendance.filter(att => {
        const empDept = att.employee?.department;
        return empDept && departments.includes(empDept);
      });
    } else {
      attendance = await attendanceRepository.findAll(query, {
        ...queryOptions,
        populate: 'employee',
        sort: { date: -1, employee: 1 },
      });
    }

    // Filter out Super Admin attendance for Admin users
    attendance = await filterSuperAdminData(attendance, user);

    return {
      success: true,
      data: attendance,
      count: attendance.length,
      meta: {
        page: queryOptions.page,
        limit: queryOptions.limit,
        total: attendance.length,
        pages: Math.ceil(attendance.length / queryOptions.limit),
        department: userDepartment || 'all', // Indicate which department is being viewed
      },
    };
  }
}

module.exports = new AttendanceService();

