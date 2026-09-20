const mongoose = require('mongoose');

const dealActivitySchema = new mongoose.Schema({
    deal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Deal',
        required: [true, 'Deal reference is required']
    },
    type: {
        type: String,
        enum: ['note', 'call', 'meeting', 'email', 'stage_change', 'status_change', 'created', 'updated'],
        required: [true, 'Activity type is required']
    },
    description: {
        type: String,
        trim: true
    },
    oldValue: {
        type: String,
        trim: true
    },
    newValue: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Creator is required']
    }
}, {
    timestamps: true
});

// Indexes for better query performance
dealActivitySchema.index({ deal: 1, createdAt: -1 });
dealActivitySchema.index({ type: 1 });

module.exports = mongoose.model('DealActivity', dealActivitySchema);
