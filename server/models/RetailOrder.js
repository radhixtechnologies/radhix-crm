const mongoose = require('mongoose');

const retailOrderLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'RetailProduct', required: true },
  name: { type: String, required: true, trim: true, maxlength: 180 },
  sku: { type: String, required: true, trim: true, uppercase: true, maxlength: 60 },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const retailOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 50 },
  customerName: { type: String, required: true, trim: true, maxlength: 180 },
  customerPhone: { type: String, default: '', trim: true, maxlength: 40 },
  customerEmail: { type: String, default: '', trim: true, lowercase: true, maxlength: 180 },
  shippingAddress: { type: String, default: '', trim: true, maxlength: 1000 },
  status: { type: String, enum: ['processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'processing', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid', index: true },
  paymentMethod: { type: String, enum: ['cash', 'card', 'upi', 'online', 'other'], default: 'cash' },
  items: { type: [retailOrderLineSchema], validate: [(items) => items.length > 0, 'At least one product is required.'] },
  totalAmount: { type: Number, required: true, min: 0 },
  stockReleased: { type: Boolean, default: false },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

retailOrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RetailOrder', retailOrderSchema);
