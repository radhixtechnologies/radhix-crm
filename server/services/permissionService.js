const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');

const getRoleSlug = (user) => {
  if (typeof user?.role === 'string') return user.role;
  return user?.role?.slug;
};

/**
 * Permission Service
 * Centralized service for all permission-related operations
 */

/**
 * Check if user has a specific permission
 * @param {Object} user - User object (should be populated with role and customPermissions)
 * @param {String} module - Module name (e.g., 'employee', 'sales', 'hrm')
 * @param {String} action - Action name (e.g., 'create', 'read', 'update', 'delete')
 * @param {String} resource - Resource name (e.g., 'employees', 'leads', 'deals')
 * @returns {Promise<Boolean>}
 */
async function hasPermission(user, module, action, resource = null) {
  if (!user) return false;

  // Populate role and permissions if not already populated
  if (!user.populated('role')) {
    await user.populate('role');
  }
  if (user.schema?.path('customPermissions')?.options?.ref && !user.populated('customPermissions')) {
    await user.populate('customPermissions');
  }

  // Super Admin has all permissions
  if (user.role && user.role.slug === 'super_admin') {
    return true;
  }

  // Admins have all permissions for their assigned modules
  if (user.role && (user.role.slug === 'admin' || user.role.slug.includes('_admin'))) {
    if (user.role.modules && user.role.modules.includes(module)) {
      return true;
    }
  }

  // Build permission query
  const permissionQuery = {
    module,
    action,
    isActive: true,
  };

  if (resource) {
    permissionQuery.resource = resource;
  }

  // Check custom permissions first (they override role permissions)
  if (user.customPermissions && user.customPermissions.length > 0) {
    const hasCustomPerm = user.customPermissions.some((p) => {
      if (!p.isActive) return false;
      if (p.module !== module || p.action !== action) return false;
      if (resource && p.resource !== resource) return false;
      return true;
    });
    if (hasCustomPerm) return true;
  }

  // Check role permissions
  if (user.role && user.role.permissions && user.role.permissions.length > 0) {
    const rolePermissions = await Permission.find({
      _id: { $in: user.role.permissions },
      ...permissionQuery,
    });
    return rolePermissions.length > 0;
  }

  return false;
}

/**
 * Check if user can access a module
 * @param {Object} user - User object
 * @param {String} module - Module name
 * @returns {Promise<Boolean>}
 */
async function canAccessModule(user, module) {
  if (!user) return false;

  // Populate role if not already populated
  if (!user.populated('role')) {
    await user.populate('role');
  }

  // Super Admin can access all modules
  if (user.role && user.role.slug === 'super_admin') {
    return true;
  }

  // All users can access employee module (for "My Profile")
  if (module === 'employee') {
    return true;
  }

  // Check if module is in user's role
  if (user.role && user.role.modules && user.role.modules.includes(module)) {
    return true;
  }

  return false;
}

/**
 * Get all modules accessible by user
 * @param {Object} user - User object
 * @returns {Promise<Array<String>>}
 */
async function getAccessibleModules(user) {
  if (!user) return [];

  // Populate role if not already populated
  if (!user.populated('role')) {
    await user.populate('role');
  }

  // Super Admin can access all modules
  if (user.role && user.role.slug === 'super_admin') {
    return ['dashboard', 'employee', 'finance', 'sales', 'hrm', 'settings'];
  }

  const modules = ['employee']; // All users have access to employee module (My Profile)

  // Add modules from role
  if (user.role && user.role.modules) {
    user.role.modules.forEach((module) => {
      if (!modules.includes(module)) {
        modules.push(module);
      }
    });
  }

  return modules;
}

/**
 * Get all permissions for a user
 * @param {String} userId - User ID
 * @returns {Promise<Array>}
 */
async function getUserPermissions(userId) {
  const user = await User.findById(userId)
    .populate('role')
    .populate('customPermissions');

  if (!user) return [];

  const permissions = [];

  // Get role permissions
  if (user.role && user.role.permissions) {
    const rolePermissions = await Permission.find({
      _id: { $in: user.role.permissions },
      isActive: true,
    });
    permissions.push(...rolePermissions);
  }

  // Add custom permissions
  if (user.customPermissions) {
    permissions.push(...user.customPermissions.filter((p) => p.isActive));
  }

  // Remove duplicates
  const uniquePermissions = permissions.filter(
    (p, index, self) =>
      index === self.findIndex((t) => t.name === p.name)
  );

  return uniquePermissions;
}

/**
 * Get permission scope for user
 * @param {Object} user - User object
 * @param {String} module - Module name
 * @param {String} action - Action name
 * @param {String} resource - Resource name
 * @returns {Promise<String>} - 'all', 'department', 'team', 'own'
 */
