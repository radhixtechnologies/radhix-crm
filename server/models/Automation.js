const mongoose = require('mongoose');

const automationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  trigger: { type: mongoose.Schema.Types.Mixed, default: {} },
  filters: { type: mongoose.Schema.Types.Mixed, default: {} },
  actions: { type: [mongoose.Schema.Types.Mixed], default: [] },
  executionHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Automation', automationSchema);