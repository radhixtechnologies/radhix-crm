const mongoose = require('mongoose');

const pipelineStageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, trim: true, lowercase: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#3b82f6' },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

pipelineStageSchema.index({ key: 1 }, { unique: true });
pipelineStageSchema.index({ order: 1 });

module.exports = mongoose.model('PipelineStage', pipelineStageSchema);