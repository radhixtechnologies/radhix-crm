const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Deal title is required'],
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  // Reference to original lead
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: false
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact',
    required: false
  },
  // Contact information (from lead)
  contactName: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['website', 'referral', 'ads', 'social', 'social-media', 'campaign', 'cold-call', 'phone', 'email', 'other'],
    default: 'other'
  },
  value: {
    type: Number,
    required: [true, 'Deal value is required'],
    min: 0,
    default: 0
  },
  stage: {
    type: String,
    enum: ['new-deal', 'proposal', 'quotation', 'negotiation', 'closed-won', 'closed-lost'],
    default: 'new-deal'
  },
  probability: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  expectedCloseDate: {
    type: Date,
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  status: {
    type: String,
    enum: ['open', 'won', 'lost'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  // Pipeline assignment
  pipeline: {
    type: String,
    enum: ['sales', 'enterprise', 'renewal', 'partner', 'other'],
    default: 'sales'
  },
  // Currency for deal value
  currency: {
    type: String,
    enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
    default: 'INR'
  },
  lostReason: {
    type: String,
    enum: ['budget', 'timing', 'competitor', 'no-response', 'not-interested', 'other'],
    required: false
  },

  lostNotes: {
    type: String,
    trim: true
  },
  wonDate: {
    type: Date,
    default: null
  },
  lostDate: {
    type: Date,
    default: null
  },
  closedDate: {
    type: Date,
    default: null
  },
  notes: [
    {
      content: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  attachments: [
    {
      name: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      },
      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
dealSchema.index({ stage: 1, status: 1 });
dealSchema.index({ assignedTo: 1 });
dealSchema.index({ createdBy: 1 });
dealSchema.index({ expectedCloseDate: 1 });
dealSchema.index({ isDeleted: 1 });
dealSchema.index({ source: 1 });
dealSchema.index({ leadId: 1 });

// Pre-save middleware to auto-calculate probability based on stage
dealSchema.pre('save', function (next) {
  const stageProbabilityMap = {
    'new-deal': 10,
    'proposal': 40,
    'quotation': 60,
    'negotiation': 80,
    'closed-won': 100,
    'closed-lost': 0
  };

  if (this.stage && stageProbabilityMap[this.stage] !== undefined) {
    this.probability = stageProbabilityMap[this.stage];
  }

  // Set status based on stage
  if (this.stage === 'closed-won') {
    this.status = 'won';
    if (!this.wonDate) this.wonDate = new Date();
    if (!this.closedDate) this.closedDate = new Date();
    if (!this.actualCloseDate) this.actualCloseDate = new Date();
  } else if (this.stage === 'closed-lost') {
    this.status = 'lost';
    if (!this.lostDate) this.lostDate = new Date();
    if (!this.closedDate) this.closedDate = new Date();
  } else {
    this.status = 'open';
  }

  next();
});

// Virtual for weighted value (value * probability)
dealSchema.virtual('weightedValue').get(function () {
  return (this.value * this.probability) / 100;
});

// Ensure virtuals are included in JSON
dealSchema.set('toJSON', { virtuals: true });
dealSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Deal', dealSchema);

