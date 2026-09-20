const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

/**
 * Activity Reminder Cron Job
 * Runs every 5 minutes to check for upcoming activities and send reminders
 */
const activityReminders = async () => {
    try {
        console.log('[Cron] Running activity reminders check...');

        const now = new Date();
        const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes ahead

        // Find activities that need reminders (1-5 minutes away)
        const activities = await Activity.find({
            'reminder.enabled': true,
            'reminder.reminderSent': false,
            scheduledAt: {
                $gte: now,
                $lte: fiveMinutesFromNow
            },
            status: { $in: ['scheduled', 'in-progress'] }
        })
            .populate('assignedTo')
            .populate({
                path: 'assignedTo',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .populate('relatedTo.entityId', 'name title firstName lastName company');

        if (activities.length === 0) {
            console.log('[Cron] No activities requiring reminders');
            return;
        }

        console.log(`[Cron] Found ${activities.length} activities requiring reminders`);

        for (const activity of activities) {
            try {
                // Get user details
                const assignedUser = activity.assignedTo?.user;

                if (!assignedUser || !assignedUser.email) {
                    console.log(`[Cron] Skipping activity ${activity._id} - no assigned user or email`);
                    continue;
                }

                // Calculate time until activity
                const minutesUntil = Math.round((new Date(activity.scheduledAt) - now) / (1000 * 60));

                // Format activity details
                const activityType = activity.type.charAt(0).toUpperCase() + activity.type.slice(1);
                const scheduledTime = new Date(activity.scheduledAt).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                });

                // Get related entity name
                let relatedEntityName = 'N/A';
                if (activity.relatedTo && activity.relatedTo.entityId) {
                    const entity = activity.relatedTo.entityId;
                    relatedEntityName = entity.name || entity.title ||
                        `${entity.firstName || ''} ${entity.lastName || ''}`.trim() ||
                        entity.company || 'Unknown';
                }

                // 1. Send Email Reminder
                const emailSubject = `Reminder: ${activityType} in ${minutesUntil} minutes`;
                const emailBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #667eea;">Activity Reminder</h2>
                        <p>Hi ${assignedUser.name},</p>
                        <p>This is a reminder for your upcoming activity:</p>
                        
                        <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #111827;">${activity.subject}</h3>
                            <p style="margin: 5px 0;"><strong>Type:</strong> ${activityType}</p>
                            <p style="margin: 5px 0;"><strong>Scheduled:</strong> ${scheduledTime}</p>
                            <p style="margin: 5px 0;"><strong>Related to:</strong> ${activity.relatedTo?.entityType || 'N/A'} - ${relatedEntityName}</p>
                            ${activity.description ? `<p style="margin: 5px 0;"><strong>Notes:</strong> ${activity.description}</p>` : ''}
                        </div>
                        
                        <p style="color: #ef4444; font-weight: bold;">⏰ Starting in ${minutesUntil} minutes</p>
                        
                        <p>Good luck!</p>
                        <p style="color: #6b7280; font-size: 12px;">This is an automated reminder from your CRM system.</p>
                    </div>
                `;

                // 1. Try to Send Email Reminder (non-blocking)
                try {
                    await sendEmail({
                        to: assignedUser.email,
                        subject: emailSubject,
                        html: emailBody
                    });
                    console.log(`[Cron] ✅ Email sent to ${assignedUser.email} for activity ${activity._id}`);
                } catch (emailError) {
                    console.error(`[Cron] ⚠️ Email failed for activity ${activity._id}:`, emailError.message);
                    console.log(`[Cron] Continuing with in-app notification...`);
                }

                // 2. Create In-App Notification (always execute)
                try {
                    await Notification.create({
                        user: assignedUser._id,
                        type: 'reminder',
                        title: `${activityType} in ${minutesUntil} minutes`,
                        message: `${activity.subject} - ${scheduledTime}`,
                        relatedEntity: {
                            entityType: 'Activity',
                            entityId: activity._id
                        },
                        actionUrl: `/calendar?activity=${activity._id}` // Navigate directly to calendar with activity highlighted
                    });
                    console.log(`[Cron] ✅ In-app notification created for user ${assignedUser._id}`);
                } catch (notifError) {
                    console.error(`[Cron] ⚠️ Notification creation failed:`, notifError.message);
                }

                // 3. Mark reminder as sent (always execute to prevent duplicate reminders)
                try {
                    activity.reminder.reminderSent = true;
                    await activity.save();
                    console.log(`[Cron] ✅ Reminder marked as sent for activity ${activity._id}`);
                } catch (saveError) {
                    console.error(`[Cron] ⚠️ Failed to mark reminder as sent:`, saveError.message);
                }

            } catch (activityError) {
                console.error(`[Cron] ❌ Error processing activity ${activity._id}:`, activityError.message);
                // Continue with next activity
            }
        }

        console.log('[Cron] Activity reminders check completed');

    } catch (error) {
        console.error('[Cron] Error in activity reminders job:', error);
    }
};

module.exports = activityReminders;
