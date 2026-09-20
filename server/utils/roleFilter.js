/**
 * Role-based data filtering utilities
 * Ensures Admins cannot access Super Admin data
 */

/**
 * Check if an employee is associated with a Super Admin user
 * @param {Object} employee - Employee object (may have populated user)
 * @returns {Promise<Boolean>}
 */
async function isSuperAdminEmployee(employee) {
  // If employee has populated user, check directly
  if (employee.user && typeof employee.user === 'object') {
    const roleSlug = typeof employee.user.role === 'object' ? employee.user.role?.slug : employee.user.role;
    return roleSlug === 'super_admin';
  }

  // If user is just an ID, we need to fetch it
  if (employee.user) {
    const User = require('../models/User');
    const user = await User.findById(employee.user).populate('role').select('role');
    const roleSlug = typeof user?.role === 'object' ? user.role?.slug : user?.role;
    return roleSlug === 'super_admin';
  }

  return false;
}

/**
 * Check if current user can access an employee resource
 * Admins cannot access Super Admin employees
 * @param {Object|String} employee - Employee object or employee ID
 * @param {Object} currentUser - Current user making the request
 * @returns {Promise<Boolean>}
 */
async function canAccessEmployeeResource(employee, currentUser) {
  // Get role slug (handle both old string format and new object format)
  const roleSlug = typeof currentUser.role === 'object' ? currentUser.role?.slug : currentUser.role;

  // Super Admin can access everything
  if (roleSlug === 'super_admin') {
    return true;
  }

  // Regular employees can only access their own data
  if (roleSlug === 'employee' || roleSlug === 'sales_employee' ||
    roleSlug === 'hrm_employee' || roleSlug === 'finance_employee' ||
    roleSlug === 'operations_employee' || roleSlug === 'management_employee') {
    const Employee = require('../models/Employee');
    const employeeRepository = require('../repositories/employeeRepository');

    const currentEmployee = await employeeRepository.findByUserId(currentUser._id);
    if (!currentEmployee) {
      return false;
    }

    const employeeId = typeof employee === 'string' ? employee : employee._id?.toString();
    return currentEmployee._id.toString() === employeeId;
  }

  // Admin/Manager roles
  const isAdmin = await require('../services/permissionService').isAdmin(currentUser);
  if (isAdmin) {
    const employeeObj = typeof employee === 'string'
      ? await require('../repositories/employeeRepository').findById(employee, { populate: 'user', includeDeleted: true })
      : employee;

    if (!employeeObj) {
      return false;
    }

    // Check if the admin/manager is updating their own profile
    const employeeRepository = require('../repositories/employeeRepository');
    const currentEmployee = await employeeRepository.findByUserId(currentUser._id);
    if (currentEmployee && currentEmployee._id.toString() === employeeObj._id.toString()) {
      return true; // Allow updating own profile
    }

    // Otherwise, check if they're trying to access a Super Admin employee
    const isSuperAdmin = await isSuperAdminEmployee(employeeObj);
    return !isSuperAdmin; // Admin can access if NOT Super Admin
  }

  return false;
}

/**
 * Filter out Super Admin employees from an array
 * @param {Array} employees - Array of employee objects
 * @param {Object} currentUser - Current user making the request
 * @returns {Promise<Array>}
 */
async function filterSuperAdminEmployees(employees, currentUser) {
  // Get role slug
  const roleSlug = typeof currentUser.role === 'object' ? currentUser.role?.slug : currentUser.role;

  // Super Admin can see everything
  if (roleSlug === 'super_admin') {
    return employees;
  }

  // Admin/Manager cannot see Super Admin employees
  const isAdmin = await require('../services/permissionService').isAdmin(currentUser);
  if (isAdmin) {
    const filtered = [];
    for (const employee of employees) {
      const isSuperAdmin = await isSuperAdminEmployee(employee);
      if (!isSuperAdmin) {
        filtered.push(employee);
      }
    }
    return filtered;
  }

  // Employees can only see themselves (should already be filtered)
  return employees;
}

/**
 * Filter out Super Admin data from any resource that references an employee
 * @param {Array|Object} data - Data array or object
 * @param {Object} currentUser - Current user making the request
 * @returns {Promise<Array|Object|null>}
 */
async function filterSuperAdminData(data, currentUser) {
  // Get role slug
  const roleSlug = typeof currentUser.role === 'object' ? currentUser.role?.slug : currentUser.role;

  // Super Admin can see everything
  if (roleSlug === 'super_admin') {
    return data;
  }

  // Admin/Manager cannot see Super Admin data
  const isAdmin = await require('../services/permissionService').isAdmin(currentUser);
  if (isAdmin) {
    if (Array.isArray(data)) {
      const filtered = [];
      for (const item of data) {
        if (item.employee) {
          const canAccess = await canAccessEmployeeResource(item.employee, currentUser);
          if (canAccess) {
            filtered.push(item);
          }
        } else {
          // If no employee reference, include it
          filtered.push(item);
        }
      }
      return filtered;
    } else if (data && data.employee) {
      const canAccess = await canAccessEmployeeResource(data.employee, currentUser);
      return canAccess ? data : null;
    }
  }

  return data;
}

/**
 * Add query filter to exclude Super Admin employees for Admin users
 * @param {Object} query - MongoDB query object
 * @param {Object} currentUser - Current user making the request
 * @returns {Promise<Object>}
 */
async function addSuperAdminFilter(query, currentUser) {
  // Get role slug
  const roleSlug = typeof currentUser.role === 'object' ? currentUser.role?.slug : currentUser.role;

  // Super Admin can see everything
  if (roleSlug === 'super_admin') {
    return query;
  }

  // Admin/Manager cannot see Super Admin employees
  const isAdmin = await require('../services/permissionService').isAdmin(currentUser);
  if (isAdmin) {
    const User = require('../models/User');
    const Role = require('../models/Role');

    // Find Super Admin role
    const superAdminRole = await Role.findOne({ slug: 'super_admin' });
    if (superAdminRole) {
      // Find all users with Super Admin role
      const superAdminUsers = await User.find({ role: superAdminRole._id }).select('_id');
      const superAdminUserIds = superAdminUsers.map(u => u._id);

      // Add filter to exclude employees with Super Admin users
      if (superAdminUserIds.length > 0) {
        // Only add filter if query.user is not already set
        // If query.user is already set, it means there's a specific filter in place
        if (!query.user) {
          query.user = { $nin: superAdminUserIds };
        } else if (typeof query.user === 'object' && !query.user._id) {
          // If it's already an object with operators (like $in, $ne), merge $nin
          query.user.$nin = superAdminUserIds;
        }
        // If query.user is a direct ObjectId/string, don't override it
      }
    }
  }

  return query;
}

module.exports = {
  isSuperAdminEmployee,
  canAccessEmployeeResource,
  filterSuperAdminEmployees,
  filterSuperAdminData,
  addSuperAdminFilter,
};

