const employeeRepository = require('../repositories/employeeRepository');
const leaveBalanceRepository = require('../repositories/leaveBalanceRepository');
const User = require('../models/User');
const LeaveBalance = require('../models/LeaveBalance');
const { generateEmployeeId } = require('../utils/employeeHelper');
const AppError = require('../utils/AppError');
const buildQuery = require('../utils/buildQuery');
const { addSuperAdminFilter, canAccessEmployeeResource, filterSuperAdminEmployees } = require('../utils/roleFilter');
const permissionService = require('./permissionService');

/**
 * Employee Service
 * Handles business logic for employee operations
 */
class EmployeeService {
  /**
   * Get all employees
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getEmployees(filters = {}, options = {}, user) {
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

    console.log('EmployeeService.getEmployees - Filters:', filterFields, 'Options:', optionFields);

    // Use query builder to build advanced filters
    let { query, options: queryOptions } = buildQuery.buildEmployeeQuery({ ...filterFields, ...optionFields });

    console.log('EmployeeService.getEmployees - Built query:', JSON.stringify(query, null, 2));

    // Use permission service to determine scope dynamic
    const scope = await permissionService.getPermissionScope(user, 'employee', 'read');
    const isAdmin = await permissionService.isAdmin(user);

    if (scope === 'own') {
      const employee = await employeeRepository.findByUserId(user._id);
      if (!employee) {
        throw new AppError('Employee record not found', 404, 'EMPLOYEE_NOT_FOUND');
      }
      query._id = employee._id;
    } else if (scope === 'department' && user.department) {
      query.department = user.department;
    }

    // Filter out Super Admin employees for Admin users
    if (isAdmin) {
      query = await addSuperAdminFilter(query, user);
    }

    // Add search functionality for user.name and user.email (search parameter)
    // The query builder only searches in direct fields (employeeId, designation)
    // We need to add search for populated fields (user.name, user.email)
    if (filterFields.search && filterFields.search.trim()) {
      const searchTerm = filterFields.search.trim();
      const searchRegex = { $regex: searchTerm, $options: 'i' };

      // Merge with existing $or query if present
      if (query.$or && Array.isArray(query.$or)) {
        // Add user.name and user.email search to existing $or
        query.$or = query.$or.concat([
          { 'user.name': searchRegex },
          { 'user.email': searchRegex }
        ]);
      } else {
        // Create new $or query with user.name and user.email
        query.$or = [
          { 'user.name': searchRegex },
          { 'user.email': searchRegex }
        ];
      }
    }

    // Add custom name/email search (these are handled by query builder, but adding as fallback)
    if (filterFields.name) {
      query.$or = query.$or || [];
      query.$or.push({ 'user.name': { $regex: filterFields.name, $options: 'i' } });
    }

    if (filterFields.email) {
      query['user.email'] = { $regex: filterFields.email, $options: 'i' };
    }

    // Handle skills multi-select
    if (filterFields.skills) {
      const skills = Array.isArray(filterFields.skills) ? filterFields.skills : filterFields.skills.split(',');
      query.skills = { $in: skills.map(s => s.trim()) };
    }

    // Experience range
    if (filterFields.experienceMin) {
      query.experience = query.experience || {};
      query.experience.$gte = parseFloat(filterFields.experienceMin);
    }
    if (filterFields.experienceMax) {
      query.experience = query.experience || {};
      query.experience.$lte = parseFloat(filterFields.experienceMax);
    }

    // Salary range
    if (filterFields.salaryMin) {
      query.salary = query.salary || {};
      query.salary.$gte = parseFloat(filterFields.salaryMin);
    }
    if (filterFields.salaryMax) {
      query.salary = query.salary || {};
      query.salary.$lte = parseFloat(filterFields.salaryMax);
    }

    // Joining date range
    if (filterFields.joiningDateStart) {
      query.joiningDate = query.joiningDate || {};
      query.joiningDate.$gte = new Date(filterFields.joiningDateStart);
    }
    if (filterFields.joiningDateEnd) {
      const endDate = new Date(filterFields.joiningDateEnd);
      endDate.setHours(23, 59, 59, 999);
      query.joiningDate = query.joiningDate || {};
      query.joiningDate.$lte = endDate;
    }

    // Work location
    if (filterFields.workLocation) {
      query.workLocation = { $regex: filterFields.workLocation, $options: 'i' };
    }

    // Manager filter
    if (filterFields.managerId) {
      query.manager = filterFields.managerId;
    }

    // Handle sorting for nested fields (user.name)
    let sortQuery = queryOptions.sort;
    if (options.sortBy) {
      if (options.sortBy === 'user.name' || options.sortBy === 'name') {
        // For nested field sorting, we need to sort after population
        // MongoDB doesn't support direct sorting on populated fields
        sortQuery = { 'user.name': options.sortOrder === 'asc' ? 1 : -1 };
      } else {
        sortQuery = { [options.sortBy]: options.sortOrder === 'asc' ? 1 : -1 };
      }
    }

    // Populate user and manager by default
    const finalOptions = {
      ...queryOptions,
      populate: options.populate || 'user manager',
      sort: sortQuery,
    };

    const employees = await employeeRepository.findAll(query, finalOptions);
    const total = await employeeRepository.count(query);

    return {
      success: true,
      data: employees,
      meta: {
        page: queryOptions.page,
        limit: queryOptions.limit,
        total,
        pages: Math.ceil(total / queryOptions.limit),
      },
    };
  }

  /**
   * Get employee by ID
   * @param {String} id - Employee ID
   * @param {Object} options - Query options
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async getEmployeeById(id, options = {}, user) {
    let employee = await employeeRepository.findById(id, options);

    // Fallback: if not found by Employee ID, try finding by User ID
    // This handles cases where the frontend passes User ID instead of Employee ID
    if (!employee) {
      const mongoose = require('mongoose');
      // Check if the ID is a valid ObjectId before looking up
      if (mongoose.Types.ObjectId.isValid(id)) {
        employee = await employeeRepository.findByUserId(id);
      }
    }

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Check access - use permission service for more robust check
    const scope = await permissionService.getPermissionScope(user, 'employee', 'read');
    const isAdmin = await permissionService.isAdmin(user);

    if (scope === 'own') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (!currentEmployee || currentEmployee._id.toString() !== employee._id.toString()) {
        throw new AppError('Not authorized to view this employee', 403);
      }
    } else if (scope === 'department') {
      if (user.department && employee.department !== user.department) {
        throw new AppError('Not authorized to view employees outside your department', 403);
      }
    }

    // Check if Admin is trying to access Super Admin employee
    if (isAdmin) {
      const canAccess = await canAccessEmployeeResource(employee, user);
      if (!canAccess) {
        throw new AppError('Not authorized to access this employee', 403);
      }
    }

    return {
      success: true,
      data: employee,
    };
  }

  /**
   * Create employee
   * @param {Object} data - Employee data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async createEmployee(data, user) {
    // Generate employee ID if not provided
    if (!data.employeeId) {
      data.employeeId = await generateEmployeeId(data.idDeptCode);
    }

    // Check if employee ID already exists
    const exists = await employeeRepository.employeeIdExists(data.employeeId);
    if (exists) {
      throw new AppError('Employee ID already exists', 400);
    }

    // Handle user creation/linking
    let userToUse = null;
    if (data.userId) {
      userToUse = await User.findById(data.userId);
      if (!userToUse) {
        throw new AppError('User not found', 404);
      }
      // Check if employee already exists for this user
      const existingEmployee = await employeeRepository.findByUserId(data.userId);
      if (existingEmployee) {
        throw new AppError('Employee already exists for this user', 400);
      }
    } else if (data.email) {
      // Create new user if email provided
      userToUse = await User.findOne({ email: data.email });
      if (!userToUse) {
        // Create new user with auto-generated password
        const { name, email, password, department } = data;

        // Auto-generate password if not provided (for security, admin shouldn't set passwords)
        let userPassword = password;
        if (!userPassword) {
          const crypto = require('crypto');
          userPassword = crypto.randomBytes(8).toString('hex');
        }

        // Determine role
        const Role = require('../models/Role');
        let roleSlugForUser;

        // 1. Check if role is explicitly provided (e.g. by Admin)
        if (data.role && data.role.trim() !== '') {
          const explicitRole = await Role.findById(data.role);
          if (explicitRole) {
            roleSlugForUser = explicitRole.slug;
          }
        }

        // 2. If no role provided or found, fallback to department mapping
        if (!roleSlugForUser) {
          let roleSlug = 'employee'; // Default

          if (department === 'Sales') {
            roleSlug = 'sales_employee';
          } else if (department === 'HR' || department === 'HRM') {
            roleSlug = 'hrm_employee';
          } else if (department === 'Finance') {
            roleSlug = 'finance_employee';
          } else if (department === 'Operations') {
            roleSlug = 'operations_employee';
          } else if (department === 'Management') {
            roleSlug = 'management_employee';
          }

          let employeeRole = await Role.findOne({ slug: roleSlug });
          if (!employeeRole && roleSlug === 'employee') {
            employeeRole = await Role.create({
              name: 'Employee',
              slug: 'employee',
              level: 1,
              modules: ['dashboard', 'employee'],
              permissions: [],
            });
          }
          if (!employeeRole) {
            throw new AppError(`Role ${roleSlug} not found. Please run seed script.`, 500);
          }
          roleSlugForUser = employeeRole.slug;
        }



        userToUse = await User.create({
          name: name || email.split('@')[0],
          email,
          password: userPassword,
          role: roleSlugForUser,
          department: department || null,
        });

        // Store generated password for response (will be removed before returning)
        userToUse._generatedPassword = userPassword;
      } else {
        // Check if employee already exists
        const existingEmployee = await employeeRepository.findByUserId(userToUse._id);
        if (existingEmployee) {
          throw new AppError('Employee already exists for this email', 400);
        }
      }
    } else {
      throw new AppError('Either userId or email is required', 400);
    }

    // Create employee
    const employeeData = {
      ...data,
      user: userToUse._id,
    };
    delete employeeData.userId;
    delete employeeData.name;
    delete employeeData.email;
    delete data.password;

    const employee = await employeeRepository.create(employeeData);

    // Create leave balance for new employee with default values
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

    // Sync role and department to associated User if provided in employee data
    // This ensures the user has the correct role/department immediately
    if (userToUse && (data.role || data.department)) {
      const userUpdateFields = {};
      if (data.role && userToUse.role !== data.role) {
        const Role = require('../models/Role');
        const selectedRole = await Role.findById(data.role);
        if (selectedRole) userUpdateFields.role = selectedRole.slug;
      }
      if (data.department) userUpdateFields.department = data.department;

      await User.findByIdAndUpdate(userToUse._id, userUpdateFields);
    }

    // Populate and return
    const populatedEmployee = await employeeRepository.findById(employee._id, {
      populate: 'user manager',
    });

    // Prepare response
    const response = {
      success: true,
      data: populatedEmployee,
      message: 'Employee created successfully',
    };

    // Include generated password in response if user was created with auto-generated password
    if (userToUse._generatedPassword) {
      response.generatedPassword = userToUse._generatedPassword;
      response.message = 'Employee created successfully. A temporary password has been generated.';
    }

    return response;
  }

  /**
   * Update employee
   * @param {String} id - Employee ID
   * @param {Object} data - Update data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async updateEmployee(id, data, user) {
    // Check if employee exists
    const existingEmployee = await employeeRepository.findById(id);
    if (!existingEmployee) {
      throw new AppError('Employee not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check access
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' ||
      roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
      roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (!currentEmployee || currentEmployee._id.toString() !== id) {
        throw new AppError('Not authorized to update this employee', 403);
      }
    }

    // Check if Admin is trying to update Super Admin employee
    const canAccess = await canAccessEmployeeResource(existingEmployee, user);
    if (!canAccess) {
      throw new AppError('Not authorized to update this employee', 403);
    }

    // Check if employee ID already exists (if being changed)
    if (data.employeeId && data.employeeId !== existingEmployee.employeeId) {
      const exists = await employeeRepository.employeeIdExists(data.employeeId, id);
      if (exists) {
        throw new AppError('Employee ID already exists', 400);
      }
    }

    // Handle salary history if salary is being updated
    if (data.salary && data.salary !== existingEmployee.salary) {
      const salaryHistoryEntry = {
        effectiveDate: new Date(),
        salary: data.salary,
        salaryStructure: data.salaryStructure || existingEmployee.salaryStructure,
        changedBy: user._id,
        reason: data.salaryChangeReason || 'Salary update',
      };
      await employeeRepository.addSalaryHistory(id, salaryHistoryEntry);
    }

    // Update employee
    const employee = await employeeRepository.updateById(id, data, {
      populate: 'user manager',
    });

    // Sync role and department to associated User if provided
    if (employee.user && (data.role || data.department)) {
      const userUpdateFields = {};
      if (data.role) userUpdateFields.role = data.role;
      if (data.department) userUpdateFields.department = data.department;

      await User.findByIdAndUpdate(employee.user._id || employee.user, userUpdateFields);
    }

    return {
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    };
  }

  /**
   * Delete employee (permanent deletion)
   * Also deletes the associated User account and all related records
   * @param {String} id - Employee ID or User ID
   * @param {Object} currentUser - Current user performing the deletion
   * @returns {Promise<Object>}
   */
  async deleteEmployee(id, currentUser) {
    let employee = await employeeRepository.findById(id, { includeDeleted: true });

    // Fallback: if not found by Employee ID, try finding by User ID
    if (!employee) {
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(id)) {
        // findByUserId already handles soft-deleted check by default? Let's check.
        // Actually findByUserId has deletedAt: null hardcoded in some versions, 
        // but we'll try to find any employee for this user.
        const Employee = require('../models/Employee');
        employee = await Employee.findOne({ user: id }).populate('user');
      }
    }

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Check if Admin is trying to delete Super Admin employee
    const canAccess = await canAccessEmployeeResource(employee, currentUser);
    if (!canAccess) {
      throw new AppError('Not authorized to delete this employee', 403);
    }

