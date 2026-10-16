const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 2000 },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 5000 },
  status: {
    type: String,
    enum: ['planned', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planned',
    index: true,
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  startDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  projectManager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  milestones: [milestoneSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isArchived: { type: Boolean, default: false, index: true },
}, { timestamps: true });

projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ projectManager: 1, status: 1 });

module.exports = mongoose.model('Project', projectSchema);
