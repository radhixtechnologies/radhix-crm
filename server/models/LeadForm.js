const mongoose = require('mongoose');

const leadFormSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
    },
    industry: {
      type: String,
      default: 'General',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    source: {
      type: String,
      default: 'Website Form',
    },
    fields: {
      askName: { type: Boolean, default: true },
      askEmail: { type: Boolean, default: true },
      askPhone: { type: Boolean, default: true },
      askBudget: { type: Boolean, default: false },
      askMessage: { type: Boolean, default: true },
      customQuestion: { type: String, default: '' },
    },
    themeColor: {
      type: String,
      default: '#6366f1',
    },
    submitButtonText: {
      type: String,
      default: 'Submit Inquiry',
    },
    successMessage: {
      type: String,
      default: 'Thank you! Our advisor will connect with you shortly.',
    },
    redirectUrl: {
      type: String,
      default: '',
    },
    submissionsCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LeadForm', leadFormSchema);