    const employeeId = employee._id;
    const userId = employee.user?._id || employee.user;

    // 1. Delete associated User account
    if (userId) {
      await User.findByIdAndDelete(userId);
    }

    // 2. Delete Leave Balances
    const LeaveBalance = require('../models/LeaveBalance');
    await LeaveBalance.deleteMany({ employee: employeeId });

    // 3. Delete Attendance records
    const Attendance = require('../models/Attendance');
    await Attendance.deleteMany({ employee: employeeId });

    // 4. Delete Tasks (or unassign them)
    const Task = require('../models/Task');
    // Option A: Delete tasks assigned to them
    await Task.deleteMany({ assignedTo: employeeId });
    // Option B: Delete tasks created by them
    await Task.deleteMany({ creator: employeeId });

    // 5. Delete Leaves
    const Leave = require('../models/Leave');
    await Leave.deleteMany({ employee: employeeId });

    // 6. Delete Salary Slips
    const SalarySlip = require('../models/SalarySlip');
    await SalarySlip.deleteMany({ employee: employeeId });

    // 7. Delete Performance records
    const Performance = require('../models/Performance');
    await Performance.deleteMany({ employee: employeeId });

    // 8. Delete Asset assignments (or mark as unassigned)
    const Asset = require('../models/Asset');
    await Asset.updateMany({ assignedTo: employeeId }, { $set: { assignedTo: null, status: 'available' } });