async function getPermissionScope(user, module, action, resource) {
  if (!user) return 'own';

  const roleSlug = getRoleSlug(user);
  if (roleSlug === 'super_admin') return 'all';

  // Populate role and permissions if not already populated
  if (user.schema?.path('role')?.options?.ref && !user.populated('role')) {
    await user.populate('role');
  }
  if (user.schema?.path('customPermissions')?.options?.ref && !user.populated('customPermissions')) {
    await user.populate('customPermissions');
  }

  // Super Admin has 'all' scope
  if (getRoleSlug(user) === 'super_admin') {
    return 'all';
  }

  // Admins have 'all' scope for their assigned modules
  if (roleSlug === 'admin' || roleSlug?.includes('_admin') || roleSlug?.includes('_manager')) {
    if (typeof user.role === 'string' || user.role.modules?.includes(module)) {
      return 'all';
    }
  }

  // Check custom permissions first
  if (user.customPermissions && user.customPermissions.length > 0) {
    const customPerm = user.customPermissions.find((p) => {
      if (!p.isActive) return false;
      if (p.module !== module || p.action !== action) return false;
      if (resource && p.resource !== resource) return false;
      return true;
    });
    if (customPerm) return customPerm.scope || 'own';
  }

  // Check role permissions
  if (user.role && user.role.permissions && user.role.permissions.length > 0) {
    const rolePermissions = await Permission.find({
      _id: { $in: user.role.permissions },
      module,
      action,
      isActive: true,
    });

    if (resource) {
      const resourcePerm = rolePermissions.find((p) => p.resource === resource);
      if (resourcePerm) return resourcePerm.scope || 'own';
    }

    if (rolePermissions.length > 0) {
      return rolePermissions[0].scope || 'own';
    }
  }

  return 'own';
}

/**
 * Apply scope filter to query based on user permissions
 * @param {Object} query - MongoDB query object
 * @param {Object} user - User object
 * @param {String} scope - Scope ('all', 'department', 'team', 'own')
 * @returns {Promise<Object>} - Modified query
 */
async function applyScopeFilter(query, user, scope) {
  if (scope === 'all') {
    return query; // No filter needed
  }

  if (scope === 'department' && user.department) {
    // Filter by department
    query.department = user.department;
  } else if (scope === 'team') {
    // Filter by manager (user is manager) or user's manager's team
    const Employee = require('../models/Employee');
    const employeeRepository = require('../repositories/employeeRepository');

    const currentEmployee = await employeeRepository.findByUserId(user._id);
    if (currentEmployee) {
      // Get all employees where this user is the manager
      const teamMembers = await Employee.find({ manager: currentEmployee._id }).select('_id');
      const teamMemberIds = teamMembers.map((e) => e._id);
      teamMemberIds.push(currentEmployee._id); // Include self

      query._id = { $in: teamMemberIds };
    }
  } else if (scope === 'own') {
    // Filter to only user's own data
    const Employee = require('../models/Employee');
    const employeeRepository = require('../repositories/employeeRepository');

    const currentEmployee = await employeeRepository.findByUserId(user._id);
    if (currentEmployee) {
      query._id = currentEmployee._id;
    } else {
      // If no employee record, return empty result
      query._id = null;
    }
  }

  return query;
}

/**
 * Check if user is Super Admin
 * @param {Object} user - User object
 * @returns {Promise<Boolean>}
 */
async function isSuperAdmin(user) {
  if (!user) return false;

  if (!user.populated('role')) {
    await user.populate('role');
  }

  return user.role && user.role.slug === 'super_admin';
}

/**
 * Check if user is Admin (any admin role)
 * @param {Object} user - User object
 * @returns {Promise<Boolean>}
 */
async function isAdmin(user) {
  if (!user) return false;

  const roleSlug = getRoleSlug(user);
  if (roleSlug) {
    return roleSlug === 'super_admin' || roleSlug === 'admin' || roleSlug.includes('_admin') || roleSlug.includes('_manager');
  }

  if (user.schema?.path('role')?.options?.ref && !user.populated('role')) {
    await user.populate('role');
  }

  return user.role && (
    user.role.slug === 'super_admin' ||
    user.role.slug === 'admin' ||
    user.role.slug.includes('_admin') ||
    user.role.slug.includes('_manager')
  );
}

module.exports = {
  hasPermission,
  canAccessModule,
  getAccessibleModules,
  getUserPermissions,
  getPermissionScope,
  applyScopeFilter,
  isSuperAdmin,
  isAdmin,
};
