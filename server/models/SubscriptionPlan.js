const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: '',
    },
    priceMonthly: {
      type: Number,
      required: true,
      default: 0,
    },
    priceYearly: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    features: [
      {
        type: String,
      },
    ],
    limits: {
      maxEmployees: {
        type: Number,
        default: 5,
      },
      maxLeads: {
        type: Number,
        default: 1000,
      },
      maxStorageGB: {
        type: Number,
        default: 5,
      },
      maxBranches: {
        type: Number,
        default: 1,
      },
    },
    allowedSuites: [
      {
        type: String,
        default: 'all',
      },
    ],
    allowedModules: [
      {
        type: String,
        default: ['dashboard', 'employee', 'sales', 'hrm', 'finance'],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

