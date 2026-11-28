const mongoose = require('mongoose');

const aiCallLogSchema = new mongoose.Schema(
  {
    tenantCompany: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      default: null,
      index: true,
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    provider: {
      type: String,
      enum: ['bolna', 'retell', 'vapi', 'simulator'],
      default: 'bolna',
    },
    externalCallId: {
      type: String,
      default: '',
      index: true,
    },
    agentId: {
      type: String,
      default: '',
    },
    fromNumber: {
      type: String,
      default: '',
    },
    toNumber: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'ringing', 'in-progress', 'completed', 'no-answer', 'busy', 'failed'],
      default: 'queued',
    },
    outcome: {
      type: String,
      enum: ['', 'interested', 'callback_requested', 'busy', 'no_answer', 'not_interested', 'voicemail', 'other'],
      default: '',
    },
    terminationReason: {
      type: String,
      default: '',
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    cost: {
      type: Number,
      default: 0,
    },
    recordingUrl: {
      type: String,
      default: '',
    },
    summary: {
      type: String,
      default: '',
    },
    transcriptText: {
      type: String,
      default: '',
    },
    transcriptTurns: [
      {
        role: { type: String, default: 'agent' },
        message: { type: String, default: '' },
      },
    ],
    extractedData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    recommendedTemperature: {
      type: String,
      default: '',
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
    },
    nextFollowUpTime: {
      type: String,
      default: '',
    },
    syncedToLead: {
      type: Boolean,
      default: false,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    parentCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AiCallLog',
      default: null,
    },
    nextRetryAt: {
      type: Date,
      default: null,
    },
    retryScheduled: {
      type: Boolean,
      default: false,
    },
    retryExecuted: {
      type: Boolean,
      default: false,
    },
    whatsappAutoSent: {
      type: Boolean,
      default: false,
    },
    whatsappAutoStatus: {
      type: String,
      default: '',
    },
    errorMessage: {
      type: String,
      default: '',
    },
    rawPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

aiCallLogSchema.index({ tenantCompany: 1, createdAt: -1 });
aiCallLogSchema.index({ lead: 1, createdAt: -1 });

module.exports = mongoose.model('AiCallLog', aiCallLogSchema);