    // 9. Delete Timesheets
    const Timesheet = require('../models/Timesheet');
    await Timesheet.deleteMany({ employee: employeeId });

    // 10. Delete Reimbursements
    const Reimbursement = require('../models/Reimbursement');
    await Reimbursement.deleteMany({ employee: employeeId });

    // Finally, hard delete the employee record
    await employeeRepository.deleteById(employeeId);

    return {
      success: true,
      message: 'Employee, associated user account, and all related records deleted permanently',
    };
  }

  /**
   * Add document to employee
   * @param {String} id - Employee ID
   * @param {Object} document - Document data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async addDocument(id, document, user) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const documentData = {
      ...document,
      uploadedBy: user._id,
      uploadedAt: new Date(),
    };

    const updated = await employeeRepository.addDocument(id, documentData);

    return {
      success: true,
      data: updated,
      message: 'Document added successfully',
    };
  }

  /**
   * Remove document from employee
   * @param {String} id - Employee ID
   * @param {String} docId - Document ID
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async removeDocument(id, docId, user) {
    const employee = await employeeRepository.findById(id);
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
      if (!currentEmployee || currentEmployee._id.toString() !== id) {
        throw new AppError('Not authorized', 403);
      }
    }

    const updated = await employeeRepository.removeDocument(id, docId);

    return {
      success: true,
      data: updated,
      message: 'Document removed successfully',
    };
  }

  /**
   * Add skill to employee
   * @param {String} id - Employee ID
   * @param {Object} skill - Skill data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async addSkill(id, skill, user) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    // Get role slug
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;

    // Check access - employees can only add skills to their own profile
    if (roleSlug === 'employee' || roleSlug === 'sales_employee' ||
      roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
      roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
      const currentEmployee = await employeeRepository.findByUserId(user._id);
      if (!currentEmployee || currentEmployee._id.toString() !== id) {
        throw new AppError('Not authorized to add skills to this employee', 403);
      }
    }

    const updated = await employeeRepository.addSkill(id, skill);

    return {
      success: true,
      data: updated,
      message: 'Skill added successfully',
    };
  }

  /**
   * Update skill
   * @param {String} id - Employee ID
   * @param {String} skillId - Skill ID
   * @param {Object} skillData - Updated skill data
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async updateSkill(id, skillId, skillData, user) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const updated = await employeeRepository.updateSkill(id, skillId, skillData);

    return {
      success: true,
      data: updated,
      message: 'Skill updated successfully',
    };
  }

  /**
   * Remove skill
   * @param {String} id - Employee ID
   * @param {String} skillId - Skill ID
   * @param {Object} user - Current user
   * @returns {Promise<Object>}
   */
  async removeSkill(id, skillId, user) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    const updated = await employeeRepository.removeSkill(id, skillId);

    return {
      success: true,
      data: updated,
      message: 'Skill removed successfully',
    };
  }
}

module.exports = new EmployeeService();

