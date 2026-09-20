const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'reminder', 'task', 'leave', 'invoice', 'attendance', 'appraisal', 'payroll', 'document', 'asset'],
    default: 'info',
  },
  relatedEntity: {
    entityType: String,
    entityId: mongoose.Schema.Types.ObjectId,
  },
  actionUrl: {
    type: String, // URL to navigate when clicked
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Notification', notificationSchema);

