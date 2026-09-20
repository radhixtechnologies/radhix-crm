const mongoose = require('mongoose');

const importLogSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  totalRows: {
    type: Number,
    required: true,
    default: 0,
  },
  importedRows: {
    type: Number,
    required: true,
    default: 0,
  },
  failedRows: {
    type: Number,
    required: true,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  errorRecords: [{
    row: Number,
    employeeId: String,
    name: String,
    error: String,
  }],
  success: [{
    row: Number,
    employeeId: String,
    name: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ImportLog', importLogSchema);

