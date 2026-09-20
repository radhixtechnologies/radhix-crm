const Employee = require('../models/Employee');
const Timesheet = require('../models/Timesheet');
const logActivity = require('../utils/activityLogger');
const { requireEmployee } = require('../utils/employeeHelper');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const buildQuery = require('../utils/buildQuery');
const { filterSuperAdminData, canAccessEmployeeResource } = require('../utils/roleFilter');

// Helper function to get role slug from user object
const getRoleSlug = (user) => {
  if (!user || !user.role) return null;
  return typeof user.role === 'object' ? user.role.slug : user.role;
};

// @desc    Get timesheets
// @route   GET /api/employees/timesheets
// @access  Private
exports.getTimesheets = asyncHandler(async (req, res) => {
  // Use query builder to build advanced filters
  let { query, options: queryOptions } = buildQuery.buildTimesheetQuery(req.query);

  // Get current user's employee record
  const currentEmployee = await Employee.findOne({ user: req.user._id });
  if (!currentEmployee) {
    throw new AppError('Employee record not found', 404);
  }

  const userRole = getRoleSlug(req.user);
  const employee = await Employee.findOne({ user: req.user._id });

  // Role-based filtering
  if (userRole === 'super_admin' || userRole === 'hrm_admin') {
    // Super Admin & HRM Admin: see everything by default
    if (req.query.view === 'my') {
      query.createdBy = req.user._id;
    }
  } else if (userRole === 'admin' || userRole?.endsWith('_admin')) {
    // Other Admins: see theirs + department by default, OR only theirs if view=my
    if (req.query.view === 'my') {
      query.createdBy = req.user._id;
    } else {
      const dept = employee ? employee.department : req.user.department;
      if (dept) {
        const deptEmployees = await Employee.find({ department: dept }).select('_id');
        const deptEmpIds = deptEmployees.map(e => e._id);

        query.$or = [
          { employee: { $in: deptEmpIds } },
          { createdBy: req.user._id }
        ];
      } else {
        query.createdBy = req.user._id;
      }
    }
  } else {
    // Normal employees see only their own
    query.createdBy = req.user._id;
  }

  // Handle department filtering for admin/super admin/hrm_admin
  let timesheets;
  if (req.query.department && (userRole === 'admin' || userRole === 'super_admin' || userRole === 'hrm_admin')) {
    // Get all timesheets and filter by employee's department
    const allTimesheets = await Timesheet.find(query)
      .populate('employee', 'employeeId user department')
      .populate('employee.user', 'name email')
      .populate('createdBy', 'name email role')
      .sort(queryOptions.sort)
      .skip(queryOptions.skip)
      .limit(queryOptions.limit)
      .exec();

    const departments = Array.isArray(req.query.department)
      ? req.query.department
      : req.query.department.split(',').map(d => d.trim());

    timesheets = allTimesheets.filter(ts => {
      const empDept = ts.employee?.department;
      return empDept && departments.includes(empDept);
    });
  } else {
    timesheets = await Timesheet.find(query)
      .populate('employee', 'employeeId user department')
      .populate('employee.user', 'name email')
      .populate('createdBy', 'name email role')
      .sort(queryOptions.sort)
      .skip(queryOptions.skip)
      .limit(queryOptions.limit)
      .exec();
  }

  const total = await Timesheet.countDocuments(query);

  res.status(200).json({
    success: true,
    count: timesheets.length,
    data: timesheets,
    meta: {
      page: queryOptions.page,
      limit: queryOptions.limit,
      total,
      pages: Math.ceil(total / queryOptions.limit),
    },
  });
});

// @desc    Get single timesheet
// @route   GET /api/employees/timesheets/:id
// @access  Private
exports.getTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await Timesheet.findById(req.params.id)
    .populate('employee', 'employeeId user department')
    .populate('employee.user', 'name email')
    .populate('createdBy', 'name email role');

  if (!timesheet) {
    throw new AppError('Timesheet not found', 404);
  }

  // Get current user's employee record
  const currentEmployee = await Employee.findOne({ user: req.user._id });
  if (!currentEmployee) {
    throw new AppError('Employee record not found', 404);
  }

  const userRole = getRoleSlug(req.user);

  // Role-based access control
  if (userRole === 'super_admin' || userRole === 'hrm_admin') {
    // Super Admin and HRM Admin can view everything
  } else if (userRole === 'admin' || userRole?.endsWith('_admin')) {
    // Admin can see:
    // 1. Their own records
    // 2. Records of employees in their department
    const isOwn = timesheet.createdBy.toString() === req.user._id.toString();
    const tsEmployee = await Employee.findById(timesheet.employee);
    const isSameDept = tsEmployee && tsEmployee.department === (currentEmployee?.department || req.user.department);

    if (!isOwn && !isSameDept) {
      throw new AppError('Not authorized to view this timesheet', 403);
    }
  } else {
    // Others (employees) can only see their own
    if (timesheet.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to view this timesheet', 403);
    }
  }

  res.status(200).json({
    success: true,
    data: timesheet,
  });
});

