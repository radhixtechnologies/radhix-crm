const mongoose = require('mongoose');

const leaveBalanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear(),
  },
  // Total allocated leave days
  casual: { type: Number, default: 12 },
  sick: { type: Number, default: 10 },
  annual: { type: Number, default: 15 },
  maternity: { type: Number, default: 0 },
  paternity: { type: Number, default: 0 },
  unpaid: { type: Number, default: 0 },
  
  // Used leave days
  used: {
    casual: { type: Number, default: 0 },
    sick: { type: Number, default: 0 },
    annual: { type: Number, default: 0 },
    maternity: { type: Number, default: 0 },
    paternity: { type: Number, default: 0 },
  },
  
  // Carry forward from previous year
  carryForward: {
    casual: { type: Number, default: 0 },
    annual: { type: Number, default: 0 },
  },
  
  // Legacy balances structure (for backward compatibility)
  balances: {
    casual: {
      total: { type: Number, default: 12 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 12 },
      pending: { type: Number, default: 0 },
    },
    sick: {
      total: { type: Number, default: 10 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 10 },
      pending: { type: Number, default: 0 },
    },
    annual: {
      total: { type: Number, default: 15 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 15 },
      pending: { type: Number, default: 0 },
    },
    maternity: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    paternity: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
    unpaid: {
      total: { type: Number, default: 0 },
      used: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
    },
  },
  lastResetDate: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for employee + year uniqueness
leaveBalanceSchema.index({ employee: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', leaveBalanceSchema);

