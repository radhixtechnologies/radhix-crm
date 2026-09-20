const User = require('../models/User');
const Session = require('../models/Session');
const generateToken = require('../utils/generateToken');
const AppError = require('../utils/AppError');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../utils/emailService');

/**
 * Authentication Service
 * Handles business logic for authentication operations
 */
class AuthService {
  /**
   * Login user
   * @param {String} email - User email
   * @param {String} password - User password
   * @param {String} ipAddress - Client IP address
   * @param {String} userAgent - Client user agent
   * @returns {Promise<Object>}
   */
  async login(email, password, ipAddress = '', userAgent = '') {
    // Validate email and password
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Check for user and include password, populate role and customPermissions
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('role');

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact administrator.', 401);
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Create session
    const session = await Session.create({
      user: user._id,
      token,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });


    // Lookup employee record (exclude soft-deleted employees)
    let employeeId = null;
    const Employee = require('../models/Employee');
    const employee = await Employee.findOne({ user: user._id, deletedAt: null });
    if (employee) {
      employeeId = employee._id;
    }

    // Return user data without password
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role, // Now an object with role details
      department: user.department,
      avatar: user.avatar,
      isActive: user.isActive,
      employeeId: employeeId,
    };

    return {
      success: true,
      token,
      sessionId: session._id,
      data: userData,
    };
  }

  /**
   * Logout user
   * @param {String} token - JWT token
   * @param {String} sessionId - Session ID (optional)
   * @returns {Promise<Object>}
   */
  async logout(token, sessionId = null) {
    try {
      // If sessionId is provided, invalidate that specific session
      if (sessionId) {
        await Session.findByIdAndUpdate(sessionId, {
          isActive: false,
          loggedOutAt: new Date(),
        });
      } else {
        // Otherwise, invalidate all sessions with this token
        await Session.updateMany(
          { token, isActive: true },
          {
            isActive: false,
            loggedOutAt: new Date(),
          }
        );
      }

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      throw new AppError('Error during logout', 500);
    }
  }

  /**
   * Logout from all devices
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async logoutAll(userId) {
    try {
      await Session.updateMany(
        { user: userId, isActive: true },
        {
          isActive: false,
          loggedOutAt: new Date(),
        }
      );

      return {
        success: true,
        message: 'Logged out from all devices successfully',
      };
    } catch (error) {
      throw new AppError('Error during logout from all devices', 500);
    }
  }

  /**
   * Get current user
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async getCurrentUser(userId) {
    const user = await User.findById(userId)
      .populate('role');

    if (!user) {
      throw new AppError('User not found', 404);
    }


    // Get employee ID if exists (exclude soft-deleted employees)
    let employeeId = null;
    const Employee = require('../models/Employee');
    const employee = await Employee.findOne({ user: userId, deletedAt: null });
    if (employee) {
      employeeId = employee._id;
    }

    // Return user with employee ID
    const userData = user.toObject();
    userData.employeeId = employeeId;

    return {
      success: true,
      data: userData,
    };
  }

  /**
   * Update user profile
   * @param {String} userId - User ID
   * @param {Object} data - Update data
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, data) {
    const allowedFields = ['name', 'email', 'avatar'];
    const fieldsToUpdate = {};

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key)) {
        fieldsToUpdate[key] = data[key];
      }
    });

    // Check if email is being changed and if it's already taken
    if (fieldsToUpdate.email) {
      const existingUser = await User.findOne({
        email: fieldsToUpdate.email.toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
    }

    const user = await User.findByIdAndUpdate(userId, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    return {
      success: true,
      data: user,
      message: 'Profile updated successfully',
    };
  }

  /**
   * Change password
   * @param {String} userId - User ID
   * @param {String} currentPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<Object>}
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw new AppError('Please provide current password and new password', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all sessions except current one (optional - can be handled differently)
    // For now, we'll keep sessions active but user can logout manually

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  /**
   * Forgot password - generate reset token
   * @param {String} email - User email
   * @returns {Promise<Object>}
   */
  async forgotPassword(email) {
    if (!email) {
      throw new AppError('Please provide email address', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Hash token and save to database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = new Date(resetTokenExpire);

    await user.save({ validateBeforeSave: false });

    // Send email with reset token
    try {
      // Ensure FRONTEND_URL doesn't have trailing slash
      // Default to Vite's default port (5173) if not specified
      const frontendUrl = (process.env.FRONTEND_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
      // Encode the token to handle special characters in URL
      const encodedToken = encodeURIComponent(resetToken);
      const resetUrl = `${frontendUrl}/reset-password/${encodedToken}`;

      console.log('Password reset URL generated:', resetUrl.replace(/\/reset-password\/[^/]+/, '/reset-password/[TOKEN]'));

      await sendPasswordResetEmail(user.email, user.name, resetUrl);

      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (error) {
      // Reset token fields if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      // Enhanced error logging with full SMTP error details
      console.error('Password reset email error in authService:', {
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
        message: error.message,
      });

      // Handle authentication errors (535, EAUTH, etc.)
      if (
        error.code === 'EAUTH' ||
        error.command === 'AUTH' ||
        (error.response && (error.response.includes('535') || error.response.includes('Authentication failed'))) ||
        error.message.includes('535') ||
        error.message.includes('Authentication failed')
      ) {
        throw new AppError(
          `Email authentication failed (535). SMTP Response: ${error.response || error.message}. ` +
          `Please verify your Hostinger SMTP credentials (info@zynextro.com). ` +
          `If authentication still fails, generate a Hostinger SMTP App Password and use it instead of the regular password.`,
          500,
          'EMAIL_AUTH_ERROR'
        );
      }

      // Handle connection errors
      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
        throw new AppError(
          `Failed to connect to Hostinger SMTP server (smtp.hostinger.com:465). ` +
          `Error: ${error.message}. ` +
          `Please check your network connection, firewall settings, and ensure port 465 is not blocked.`,
          500,
          'EMAIL_CONNECTION_ERROR'
        );
      }

      // Handle configuration errors
      if (error.message && error.message.includes('Email service not configured')) {
        throw new AppError(
          'Email service is not configured. Please set up EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in your .env file.',
          500,
          'EMAIL_NOT_CONFIGURED'
        );
      }

      // Generic error handling
      throw new AppError(
        `Email could not be sent: ${error.message || 'Unknown error'}. ` +
        `SMTP Response: ${error.response || 'No response'}. ` +
        `Please check server logs for detailed error information.`,
        500,
        'EMAIL_SEND_ERROR'
      );
    }
  }

  /**
   * Reset password with token
   * @param {String} resetToken - Reset token
   * @param {String} newPassword - New password
   * @returns {Promise<Object>}
   */
  async resetPassword(resetToken, newPassword) {
    if (!resetToken || !newPassword) {
      throw new AppError('Please provide reset token and new password', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Hash token to compare with database
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Find user with valid reset token (include fields that are select: false)
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    // Invalidate all existing sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      {
        isActive: false,
        loggedOutAt: new Date(),
      }
    );

    return {
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  /**
   * Register new user (for super admin)
   * @param {Object} data - User data
   * @param {Object} currentUser - Current user (who is creating)
   * @returns {Promise<Object>}
   */
  async register(data, currentUser) {
    const { name, email, password, role, modulesAccess } = data;

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      throw new AppError('User already exists', 400);
    }

    // Validate role
    if (role && !['super_admin', 'admin', 'employee'].includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    // Only super admin can create admins
    if (role === 'admin' && currentUser.role !== 'super_admin') {
      throw new AppError('Only super admin can create admin users', 403);
    }

    // Only super admin and admin can create employees
    if (role === 'employee' && !['super_admin', 'admin'].includes(currentUser.role)) {
      throw new AppError('Not authorized to create employees', 403);
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'employee',
      modulesAccess: role === 'admin' ? modulesAccess || {} : {},
    });

    // Return user data without password
    return {
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        modulesAccess: user.modulesAccess,
      },
      message: 'User created successfully',
    };
  }

  /**
   * Verify session
   * @param {String} token - JWT token
   * @param {String} sessionId - Session ID (optional)
   * @returns {Promise<Object>}
   */
  async verifySession(token, sessionId = null) {
    if (sessionId) {
      const session = await Session.findOne({
        _id: sessionId,
        token,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });

      if (!session) {
        throw new AppError('Invalid or expired session', 401);
      }

      return {
        success: true,
        session,
      };
    }

    // If no sessionId, check if any active session exists with this token
    const session = await Session.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!session) {
      throw new AppError('Invalid or expired session', 401);
    }

    return {
      success: true,
      session,
    };
  }

  /**
   * Get user sessions
   * @param {String} userId - User ID
   * @returns {Promise<Object>}
   */
  async getUserSessions(userId) {
    const sessions = await Session.find({
      user: userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .select('-token');

    return {
      success: true,
      data: sessions,
    };
  }

  /**
   * Get user permissions based on role
   * @param {Object} user - User object
   * @returns {Object}
   */
  getUserPermissions(user) {
    const permissions = {
      canAccessEmployee: false,
      canAccessFinance: false,
      canAccessSales: false,
      canAccessHRM: false,
      canAccessDashboard: false,
      canAccessSettings: false,
    };

    // Handle both old string role and new role object
    const roleSlug = typeof user.role === 'object' ? user.role?.slug : user.role;
    const roleModules = typeof user.role === 'object' ? user.role?.modules : [];

    if (roleSlug === 'super_admin') {
      // Super admin has access to all modules
      permissions.canAccessEmployee = true;
      permissions.canAccessFinance = true;
      permissions.canAccessSales = true;
      permissions.canAccessHRM = true;
      permissions.canAccessDashboard = true;
      permissions.canAccessSettings = true;
    } else if (roleModules && roleModules.length > 0) {
      // Use role modules for new permission system
      permissions.canAccessEmployee = roleModules.includes('employee');
      permissions.canAccessFinance = roleModules.includes('finance');
      permissions.canAccessSales = roleModules.includes('sales');
      permissions.canAccessHRM = roleModules.includes('hrm');
      permissions.canAccessDashboard = roleModules.includes('dashboard');
      permissions.canAccessSettings = roleModules.includes('settings');
    } else {
      // Fallback: All users have access to employee module (My Profile)
      permissions.canAccessEmployee = true;
    }

    return permissions;
  }

  /**
   * Admin reset user password (without email)
   * @param {String} userId - User ID to reset
   * @param {String} newPassword - New password (optional, generates temporary if not provided)
   * @param {Object} currentUser - Current admin user
   * @returns {Promise<Object>}
   */
  async adminResetPassword(userId, newPassword = null, currentUser) {
    // Check permissions
    if (!['super_admin', 'admin'].includes(currentUser.role)) {
      throw new AppError('Not authorized to reset passwords', 403);
    }

    // Admin can only reset employees, super admin can reset anyone
    if (currentUser.role === 'admin') {
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new AppError('User not found', 404);
      }
      if (targetUser.role === 'super_admin') {
        throw new AppError('Admins cannot reset super admin passwords', 403);
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate temporary password if not provided
    let tempPassword = null;
    if (!newPassword) {
      tempPassword = crypto.randomBytes(8).toString('hex'); // 16-character password
      newPassword = tempPassword;
    }

    if (newPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long', 400);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Invalidate all existing sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      {
        isActive: false,
        loggedOutAt: new Date(),
      }
    );

    return {
      success: true,
      message: 'Password reset successfully',
      ...(tempPassword && { temporaryPassword: tempPassword }),
    };
  }

  /**
   * Generate temporary password for user
   * @param {String} userId - User ID
   * @param {Object} currentUser - Current admin user
   * @returns {Promise<Object>}
   */
  async generateTemporaryPassword(userId, currentUser) {
    // Check permissions
    if (!['super_admin', 'admin'].includes(currentUser.role)) {
      throw new AppError('Not authorized to generate temporary passwords', 403);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Admin can only reset employees, super admin can reset anyone
    if (currentUser.role === 'admin' && user.role === 'super_admin') {
      throw new AppError('Admins cannot reset super admin passwords', 403);
    }

    // Generate secure temporary password (12 characters)
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12-character password

    // Update password
    user.password = tempPassword;
    await user.save();

    // Invalidate all existing sessions
    await Session.updateMany(
      { user: user._id, isActive: true },
      {
        isActive: false,
        loggedOutAt: new Date(),
      }
    );

    return {
      success: true,
      temporaryPassword: tempPassword,
      message: 'Temporary password generated successfully',
    };
  }
}

module.exports = new AuthService();

