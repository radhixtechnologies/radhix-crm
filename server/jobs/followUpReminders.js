const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');

const getUtcDayRange = () => {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  return { start, next };
};

const notifyAssignee = async (followUp, title, message) => {
  const user = followUp.assignedTo?.user;
  if (!user?._id) {
    console.warn(`[Follow-up reminders] Skipping ${followUp._id}: assignee has no linked user`);
    return false;
  }

  await Notification.create({
    user: user._id,
    type: 'reminder',
    title,
    message,
    relatedEntity: { entityType: 'FollowUp', entityId: followUp._id },
    actionUrl: '/sales/followups',
  });
  return true;
};

const followUpReminders = async () => {
  const { start, next } = getUtcDayRange();

  try {
    const dueToday = await FollowUp.find({
      status: 'pending',
      reminderSent: false,
      scheduledDate: { $gte: start, $lt: next },
    }).populate({
      path: 'assignedTo',
      populate: { path: 'user', select: 'name' },
    });

    for (const followUp of dueToday) {
      try {
        const notified = await notifyAssignee(
          followUp,
          'Follow-up due today',
          `${followUp.title} is scheduled for today.`
        );
        if (notified) {
          followUp.reminderSent = true;
          followUp.reminderSentAt = new Date();
          await followUp.save();
        }
      } catch (error) {
        console.error(`[Follow-up reminders] Could not notify for ${followUp._id}:`, error.message);
      }
    }

    const overdue = await FollowUp.find({
      status: { $in: ['pending', 'overdue'] },
      overdueNotified: false,
      scheduledDate: { $lt: start },
    }).populate({
      path: 'assignedTo',
      populate: { path: 'user', select: 'name' },
    });

    for (const followUp of overdue) {
      try {
        const notified = await notifyAssignee(
          followUp,
          'Follow-up overdue',
          `${followUp.title} was scheduled for ${new Date(followUp.scheduledDate).toLocaleDateString()}. Please follow up or reschedule it.`
        );
        if (notified) {
          followUp.status = 'overdue';
          followUp.overdueNotified = true;
          await followUp.save();
        }
      } catch (error) {
        console.error(`[Follow-up reminders] Could not notify for overdue item ${followUp._id}:`, error.message);
      }
    }
  } catch (error) {
    console.error('[Follow-up reminders] Reminder check failed:', error);
  }
};

module.exports = followUpReminders;
