const unavailable = (message) => async (req, res) => res.status(501).json({ success: false, message });
exports.getTaxes = unavailable('Tax settings are not configured');
exports.getTax = unavailable('Tax settings are not configured');
exports.createTax = unavailable('Tax settings are not configured');
exports.updateTax = unavailable('Tax settings are not configured');
exports.deleteTax = unavailable('Tax settings are not configured');