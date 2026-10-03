const mongoose = require('mongoose');

const salaryStructureSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  basic: { type: Number, default: 0 },
  allowances: { type: mongoose.Schema.Types.Mixed, default: {} },
  deductions: { type: mongoose.Schema.Types.Mixed, default: {} },
  grossSalary: { type: Number, default: 0 },
  annualCTC: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  effectiveFrom: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('SalaryStructure', salaryStructureSchema);