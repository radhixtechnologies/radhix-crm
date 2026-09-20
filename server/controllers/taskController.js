const Task = require('../models/Task');
const Employee = require('../models/Employee');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { ensureEmployeeForUser } = require('../utils/employeeHelper');
const buildQuery = require('../utils/buildQuery');
const { filterSuperAdminData, canAccessEmployeeResource } = require('../utils/roleFilter');

// Helper function to get role slug from user object
const getRoleSlug = (user) => {
  if (!user || !user.role) return null;
  return typeof user.role === 'object' ? user.role.slug : user.role;
};

// Helper function to get standardized category for Task model enum: ['employee', 'admin', 'super_admin']
const getRoleCategory = (user) => {
  const slug = getRoleSlug(user);
  if (!slug) return 'employee';
  if (slug === 'super_admin') return 'super_admin';
  if (slug === 'admin' || slug.endsWith('_admin') || slug.endsWith('_manager')) return 'admin';
  return 'employee';
};

/**
 * @desc    Get all tasks
 * @route   GET /api/employees/tasks
 * @access  Private
 */
exports.getTasks = asyncHandler(async (req, res) => {
  // Use query builder to build advanced filters
  let { query, options: queryOptions } = buildQuery.buildTaskQuery(req.query);

  const roleCategory = getRoleCategory(req.user);

  // Role-based filtering
  if (roleCategory === 'employee') {
    // Employees can only see tasks assigned to them
    const employee = await ensureEmployeeForUser(req.user);
    if (!employee) {
      throw new AppError('Employee record not found. Please contact HR to create your employee profile.', 404);
    }
    query.assignedTo = employee._id;
  } else if (roleCategory === 'admin') {
    // Admins can see:
    // 1. Tasks assigned to employees in their related department
    // 2. Their own tasks
    // 3. Tasks they created

    const employee = await ensureEmployeeForUser(req.user);
    const dept = employee ? employee.department : req.user.department;

    if (dept) {
      // Find all employees in this department
      const deptEmployees = await Employee.find({ department: dept }).select('_id');
      const deptEmployeeIds = deptEmployees.map(emp => emp._id);

      query.$or = [
        { assignedTo: { $in: deptEmployeeIds } },
        { createdBy: req.user._id }
      ];
    } else {
      // Fallback: If no department found, only see their own/created tasks
      query.$or = [
        { assignedTo: employee ? employee._id : null },
        { createdBy: req.user._id }
      ];
    }

    // Role-based constraint: Admins cannot see Super Admin created tasks unless assigned to them
    // (This is implicitly handled by the $or query above)

    // Handle specific admin view filters
    if (req.query.approvalStatus === 'pending') {
      query.status = 'submitted_for_approval';
    } else if (req.query.view === 'my-tasks' && employee) {
      query.assignedTo = employee._id;
      // Remove $or since we want specifically their own tasks
      delete query.$or;
    }
  } else if (roleCategory === 'super_admin') {
    // Super Admin can see everything
    if (req.query.approvalStatus === 'pending') {
      // Show admin tasks waiting for super admin approval
      query.roleOfCreator = 'admin';
      query.status = 'submitted_for_approval';
    } else if (req.query.view === 'my-tasks') {
      // Show super admin's own tasks
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.assignedTo = employee._id;
      }
    }
    // Otherwise, show all tasks (query remains wide)
  }

  // Handle department filtering for tasks
  let tasks;
  if (req.query.department && (roleCategory === 'admin' || roleCategory === 'super_admin')) {
    // Get all tasks and filter by assigned employee's department
    const allTasks = await Task.find(query)
      .populate('assignedTo', 'employeeId designation department user')
      .populate('assignedTo.user', 'name email')
      .populate('assignedBy', 'name email')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort(queryOptions.sort)
      .skip(queryOptions.skip)
      .limit(queryOptions.limit)
      .exec();

    const departments = Array.isArray(req.query.department)
      ? req.query.department
      : req.query.department.split(',').map(d => d.trim());

    tasks = allTasks.filter(task => {
      const empDept = task.assignedTo?.department;
      return empDept && departments.includes(empDept);
    });
  } else {
    tasks = await Task.find(query)
      .populate('assignedTo', 'employeeId designation department user')
      .populate('assignedTo.user', 'name email')
      .populate('assignedBy', 'name email')
      .populate('createdBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort(queryOptions.sort)
      .skip(queryOptions.skip)
      .limit(queryOptions.limit)
      .exec();
  }

  // Filter out Super Admin tasks for Admin users
  if (roleCategory === 'admin') {
    tasks = await filterSuperAdminData(tasks, req.user);
  }

  const total = Array.isArray(tasks) ? tasks.length : await Task.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
    meta: {
      page: queryOptions.page,
      limit: queryOptions.limit,
      total,
      pages: Math.ceil(total / queryOptions.limit),
    },
  });
});

