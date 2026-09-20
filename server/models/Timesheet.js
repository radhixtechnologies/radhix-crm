const mongoose = require('mongoose');

const timesheetSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  // Core fields
  workDescription: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24,
  },
  // Creator information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roleOfCreator: {
    type: String,
    enum: ['employee', 'admin', 'super_admin'],
    required: true,
  },
  // Editable status - true for all except when needed
  isEditable: {
    type: Boolean,
    default: true,
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

// Indexes for performance
timesheetSchema.index({ employee: 1, date: 1 }, { unique: true }); // Ensure one timesheet per employee per day
timesheetSchema.index({ createdBy: 1 });
timesheetSchema.index({ roleOfCreator: 1 });
timesheetSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Timesheet', timesheetSchema);

