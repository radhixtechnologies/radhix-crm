const mongoose = require('mongoose');

const exitTaskSchema = new mongoose.Schema({
    exitRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExitRequest',
        required: true,
        index: true
    },

    taskName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },

    // Assignment
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    assignedRole: {
        type: String,
        enum: ['employee', 'manager', 'hr', 'it', 'admin', 'finance'],
        required: true
    },

    // Categorization
    category: {
        type: String,
        enum: [
            'handover',
            'documentation',
            'asset_return',
            'access_revoke',
            'knowledge_transfer',
            'clearance',
            'other'
        ],
        default: 'other'
    },

    isMandatory: {
        type: Boolean,
        default: true
    },

    // Status
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'skipped'],
        default: 'pending',
        index: true
    },

    // Completion
    completedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    completedAt: Date,
    comments: String,
    attachments: [{
        filename: String,
        url: String,
        uploadedAt: Date
    }],

    // Scheduling
    dueDate: Date,
    reminderSent: {
        type: Boolean,
        default: false
    },

    // Metadata
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Indexes
exitTaskSchema.index({ exitRequest: 1, status: 1 });
exitTaskSchema.index({ assignedTo: 1, status: 1 });
exitTaskSchema.index({ dueDate: 1 });

// Method to check if task is overdue
exitTaskSchema.methods.isOverdue = function () {
    return this.status !== 'completed' && this.dueDate && new Date() > this.dueDate;
};

module.exports = mongoose.model('ExitTask', exitTaskSchema);
