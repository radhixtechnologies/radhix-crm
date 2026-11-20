const mongoose = require('mongoose');

const restaurantOrderLineSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantMenuItem', required: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  quantity: { type: Number, required: true, min: 1, max: 1000 },
  unitPrice: { type: Number, required: true, min: 0 },
}, { _id: false });

const restaurantOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 40 },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantCustomer', default: null },
  guestName: { type: String, default: '', trim: true, maxlength: 160 },
  orderType: { type: String, enum: ['dine_in', 'takeaway', 'delivery'], default: 'dine_in', index: true },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantTable', default: null },
  status: { type: String, enum: ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'], default: 'placed', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid', index: true },
  items: { type: [restaurantOrderLineSchema], validate: [(items) => items.length > 0, 'At least one menu item is required.'] },
  subtotal: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  loyaltyAwarded: { type: Boolean, default: false },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

restaurantOrderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('RestaurantOrder', restaurantOrderSchema);
