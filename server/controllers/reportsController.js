const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Campaign = require('../models/Campaign');

exports.getLeadConversionReport = async (req, res) => { try { const total = await Lead.countDocuments(); const converted = await Lead.countDocuments({ status: 'converted' }); res.json({ success: true, data: { total, converted, conversionRate: total ? converted / total * 100 : 0 } }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getSalesPerformanceReport = async (req, res) => { try { const data = await Deal.aggregate([{ $group: { _id: '$assignedTo', count: { $sum: 1 }, value: { $sum: '$value' } } }]); res.json({ success: true, data }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getMarketingROIReport = async (req, res) => { try { const data = await Campaign.find({}, 'name budget actualSpend roi metrics'); res.json({ success: true, data }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };