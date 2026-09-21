const financeReports = require('../financeReportController');
const unavailable = (message) => async (req, res) => res.status(501).json({ success: false, message });
exports.exportInvoices = unavailable('Invoice export is not configured');
exports.exportExpenses = unavailable('Expense export is not configured');
exports.exportPayroll = unavailable('Payroll export is not configured');
exports.getFinancialSummary = financeReports.getRevenueDashboard;
exports.getExpenseStats = unavailable('Expense statistics are not configured');