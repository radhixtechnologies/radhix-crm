const PolicyNotification = require('../models/PolicyNotification');
const Notification = require('../models/Notification');
const Employee = require('../models/Employee');
const User = require('../models/User');

/**
 * Policy Notification Service
 * Handles all policy-related notifications and reminders
 */

/**
 * Notify employees when a policy is assigned to them
 * @param {Object} policy - Policy object
 * @param {Array} employeeIds - Array of employee IDs to notify
 * @returns {Promise<Object>} Notification results
 */
exports.notifyPolicyAssignment = async (policy, employeeIds) => {
    try {
        const notifications = [];
        const policyNotifications = [];

        for (const employeeId of employeeIds) {
            const employee = await Employee.findById(employeeId).populate('user');
            if (!employee || !employee.user) continue;

            // Create system notification
            const notification = await Notification.create({
                user: employee.user._id,
                type: 'policy_assigned',
                title: 'New Policy Assigned',
                message: `A new ${policy.isMandatory ? 'mandatory' : ''} policy "${policy.title}" has been assigned to you. ${policy.requiresAcknowledgment ? 'Please review and acknowledge.' : ''}`,
                link: `/hrm/policies/${policy._id}`,
                priority: policy.isMandatory ? 'high' : 'medium',
            });
            notifications.push(notification);

            // Create policy notification record
            const policyNotification = await PolicyNotification.create({
                policy: policy._id,
                employee: employeeId,
                notificationType: 'assignment',
                status: 'sent',
                message: `Policy "${policy.title}" assigned`,
            });
            policyNotifications.push(policyNotification);
        }

        return {
            success: true,
            notificationsSent: notifications.length,
            notifications,
            policyNotifications,
        };
    } catch (error) {
        console.error('Error sending policy assignment notifications:', error);
        throw error;
    }
};

/**
 * Send reminder for pending policy acknowledgments
 * @param {Object} policy - Policy object
 * @param {Array} employeeIds - Array of employee IDs to remind
 * @returns {Promise<Object>} Reminder results
 */
exports.sendAcknowledgmentReminder = async (policy, employeeIds) => {
    try {
        const notifications = [];
        const policyNotifications = [];

        for (const employeeId of employeeIds) {
            const employee = await Employee.findById(employeeId).populate('user');
            if (!employee || !employee.user) continue;

            // Check existing reminders
            const existingReminders = await PolicyNotification.find({
                policy: policy._id,
                employee: employeeId,
                notificationType: 'reminder',
            }).sort({ sentAt: -1 });

            const reminderCount = existingReminders.length;

            // Check if max reminders reached
            if (policy.reminderSchedule.enabled &&
                reminderCount >= policy.reminderSchedule.maxReminders) {
                continue;
            }

            // Create system notification
            const notification = await Notification.create({
                user: employee.user._id,
                type: 'policy_reminder',
                title: 'Policy Acknowledgment Reminder',
                message: `Reminder: Please acknowledge the ${policy.isMandatory ? 'mandatory' : ''} policy "${policy.title}".`,
                link: `/hrm/policies/${policy._id}`,
                priority: policy.isMandatory ? 'high' : 'medium',
            });
            notifications.push(notification);

            // Calculate next reminder date
            let nextReminderAt = null;
            if (policy.reminderSchedule.enabled && reminderCount + 1 < policy.reminderSchedule.maxReminders) {
                const now = new Date();
                switch (policy.reminderSchedule.frequency) {
                    case 'daily':
                        nextReminderAt = new Date(now.setDate(now.getDate() + 1));
                        break;
                    case 'weekly':
                        nextReminderAt = new Date(now.setDate(now.getDate() + 7));
                        break;
                    case 'monthly':
                        nextReminderAt = new Date(now.setMonth(now.getMonth() + 1));
                        break;
                }
            }

            // Create policy notification record
            const policyNotification = await PolicyNotification.create({
                policy: policy._id,
                employee: employeeId,
                notificationType: 'reminder',
                status: 'sent',
                reminderCount: reminderCount + 1,
                nextReminderAt,
                message: `Reminder ${reminderCount + 1} for policy "${policy.title}"`,
            });
            policyNotifications.push(policyNotification);
        }

        return {
            success: true,
            remindersSent: notifications.length,
            notifications,
            policyNotifications,
        };
    } catch (error) {
        console.error('Error sending acknowledgment reminders:', error);
        throw error;
    }
};

/**
 * Send escalation alert to HR/Admin about non-compliance
 * @param {Object} policy - Policy object
 * @param {Array} employeeIds - Array of non-compliant employee IDs
 * @returns {Promise<Object>} Escalation results
 */
