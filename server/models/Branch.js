const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Branch code is required'],
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['headquarters', 'regional_office', 'sales_branch', 'warehouse', 'clinic_center', 'campus', 'showroom'],
      default: 'sales_branch',
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    managerName: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, required: [true, 'City is required'], trim: true },
      state: { type: String, default: '' },
      country: { type: String, default: 'India' },
      postalCode: { type: String, default: '' },
    },
    capacity: {
      type: Number,
      default: 25,
    },
    operatingHours: {
      type: String,
      default: '9:30 AM - 6:30 PM (Mon-Sat)',
    },
    isHeadOffice: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Unique branch code per company
branchSchema.index({ company: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Branch', branchSchema);

