const mongoose = require('mongoose');

const workUpdateSchema = new mongoose.Schema({
  message: { type: String, required: true, trim: true, maxlength: 2000 },
  progress: { type: Number, min: 0, max: 100, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

const projectTaskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: '', trim: true, maxlength: 3000 },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, index: true },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'blocked', 'done'],
    default: 'todo',
    index: true,
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: { type: Date, default: null },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  workUpdates: [workUpdateSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isArchived: { type: Boolean, default: false, index: true },
}, { timestamps: true });

projectTaskSchema.index({ project: 1, status: 1, dueDate: 1 });

module.exports = mongoose.model('ProjectTask', projectTaskSchema);
