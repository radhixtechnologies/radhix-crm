const financeReports = require('../financeReportController');
const Invoice = require('../../models/Invoice');
const Expense = require('../../models/Expense');
const Payroll = require('../../models/Payroll');
exports.exportInvoices = async (req, res) => res.json(await Invoice.find(req.query).lean());
exports.exportExpenses = async (req, res) => res.json(await Expense.find(req.query).lean());
exports.exportPayroll = async (req, res) => res.json(await Payroll.find(req.query).populate('employee').lean());
exports.getFinancialSummary = financeReports.getRevenueDashboard;
exports.getExpenseStats = async (req, res) => {
	try {
		const match = {};
		if (req.query.startDate || req.query.endDate) {
			match.date = {};
			if (req.query.startDate) match.date.$gte = new Date(req.query.startDate);
			if (req.query.endDate) {
				const end = new Date(req.query.endDate);
				end.setHours(23, 59, 59, 999);
				match.date.$lte = end;
			}
		}

		const categoryWise = await Expense.aggregate([
			{ $match: match },
			{
				$group: {
					_id: '$category',
					total: { $sum: { $ifNull: ['$total', '$amount'] } },
					count: { $sum: 1 },
				},
			},
			{ $sort: { total: -1 } },
		]);

		res.json({
			success: true,
			data: {
				categoryWise: categoryWise.map(({ _id, ...category }) => ({ category: _id, ...category })),
			},
		});
	} catch (error) {
		res.status(500).json({ success: false, message: error.message });
	}
};