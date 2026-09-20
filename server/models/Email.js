const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
    // Basic Information
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    body: {
        type: String,
        required: true,
    },
    preheader: {
        type: String,
        default: '',
    },

    // Template
    template: {
        type: String,
        enum: ['blank', 'welcome', 'newsletter', 'promotion', 'announcement', 'custom'],
        default: 'blank',
    },
    templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmailTemplate',
    },

    // Recipients
    recipientType: {
        type: String,
        enum: ['all', 'segment', 'contacts', 'leads', 'manual'],
        default: 'segment',
    },
    segments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Segment',
    }],
    contacts: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',
    }],
    leads: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
    }],
    customEmails: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    // Campaign Association
    campaign: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
    },

    // Scheduling
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
        default: 'draft',
    },
    scheduledDate: {
        type: Date,
    },
    sentDate: {
        type: Date,
    },
    timezone: {
        type: String,
        default: 'UTC',
    },

    // Sender Information
    fromName: {
        type: String,
        required: true,
    },
    fromEmail: {
        type: String,
        required: true,
    },
    replyTo: {
        type: String,
    },

    // Tracking & Analytics
    metrics: {
        totalRecipients: {
            type: Number,
            default: 0,
        },
        sent: {
            type: Number,
            default: 0,
        },
        delivered: {
            type: Number,
            default: 0,
        },
        opened: {
            type: Number,
            default: 0,
        },
        clicked: {
            type: Number,
            default: 0,
        },
        bounced: {
            type: Number,
            default: 0,
        },
        unsubscribed: {
            type: Number,
            default: 0,
        },
        complained: {
            type: Number,
            default: 0,
        },
    },

    // Calculated Metrics
    openRate: {
        type: Number,
        default: 0,
    },
    clickRate: {
        type: Number,
        default: 0,
    },
    bounceRate: {
        type: Number,
        default: 0,
    },

    // A/B Testing (optional)
    isABTest: {
        type: Boolean,
        default: false,
    },
    abTestVariant: {
        type: String,
        enum: ['A', 'B'],
    },

    // Tags
    tags: [String],

    // Owner
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
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
emailSchema.index({ status: 1, scheduledDate: 1 });
emailSchema.index({ campaign: 1 });
emailSchema.index({ owner: 1 });
emailSchema.index({ createdAt: -1 });

// Pre-save middleware
emailSchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Calculate rates
    if (this.metrics.delivered > 0) {
        this.openRate = (this.metrics.opened / this.metrics.delivered) * 100;
        this.clickRate = (this.metrics.clicked / this.metrics.delivered) * 100;
    }

    if (this.metrics.sent > 0) {
        this.bounceRate = (this.metrics.bounced / this.metrics.sent) * 100;
    }

    next();
});

module.exports = mongoose.model('Email', emailSchema);
