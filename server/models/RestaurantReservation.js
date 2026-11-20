const mongoose = require('mongoose');

const restaurantReservationSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantCustomer', default: null },
  guestName: { type: String, required: true, trim: true, maxlength: 160 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  table: { type: mongoose.Schema.Types.ObjectId, ref: 'RestaurantTable', default: null },
  partySize: { type: Number, required: true, min: 1, max: 50 },
  reservationAt: { type: Date, required: true, index: true },
  status: { type: String, enum: ['booked', 'seated', 'completed', 'cancelled', 'no_show'], default: 'booked', index: true },
  notes: { type: String, default: '', trim: true, maxlength: 1000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

restaurantReservationSchema.index({ reservationAt: 1, status: 1 });

module.exports = mongoose.model('RestaurantReservation', restaurantReservationSchema);
