const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  employeeId: {
    type: String,
    unique: true,
    required: true,
    // index: true removed - unique already creates an index
  },
  // Personal Details
  dateOfBirth: {
    type: Date,
    default: null,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    default: null,
  },
  phone: {
    type: String,
    default: '',
  },
  alternatePhone: {
    type: String,
    default: '',
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  emergencyContact: {
    name: String,
    relation: String,
    phone: String,
    email: String,
    address: String,
  },
  // Job Details
  department: {
    type: String,
    required: true,
    enum: ['IT', 'HR', 'Finance', 'Sales', 'Management', 'Operations'],
    index: true,
  },
  designation: {
    type: String,
    required: true,
    index: true,
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    index: true,
  },
  workLocation: {
    type: String,
    enum: ['remote', 'hybrid', 'office'],
    default: 'office',
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'intern', 'contract', 'consultant'],
    default: 'full-time',
  },
  joiningDate: {
    type: Date,
    default: Date.now,
    index: true,
  },
  probationEndDate: {
    type: Date,
    default: null,
  },
  probationStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'extended'],
    default: 'not-started',
  },
  // Avatar
  avatar: {
    type: String,
    default: null,
  },
  // System Details
  status: {
    type: String,
    enum: ['active', 'inactive', 'onboarding', 'terminated', 'resigned'],
    default: 'active',
    // index: true removed - compound index exists at schema level
  },
  // Soft delete
  deletedAt: {
    type: Date,
    default: null,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Documents
  documents: [
    {
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['resume', 'id-proof', 'certificate', 'contract', 'other'],
      },
      expiryDate: Date, // For document expiry tracking
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  // Skills Matrix
  skills: [
    {
      name: String,
      proficiency: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      },
      certifications: [
        {
          name: String,
          issuer: String,
          issueDate: Date,
          expiryDate: Date,
          certificateUrl: String,
        },
      ],
      yearsOfExperience: Number,
    },
  ],
  // Salary Details (for payroll view)
  salary: {
    type: Number,
    default: 0,
  },
  salaryStructure: {
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    pf: { type: Number, default: 0 },
    esi: { type: Number, default: 0 },
    tds: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
  },
  // Salary History
  salaryHistory: [
    {
      effectiveDate: Date,
      salary: Number,
      salaryStructure: {
        basic: Number,
        hra: Number,
        allowances: Number,
        pf: Number,
        esi: Number,
        tds: Number,
        netSalary: Number,
      },
      changedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  // Attendance Settings
  attendanceSettings: {
    gracePeriod: { type: Number, default: 15 }, // minutes
    requireLocation: { type: Boolean, default: false },
    shift: {
      type: String,
      enum: ['general', 'morning', 'evening', 'night'],
      default: 'general',
    },
    shiftTimings: {
      startTime: String, // HH:mm format
      endTime: String, // HH:mm format
    },
  },
  // Exit Process
  exitProcess: {
    resignationDate: Date,
    lastWorkingDate: Date,
    noticePeriod: Number, // in days
    noticePeriodStart: Date,
    noticePeriodEnd: Date,
    exitChecklist: {
      assetReturned: { type: Boolean, default: false },
      accessRevoked: { type: Boolean, default: false },
      documentsSubmitted: { type: Boolean, default: false },
      finalSettlement: { type: Boolean, default: false },
      exitInterview: { type: Boolean, default: false },
    },
    finalSettlementAmount: Number,
    exitReason: String,
    feedback: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
employeeSchema.index({ user: 1 });
employeeSchema.index({ status: 1, department: 1 });
employeeSchema.index({ deletedAt: 1 });
employeeSchema.index({ createdAt: -1 });

// Soft delete query helper
employeeSchema.query.active = function () {
  return this.where({ deletedAt: null });
};

employeeSchema.query.deleted = function () {
  return this.where({ deletedAt: { $ne: null } });
};

// Pre-save middleware
employeeSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
