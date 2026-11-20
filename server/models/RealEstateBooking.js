const mongoose = require('mongoose');

const realEstateBookingSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateProperty', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateOffer', default: null },
  bookingAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['reserved', 'confirmed', 'cancelled', 'completed'], default: 'reserved' },
  bookingDate: { type: Date, default: Date.now },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

realEstateBookingSchema.index(
  { property: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['reserved', 'confirmed'] } } }
);
realEstateBookingSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('RealEstateBooking', realEstateBookingSchema);
