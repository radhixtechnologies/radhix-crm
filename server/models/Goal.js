const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['kpi', 'okr', 'goal', 'project'],
    default: 'goal',
  },
  category: {
    type: String,
    enum: ['performance', 'development', 'project', 'team', 'personal'],
    default: 'performance',
  },
  status: {
    type: String,
    enum: ['draft', 'assigned', 'in-progress', 'achieved', 'not-achieved', 'cancelled'],
    default: 'draft',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium',
  },
  targetValue: {
    type: String,
    default: '',
  },
  currentValue: {
    type: String,
    default: '',
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  weight: {
    type: Number,
    default: 1,
  },
  startDate: {
    type: Date,
    required: true,
  },
  targetDate: {
    type: Date,
    required: true,
  },
  achievedDate: {
    type: Date,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  milestones: [{
    title: String,
    targetDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
  }],
  selfAssessment: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String,
    submittedAt: Date,
  },
  managerAssessment: {
    rating: { type: Number, min: 1, max: 5 },
    comments: String,
    submittedAt: Date,
  },
  linkedReview: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Performance',
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

module.exports = mongoose.model('Goal', goalSchema);

