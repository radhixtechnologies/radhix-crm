const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Invoice = require('../models/Invoice');
const { sendPaymentReminder } = require('./emailService');

/**
 * Cron job to check and send due reminders
 * Runs daily at 9 AM
 */
exports.startReminderCron = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      console.log('Running reminder cron job...');
      
      const now = new Date();
      const pendingReminders = await Reminder.find({
        status: 'pending',
        scheduledDate: { $lte: now },
      }).populate('invoice').populate('invoice.client');

      for (const reminder of pendingReminders) {
        if (!reminder.invoice || !reminder.invoice.client) {
          console.log(`Reminder ${reminder._id} has invalid invoice or client`);
          reminder.status = 'failed';
          reminder.error = 'Invalid invoice or client';
          await reminder.save();
          continue;
        }

        try {
          await sendPaymentReminder(
            reminder.invoice,
            reminder.invoice.client,
            reminder.type
          );
          
          reminder.status = 'sent';
          reminder.sentAt = new Date();
          await reminder.save();
          
          console.log(`Reminder sent successfully for invoice ${reminder.invoice.invoiceNumber}`);
        } catch (error) {
          console.error(`Error sending reminder ${reminder._id}:`, error.message);
          reminder.status = 'failed';
          reminder.error = error.message;
          await reminder.save();
        }
      }

      // Auto-create overdue reminders
      const overdueInvoices = await Invoice.find({
        status: { $in: ['sent', 'pending'] },
        dueDate: { $lt: now },
      }).populate('client');

      for (const invoice of overdueInvoices) {
        // Check if reminder already exists
        const existingReminder = await Reminder.findOne({
          invoice: invoice._id,
          type: 'overdue',
          status: { $in: ['pending', 'sent'] },
        });

        if (!existingReminder && invoice.client && invoice.client.email) {
          await Reminder.create({
            invoice: invoice._id,
            type: 'overdue',
            scheduledDate: now,
            emailTo: invoice.client.email,
            subject: `URGENT: Overdue Invoice ${invoice.invoiceNumber}`,
            message: `Invoice ${invoice.invoiceNumber} is now overdue. Please make payment immediately.`,
            status: 'pending',
          });
          
          // Update invoice status
          invoice.status = 'overdue';
          await invoice.save();
        }
      }

      console.log('Reminder cron job completed');
    } catch (error) {
      console.error('Error in reminder cron job:', error);
    }
  });
};

