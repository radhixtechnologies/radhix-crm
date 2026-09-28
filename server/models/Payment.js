const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, default: 'bank_transfer' },
  reference: { type: String, default: '' },
  notes: { type: String, default: '' },
  paidAt: { type: Date, default: Date.now },
  refundedAmount: { type: Number, default: 0, min: 0 },
  refundedAt: { type: Date, default: null },
  refundReason: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['completed', 'refunded'], default: 'completed' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);