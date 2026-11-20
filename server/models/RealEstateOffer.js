const mongoose = require('mongoose');

const realEstateOfferSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'RealEstateProperty', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  offerAmount: { type: Number, required: true, min: 1 },
  counterAmount: { type: Number, default: null, min: 1 },
  status: {
    type: String,
    enum: ['submitted', 'countered', 'accepted', 'rejected', 'withdrawn'],
    default: 'submitted',
  },
  notes: { type: String, default: '', trim: true, maxlength: 2000 },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

realEstateOfferSchema.index({ company: 1, status: 1 });
realEstateOfferSchema.index({ property: 1, buyer: 1, createdAt: -1 });
realEstateOfferSchema.index({ status: 1, updatedAt: -1 });

module.exports = mongoose.model('RealEstateOffer', realEstateOfferSchema);
