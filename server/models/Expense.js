const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: [
      'hosting',
      'domain',
      'travel',
      'tools',
      'training',
      'hardware',
      'internet',
      'server',
      'marketing',
      'office',
      'other'
    ],
    required: true,
  },
  vendor: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['UPI', 'Bank Transfer', 'Credit Card', 'Cash'],
    default: 'Bank Transfer',
  },
  amount: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  description: {
    type: String,
    default: '',
  },
  receipt: {
    name: String,
    url: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending',
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

// Calculate tax and total before saving
expenseSchema.pre('save', function(next) {
  if (this.isModified('amount') || this.isModified('taxRate')) {
    const amount = this.amount || 0;
    const taxRate = this.taxRate || 0;
    // Calculate tax amount from percentage
    this.tax = (amount * taxRate) / 100;
    // Calculate total
    this.total = amount + this.tax;
  }
  next();
});

module.exports = mongoose.model('Expense', expenseSchema);

