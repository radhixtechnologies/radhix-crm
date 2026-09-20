const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobPosting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobPosting',
    required: true,
  },
  applicantName: {
    type: String,
    required: true,
  },
  applicantType: {
    type: String,
    enum: ['external', 'internal'],
    default: 'external',
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  resume: {
    name: String,
    url: String,
    uploadedAt: Date,
  },
  documents: [{
    name: String,
    type: String,
    url: String,
    uploadedAt: Date,
  }],
  coverLetter: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'offer', 'hired', 'selected', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true,
  },
  atsStage: {
    type: String,
    enum: ['applied', 'screening', 'interview', 'technical_round', 'hr_round', 'offer', 'hired', 'selected', 'rejected', 'withdrawn'],
    default: 'applied',
    index: true,
  },
  applicantProfile: {
    yearsOfExperience: Number,
    currentCompany: String,
    currentPosition: String,
    currentSalary: Number,
    expectedSalary: Number,
    noticePeriod: Number,
    availability: Date,
    linkedin: String,
    portfolio: String,
    github: String,
    otherLinks: [String],
    education: [{
      degree: String,
      institution: String,
      year: Number,
      grade: String,
    }],
    experience: [{
      company: String,
      position: String,
      duration: String,
      responsibilities: [String],
    }],
    skills: [String],
    certifications: [{
      name: String,
      issuer: String,
      year: Number,
      expiryDate: Date,
    }],
  },
  interviewHistory: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  evaluation: {
    rating: { type: Number, min: 1, max: 5 },
    strengths: String,
    weaknesses: String,
    fitScore: { type: Number, min: 1, max: 10 },
    recommendation: {
      type: String,
      enum: ['strong_yes', 'yes', 'maybe', 'no', 'strong_no'],
    },
  },
  notes: {
    type: String,
    default: '',
  },
  internalNotes: {
    type: String,
    default: '',
  },
  tags: [String],
  source: {
    type: String,
    enum: ['website', 'linkedin', 'referral', 'job_board', 'agency', 'internal', 'other'],
    default: 'website',
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Force recompilation of the model to ensure schema updates are applied
if (mongoose.models.JobApplication) {
  delete mongoose.models.JobApplication;
}

console.log('[Model] JobApplication schema loaded with interviewHistory as Array');

module.exports = mongoose.model('JobApplication', jobApplicationSchema);

