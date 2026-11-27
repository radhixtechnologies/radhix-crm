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
      hsnSac: { type: String, default: '' },
      quantity: Number,
      unit: { type: String, default: 'NOS' },
      rate: Number,
      taxRate: { type: Number, default: 0 },
      amount: Number,
    },
  ],
  poNumber: {
    type: String,
    default: '',
  },
  poDate: {
    type: Date,
    default: null,
  },
  vendorCode: {
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
  billedTo: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    gstin: { type: String, default: '' },
    pan: { type: String, default: '' },
  },
  shippedTo: {
    name: { type: String, default: '' },
    address: { type: String, default: '' },
    state: { type: String, default: '' },
    stateCode: { type: String, default: '' },
    gstin: { type: String, default: '' },
  },
  gstDetails: {
    copyLabel: { type: String, default: 'Original for Recipient' },
    cgstRate: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstRate: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstRate: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    reverseCharge: { type: String, default: 'N. A.' },
    ackNo: { type: String, default: '' },
    ackDate: { type: String, default: '' },
    irnNo: { type: String, default: '' },
    grNo: { type: String, default: '' },
    ewayBillNo: { type: String, default: '' },
    transport: { type: String, default: '' },
    vehicleNo: { type: String, default: '' },
  },
  importedFromPdf: {
    originalFilename: { type: String, default: '' },
    importedAt: { type: Date, default: null },
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

invoiceSchema.index({ status: 1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ paidDate: 1 });
invoiceSchema.index({ createdAt: -1 });
invoiceSchema.index({ client: 1 });
invoiceSchema.index({ createdBy: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);

