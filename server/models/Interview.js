const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobApplication',
    required: true,
  },
  type: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'technical_round', 'hr_round', 'final'],
    default: 'in-person',
    index: true,
  },
  scheduledDate: {
    type: Date,
    required: true,
  },
  scheduledTime: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    default: '',
  },
  meetingLink: {
    type: String,
    default: '',
  },
  interviewers: [{
    name: String,
    email: String,
    role: String,
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
    default: 'scheduled',
  },
  evaluation: {
    technicalSkills: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    problemSolving: { type: Number, min: 1, max: 5 },
    culturalFit: { type: Number, min: 1, max: 5 },
    overallRating: { type: Number, min: 1, max: 5 },
    feedback: String,
    strengths: String,
    areasForImprovement: String,
    recommendation: {
      type: String,
      enum: ['strong_yes', 'yes', 'maybe', 'no', 'strong_no'],
    },
    notes: String,
  },
  scheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  evaluatedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

interviewSchema.index({ application: 1 });
interviewSchema.index({ scheduledDate: 1 });
interviewSchema.index({ status: 1 });

module.exports = mongoose.model('Interview', interviewSchema);

