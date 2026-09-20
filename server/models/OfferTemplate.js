const mongoose = require('mongoose');

const offerTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: String,
    htmlContent: {
        type: String,
        required: true,
    },
    // Variables that can be used in template: {{candidateName}}, {{jobTitle}}, {{joiningDate}}, etc.
    variables: [{
        name: String,
        description: String,
        required: Boolean,
    }],
    category: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        default: 'full-time',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isDefault: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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

module.exports = mongoose.model('OfferTemplate', offerTemplateSchema);