/**
 * @desc    Create task
 * @route   POST /api/employees/tasks
 * @access  Private (All roles - employees can create tasks for themselves)
 */
exports.createTask = asyncHandler(async (req, res) => {
  const { assignedTo, ...taskData } = req.body;

  let assignedToId;
  const userRole = getRoleSlug(req.user);
  const roleCategory = getRoleCategory(req.user);

  // 1. Get current logged-in employee record first (needed for both cases typically)
  const currentEmployee = await Employee.findOne({ user: req.user._id });

  // 2. Logic based on Role Category
  if (roleCategory === 'employee') {
    // Employees can ONLY create tasks for themselves
    if (!currentEmployee) {
      throw new AppError('Your employee record was not found. Please contact HR.', 404);
    }
    assignedToId = currentEmployee._id;
  } else {
    // Admin or Super Admin
    if (assignedTo) {
      // If a specific ID was sent
      if (typeof assignedTo === 'string' && assignedTo.match(/^[0-9a-fA-F]{24}$/)) {
        // It looks like a MongoDB ObjectId (e.g. from dropdown value) -> Verify it exists
        const emp = await Employee.findById(assignedTo);
        if (!emp) throw new AppError('Assigned employee not found', 404);
        assignedToId = emp._id;
      } else {
        // It might be a custom employeeId string (e.g. EMP001) -> Find by employeeId
        const emp = await Employee.findOne({ employeeId: assignedTo });
        if (!emp) throw new AppError(`Employee with ID '${assignedTo}' not found`, 404);
        assignedToId = emp._id;
      }
    } else {
      // No assignedTo provided -> Self Assign
      if (!currentEmployee) {
        throw new AppError('Your employee record was not found to self-assign this task.', 404);
      }
      assignedToId = currentEmployee._id;
    }
  }

  if (!assignedToId) {
    throw new AppError('Assigned to employee could not be determined. Please specify an assignee.', 400);
  }

  // Create task with approval workflow fields
  const task = await Task.create({
    ...taskData,
    assignedTo: assignedToId,
    assignedBy: req.user._id,
    createdBy: req.user._id,
    roleOfCreator: roleCategory,
    status: 'created', // Initial status
  });

  await task.populate('assignedTo', 'employeeId designation department user');
  await task.populate('assignedTo.user', 'name email');
  await task.populate('assignedBy', 'name email');
  await task.populate('createdBy', 'name email role');

  res.status(201).json({
    success: true,
    data: task,
    message: 'Task created successfully',
  });
});

/**
 * @desc    Update task
 * @route   PUT /api/employees/tasks/:id
 * @access  Private
 */
exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const userRole = getRoleSlug(req.user);

  // Check access - users can only update their own tasks
  if (userRole === 'employee') {
    // Employees can only update their own tasks
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee || task.assignedTo.toString() !== employee._id.toString()) {
      throw new AppError('Not authorized to update this task', 403);
    }
    // Employees cannot update tasks that are already submitted or approved
    if (['submitted_for_approval', 'approved_by_admin', 'rejected_by_admin'].includes(task.status)) {
      throw new AppError('Cannot update task that is already submitted or approved', 400);
    }
  } else if (userRole === 'admin') {
    // Admins can only update their own tasks
    if (task.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this task', 403);
    }
    // Admins cannot update tasks that are already submitted or approved
    if (['submitted_for_approval', 'approved_by_superadmin', 'rejected_by_superadmin'].includes(task.status)) {
      throw new AppError('Cannot update task that is already submitted or approved', 400);
    }
  } else if (userRole === 'super_admin') {
    // Super Admins can only update their own tasks
    if (task.createdBy.toString() !== req.user._id.toString()) {
      throw new AppError('Not authorized to update this task', 403);
    }
  }

  // Prevent updating certain fields directly
  const restrictedFields = ['createdBy', 'roleOfCreator', 'approvedBy', 'approvalDate', 'submittedAt'];
  restrictedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      delete req.body[field];
    }
  });

  // Update task
  Object.keys(req.body).forEach(key => {
    task[key] = req.body[key];
  });

  task.updatedAt = new Date();

  // Update completion date if status is completed
  if (req.body.status === 'completed' && !task.completionDate) {
    task.completionDate = new Date();
  }

  await task.save();

  await task.populate('assignedTo', 'employeeId designation department user');
  await task.populate('assignedTo.user', 'name email');
  await task.populate('assignedBy', 'name email');
  await task.populate('createdBy', 'name email role');
  await task.populate('approvedBy', 'name email role');

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task updated successfully',
  });
});

/**
 * @desc    Submit task for approval
 * @route   POST /api/employees/tasks/:id/submit
 * @access  Private
 */
exports.submitTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  // Check access - only task creator can submit
  if (task.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized to submit this task', 403);
  }

  // Validate task can be submitted
  if (task.status !== 'created') {
    throw new AppError(`Task cannot be submitted. Current status: ${task.status}`, 400);
  }

  // Update task status based on creator role
  if (task.roleOfCreator === 'employee') {
    // Employee tasks need admin approval
    task.status = 'submitted_for_approval';
  } else if (task.roleOfCreator === 'admin') {
    // Admin tasks need super admin approval
    task.status = 'submitted_for_approval';
  } else if (task.roleOfCreator === 'super_admin') {
    // Super admin tasks don't need approval (auto-approved)
    task.status = 'approved_by_superadmin';
    task.approvedBy = req.user._id;
    task.approvalDate = new Date();
  }

  task.submittedAt = new Date();
  task.updatedAt = new Date();
  await task.save();

  await task.populate('assignedTo', 'employeeId designation department user');
  await task.populate('assignedTo.user', 'name email');
  await task.populate('assignedBy', 'name email');
  await task.populate('createdBy', 'name email role');
  await task.populate('approvedBy', 'name email role');

  res.status(200).json({
    success: true,
    data: task,
    message: task.roleOfCreator === 'super_admin'
      ? 'Task auto-approved (Super Admin)'
      : 'Task submitted for approval successfully',
  });
});

/**
 * @desc    Approve task
 * @route   POST /api/employees/tasks/:id/approve
 * @access  Private (Admin, Super Admin)
 */
exports.approveTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const roleCategory = getRoleCategory(req.user);

  // Check if task is in submitted state
  if (task.status !== 'submitted_for_approval') {
    throw new AppError(`Task cannot be approved. Current status: ${task.status}`, 400);
  }

  // Check authorization based on task creator role and approver role
  if (task.roleOfCreator === 'employee') {
    // Employee tasks must be approved by admin
    if (roleCategory !== 'admin' && roleCategory !== 'super_admin') {
      throw new AppError('Only admin can approve employee tasks', 403);
    }
    // Check if admin is trying to approve Super Admin employee task
    if (roleCategory === 'admin') {
      const canAccess = await canAccessEmployeeResource(task.assignedTo, req.user);
      if (!canAccess) {
        throw new AppError('Not authorized to approve this task', 403);
      }
    }
    task.status = 'approved_by_admin';
  } else if (task.roleOfCreator === 'admin') {
    // Admin tasks must be approved by super admin
    if (roleCategory !== 'super_admin') {
      throw new AppError('Only super admin can approve admin tasks', 403);
    }
    task.status = 'approved_by_superadmin';
  } else {
    throw new AppError('Invalid task for approval', 400);
  }

  task.approvedBy = req.user._id;
  task.approvalDate = new Date();
  task.updatedAt = new Date();
  await task.save();

  await task.populate('assignedTo', 'employeeId designation department user');
  await task.populate('assignedTo.user', 'name email');
  await task.populate('assignedBy', 'name email');
  await task.populate('createdBy', 'name email role');
  await task.populate('approvedBy', 'name email role');

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task approved successfully',
  });
});

/**
 * @desc    Reject task
 * @route   POST /api/employees/tasks/:id/reject
 * @access  Private (Admin, Super Admin)
 */
exports.rejectTask = asyncHandler(async (req, res) => {
  const { rejectionReason } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const roleCategory = getRoleCategory(req.user);

  // Check if task is in submitted state
  if (task.status !== 'submitted_for_approval') {
    throw new AppError(`Task cannot be rejected. Current status: ${task.status}`, 400);
  }

  // Check authorization based on task creator role and approver role
  if (task.roleOfCreator === 'employee') {
    // Employee tasks must be rejected by admin
    if (roleCategory !== 'admin' && roleCategory !== 'super_admin') {
      throw new AppError('Only admin can reject employee tasks', 403);
    }
    // Check if admin is trying to reject Super Admin employee task
    if (roleCategory === 'admin') {
      const canAccess = await canAccessEmployeeResource(task.assignedTo, req.user);
      if (!canAccess) {
        throw new AppError('Not authorized to reject this task', 403);
      }
    }
    task.status = 'rejected_by_admin';
  } else if (task.roleOfCreator === 'admin') {
    // Admin tasks must be rejected by super admin
    if (roleCategory !== 'super_admin') {
      throw new AppError('Only super admin can reject admin tasks', 403);
    }
    task.status = 'rejected_by_superadmin';
  } else {
    throw new AppError('Invalid task for rejection', 400);
  }

  task.approvedBy = req.user._id;
  task.approvalDate = new Date();
  task.rejectionReason = rejectionReason || 'No reason provided';
  task.updatedAt = new Date();
  await task.save();

  await task.populate('assignedTo', 'employeeId designation department user');
  await task.populate('assignedTo.user', 'name email');
  await task.populate('assignedBy', 'name email');
  await task.populate('createdBy', 'name email role');
  await task.populate('approvedBy', 'name email role');

  res.status(200).json({
    success: true,
    data: task,
    message: 'Task rejected successfully',
  });
});

/**
 * @desc    Get single task
 * @route   GET /api/employees/tasks/:id
 * @access  Private
 */
exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'employeeId designation department user')
    .populate('assignedTo.user', 'name email')
    .populate('assignedBy', 'name email')
    .populate('createdBy', 'name email role')
    .populate('approvedBy', 'name email role');

  if (!task) {
    throw new AppError('Task not found', 404);
  }

  const roleCategory = getRoleCategory(req.user);

  // Check access based on role
  if (roleCategory === 'employee') {
    // Employees can only see their own tasks
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee || task.assignedTo.toString() !== employee._id.toString()) {
      throw new AppError('Not authorized to view this task', 403);
    }
    // Employees cannot see admin or super admin tasks
    if (task.roleOfCreator !== 'employee') {
      throw new AppError('Not authorized to view this task', 403);
    }
  } else if (roleCategory === 'admin') {
    // Admins can see employee tasks and their own tasks
    // Cannot see Super Admin tasks
    if (task.roleOfCreator === 'super_admin') {
      throw new AppError('Not authorized to view this task', 403);
    }
    // Check if admin is viewing their own task or employee task
    if (task.roleOfCreator === 'admin' && task.createdBy.toString() !== req.user._id.toString()) {
      // Admin viewing another admin's task - not allowed
      throw new AppError('Not authorized to view this task', 403);
    }
  }
  // Super Admin can see everything (no additional check needed)

  res.status(200).json({
    success: true,
    data: task,
  });
});

