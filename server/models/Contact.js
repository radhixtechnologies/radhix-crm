const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    // Basic Information
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        default: '',
    },
    alternatePhone: {
        type: String,
        default: '',
    },

    // Company Information
    company: {
        type: String,
        required: true,
    },
    designation: {
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

    // Address
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String,
    },

    // Contact Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'prospect', 'customer', 'churned'],
        default: 'active',
    },

    // Lifecycle
    lifecycleStage: {
        type: String,
        enum: ['lead', 'marketing-qualified', 'sales-qualified', 'opportunity', 'customer', 'evangelist'],
        default: 'lead',
    },

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },

    // Source Tracking
    source: {
        type: String,
        enum: ['website', 'referral', 'social-media', 'email', 'phone', 'campaign', 'other'],
        default: 'website',
    },
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
        default: null,
    },

    // Lead Conversion
    convertedFromLead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        default: null,
    },
    conversionDate: {
        type: Date,
        default: null,
    },

    // Social Media
    socialMedia: {
        linkedin: String,
        twitter: String,
        facebook: String,
    },

    // Communication History
    communicationHistory: [
        {
            type: {
                type: String,
                enum: ['call', 'email', 'meeting', 'note', 'sms'],
            },
            subject: String,
            description: String,
            date: Date,
            duration: Number, // in minutes
            outcome: String,
            addedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],

    // Notes
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
            isPinned: {
                type: Boolean,
                default: false,
            },
        },
    ],

    // Documents
    documents: [
        {
            name: String,
            url: String,
            type: {
                type: String,
                enum: ['contract', 'proposal', 'invoice', 'agreement', 'other'],
            },
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

    // Relationships
    linkedDeals: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Deal',
        },
    ],
    linkedTickets: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ticket',
        },
    ],

    // Metrics
    totalRevenue: {
        type: Number,
        default: 0,
    },
    totalDeals: {
        type: Number,
        default: 0,
    },
    lastContactedDate: {
        type: Date,
        default: null,
    },
    nextFollowUpDate: {
        type: Date,
        default: null,
    },

    // Tags
    tags: [String],

    // Custom Fields
    customFields: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
});

// Indexes
contactSchema.index({ email: 1 });
contactSchema.index({ assignedTo: 1, status: 1 });
contactSchema.index({ company: 1 });
contactSchema.index({ createdAt: -1 });
contactSchema.index({ lifecycleStage: 1 });

// Pre-save middleware
contactSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for full name
contactSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('Contact', contactSchema);
