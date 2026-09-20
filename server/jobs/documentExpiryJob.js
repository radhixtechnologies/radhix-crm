const cron = require('node-cron');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { createNotification } = require('../utils/notificationHelper');

/**
 * Document Expiry Alert Job
 * Checks for documents expiring soon and sends notifications
 * Schedule: Daily at 9 AM
 */
const documentExpiryJob = cron.schedule('0 9 * * *', async () => {
  console.log('Starting document expiry check job...');
  
  try {
    const today = new Date();
    const warningDays = 30; // Warn 30 days before expiry
    const warningDate = new Date(today);
    warningDate.setDate(warningDate.getDate() + warningDays);

    // Find employees with documents expiring soon
    const employees = await Employee.find({
      status: { $in: ['active', 'onboarding'] },
      deletedAt: null,
    })
      .populate('user', 'name email')
      .select('employeeId user documents');

    let notificationsSent = 0;

    for (const employee of employees) {
      if (!employee.documents || employee.documents.length === 0) continue;

      const expiringDocs = employee.documents.filter(doc => {
        if (!doc.expiryDate) return false;
        const expiryDate = new Date(doc.expiryDate);
        return expiryDate <= warningDate && expiryDate >= today;
      });

      if (expiringDocs.length > 0) {
        try {
          const docNames = expiringDocs.map(d => d.name).join(', ');
          const daysUntilExpiry = Math.ceil(
            (new Date(expiringDocs[0].expiryDate) - today) / (1000 * 60 * 60 * 24)
          );

          await createNotification({
            user: employee.user._id,
            title: 'Document Expiry Alert',
            message: `${docNames} ${expiringDocs.length > 1 ? 'are' : 'is'} expiring in ${daysUntilExpiry} day(s)`,
            type: 'warning',
            module: 'employee',
            link: `/employees/${employee._id}`,
          });

          notificationsSent++;
        } catch (error) {
          console.error(`Error creating notification for employee ${employee._id}:`, error);
        }
      }
    }

    console.log(`Document expiry check completed. Notifications sent: ${notificationsSent}`);
  } catch (error) {
    console.error('Document expiry job error:', error);
  }
}, {
  scheduled: false,
  timezone: 'Asia/Kolkata',
});

module.exports = {
  documentExpiryJob,
};

