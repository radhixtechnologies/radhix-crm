const mongoose = require('mongoose');

const finalSettlementSchema = new mongoose.Schema({
  exitRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExitRequest',
    required: true,
    unique: true,
    index: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
    // index: true removed - compound index exists at schema level (line 97)
  },
  settlementDate: {
    type: Date,
    required: true,
  },
  earnings: {
    basicSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    overtime: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
    otherEarnings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
  },
  deductions: {
    unpaidLeaves: { type: Number, default: 0 },
    noticePeriod: { type: Number, default: 0 },
    loanRecovery: { type: Number, default: 0 },
    advanceRecovery: { type: Number, default: 0 },
    taxDeduction: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
  },
  leaveEncashment: {
    eligibleDays: { type: Number, default: 0 },
    ratePerDay: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  gratuity: {
    eligible: { type: Boolean, default: false },
    yearsOfService: { type: Number, default: 0 },
    amount: { type: Number, default: 0 },
  },
  netSettlement: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'calculated', 'approved', 'processed', 'paid'],
    default: 'pending',
    // index: true removed - index exists at schema level (line 98)
  },
  paymentDetails: {
    paymentDate: Date,
    paymentMethod: { type: String, enum: ['bank_transfer', 'cheque', 'cash'] },
    transactionId: String,
    bankAccount: String,
    ifscCode: String,
  },
  documents: [{
    name: String,
    type: String,
    url: String,
  }],
  calculatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: {
    type: String,
    default: '',
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

finalSettlementSchema.index({ employee: 1 });
finalSettlementSchema.index({ status: 1 });
finalSettlementSchema.index({ settlementDate: 1 });

// Calculate totals before saving
finalSettlementSchema.pre('save', function (next) {
  // Calculate total earnings
  this.earnings.totalEarnings =
    (this.earnings.basicSalary || 0) +
    (this.earnings.allowances || 0) +
    (this.earnings.overtime || 0) +
    (this.earnings.bonus || 0) +
    (this.earnings.commission || 0) +
    (this.earnings.otherEarnings || 0);

  // Calculate total deductions
  this.deductions.totalDeductions =
    (this.deductions.unpaidLeaves || 0) +
    (this.deductions.noticePeriod || 0) +
    (this.deductions.loanRecovery || 0) +
    (this.deductions.advanceRecovery || 0) +
    (this.deductions.taxDeduction || 0) +
    (this.deductions.otherDeductions || 0);

  // Calculate leave encashment
  if (this.leaveEncashment.eligibleDays && this.leaveEncashment.ratePerDay) {
    this.leaveEncashment.totalAmount =
      this.leaveEncashment.eligibleDays * this.leaveEncashment.ratePerDay;
  }

  // Calculate net settlement
  this.netSettlement =
    this.earnings.totalEarnings -
    this.deductions.totalDeductions +
    (this.leaveEncashment.totalAmount || 0) +
    (this.gratuity.amount || 0);

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('FinalSettlement', finalSettlementSchema);