exports.sendEscalationAlert = async (policy, employeeIds) => {
    try {
        // Get all HR admins
        const hrAdmins = await User.find({
            $or: [
                { role: 'super_admin' },
                { role: 'admin', 'modulesAccess.hrm': true }
            ],
            isActive: true,
        });

        const notifications = [];

        for (const admin of hrAdmins) {
            const notification = await Notification.create({
                user: admin._id,
                type: 'policy_escalation',
                title: 'Policy Compliance Alert',
                message: `${employeeIds.length} employee(s) have not acknowledged the mandatory policy "${policy.title}".`,
                link: `/hrm/policies/${policy._id}`,
                priority: 'high',
            });
            notifications.push(notification);
        }

        return {
            success: true,
            alertsSent: notifications.length,
            notifications,
        };
    } catch (error) {
        console.error('Error sending escalation alerts:', error);
        throw error;
    }
};

/**
 * Notify employees when a policy is updated
 * @param {Object} policy - Updated policy object
 * @param {Array} employeeIds - Array of employee IDs to notify
 * @returns {Promise<Object>} Notification results
 */
exports.notifyPolicyUpdate = async (policy, employeeIds) => {
    try {
        const notifications = [];
        const policyNotifications = [];

        for (const employeeId of employeeIds) {
            const employee = await Employee.findById(employeeId).populate('user');
            if (!employee || !employee.user) continue;

            // Create system notification
            const notification = await Notification.create({
                user: employee.user._id,
                type: 'policy_updated',
                title: 'Policy Updated',
                message: `The policy "${policy.title}" has been updated to version ${policy.version}. ${policy.requiresAcknowledgment ? 'Please review and acknowledge the new version.' : ''}`,
                link: `/hrm/policies/${policy._id}`,
                priority: policy.isMandatory ? 'high' : 'medium',
            });
            notifications.push(notification);

            // Create policy notification record
            const policyNotification = await PolicyNotification.create({
                policy: policy._id,
                employee: employeeId,
                notificationType: 'update',
                status: 'sent',
                message: `Policy "${policy.title}" updated to version ${policy.version}`,
            });
            policyNotifications.push(policyNotification);
        }

        return {
            success: true,
            notificationsSent: notifications.length,
            notifications,
            policyNotifications,
        };
    } catch (error) {
        console.error('Error sending policy update notifications:', error);
        throw error;
    }
};

/**
 * Schedule reminders for policies with pending acknowledgments
 * @returns {Promise<Object>} Scheduling results
 */
exports.scheduleReminders = async () => {
    try {
        const Policy = require('../models/Policy');
        const PolicyAcknowledgment = require('../models/PolicyAcknowledgment');
        const policyTargetingService = require('./policyTargetingService');

        // Get all active policies with reminders enabled
        const policies = await Policy.find({
            status: 'active',
            isLatestVersion: true,
            requiresAcknowledgment: true,
            'reminderSchedule.enabled': true,
        });

        let totalReminders = 0;

        for (const policy of policies) {
            // Get applicable employees
            const applicableEmployeeIds = await policyTargetingService.getApplicableEmployees(
                policy.applicableTo
            );

            // Get employees who have already acknowledged
            const acknowledgments = await PolicyAcknowledgment.find({
                policy: policy._id,
                policyVersion: policy.versionNumber,
                status: 'acknowledged',
            }).select('employee');

            const acknowledgedEmployeeIds = acknowledgments.map(ack => ack.employee.toString());

            // Get employees with pending acknowledgments
            const pendingEmployeeIds = applicableEmployeeIds.filter(
                empId => !acknowledgedEmployeeIds.includes(empId.toString())
            );

            if (pendingEmployeeIds.length > 0) {
                // Check if it's time to send reminders
                const now = new Date();
                const pendingNotifications = await PolicyNotification.find({
                    policy: policy._id,
                    employee: { $in: pendingEmployeeIds },
                    notificationType: 'reminder',
                    nextReminderAt: { $lte: now },
                });

                if (pendingNotifications.length > 0) {
                    const employeesToRemind = pendingNotifications.map(n => n.employee);
                    await this.sendAcknowledgmentReminder(policy, employeesToRemind);
                    totalReminders += employeesToRemind.length;
                }
            }
        }

        return {
            success: true,
            remindersScheduled: totalReminders,
        };
    } catch (error) {
        console.error('Error scheduling reminders:', error);
        throw error;
    }
};
