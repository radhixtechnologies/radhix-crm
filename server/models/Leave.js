const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  type: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'maternity', 'paternity', 'unpaid'],
    required: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
    index: true,
  },
  endDate: {
    type: Date,
    required: true,
    index: true,
  },
  days: {
    type: Number,
    required: true,
  },
  halfDay: {
    type: Boolean,
    default: false,
  },
  halfDayType: {
    type: String,
    enum: ['first-half', 'second-half'],
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: {
    type: Date,
  },
  comments: {
    type: String,
    default: '',
  },
  rejectionReason: {
    type: String,
  },
  documentUrl: {
    type: String,
    default: '',
  },
  // Leave overlap tracking
  overlapsWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Leave',
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
leaveSchema.index({ employee: 1, startDate: 1, endDate: 1 });
leaveSchema.index({ status: 1, startDate: 1 });
leaveSchema.index({ employee: 1, status: 1 });

// Pre-save middleware
leaveSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);
