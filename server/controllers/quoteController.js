const unavailable = (message) => async (req, res) => res.status(501).json({ success: false, message });
exports.getAllQuotes = unavailable('Quotes are not configured');
exports.getQuoteById = unavailable('Quotes are not configured');
exports.createQuote = unavailable('Quotes are not configured');
exports.updateQuote = unavailable('Quotes are not configured');
exports.deleteQuote = unavailable('Quotes are not configured');
exports.sendQuote = unavailable('Quotes are not configured');
exports.acceptQuote = unavailable('Quotes are not configured');
exports.convertToInvoice = unavailable('Quotes are not configured');