const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 * @param {string} userId - The ID of the user to notify
 * @param {string} type - Type of notification (info, success, warning, error)
 * @param {string} title - Title of the notification
 * @param {string} message - Body message
 * @param {string} link - Optional link to related resource
 */
exports.createNotification = async (userId, type, title, message, link = null) => {
    try {
        if (!userId) return;

        await Notification.create({
            user: userId,
            type,
            title,
            message,
            link,
            isRead: false,
            createdAt: Date.now()
        });
    } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error.message);
        // Don't throw error to prevent blocking main flow
    }
};
