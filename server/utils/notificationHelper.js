const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {String} userId - User ID to notify
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} type - Notification type (info, success, warning, error, task, leave, etc.)
 * @param {Object} relatedEntity - Related entity info { entityType, entityId }
 */
const createNotification = async (userId, title, message, type = 'info', relatedEntity = null) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      relatedEntity: relatedEntity || undefined,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

/**
 * Create notifications for multiple users
 * @param {Array} userIds - Array of user IDs
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} type - Notification type
 * @param {Object} relatedEntity - Related entity info
 */
const createNotifications = async (userIds, title, message, type = 'info', relatedEntity = null) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      message,
      type,
      relatedEntity: relatedEntity || undefined,
    }));
    await Notification.insertMany(notifications);
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

module.exports = {
  createNotification,
  createNotifications,
};

