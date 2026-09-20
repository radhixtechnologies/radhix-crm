const mongoose = require('mongoose');

const exitDocumentSchema = new mongoose.Schema({
    exitRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExitRequest',
        required: true,
        index: true
    },

    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },

    // Document Details
    documentType: {
        type: String,
        enum: [
            'relieving_letter',
            'experience_letter',
            'fnf_statement',
            'noc',
            'service_certificate',
            'salary_certificate',
            'other'
        ],
        required: true,
        index: true
    },

    documentUrl: {
        type: String,
        required: true
    },

    // Generation Details
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },

    // Template & Content
    templateUsed: {
        type: String
    },
    metadata: {
        employeeName: String,
        employeeId: String,
        designation: String,
        department: String,
        joiningDate: Date,
        lastWorkingDay: Date,
        totalExperience: String,
        reason: String,
        customFields: mongoose.Schema.Types.Mixed
    },

    // Issuance
    issuedTo: {
        type: String // Employee name
    },
    issuedDate: {
        type: Date
    },

    // Status
    status: {
        type: String,
        enum: ['draft', 'generated', 'issued', 'revoked'],
        default: 'generated'
    },

    // Verification
    verificationCode: {
        type: String,
        unique: true,
        sparse: true
    },

    // Revocation
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    revokedAt: Date,
    revocationReason: String,

    // Additional
    notes: String,
    downloadCount: {
        type: Number,
        default: 0
    },
    lastDownloadedAt: Date
}, {
    timestamps: true
});

// Indexes
exitDocumentSchema.index({ exitRequest: 1, documentType: 1 });
exitDocumentSchema.index({ employee: 1, documentType: 1 });
exitDocumentSchema.index({ verificationCode: 1 });
exitDocumentSchema.index({ generatedAt: -1 });

// Method to generate verification code
exitDocumentSchema.methods.generateVerificationCode = function () {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    this.verificationCode = `${timestamp}-${random}`.toUpperCase();
    return this.verificationCode;
};

// Method to increment download count
exitDocumentSchema.methods.recordDownload = function () {
    this.downloadCount += 1;
    this.lastDownloadedAt = new Date();
    return this.save();
};

module.exports = mongoose.model('ExitDocument', exitDocumentSchema);
