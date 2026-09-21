const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

const fail = (res, error) => res.status(500).json({ success: false, message: error.message });
exports.getAllPayments = async (req, res) => { try { res.json({ success: true, data: await Payment.find().populate('invoice').sort({ paidAt: -1 }) }); } catch (e) { fail(res, e); } };
exports.getPaymentById = async (req, res) => { try { const payment = await Payment.findById(req.params.id).populate('invoice'); if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' }); res.json({ success: true, data: payment }); } catch (e) { fail(res, e); } };
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
exports.deletePayment = async (req, res) => { try { const payment = await Payment.findByIdAndDelete(req.params.id); if (payment) await Invoice.findByIdAndUpdate(payment.invoice, { $inc: { amountPaid: -payment.amount } }); res.json({ success: true }); } catch (e) { fail(res, e); } };
exports.refundPayment = async (req, res) => { try { const payment = await Payment.findByIdAndUpdate(req.params.id, { status: 'refunded' }, { new: true }); if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' }); await Invoice.findByIdAndUpdate(payment.invoice, { $inc: { amountPaid: -payment.amount, balanceDue: payment.amount }, status: 'partially-paid' }); res.json({ success: true, data: payment }); } catch (e) { fail(res, e); } };