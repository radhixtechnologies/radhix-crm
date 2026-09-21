const Tax = require('../../models/Tax');
const fail = (res, e) => res.status(500).json({ success: false, message: e.message });
exports.getTaxes = async (req, res) => { try { res.json({ success: true, data: await Tax.find({ isActive: true }).sort({ name: 1 }) }); } catch (e) { fail(res, e); } };
exports.getTax = async (req, res) => { try { res.json({ success: true, data: await Tax.findById(req.params.id) }); } catch (e) { fail(res, e); } };
exports.createTax = async (req, res) => { try { res.status(201).json({ success: true, data: await Tax.create({ ...req.body, createdBy: req.user._id }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateTax = async (req, res) => { try { res.json({ success: true, data: await Tax.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.deleteTax = async (req, res) => { try { res.json({ success: true, data: await Tax.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }) }); } catch (e) { fail(res, e); } };