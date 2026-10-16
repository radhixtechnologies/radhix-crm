const mongoose = require('mongoose');

const dailyUpdateSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    index: true,
  },
  tasksDone: {
    type: String,
    required: [true, 'Please provide details of work completed today'],
    trim: true,
    maxlength: 5000,
  },
  planForTomorrow: {
    type: String,
    default: '',
    trim: true,
    maxlength: 3000,
  },
  blockers: {
    type: String,
    default: '',
    trim: true,
    maxlength: 2000,
  },
  hasBlockers: {
    type: Boolean,
    default: false,
    index: true,
  },
  hoursWorked: {
    type: Number,
    min: [0, 'Hours cannot be negative'],
    max: [24, 'Hours cannot exceed 24 in a day'],
    default: 8,
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    default: null,
  },
  projectTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProjectTask',
    default: null,
  },
  status: {
    type: String,
    enum: ['submitted', 'reviewed'],
    default: 'submitted',
    index: true,
  },
  managerFeedback: {
    comment: { type: String, default: '', trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
  },
}, { timestamps: true });

// Compound index to quickly find an employee's update for a specific date
dailyUpdateSchema.index({ employee: 1, date: 1 });
dailyUpdateSchema.index({ date: -1, hasBlockers: 1 });

module.exports = mongoose.model('DailyUpdate', dailyUpdateSchema);
