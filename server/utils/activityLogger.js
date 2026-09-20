const ActivityLog = require('../models/ActivityLog');

const logActivity = async (user, action, module, entity, entityId = null, details = null, ipAddress = null) => {
  try {
    await ActivityLog.create({
      user,
      action,
      module,
      entity,
      entityId,
      details,
      ipAddress,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = logActivity;

