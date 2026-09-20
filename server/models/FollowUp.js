const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lead', 'client', 'deal'],
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: String,
    default: '',
  },
  typeOfFollowUp: {
    type: String,
    enum: ['call', 'email', 'meeting', 'task', 'other'],
    default: 'call',
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'overdue'],
    default: 'pending',
  },
  completedAt: {
    type: Date,
    default: null,
  },
  reminderSent: {
    type: Boolean,
    default: false,
  },
  reminderSentAt: {
    type: Date,
    default: null,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  outcome: {
    type: String,
    default: '',
  },
  nextFollowUp: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('FollowUp', followUpSchema);


















