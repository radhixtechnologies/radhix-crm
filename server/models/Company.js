const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: 'general',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    upiId: {
      type: String,
      default: '', // e.g. 'company@okaxis' or 'merchant@upi' for QR generation
      trim: true,
    },
    upiName: {
      type: String,
      default: '', // Payee name for UPI
      trim: true,
    },
    subscription: {
      plan: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionPlan',
      },
      planSlug: {
        type: String,
        default: 'starter',
      },
      status: {
        type: String,
        enum: ['trial', 'active', 'past_due', 'canceled', 'expired'],
        default: 'trial',
      },
      billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        default: 'monthly',
      },
      trialEndsAt: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day free trial
      },
      currentPeriodStart: {
        type: Date,
        default: Date.now,
      },
      currentPeriodEnd: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      allowedSuites: [
        {
          type: String,
          default: 'all',
        },
      ],
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
    },
    pan: {
      type: String,
      default: '',
      trim: true,
    },
    cin: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    stateName: {
      type: String,
      default: '',
      trim: true,
    },
    stateCode: {
      type: String,
      default: '',
      trim: true,
    },
    bankDetails: {
      bankName: { type: String, default: '', trim: true },
      branch: { type: String, default: '', trim: true },
      accountNumber: { type: String, default: '', trim: true },
      ifscCode: { type: String, default: '', trim: true },
    },
    branding: {
      brandColor: { type: String, default: '#6366f1' },
      accentColor: { type: String, default: '#8b5cf6' },
      logo: { type: String, default: '' },
      favicon: { type: String, default: '' },
      companyDisplayName: { type: String, default: '' },
      tagline: { type: String, default: '' },
      supportEmail: { type: String, default: '' },
      supportPhone: { type: String, default: '' },
      customDomain: { type: String, default: '' },
      invoiceHeaderNote: { type: String, default: 'Thank you for your business!' },
      invoiceFooterTerms: { type: String, default: 'Payment is due within 15 days of invoice date. All disputes subject to local jurisdiction.' },
      signatureUrl: { type: String, default: '' },
      signatoryName: { type: String, default: '' },
      declarationText: { type: String, default: 'Certified that Particulars given above are true & correct under GST Act 2017 and amount indicated represent the price actually charged and that there is no flow of additional consideration directly or indirectly from buyer.' },
      jurisdiction: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);

