const FollowUp = require('../models/FollowUp');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Role = require('../models/Role');
const { getIstDayRange } = require('../utils/followUpSync');

const buildEntityActionUrl = (followUp) => {
  const relId = followUp?.relatedId?._id || followUp?.relatedId;
  if (relId && followUp?.type === 'lead') return `/sales/leads/${relId}`;
  if (relId && followUp?.type === 'client') return `/sales/clients/${relId}`;
  if (relId && followUp?.type === 'deal') return `/sales/deals/${relId}`;
  return '/sales/followups';
};

const parseScheduledTimestampIst = (scheduledDate, scheduledTime) => {
  if (!scheduledDate) return null;
  const dateStr = new Date(scheduledDate).toISOString().slice(0, 10);
  const timeMatch = String(scheduledTime || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!timeMatch) return null;
  const hh = String(parseInt(timeMatch[1], 10)).padStart(2, '0');
  const mm = String(parseInt(timeMatch[2], 10)).padStart(2, '0');
  const dt = new Date(`${dateStr}T${hh}:${mm}:00+05:30`);
  return Number.isNaN(dt.getTime()) ? null : dt;
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
    actionUrl: buildEntityActionUrl(followUp),
  });
  return true;
};

const notifySalesManagersOverdue = async (followUp, assigneeName, daysLate) => {
  try {
    const managerRoles = await Role.find({
      slug: { $in: ['super_admin', 'admin', 'sales_manager'] },
    }).select('_id').lean();
    if (managerRoles.length === 0) return;

    const managers = await User.find({
      role: { $in: managerRoles.map((r) => r._id) },
      status: { $ne: 'inactive' },
    }).select('_id').limit(10).lean();

    const assigneeUserId = String(followUp.assignedTo?.user?._id || '');
    const actionUrl = buildEntityActionUrl(followUp);

    await Promise.all(
      managers
        .filter((m) => String(m._id) !== assigneeUserId)
        .map((m) =>
          Notification.create({
            user: m._id,
            type: 'warning',
            title: `Overdue Follow-up Alert (${daysLate}d late)`,
            message: `${followUp.title} assigned to ${assigneeName || 'Sales Rep'} is overdue by ${daysLate} day(s).`,
            relatedEntity: { entityType: 'FollowUp', entityId: followUp._id },
            actionUrl,
          })
        )
    );
  } catch (err) {
    console.warn('[Follow-up reminders] Manager escalation skipped:', err.message);
  }
};

const followUpReminders = async () => {
  const { start, next } = getIstDayRange();
  const now = new Date();
  const istNow = new Date(now.getTime() + 5.5 * 3600000);
  const currentIstHour = istNow.getUTCHours();

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
        const exactDue = parseScheduledTimestampIst(followUp.scheduledDate, followUp.scheduledTime);
        if (exactDue) {
          const minsUntilCall = (exactDue.getTime() - now.getTime()) / 60000;
          // Send reminder 20 minutes before scheduled call time (or immediately if already within window)
          if (minsUntilCall > 20) continue;
        } else if (currentIstHour < 9) {
          // If no exact time specified, wait until 9 AM IST
          continue;
        }

        const timeText = followUp.scheduledTime ? ` at ${followUp.scheduledTime}` : ' today';
        const notified = await notifyAssignee(
          followUp,
          exactDue ? `Upcoming Call Reminder${timeText}` : 'Follow-up Due Today',
          `${followUp.title} is scheduled${timeText}. Click to review client remarks and log outcome.`
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
        const daysLate = Math.max(1, Math.floor((start.getTime() - new Date(followUp.scheduledDate).getTime()) / 86400000));
        const notified = await notifyAssignee(
          followUp,
          `Overdue Follow-up (${daysLate}d late)`,
          `${followUp.title} was scheduled for ${new Date(followUp.scheduledDate).toISOString().slice(0, 10)}${followUp.scheduledTime ? ` at ${followUp.scheduledTime}` : ''}. Please follow up or reschedule it.`
        );
        if (notified) {
          followUp.status = 'overdue';
          followUp.overdueNotified = true;
          await followUp.save();
          if (daysLate >= 2) {
            await notifySalesManagersOverdue(followUp, followUp.assignedTo?.user?.name, daysLate);
          }
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
