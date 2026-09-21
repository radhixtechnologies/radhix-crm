const mongoose = require('mongoose');

const assetRecoverySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  exitRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'ExitRequest' },
  asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
  status: { type: String, enum: ['pending', 'recovered', 'waived'], default: 'pending' },
  recoveredAt: Date,
  notes: { type: String, default: '' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('AssetRecovery', assetRecoverySchema);