const mongoose = require('mongoose');

const offerLetterSchema = new mongoose.Schema({
    application: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobApplication',
        required: true,
    },
    jobPosting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPosting',
        required: true,
    },
    candidateName: {
        type: String,
        required: true,
    },
    candidateEmail: {
        type: String,
        required: true,
    },
    candidatePhone: String,
    department: String,
    designation: String,
    location: String,
    employmentType: {
        type: String,
        enum: ['full-time', 'part-time', 'contract', 'internship'],
        default: 'full-time',
    },

    // Compensation Structure
    salaryDetails: {
        basic: { type: Number, default: 0 },
        hra: { type: Number, default: 0 },
        allowances: { type: Number, default: 0 },
        specialAllowance: { type: Number, default: 0 },
        medical: { type: Number, default: 0 },
        transport: { type: Number, default: 0 },
        bonus: { type: Number, default: 0 },
        variable: { type: Number, default: 0 },
        otherBenefits: { type: Number, default: 0 },

        // Auto-calculated fields
        monthlyGross: { type: Number, default: 0 },
        annualGross: { type: Number, default: 0 },
        annualCTC: { type: Number, required: true },
        currency: { type: String, default: 'USD' },
    },

    // Dates
    joiningDate: {
        type: Date,
        required: true,
    },
    validUntil: {
        type: Date,
        required: true,
    },
    offerIssuedDate: Date,

    // Offer Terms & Policies
    probationPeriod: {
        duration: { type: Number, default: 3 }, // in months
        unit: { type: String, default: 'months' },
    },
    noticePeriod: {
        duration: { type: Number, default: 30 }, // in days
        unit: { type: String, default: 'days' },
    },
    workingHours: String,
    policyReferences: [{
        policyName: String,
        policyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Policy' },
        description: String,
    }],
    additionalTerms: String,
    benefits: [String],

    // Template & Preview
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OfferTemplate',
    },
    generatedPDF: {
        url: String,
        generatedAt: Date,
    },

    // Approval Workflow
    status: {
        type: String,
        enum: ['draft', 'pending_approval', 'approved', 'rejected_by_approver', 'sent', 'accepted', 'rejected_by_candidate', 'expired', 'withdrawn'],
        default: 'draft',
        index: true,
    },
    approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Super Admin if salary > threshold
    },
    approvalRequestedAt: Date,
    approvedAt: Date,
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    rejectionReason: String,

    // Candidate Response
    token: {
        type: String,
        index: true, // For public access to accept/reject
    },
    sentAt: Date,
    viewedAt: Date,
    respondedAt: Date,
    candidateResponse: {
        accepted: Boolean,
        rejectionReason: String,
        comments: String,
    },

    // Employee Creation
    employeeCreated: {
        type: Boolean,
        default: false,
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
    },

    // Activity Log
    activities: [{
        action: String, // e.g., 'created', 'submitted_for_approval', 'approved', 'rejected', 'sent', 'viewed', 'accepted', 'declined'
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        details: String,
    }],

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

module.exports = mongoose.model('OfferLetter', offerLetterSchema);
