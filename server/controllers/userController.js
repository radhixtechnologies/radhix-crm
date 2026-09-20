const User = require('../models/User');
const Role = require('../models/Role');
const logActivity = require('../utils/activityLogger');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// Helper function to get role slug from user object
const getRoleSlug = (user) => {
  if (!user || !user.role) return null;
  return typeof user.role === 'object' ? user.role.slug : user.role;
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Super Admin, Admin)
exports.getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  let query = {};

  // Filter by role if provided (convert slug to ObjectId)
  if (role) {
    const roleDoc = await Role.findOne({ slug: role });
    if (roleDoc) {
      query.role = roleDoc._id;
    } else {
      // If role not found, return empty list (or should we throw error?)
      // For filtering, returning empty is safer
      query.role = null;
    }
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const userRole = getRoleSlug(req.user);

  // Super admin can see all, admin can see employees and other admins (if permitted)
  if (userRole === 'admin') {
    // Admin can view 'admin' and 'employee' roles
    const allowedRoles = await Role.find({ slug: { $in: ['admin', 'employee'] } });
    const allowedRoleIds = allowedRoles.map(r => r._id);

    // If query.role is already set, ensure it's within allowed roles
    if (query.role) {
      const isAllowed = allowedRoleIds.some(id => id.toString() === query.role.toString());
      if (!isAllowed) {
        // If trying to access forbidden role, return empty
        query.role = null;
      }
    } else {
      // Limit to allowed roles
      query.role = { $in: allowedRoleIds };
    }
  }

  const users = await User.find(query)
    .select('-password')
    .populate('role', 'name slug permissions')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Create admin user (Super Admin only)
// @route   POST /api/users/admin
// @access  Private (Super Admin)
exports.createAdmin = asyncHandler(async (req, res) => {
  const { name, email, password, modulesAccess } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError('User already exists', 400);
  }

  const admin = await User.create({
    name,
    email,
    password,
    role: 'admin',
    modulesAccess: modulesAccess || {
      employee: false,
      finance: false,
      sales: false,
      hrm: false,
    },
  });

  // Log activity
  logActivity(req.user._id, 'create', 'settings', 'Admin', admin._id, { modulesAccess }, req.ip).catch(console.error);

  res.status(201).json({
    success: true,
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      modulesAccess: admin.modulesAccess,
      createdAt: admin.createdAt,
    },
    message: 'Admin created successfully',
  });
});

// @desc    Get all roles
// @route   GET /api/users/roles
// @access  Private (Super Admin, Admin)
exports.getRoles = asyncHandler(async (req, res) => {
  const Role = require('../models/Role');
  const roles = await Role.find({}).sort({ level: 1 });

  res.status(200).json({
    success: true,
    count: roles.length,
    data: roles,
  });
});

// @desc    Update admin module access
// @route   PUT /api/users/:id/modules
// @access  Private (Super Admin)
exports.updateAdminModules = asyncHandler(async (req, res) => {
  const { modulesAccess } = req.body;
  const admin = await User.findById(req.params.id);

  if (!admin || admin.role !== 'admin') {
    throw new AppError('Admin not found', 404);
  }

  admin.modulesAccess = modulesAccess || {
    employee: false,
    finance: false,
    sales: false,
    hrm: false,
  };
  await admin.save();

  // Log activity
  logActivity(req.user._id, 'update', 'settings', 'Admin', admin._id, { modulesAccess }, req.ip).catch(console.error);

  res.status(200).json({
    success: true,
    data: {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      modulesAccess: admin.modulesAccess,
    },
    message: 'Admin module access updated successfully',
  });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Super Admin, Admin)
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if email is being changed and if it already exists
  if (req.body.email && req.body.email !== user.email) {
    const emailExists = await User.findOne({ email: req.body.email });
    if (emailExists) {
      throw new AppError('Email already exists', 400);
    }
  }

  // Update fields
  if (req.body.name !== undefined) {
    user.name = req.body.name;
  }
  if (req.body.email !== undefined) {
    user.email = req.body.email;
  }
  if (req.body.password !== undefined && req.body.password !== '') {
    user.password = req.body.password; // Will be hashed by pre-save hook
  }
  if (req.body.modulesAccess !== undefined) {
    user.modulesAccess = req.body.modulesAccess;
  }
  if (req.body.isActive !== undefined) {
    user.isActive = req.body.isActive;
  }
  if (req.body.role !== undefined) {
    user.role = req.body.role;
  }

  await user.save();

  // Log activity
  logActivity(req.user._id, 'update', 'settings', 'User', user._id, req.body, req.ip).catch(console.error);

  const updatedUser = await User.findById(user._id).select('-password');

  res.status(200).json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully',
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Super Admin, Admin)
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting super_admin
  if (user.role === 'super_admin') {
    throw new AppError('Cannot delete super admin', 403);
  }

  // Also delete associated Employee record if it exists
  const Employee = require('../models/Employee');
  await Employee.deleteMany({ user: user._id });

  await user.deleteOne();

  // Log activity
  logActivity(req.user._id, 'delete', 'settings', 'User', user._id, null, req.ip).catch(console.error);

  res.status(200).json({
    success: true,
    data: {},
    message: 'User and associated employee record deleted successfully',
  });
});

