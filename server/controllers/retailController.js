const mongoose = require('mongoose');
const Product = require('../models/RetailProduct');
const Order = require('../models/RetailOrder');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    return res.status(409).json({ success: false, message: field === 'sku' ? 'That SKU is already in use.' : field === 'orderNumber' ? 'That order number is already in use.' : 'This record conflicts with an existing record.' });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Retail] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Retail request failed.' });
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
};
const safeSearch = (value) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  : '';
const normalizeItems = async (items) => {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw fail('Add between 1 and 100 order items.');
  const normalized = await Promise.all(items.map(async (line) => {
    validId(line.product, 'product ID');
    const product = await Product.findOne({ _id: line.product, status: 'active' }).select('name sku salePrice');
    if (!product) throw fail('A selected product is inactive or unavailable.');
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000) throw fail('Product quantities must be positive whole numbers.');
    return { product: product._id, name: product.name, sku: product.sku, quantity, unitPrice: product.salePrice };
  }));
  const combined = new Map();
  for (const line of normalized) {
    const key = String(line.product);
    const existing = combined.get(key);
    if (existing) existing.quantity += line.quantity;
    else combined.set(key, { ...line });
  }
  return [...combined.values()];
};
const releaseOrderStock = async (order) => {
  for (const line of order.items) {
    const result = await Product.updateOne({ _id: line.product }, { $inc: { stockQuantity: line.quantity } });
    if (!result.matchedCount) throw fail(`Could not restock ${line.name}; product no longer exists.`, 409);
  }
};
exports.getSummary = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const prodScope = await applyTenantScope({ status: 'active' }, req.user);
    const ordScope = await applyTenantScope({ status: { $in: ['processing', 'packed', 'shipped'] } }, req.user);
    const [products, lowStock, openOrders, dailySales, recentOrders] = await Promise.all([
      Product.countDocuments(prodScope),
      Product.countDocuments({ status: 'active', $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
      Order.countDocuments(ordScope),
      Order.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end }, status: { $nin: ['cancelled', 'returned'] } } },
        { $group: { _id: null, sales: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      ]),
      Order.find({ status: { $nin: ['delivered', 'cancelled', 'returned'] } }).sort({ createdAt: -1 }).limit(6).lean(),
    ]);
    res.json({ success: true, data: { products, lowStock, openOrders, salesToday: dailySales[0]?.sales || 0, ordersToday: dailySales[0]?.count || 0, recentOrders } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProducts = async (req, res) => {
  try {
    let query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = ['name', 'sku', 'category'].map((field) => ({ [field]: { $regex: term, $options: 'i' } }));
    if (req.query.lowStock === 'true') query.$expr = { $lte: ['$stockQuantity', '$reorderLevel'] };
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Product.find(query).sort({ updatedAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, sku } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof sku !== 'string' || !sku.trim()) throw fail('Product name and SKU are required.');
    const retCompanyId = await getTenantCompanyId(req.user);
    const product = await Product.create({
      company: retCompanyId || null, ...req.body, name: name.trim(), sku: sku.trim().toUpperCase(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    validId(req.params.id, 'product ID');
    const allowed = ['name', 'sku', 'category', 'description', 'stockQuantity', 'reorderLevel', 'costPrice', 'salePrice', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Product name is required.');
    if (updates.sku !== undefined && (typeof updates.sku !== 'string' || !updates.sku.trim())) throw fail('SKU is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.sku) updates.sku = updates.sku.trim().toUpperCase();
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) throw fail('Product not found.', 404);
    res.json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const query = {};
    if (['processing', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = ['orderNumber', 'customerName', 'customerPhone'].map((field) => ({ [field]: { $regex: term, $options: 'i' } }));
    res.json({ success: true, data: await Order.find(query).sort({ createdAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createOrder = async (req, res) => {
  let order = null;
  const deducted = [];
  try {
    if (typeof req.body.customerName !== 'string' || !req.body.customerName.trim()) throw fail('Customer name is required.');
    const items = await normalizeItems(req.body.items);
    const totalAmount = items.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    order = await Order.create({
      ...req.body,
      customerName: req.body.customerName.trim(),
      items,
      totalAmount,
      createdBy: req.user._id,
    });
    for (const line of items) {
      const product = await Product.findOneAndUpdate(
        { _id: line.product, status: 'active', stockQuantity: { $gte: line.quantity } },
        { $inc: { stockQuantity: -line.quantity } },
        { new: true },
      );
      if (!product) throw fail(`Insufficient stock for ${line.name}.`, 409);
      deducted.push(line);
    }
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    for (const line of deducted) await Product.updateOne({ _id: line.product }, { $inc: { stockQuantity: line.quantity } });
    if (order) await Order.deleteOne({ _id: order._id });
    sendError(res, error);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    validId(req.params.id, 'order ID');
    const allowed = ['status', 'paymentStatus', 'paymentMethod', 'shippingAddress', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    const order = await Order.findById(req.params.id);
    if (!order) throw fail('Order not found.', 404);
    if (['cancelled', 'returned'].includes(order.status) && Object.keys(updates).some((key) => key !== 'paymentStatus')) {
      throw fail('Cancelled or returned orders cannot be changed further.', 409);
    }
    if (order.status === 'delivered' && ['processing', 'packed', 'shipped', 'cancelled'].includes(updates.status)) {
      throw fail('A delivered order cannot be moved to an earlier stage or cancelled.');
    }
    const releasing = ['cancelled', 'returned'].includes(updates.status) && !order.stockReleased;
    const updated = releasing
      ? await Order.findOneAndUpdate(
        { _id: order._id, stockReleased: false, status: { $nin: ['cancelled', 'returned'] } },
        { $set: { ...updates, stockReleased: true, ...(updates.status === 'returned' || (updates.status === 'cancelled' && order.paymentStatus === 'paid') ? { paymentStatus: 'refunded' } : {}) } },
        { new: true, runValidators: true },
      )
      : await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!updated) throw fail('Order was updated by another request. Refresh and try again.', 409);
    if (releasing) await releaseOrderStock(order);
    res.json({ success: true, data: updated });
  } catch (error) {
    sendError(res, error);
  }
};

exports.adjustStock = async (req, res) => {
  try {
    validId(req.params.id, 'product ID');
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw fail('Stock adjustment must be a positive whole number.');
    if (!['in', 'out'].includes(req.body.direction)) throw fail('Stock adjustment direction must be in or out.');
    const filter = { _id: req.params.id, status: 'active' };
    if (req.body.direction === 'out') filter.stockQuantity = { $gte: quantity };
    const product = await Product.findOneAndUpdate(
      filter,
      { $inc: { stockQuantity: req.body.direction === 'in' ? quantity : -quantity } },
      { new: true, runValidators: true },
    );
    if (!product) throw fail(req.body.direction === 'out' ? 'Insufficient stock or product inactive.' : 'Product inactive or not found.', 409);
    res.json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};
