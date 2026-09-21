const unavailable = (message) => async (req, res) => res.status(501).json({ success: false, message });
exports.getAllPayments = unavailable('Payments are not configured');
exports.getPaymentById = unavailable('Payments are not configured');
exports.getPaymentsByInvoice = unavailable('Payments are not configured');
exports.createPayment = unavailable('Payments are not configured');
exports.updatePayment = unavailable('Payments are not configured');
exports.deletePayment = unavailable('Payments are not configured');
exports.refundPayment = unavailable('Payments are not configured');