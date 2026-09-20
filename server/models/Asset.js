const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetId: { type: String, required: true, unique: true, trim: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, required: true, trim: true },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  serialNumber: { type: String, unique: true, sparse: true, default: null },
  purchaseDate: Date,
  purchasePrice: { type: Number, default: 0 },
  warrantyExpiry: Date,
  specifications: { type: mongoose.Schema.Types.Mixed, default: {} },
  notes: { type: String, default: '' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  assignedDate: Date,
  returnedDate: Date,
  currentStatus: { type: String, enum: ['available', 'assigned', 'maintenance', 'retired', 'lost'], default: 'available' },
  maintenanceHistory: { type: Array, default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Asset', assetSchema);
