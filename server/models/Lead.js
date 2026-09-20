const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    default: '',
  },
  company: {
    type: String,
    default: '',
  },
  industry: {
    type: String,
    default: '',
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
    default: '1-10',
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'social-media', 'email', 'phone', 'campaign', 'other'],
    default: 'website',
  },
  // Campaign tracking
  campaign: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    default: null,
  },
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'converted', 'lost'],
    default: 'new',
  },
  // Lead Temperature - User-friendly categorization
  leadTemperature: {
    type: String,
    enum: ['cold', 'warm', 'hot', 'qualified'],
    default: 'cold',
  },
  qualificationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  value: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    default: 'INR',
  },
  probability: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  // Tags for categorization
  tags: [String],
  // Last activity tracking
  lastActivityDate: {
    type: Date,
    default: null,
  },
  notes: [
    {
      content: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  communicationHistory: [
    {
      type: {
        type: String,
        enum: ['call', 'email', 'meeting', 'note'],
      },
      description: String,
      date: Date,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  documents: [
    {
      name: String,
      url: String,
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
  followUpDate: {
    type: Date,
    default: null,
  },
  convertedToClient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    default: null,
  },
  // Contact conversion tracking
  convertedToContact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    default: null,
  },
  conversionDate: {
    type: Date,
    default: null,
  },
  // Read-only flag for converted leads
  isReadOnly: {
    type: Boolean,
    default: false,
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


// Indexes for performance
leadSchema.index({ email: 1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ campaign: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ leadTemperature: 1 });
// leadSchema.index({ status: 1 }); // Removed duplicate index


// Pre-save middleware
leadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();

  // Auto-calculate qualificationScore based on leadTemperature
  if (this.leadTemperature) {
    const temperatureScoreMap = {
      'cold': 25,
      'warm': 50,
      'hot': 75,
      'qualified': 100
    };
    this.qualificationScore = temperatureScoreMap[this.leadTemperature] || 0;
  }

  next();
});

module.exports = mongoose.model('Lead', leadSchema);

