const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  category: {
    type: String,
    enum: ['technical', 'soft-skills', 'leadership', 'compliance', 'onboarding', 'product', 'other'],
    default: 'technical',
  },
  type: {
    type: String,
    enum: ['internal', 'external', 'online', 'workshop', 'certification'],
    default: 'internal',
  },
  instructor: {
    name: String,
    email: String,
    organization: String,
  },
  duration: {
    hours: Number,
    days: Number,
  },
  schedule: {
    startDate: Date,
    endDate: Date,
    sessions: [{
      date: Date,
      time: String,
      location: String,
      mode: {
        type: String,
        enum: ['online', 'in-person', 'hybrid'],
      },
    }],
  },
  maxParticipants: {
    type: Number,
  },
  cost: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'in-progress', 'completed', 'cancelled'],
    default: 'draft',
  },
  required: {
    type: Boolean,
    default: false,
  },
  targetDepartments: [{
    type: String,
  }],
  prerequisites: [{
    type: String,
  }],
  learningObjectives: [{
    type: String,
  }],
  materials: [{
    name: String,
    url: String,
    type: String,
  }],
  certificate: {
    provided: Boolean,
    template: String,
    issuingBody: String,
  },
  modules: [{
    title: { type: String, required: true },
    description: String,
    order: Number,
    duration: Number, // in minutes
    contents: [{
      title: { type: String, required: true },
      type: {
        type: String,
        enum: ['text', 'video', 'image', 'quiz', 'file'],
        required: true
      },
      data: {
        text: String, // for text/blog content
        url: String, // for video/image/file
        fileType: String, // for files
        questions: [{ // for quizzes
          question: String,
          options: [String],
          correctAnswer: Number, // index
          explanation: String
        }],
      },
      completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    }]
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enrollments: [{
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    enrolledAt: Date,
    status: {
      type: String,
      enum: ['pending', 'selected', 'rejected', 'enrolled', 'in-progress', 'completed', 'dropped'],
      default: 'pending',
    },
    completionDate: Date,
    certificateUrl: String,
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Training', trainingSchema);

