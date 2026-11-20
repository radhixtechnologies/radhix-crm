const mongoose = require('mongoose');

const orderLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturingProduct', default: null },
  productName: { type: String, required: true, trim: true, maxlength: 180 },
  sku: { type: String, default: '', trim: true, uppercase: true, maxlength: 60 },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const manufacturingOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 50 },
  type: { type: String, enum: ['sales', 'purchase'], required: true, index: true },
  partnerName: { type: String, required: true, trim: true, maxlength: 180 },
  partnerPhone: { type: String, default: '', trim: true, maxlength: 40 },
  partnerEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 180 },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturingSupplier', default: null },
  status: { type: String, enum: ['draft', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'], default: 'draft', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid', index: true },
  expectedDate: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  items: { type: [orderLineSchema], validate: [(items) => items.length > 0, 'At least one order item is required.'] },
  totalAmount: { type: Number, required: true, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', trim: true, maxlength: 3000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

manufacturingOrderSchema.index({ type: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ManufacturingOrder', manufacturingOrderSchema);
