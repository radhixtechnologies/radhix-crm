const mongoose = require('mongoose');

const exitRequestSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    // index: true removed - compound index exists at schema level (line 93)
  },
  resignationDate: {
    type: Date,
    required: true,
  },
  lastWorkingDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    enum: ['better_opportunity', 'career_growth', 'relocation', 'health', 'family', 'dissatisfaction', 'retirement', 'other'],
    default: 'other',
  },
  reasonDetails: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    enum: ['resignation', 'termination'],
    default: 'resignation',
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'withdrawn', 'completed', 'exited'],
    default: 'submitted',
    // index: true removed - compound index exists at schema level (line 93)
  },
  approvalFlow: {
    directManager: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: String,
    },
    hrManager: {
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      approvedAt: Date,
      comments: String,
    },
  },
  exitInterview: {
    conducted: { type: Boolean, default: false },
    conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    conductedAt: Date,
    feedback: {
      whatTheyLiked: String,
      whatCouldBeImproved: String,
      reasonForLeaving: String,
      wouldRecommend: { type: Boolean },
      overallRating: { type: Number, min: 1, max: 5 },
      additionalComments: String,
    },
  },
  exitChecklist: [{
    task: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    dueDate: Date,
    completedAt: Date,
    notes: String,
  }],
  handoverDetails: {
    projects: [String],
    documents: [String],
    accessToTransfer: [String],
    notes: String,
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // User who initiated (can be Admin or Employee)
  },
  documentsGenerated: {
    experienceLetter: { type: Boolean, default: false },
    experienceLetterPath: { type: String },
    relievingLetter: { type: Boolean, default: false },
    relievingLetterPath: { type: String },
    terminationLetter: { type: Boolean, default: false },
    terminationLetterPath: { type: String },
    generatedAt: Date,
  },
  closureStatus: {
    accountDeactivated: { type: Boolean, default: false },
    accessRevoked: { type: Boolean, default: false },
    finalSettlementPaid: { type: Boolean, default: false },
    completedAt: Date,
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  submittedAt: {
    type: Date,
    default: Date.now,
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

exitRequestSchema.index({ employee: 1, status: 1 });
exitRequestSchema.index({ lastWorkingDate: 1 });

module.exports = mongoose.model('ExitRequest', exitRequestSchema);

