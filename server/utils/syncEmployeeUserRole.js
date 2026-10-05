const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Role');
const AppError = require('./AppError');

const departmentRoles = {
  Sales: 'sales_employee',
  HR: 'hrm_employee',
  HRM: 'hrm_employee',
  Finance: 'finance_employee',
  Operations: 'operations_employee',
  Management: 'management_employee',
};

const syncEmployeeUserRole = async (userId, department, requestedRole) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('Employee user account not found', 404);

  const updates = {};
  if (department) updates.department = department;

  let role = null;
  if (requestedRole) {
    role = mongoose.isValidObjectId(requestedRole)
      ? await Role.findById(requestedRole)
      : await Role.findOne({ slug: requestedRole });
    if (!role) throw new AppError('Selected role not found', 400);
  } else if (departmentRoles[department] && (!user.role || user.role === 'employee')) {
    role = await Role.findOne({ slug: departmentRoles[department] });
    if (!role) {
      throw new AppError(`Role ${departmentRoles[department]} not found. Please run the role seed script.`, 500);
    }
  }

  if (role) updates.role = role.slug;
  if (Object.keys(updates).length) {
    return User.findByIdAndUpdate(userId, updates, { new: true });
  }
  return user;
};

module.exports = syncEmployeeUserRole;
