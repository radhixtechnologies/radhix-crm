const Lead = require('../../models/Lead');
const Client = require('../../models/Client');
const Deal = require('../../models/Deal');
const Contact = require('../../models/Contact');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const listQuery = (req) => {
  const { page = 1, limit = 50, search, status, source, campaign, owner, myLeads } = req.query;
  const query = { isDeleted: { $ne: true } };
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }];
  if (status) query.status = status;
  if (source) query.source = source;
  if (campaign) query.campaign = campaign;
  if (owner && owner !== 'all') query.assignedTo = owner;
  if (myLeads === 'true') query.assignedTo = req.user._id;
  return { query, page: Math.max(1, Number(page)), limit: Math.min(100, Math.max(1, Number(limit))) };
};

exports.getLeads = async (req, res) => { try { const { query, page, limit } = listQuery(req); const [data, total] = await Promise.all([Lead.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).populate('assignedTo', 'name email').lean(), Lead.countDocuments(query)]); res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) }); } catch (e) { sendError(res, e); } };
exports.getLead = async (req, res) => { try { const data = await Lead.findById(req.params.id).populate('assignedTo', 'name email').populate('campaign', 'name'); if (!data) return res.status(404).json({ success: false, message: 'Lead not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.createLead = async (req, res) => { try { const data = await Lead.create(req.body); res.status(201).json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.updateLead = async (req, res) => { try { const data = await Lead.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Lead not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.deleteLead = async (req, res) => { try { const data = await Lead.findByIdAndUpdate(req.params.id, { isDeleted: true, updatedAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Lead not found' }); res.json({ success: true, message: 'Lead deleted' }); } catch (e) { sendError(res, e); } };
exports.assignLead = async (req, res) => exports.updateLead({ ...req, body: { assignedTo: req.body.employeeId || req.body.assignedTo } }, res);
exports.changeStatus = async (req, res) => exports.updateLead({ ...req, body: { status: req.body.status } }, res);
exports.addNote = async (req, res) => { try { const data = await Lead.findByIdAndUpdate(req.params.id, { $push: { notes: { content: req.body.content, addedBy: req.user._id } }, updatedAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Lead not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.addCommunication = async (req, res) => { try { const data = await Lead.findByIdAndUpdate(req.params.id, { $push: { communicationHistory: { ...req.body, date: req.body.date || new Date(), addedBy: req.user._id } }, updatedAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Lead not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.convertLead = async (req, res) => { try { const lead = await Lead.findById(req.params.id); if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' }); const client = await Client.create({ name: lead.name, email: lead.email, phone: lead.phone, company: lead.company, status: 'prospect' }); const deal = await Deal.create({ title: req.body.title || `${lead.name} Deal`, name: lead.name, leadId: lead._id, client: client._id, contactName: lead.name, email: lead.email, phone: lead.phone, company: lead.company, value: lead.value || 0 }); lead.convertedToClient = client._id; lead.status = 'converted'; lead.conversionDate = new Date(); await lead.save(); res.status(201).json({ success: true, data: { lead, client, deal } }); } catch (e) { sendError(res, e); } };
