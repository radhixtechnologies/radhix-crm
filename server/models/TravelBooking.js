const mongoose = require('mongoose');

const travelBookingSchema = new mongoose.Schema({
  bookingCode: { type: String, trim: true, uppercase: true, unique: true, sparse: true, maxlength: 40 },
  customerName: { type: String, required: true, trim: true, maxlength: 160 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 160 },
  package: { type: mongoose.Schema.Types.ObjectId, ref: 'TravelPackage', default: null },
  destination: { type: String, required: true, trim: true, maxlength: 160 },
  travelers: { type: Number, default: 1, min: 1, max: 1000 },
  travelStartDate: { type: Date, default: null },
  travelEndDate: { type: Date, default: null },
  status: { type: String, enum: ['inquiry', 'quoted', 'confirmed', 'cancelled', 'completed'], default: 'inquiry', index: true },
  paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid', 'refunded'], default: 'unpaid', index: true },
  totalAmount: { type: Number, default: 0, min: 0 },
  amountPaid: { type: Number, default: 0, min: 0 },
  notes: { type: String, default: '', trim: true, maxlength: 3000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

travelBookingSchema.index({ travelStartDate: 1, status: 1 });
travelBookingSchema.index({ customerName: 1, phone: 1 });

module.exports = mongoose.model('TravelBooking', travelBookingSchema);
