const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  relatedDeal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deal',
    default: null,
  },
  issueDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  items: [
    {
      name: String,
      description: String,
      quantity: Number,
      rate: Number,
      taxRate: { type: Number, default: 0 },
      amount: Number,
    },
  ],
  poNumber: {
    type: String,
    default: '',
  },
  project: {
    type: String,
    default: '',
  },
  department: {
    type: String,
    default: '',
  },
  taxMode: {
    type: String,
    enum: ['exclusive', 'inclusive', 'no_tax'],
    default: 'exclusive',
  },
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    default: 'flat',
  },
  shipping: {
    type: Number,
    default: 0,
  },
  additionalCharges: {
    type: Number,
    default: 0,
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  balanceDue: {
    type: Number,
    default: 0,
  },
  customerNotes: {
    type: String,
    default: '',
  },
  terms: {
    type: String,
    default: '',
  },
  footerMessage: {
    type: String,
    default: '',
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now },
  }],
  subtotal: {
    type: Number,
    required: true,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'pending', 'partially-paid', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  pdfUrl: {
    type: String,
    default: null,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  emailSentAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
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

module.exports = mongoose.model('Invoice', invoiceSchema);

