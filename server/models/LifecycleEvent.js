const mongoose = require('mongoose');

const lifecycleEventSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  eventType: {
    type: String,
    enum: ['joining', 'promotion', 'transfer', 'compensation_update', 'role_change', 'department_change', 'probation_complete', 'exit'],
    required: true,
  },
  eventDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  details: {
    // For promotion
    oldDesignation: String,
    newDesignation: String,
    oldDepartment: String,
    newDepartment: String,
    
    // For transfer
    fromLocation: String,
    toLocation: String,
    transferReason: String,
    
    // For compensation update
    oldSalary: Number,
    newSalary: Number,
    salaryComponent: {
      basic: Number,
      allowances: Number,
      bonus: Number,
      commission: Number,
    },
    effectiveDate: Date,
    incrementPercentage: Number,
    
    // For role change
    oldRole: String,
    newRole: String,
    reportingManager: {
      old: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
      new: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    },
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date,
  }],
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
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

// Compound indexes (removed individual field indexes to avoid duplicates)
lifecycleEventSchema.index({ employee: 1, eventDate: -1 });
lifecycleEventSchema.index({ eventType: 1 });
lifecycleEventSchema.index({ status: 1 });

module.exports = mongoose.model('LifecycleEvent', lifecycleEventSchema);

