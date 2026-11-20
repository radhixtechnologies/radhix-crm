const mongoose = require('mongoose');

const realEstatePropertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  propertyCode: { type: String, trim: true, uppercase: true, unique: true, sparse: true },
  propertyType: {
    type: String,
    enum: ['apartment', 'house', 'villa', 'plot', 'commercial', 'office', 'other'],
    default: 'apartment',
  },
  listingType: { type: String, enum: ['sale', 'rent'], default: 'sale' },
  status: { type: String, enum: ['available', 'reserved', 'sold', 'rented'], default: 'available' },
  price: { type: Number, required: true, min: 0 },
  bedrooms: { type: Number, default: 0, min: 0 },
  bathrooms: { type: Number, default: 0, min: 0 },
  areaSqft: { type: Number, default: 0, min: 0 },
  address: { type: String, required: true, trim: true, maxlength: 300 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: '', trim: true, maxlength: 5000 },
  photos: [{
    filename: { type: String, required: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  }],
  documents: [{
    name: { type: String, required: true },
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, default: '' },
    uploadedAt: { type: Date, default: Date.now },
  }],
  assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', index: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

realEstatePropertySchema.index({ company: 1, status: 1, listingType: 1 });
realEstatePropertySchema.index({ status: 1, listingType: 1, createdAt: -1 });
realEstatePropertySchema.index({ city: 1, propertyType: 1 });

module.exports = mongoose.model('RealEstateProperty', realEstatePropertySchema);
