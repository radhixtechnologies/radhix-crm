const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  type: {
    type: String,
    enum: ['due', 'overdue', 'payment'],
    default: 'overdue',
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  emailTo: {
    type: String,
    default: '',
  },
  subject: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending',
  },
  sentAt: {
    type: Date,
    default: null,
  },
  error: {
    type: String,
    default: '',
  },
}, { timestamps: true });

reminderSchema.index({ invoice: 1, type: 1, status: 1 });
reminderSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model('Reminder', reminderSchema);
