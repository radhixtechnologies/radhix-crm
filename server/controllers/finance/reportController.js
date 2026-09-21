const financeReports = require('../financeReportController');
const Invoice = require('../../models/Invoice');
const Expense = require('../../models/Expense');
const Payroll = require('../../models/Payroll');
exports.exportInvoices = async (req, res) => res.json(await Invoice.find(req.query).lean());
exports.exportExpenses = async (req, res) => res.json(await Expense.find(req.query).lean());
exports.exportPayroll = async (req, res) => res.json(await Payroll.find(req.query).populate('employee').lean());
exports.getFinancialSummary = financeReports.getRevenueDashboard;
exports.getExpenseStats = async (req, res) => { const data = await Expense.aggregate([{ $group: { _id: '$category', total: { $sum: '$total' }, count: { $sum: 1 } } }]); res.json({ success: true, data }); };