const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    // Basic Information
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },

    // Campaign Type
    type: {
        type: String,
        enum: ['email', 'sms', 'social-media', 'webinar', 'event', 'content', 'paid-ads', 'other'],
        required: true,
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
        default: 'draft',
    },

    // Timeline
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },

    // Budget
    budget: {
        type: Number,
        default: 0,
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'SGD', 'AED'],
        default: 'USD',
    },
    actualSpend: {
        type: Number,
        default: 0,
    },

    // Segment (MANDATORY for targeting)
    segment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Segment',
        required: [true, 'Campaign must have a target segment']
    },

    // Target Audience (deprecated - use segment instead)
    targetAudience: {
        industry: [String],
        companySize: [String],
        location: [String],
        leadTemperature: [String],
        leadSource: [String],
        engagementLevel: [String],
        purchaseHistory: [String],
        customCriteria: String,
    },

    // Campaign Owner
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },

    // Team Members
    teamMembers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
        },
    ],

    // Email Campaign Details
    emailCampaign: {
        subject: String,
        template: String,
        fromEmail: String,
        fromName: String,
        replyTo: String,
    },

    // SMS Campaign Details
    smsCampaign: {
        message: String,
        senderId: String,
    },

    // Performance Metrics
    metrics: {
        totalLeads: {
            type: Number,
            default: 0,
        },
        qualifiedLeads: {
            type: Number,
            default: 0,
        },
        convertedLeads: {
            type: Number,
            default: 0,
        },
        emailsSent: {
            type: Number,
            default: 0,
        },
        emailsOpened: {
            type: Number,
            default: 0,
        },
        emailsClicked: {
            type: Number,
            default: 0,
        },
        smsSent: {
            type: Number,
            default: 0,
        },
        smsDelivered: {
            type: Number,
            default: 0,
        },
        websiteVisits: {
            type: Number,
            default: 0,
        },
        formSubmissions: {
            type: Number,
            default: 0,
        },
        revenue: {
            type: Number,
            default: 0,
        },
    },

    // Calculated Fields
    roi: {
        type: Number,
        default: 0,
    },
    conversionRate: {
        type: Number,
        default: 0,
    },
    costPerLead: {
        type: Number,
        default: 0,
    },

    // Associated Leads
    leads: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lead',
        },
    ],

    // Tags
    tags: [String],

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
        },
    ],

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
campaignSchema.index({ status: 1, startDate: -1 });
campaignSchema.index({ owner: 1 });
campaignSchema.index({ type: 1 });
campaignSchema.index({ createdAt: -1 });

// Pre-save middleware
campaignSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Calculate ROI
    if (this.actualSpend > 0) {
        this.roi = ((this.metrics.revenue - this.actualSpend) / this.actualSpend) * 100;
    }

    // Calculate conversion rate
    if (this.metrics.totalLeads > 0) {
        this.conversionRate = (this.metrics.convertedLeads / this.metrics.totalLeads) * 100;
    }

    // Calculate cost per lead
    if (this.metrics.totalLeads > 0) {
        this.costPerLead = this.actualSpend / this.metrics.totalLeads;
    }

    next();
});

module.exports = mongoose.model('Campaign', campaignSchema);
