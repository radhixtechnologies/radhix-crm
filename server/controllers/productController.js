const Product = require('../models/Product');

const fail = (res, error) => res.status(500).json({ success: false, message: error.message });
const normalizeProductData = (data) => {
	const normalized = { ...data };
	if (data.price !== undefined) {
		normalized.unitPrice = Number(data.price);
		delete normalized.price;
	} else if (data.unitPrice !== undefined) {
		normalized.unitPrice = Number(data.unitPrice);
	}
	if (data.costPrice !== undefined) normalized.costPrice = Number(data.costPrice);
	if (data.stockQuantity !== undefined) normalized.stockQuantity = Number(data.stockQuantity);
	if (data.minStockLevel !== undefined) normalized.minStockLevel = Number(data.minStockLevel);
	if (data.taxRate !== undefined) normalized.taxRate = Number(data.taxRate);
	return normalized;
};
exports.getProducts = async (req, res) => { try { const query = { isActive: { $ne: false } }; if (req.query.search) query.$or = [{ name: { $regex: req.query.search, $options: 'i' } }, { sku: { $regex: req.query.search, $options: 'i' } }]; res.json({ success: true, data: await Product.find(query).sort({ createdAt: -1 }) }); } catch (e) { fail(res, e); } };
exports.getProduct = async (req, res) => { try { const data = await Product.findById(req.params.id); if (!data) return res.status(404).json({ success: false, message: 'Product not found' }); res.json({ success: true, data }); } catch (e) { fail(res, e); } };
exports.createProduct = async (req, res) => { try { res.status(201).json({ success: true, data: await Product.create({ ...normalizeProductData(req.body), createdBy: req.user._id }) }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.updateProduct = async (req, res) => { try { const data = await Product.findByIdAndUpdate(req.params.id, normalizeProductData(req.body), { new: true, runValidators: true }); if (!data) return res.status(404).json({ success: false, message: 'Product not found' }); res.json({ success: true, data }); } catch (e) { res.status(400).json({ success: false, message: e.message }); } };
exports.deleteProduct = async (req, res) => { try { const data = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Product not found' }); res.json({ success: true, data }); } catch (e) { fail(res, e); } };
exports.stockIn = async (req, res) => { try { const quantity = Number(req.body.quantity); if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number' }); const data = await Product.findOneAndUpdate({ _id: req.params.id, isActive: { $ne: false } }, { $inc: { stockQuantity: quantity } }, { new: true }); if (!data) return res.status(404).json({ success: false, message: 'Product not found' }); res.json({ success: true, message: 'Stock added successfully', data }); } catch (e) { fail(res, e); } };
exports.stockOut = async (req, res) => { try { const quantity = Number(req.body.quantity); if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number' }); const data = await Product.findOneAndUpdate({ _id: req.params.id, isActive: { $ne: false }, stockQuantity: { $gte: quantity } }, { $inc: { stockQuantity: -quantity } }, { new: true }); if (!data) return res.status(400).json({ success: false, message: 'Insufficient stock or invalid product' }); res.json({ success: true, message: 'Stock removed successfully', data }); } catch (e) { fail(res, e); } };