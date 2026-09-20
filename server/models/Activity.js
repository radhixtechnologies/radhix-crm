const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    // Activity Type - Enhanced with Calendar Types
    type: {
        type: String,
        enum: [
            'call', 'email', 'meeting', 'task', 'note', 'sms', 'demo', 'presentation',
            'leave', 'interview', 'reminder', 'holiday', 'announcement',
            'field-change', 'status-change', 'assignment', 'system'
        ],
        required: true,
    },

    // Activity Details
    subject: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },

    // Timing - Enhanced for Calendar
    scheduledAt: {
        type: Date,
        default: null,
    },
    endTime: {
        type: Date,
        default: null,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    duration: {
        type: Number, // in minutes
        default: 60,
    },
    allDay: {
        type: Boolean,
        default: false,
    },

    // Recurring Events
    isRecurring: {
        type: Boolean,
        default: false,
    },
    repeatType: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
        default: 'none',
    },
    repeatInterval: {
        type: Number,
        default: 1, // Every N days/weeks/months
    },
    repeatDays: [{
        type: Number, // 0-6 for Sunday-Saturday (for weekly)
    }],
    repeatEndDate: {
        type: Date,
        default: null,
    },
    parentEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity',
        default: null,
    },
    isException: {
        type: Boolean,
        default: false, // True if this is an edited occurrence
    },

    // Calendar Display
    color: {
        type: String,
        default: null, // Hex color code, null = use type default
    },
    visibility: {
        type: String,
        enum: ['private', 'team', 'company'],
        default: 'private',
    },

    // Status
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
        default: 'scheduled',
    },

    // Priority
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium',
    },

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
    },
    participants: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Employee',
        },
    ],

    // Related Entities (Polymorphic)
    relatedTo: {
        entityType: {
            type: String,
            enum: ['Lead', 'Contact', 'Deal', 'Ticket', 'Client'],
            required: true,
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'relatedTo.entityType',
        },
    },

    // Call Specific
    callDetails: {
        direction: {
            type: String,
            enum: ['inbound', 'outbound'],
        },
        phoneNumber: String,
        outcome: {
            type: String,
            enum: ['connected', 'no-answer', 'voicemail', 'busy', 'wrong-number'],
        },
        recordingUrl: String,
    },

    // Email Specific
    emailDetails: {
        to: [String],
        cc: [String],
        bcc: [String],
        subject: String,
        body: String,
        attachments: [
            {
                name: String,
                url: String,
            },
        ],
        isOpened: {
            type: Boolean,
            default: false,
        },
        openedAt: {
            type: Date,
            default: null,
        },
    },

    // Meeting Specific
    meetingDetails: {
        location: String,
        meetingLink: String,
        agenda: String,
        attendees: [
            {
                name: String,
                email: String,
                attended: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        notes: String,
    },

    // Outcome
    outcome: {
        type: String,
        default: '',
    },
    nextSteps: {
        type: String,
        default: '',
    },

    // Reminder
    reminder: {
        enabled: {
            type: Boolean,
            default: false,
        },
        reminderTime: {
            type: Date,
            default: null,
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },
    },

    // Attachments
    attachments: [
        {
            name: String,
            url: String,
            uploadedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],

    // Tags
    tags: [String],

    // Change Tracking (for field-change, status-change, assignment activities)
    changeDetails: {
        fieldName: String,        // e.g., "status", "email"
        fieldLabel: String,       // e.g., "Status", "Email Address"
        oldValue: String,         // Formatted old value
        newValue: String,         // Formatted new value
        changeType: {
            type: String,
            enum: ['updated', 'added', 'removed'],
        },
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
activitySchema.index({ assignedTo: 1, status: 1 });
activitySchema.index({ 'relatedTo.entityType': 1, 'relatedTo.entityId': 1 });
activitySchema.index({ scheduledAt: 1 });
activitySchema.index({ createdAt: -1 });
activitySchema.index({ type: 1, status: 1 });

// Pre-save middleware
activitySchema.pre('save', function (next) {
    this.updatedAt = Date.now();

    // Auto-calculate endTime if not provided
    if (this.scheduledAt && !this.endTime) {
        const durationMs = (this.duration || 60) * 60 * 1000; // Convert minutes to milliseconds
        this.endTime = new Date(this.scheduledAt.getTime() + durationMs);
    }

    next();
});

module.exports = mongoose.model('Activity', activitySchema);
