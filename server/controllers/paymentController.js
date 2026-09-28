const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

const fail = (res, error) => res.status(500).json({ success: false, message: error.message });
exports.getAllPayments = async (req, res) => {
	try {
		const { status, search, startDate, endDate } = req.query;
		const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
		const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
		const query = {};

		if (status) query.status = status.toLowerCase();
		if (startDate || endDate) {
			query.paidAt = {};
			if (startDate) query.paidAt.$gte = new Date(startDate);
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				query.paidAt.$lte = end;
			}
		}
		if (search) {
			const invoiceIds = await Invoice.find({
				invoiceNumber: { $regex: search, $options: 'i' },
			}).distinct('_id');
			query.invoice = { $in: invoiceIds };
		}

		const [payments, total, aggregate] = await Promise.all([
			Payment.find(query)
				.populate({ path: 'invoice', populate: { path: 'client', select: 'company name' } })
				.sort({ paidAt: -1 })
				.skip((page - 1) * limit)
				.limit(limit),
			Payment.countDocuments(query),
			Payment.aggregate([
				{ $match: query },
				{
					$group: {
						_id: null,
						totalAmount: { $sum: '$amount' },
						completedAmount: {
							$sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] },
						},
						completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
						pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
						refundedAmount: { $sum: { $ifNull: ['$refundedAmount', 0] } },
					},
				},
			]),
		]);

		res.json({
			success: true,
			data: payments,
			total,
			pages: Math.ceil(total / limit),
			page,
			summary: { total, totalAmount: 0, completedAmount: 0, completed: 0, pending: 0, refundedAmount: 0, ...aggregate[0] },
		});
	} catch (error) {
		fail(res, error);
	}
};
exports.getPaymentById = async (req, res) => {
	try {
		const payment = await Payment.findById(req.params.id)
			.populate({ path: 'invoice', populate: { path: 'client', select: 'company name' } })
			.populate('createdBy', 'name email');
		if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
		res.json({ success: true, data: payment });
	} catch (error) {
		fail(res, error);
	}
};
exports.getPaymentsByInvoice = async (req, res) => { try { res.json({ success: true, data: await Payment.find({ invoice: req.params.invoiceId }).sort({ paidAt: -1 }) }); } catch (e) { fail(res, e); } };
exports.createPayment = async (req, res) => {
	try {
		const { invoice: invoiceId, amount, paymentDate, paymentMethod, referenceNumber, transactionId, notes } = req.body;
		const invoice = await Invoice.findById(invoiceId);
		if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
		const paymentAmount = Number(amount);
		const balance = invoice.total - (invoice.amountPaid || 0);
		if (!paymentAmount || paymentAmount <= 0 || paymentAmount > balance) return res.status(400).json({ success: false, message: 'Invalid payment amount' });
		const payment = await Payment.create({ invoice: invoiceId, amount: paymentAmount, paidAt: paymentDate || new Date(), method: paymentMethod, reference: referenceNumber || transactionId || '', notes, createdBy: req.user._id });
		invoice.amountPaid = (invoice.amountPaid || 0) + paymentAmount;
		invoice.balanceDue = Math.max(0, invoice.total - invoice.amountPaid);
		invoice.status = invoice.balanceDue === 0 ? 'paid' : 'partially-paid';
		invoice.paymentDate = payment.paidAt;
		await invoice.save();
		res.status(201).json({ success: true, payment, data: payment });
	} catch (e) { res.status(400).json({ success: false, message: e.message }); }
};
exports.updatePayment = async (req, res) => { try { res.json({ success: true, data: await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }) }); } catch (e) { fail(res, e); } };
exports.deletePayment = async (req, res) => {
	try {
		const payment = await Payment.findByIdAndDelete(req.params.id);
		if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

		const netAmount = Math.max(0, payment.amount - (payment.refundedAmount || 0));
		const invoice = await Invoice.findById(payment.invoice);
		if (invoice && netAmount > 0) {
			invoice.amountPaid = Math.max(0, (invoice.amountPaid || 0) - netAmount);
			invoice.balanceDue = Math.max(0, invoice.total - invoice.amountPaid);
			invoice.status = invoice.balanceDue === 0 ? 'paid' : invoice.amountPaid > 0 ? 'partially-paid' : 'pending';
			await invoice.save();
		}
		res.json({ success: true });
	} catch (error) {
		fail(res, error);
	}
};
exports.refundPayment = async (req, res) => {
	try {
		const payment = await Payment.findById(req.params.id);
		if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });

		const remainingAmount = payment.amount - (payment.refundedAmount || 0);
		const refundAmount = Number(req.body.refundAmount || remainingAmount);
		if (payment.status === 'refunded' || refundAmount <= 0 || refundAmount > remainingAmount) {
			return res.status(400).json({ success: false, message: 'Refund amount must be greater than zero and no more than the remaining payment amount.' });
		}
		if (!req.body.refundReason?.trim()) {
			return res.status(400).json({ success: false, message: 'Refund reason is required.' });
		}

		payment.refundedAmount = (payment.refundedAmount || 0) + refundAmount;
		payment.refundedAt = new Date();
		payment.refundReason = req.body.refundReason.trim();
		if (payment.refundedAmount >= payment.amount) payment.status = 'refunded';
		await payment.save();

		const invoice = await Invoice.findById(payment.invoice);
		if (invoice) {
			invoice.amountPaid = Math.max(0, (invoice.amountPaid || 0) - refundAmount);
			invoice.balanceDue = Math.max(0, invoice.total - invoice.amountPaid);
			invoice.status = invoice.balanceDue === 0 ? 'paid' : invoice.amountPaid > 0 ? 'partially-paid' : 'pending';
			await invoice.save();
		}

		res.json({ success: true, data: payment });
	} catch (error) {
		fail(res, error);
	}
};