// @desc    Create timesheet
// @route   POST /api/employees/timesheets
// @access  Private
exports.createTimesheet = asyncHandler(async (req, res) => {
  const { date, workDescription, hours } = req.body;

  // Validate required fields
  if (!date || !workDescription || hours === undefined || hours === null) {
    throw new AppError('Date, work description, and hours are required', 400);
  }

  if (hours < 0 || hours > 24) {
    throw new AppError('Hours must be between 0 and 24', 400);
  }

  // Get employee record for the current user
  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) {
    throw new AppError('Employee record not found', 404);
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  // Check if timesheet for this date already exists
  const existing = await Timesheet.findOne({
    employee: employee._id,
    date: dateObj,
  });

  if (existing) {
    throw new AppError('Timesheet for this date already exists. Please update it instead.', 400);
  }

  // Determine roleOfCreator based on user role
  let roleOfCreator = 'employee';
  const userRole = getRoleSlug(req.user);

  if (userRole === 'admin') {
    roleOfCreator = 'admin';
  } else if (userRole === 'super_admin') {
    roleOfCreator = 'super_admin';
  }

  const timesheet = await Timesheet.create({
    employee: employee._id,
    date: dateObj,
    workDescription,
    hours,
    createdBy: req.user._id,
    roleOfCreator,
    isEditable: true, // Always editable
  });

  logActivity(req.user._id, 'create', 'employee', 'Timesheet', timesheet._id, req.body, req.ip).catch(console.error);

  await timesheet.populate('employee', 'employeeId user');
  await timesheet.populate('employee.user', 'name email');
  await timesheet.populate('createdBy', 'name email role');

  res.status(201).json({
    success: true,
    message: 'Timesheet created successfully',
    data: timesheet,
  });
});

// @desc    Update timesheet
// @route   PUT /api/employees/timesheets/:id
// @access  Private
exports.updateTimesheet = asyncHandler(async (req, res) => {
  const { date, workDescription, hours } = req.body;

  // Validate required fields
  if (!date || !workDescription || hours === undefined || hours === null) {
    throw new AppError('Date, work description, and hours are required', 400);
  }

  if (hours < 0 || hours > 24) {
    throw new AppError('Hours must be between 0 and 24', 400);
  }

  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) {
    throw new AppError('Employee record not found', 404);
  }

  const timesheet = await Timesheet.findById(req.params.id);
  if (!timesheet) {
    throw new AppError('Timesheet not found', 404);
  }

  // Check access - users can only update their own timesheets
  if (timesheet.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to update this timesheet', 403);
  }

  // Check if timesheet is editable
  if (!timesheet.isEditable) {
    throw new AppError('This timesheet is not editable', 400);
  }

  // Check if employee matches (for additional safety)
  if (timesheet.employee.toString() !== employee._id.toString()) {
    throw new AppError('Not authorized to update this timesheet', 403);
  }

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  // Check if another timesheet exists for the new date (if date changed)
  if (timesheet.date.getTime() !== dateObj.getTime()) {
    const existing = await Timesheet.findOne({
      employee: employee._id,
      date: dateObj,
      _id: { $ne: timesheet._id }
    });

    if (existing) {
      throw new AppError('Timesheet for this date already exists', 400);
    }
  }

  // Update timesheet
  timesheet.date = dateObj;
  timesheet.workDescription = workDescription;
  timesheet.hours = hours;
  timesheet.updatedAt = new Date();
  await timesheet.save();

  logActivity(req.user._id, 'update', 'employee', 'Timesheet', timesheet._id, req.body, req.ip).catch(console.error);

  await timesheet.populate('employee', 'employeeId user');
  await timesheet.populate('employee.user', 'name email');
  await timesheet.populate('createdBy', 'name email role');

  res.status(200).json({
    success: true,
    data: timesheet,
    message: 'Timesheet updated successfully',
  });
});


// @desc    Delete timesheet
// @route   DELETE /api/employees/timesheets/:id
// @access  Private
exports.deleteTimesheet = asyncHandler(async (req, res) => {
  const timesheet = await Timesheet.findById(req.params.id);
  if (!timesheet) {
    throw new AppError('Timesheet not found', 404);
  }

  // Check access - users can only delete their own timesheets
  if (timesheet.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to delete this timesheet', 403);
  }

  const employee = await Employee.findOne({ user: req.user._id });
  if (!employee) {
    throw new AppError('Employee record not found', 404);
  }

  // Check if employee matches
  if (timesheet.employee.toString() !== employee._id.toString()) {
    throw new AppError('Not authorized to delete this timesheet', 403);
  }

  await timesheet.deleteOne();

  logActivity(req.user._id, 'delete', 'employee', 'Timesheet', timesheet._id, null, req.ip).catch(console.error);

  res.status(200).json({
    success: true,
    data: {},
    message: 'Timesheet deleted successfully',
  });
});

