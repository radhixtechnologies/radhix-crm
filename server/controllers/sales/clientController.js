const Client = require('../../models/Client');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const buildQuery = (req) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const query = {};
  if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { company: { $regex: search, $options: 'i' } }];
  if (status) query.status = status;
  return { query, page: Math.max(1, Number(page)), limit: Math.min(100, Math.max(1, Number(limit))) };
};
exports.getClients = async (req, res) => { try { const { query, page, limit } = buildQuery(req); const [data, total] = await Promise.all([Client.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(), Client.countDocuments(query)]); res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) }); } catch (e) { sendError(res, e); } };
exports.getClient = async (req, res) => { try { const data = await Client.findById(req.params.id).populate('linkedDeals'); if (!data) return res.status(404).json({ success: false, message: 'Client not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.createClient = async (req, res) => { try { const data = await Client.create(req.body); res.status(201).json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.updateClient = async (req, res) => { try { const data = await Client.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Client not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.deleteClient = async (req, res) => { try { const data = await Client.findById(req.params.id); if (!data) return res.status(404).json({ success: false, message: 'Client not found' }); await data.deleteOne(); res.json({ success: true, message: 'Client deleted' }); } catch (e) { sendError(res, e); } };
exports.addContact = async (req, res) => { try { const data = await Client.findByIdAndUpdate(req.params.id, { $push: { contacts: req.body }, updatedAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Client not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
exports.addNote = async (req, res) => { try { const data = await Client.findByIdAndUpdate(req.params.id, { $push: { notes: { content: req.body.content, addedBy: req.user._id } }, updatedAt: new Date() }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Client not found' }); res.json({ success: true, data }); } catch (e) { sendError(res, e); } };
