const mongoose = require('mongoose');

const appraisalCycleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['quarterly', 'half_yearly', 'yearly'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'active', 'completed', 'cancelled'], default: 'draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('AppraisalCycle', appraisalCycleSchema);