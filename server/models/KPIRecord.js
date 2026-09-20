const mongoose = require('mongoose');

const kpiRecordSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    index: true,
  },
  period: {
    type: String, // e.g., "2025-01", "2025-Q1"
    required: true,
    index: true,
  },
  productivity: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  tasksTotal: {
    type: Number,
    default: 0,
  },
  overallScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
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

kpiRecordSchema.index({ employee: 1, period: 1 }, { unique: true });

// Calculate overall score before saving
kpiRecordSchema.pre('save', function(next) {
  // Weighted average: productivity 40%, attendance 30%, tasks 30%
  const taskCompletion = this.tasksTotal > 0 
    ? (this.tasksCompleted / this.tasksTotal) * 100 
    : 0;
  
  this.overallScore = (
    (this.productivity * 0.4) + 
    (this.attendance * 0.3) + 
    (taskCompletion * 0.3)
  ).toFixed(1);
  
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('KPIRecord', kpiRecordSchema);

