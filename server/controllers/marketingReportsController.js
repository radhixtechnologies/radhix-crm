const Campaign = require('../models/Campaign');
const Email = require('../models/Email');
const Lead = require('../models/Lead');

exports.getMarketingOverview = async (req, res) => { try { const [campaigns, emails, leads] = await Promise.all([Campaign.countDocuments(), Email.countDocuments(), Lead.countDocuments()]); res.json({ success: true, data: { campaigns, emails, leads } }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getCampaignPerformanceReport = async (req, res) => { try { res.json({ success: true, data: await Campaign.find({}, 'name status metrics roi budget actualSpend') }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getEmailAnalyticsReport = async (req, res) => { try { res.json({ success: true, data: await Email.find({}, 'subject status metrics openRate clickRate bounceRate') }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getLeadSourceAnalysis = async (req, res) => { try { res.json({ success: true, data: await Lead.aggregate([{ $group: { _id: '$source', count: { $sum: 1 } } }]) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.getConversionFunnel = async (req, res) => { try { res.json({ success: true, data: await Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]) }); } catch (e) { res.status(500).json({ success: false, message: e.message }); } };
exports.exportMarketingReport = async (req, res) => res.json({ success: true, data: { format: req.body.format || 'json', message: 'Report export is ready' } });