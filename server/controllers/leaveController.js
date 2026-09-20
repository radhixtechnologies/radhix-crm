const leaveService = require('../services/leaveService');
const { asyncHandler } = require('../utils/asyncHandler');
const Employee = require('../models/Employee');

/**
 * @desc    Create leave request
 * @route   POST /api/employees/leaves
 * @access  Private
 */
exports.createLeave = asyncHandler(async (req, res) => {
  // Get employee ID from body or params
  let employeeId = req.body.employeeId || req.user.employeeId;

  // Determine role slug
  const roleSlug = typeof req.user.role === 'object' ? req.user.role.slug : req.user.role;

  // If user is employee, get their employee record
  if (roleSlug === 'employee') {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }
    // Convert to string to ensure consistent format
    employeeId = employee._id.toString();
  }

  if (!employeeId) {
    return res.status(400).json({
      success: false,
      message: 'Employee ID is required',
    });
  }

  const result = await leaveService.createLeave(employeeId, req.body, req.user);
  res.status(201).json(result);
});

/**
 * @desc    Get leaves
 * @route   GET /api/employees/leaves
 * @route   GET /api/employees/:id/leaves (for specific employee)
 * @access  Private
 */
exports.getLeaves = asyncHandler(async (req, res) => {
  console.log('getLeaves called. Params:', req.params, 'Query:', req.query, 'User:', req.user?._id);
  // If employeeId is in params (/:id/leaves route), add it to filters
  let filters = { ...req.query };
  if (req.params.id) {
    filters.employeeId = req.params.id;
  }

  const result = await leaveService.getLeaves(filters, req.query, req.user);
  res.status(200).json(result);
});

/**
 * @desc    Get leave by ID
 * @route   GET /api/employees/leaves/:id
 * @access  Private
 */
exports.getLeave = asyncHandler(async (req, res) => {
  const result = await leaveService.getLeaveById(req.params.id, req.user);
  res.status(200).json(result);
});

/**
 * @desc    Update leave (approve/reject)
 * @route   PUT /api/employees/leaves/:id
 * @access  Private (Admin, Super Admin)
 */
exports.updateLeave = asyncHandler(async (req, res) => {
  const { status } = req.body;

  let result;
  if (status === 'approved') {
    result = await leaveService.approveLeave(req.params.id, req.body, req.user);
  } else if (status === 'rejected') {
    result = await leaveService.rejectLeave(req.params.id, req.body, req.user);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Use "approved" or "rejected"',
    });
  }

  res.status(200).json(result);
});

