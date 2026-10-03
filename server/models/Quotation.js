const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  quotationNumber: { type: String, unique: true },
  quotationName: { type: String, required: true, trim: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null },
  contact: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', default: null },
  deal: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', default: null },
  customClientDetails: { type: Object, default: null },
  quotationDate: { type: Date, default: Date.now },
  priceValidUntil: Date,
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
  deliverables: { type: Array, default: [] },
  extraRequirements: { type: Array, default: [] },
  items: { type: Array, default: [] },
  customFields: { type: Array, default: [] },
  discountType: { type: String, enum: ['none', 'percentage', 'fixed'], default: 'none' },
  discountValue: { type: Number, default: 0 },
  taxRate: { type: Number, default: 18 },
  taxInclusive: { type: Boolean, default: false },
  subtotal: { type: Number, default: 0 },
  totalDiscount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paymentTerms: { type: String, default: '' },
  deliveryTimeline: { type: String, default: '' },
  notes: { type: String, default: '' },
  pdfUrl: { type: String, default: '' },
  emailSent: { type: Boolean, default: false },
  emailSentAt: Date,
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);
