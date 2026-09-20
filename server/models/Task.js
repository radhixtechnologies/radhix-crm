const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['created', 'in_progress', 'completed', 'submitted_for_approval', 'approved_by_admin', 'approved_by_superadmin', 'rejected_by_admin', 'rejected_by_superadmin'], default: 'created' },
  dueDate: Date,
  completionDate: Date,
  submittedAt: Date,
  approvalDate: Date,
  rejectionReason: { type: String, default: '' },
  roleOfCreator: { type: String, enum: ['employee', 'admin', 'super_admin'], default: 'employee' },
  department: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
