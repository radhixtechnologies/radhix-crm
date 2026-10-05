const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const getRole = (user) => typeof user?.role === 'object' ? user.role.slug : user?.role;

exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: 'Not authorized' });
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: 'Not authorized' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

exports.authorize = (...allowedRoles) => (req, res, next) => {
  const roles = allowedRoles.flat();
  if (!roles.includes(getRole(req.user))) return res.status(403).json({ success: false, message: 'Not authorized for this action' });
  next();
};

exports.requireRole = exports.authorize;
exports.checkModuleAccess = (moduleName) => async (req, res, next) => {
  try {
    const role = getRole(req.user);

    if (role === 'super_admin') return next();

    const isEmployeeRole = role === 'employee' || /_employee$/.test(role || '');
    const isAdminRole = role === 'admin' || /_admin$/.test(role || '') || /_manager$/.test(role || '');

    if (moduleName === 'employee' && (isEmployeeRole || isAdminRole)) {
      return next();
    }

    if (req.user?.modulesAccess?.[moduleName] === true) return next();

    const roleRecord = typeof req.user.role === 'object' && Array.isArray(req.user.role.modules)
      ? req.user.role
      : await Role.findOne({ slug: role }).select('modules').lean();

    if (roleRecord?.modules?.includes(moduleName)) return next();

    return res.status(403).json({ success: false, message: `Access denied for ${moduleName} module` });
  } catch (error) {
    return next(error);
  }
};
