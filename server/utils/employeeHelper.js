const Employee = require('../models/Employee');
const LeaveBalance = require('../models/LeaveBalance');

/**
 * Get employee record for logged-in user
 * @param {Object} userId - User ID from req.user._id
 * @returns {Promise<Object>} Employee record or null
 * @throws {Error} If employee not found with helpful message
 */
async function getEmployeeByUser(userId) {
  try {
    const employee = await Employee.findOne({ user: userId });
    return employee;
  } catch (error) {
    console.error('Error finding employee by user:', error);
    throw error;
  }
}

async function ensureEmployeeForUser(user) {
  let employee = await Employee.findOne({ user: user._id, deletedAt: null });
  const role = typeof user.role === 'object' ? user.role?.slug : user.role;

  if (!employee && (role === 'admin' || role === 'super_admin')) {
    const department = 'Management';
    employee = await Employee.create({
      user: user._id,
      employeeId: await generateEmployeeId(department),
      department,
      designation: role === 'super_admin' ? 'Super Administrator' : 'Administrator',
      status: 'active',
      employmentType: 'full-time',
      joiningDate: new Date(),
    });

    await LeaveBalance.updateOne(
      { employee: employee._id, year: new Date().getFullYear() },
      {
        $setOnInsert: {
          employee: employee._id,
          year: new Date().getFullYear(),
          balances: {
            casual: { total: 12, used: 0, available: 12, pending: 0 },
            sick: { total: 10, used: 0, available: 10, pending: 0 },
            annual: { total: 15, used: 0, available: 15, pending: 0 },
          },
        },
      },
      { upsert: true }
    );
  }

  return employee;
}

/**
 * Get employee record for logged-in user or throw error
 * @param {Object} userId - User ID from req.user._id
 * @returns {Promise<Object>} Employee record
 * @throws {Object} Error response object if employee not found
 */
async function requireEmployee(userId, userEmail = null) {
  const employee = await getEmployeeByUser(userId);

  if (!employee) {
    const error = {
      success: false,
      message: 'Employee record not found. Please contact your administrator to create an employee profile for your account.',
      errorCode: 'EMPLOYEE_NOT_FOUND',
      userEmail: userEmail,
      solution: 'An administrator needs to create an employee profile for your account. Please contact your HR department or system administrator.',
    };
    throw error;
  }

  return employee;
}

async function generateEmployeeId(deptCode) {
  const Counter = require('../models/Counter');

  // Atomically find and update the counter
  const counter = await Counter.findByIdAndUpdate(
    { _id: 'employeeId' },
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // Create if doesn't exist
  );

  // Format: ZY26/ND/DEV/0019 where 26 is year, ND is static, DEV is dept code, 0019 is padded seq
  const year = new Date().getFullYear().toString().slice(-2);
  const prefix = `ZY${year}/ND`;

  // Mapping for default departments if full names are provided (e.g., from imports)
  const mapping = {
    'IT': 'DEV',
    'HR': 'HR',
    'Sales': 'MKT',
    'Finance': 'FIN',
    'Management': 'MGMT',
    'Operations': 'OPS',
    'Quality': 'QA',
    'Digital Marketing': 'DM',
    'Graphic Design': 'GD'
  };

  const department = mapping[deptCode] || deptCode || 'DEV';
  const sequence = String(counter.seq).padStart(4, '0');

  const employeeId = `${prefix}/${department}/${sequence}`;

  return employeeId;
}

module.exports = {
  getEmployeeByUser,
  ensureEmployeeForUser,
  requireEmployee,
  generateEmployeeId,
};
