const mongoose = require('mongoose');
const Product = require('../models/ManufacturingProduct');
const Supplier = require('../models/ManufacturingSupplier');
const Order = require('../models/ManufacturingOrder');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const labels = { sku: 'SKU', orderNumber: 'Order number' };
    return res.status(409).json({ success: false, message: `${labels[field] || 'This value'} is already in use.` });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Manufacturing] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Manufacturing request failed.' });
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
};
const safeSearch = (value) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  : '';
const dateOrNull = (value, label) => {
  if (value === '' || value === null || value === undefined) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail(`${label} must be a valid date.`);
  return date;
};
const normalizeItems = async (items) => {
  if (!Array.isArray(items) || !items.length || items.length > 100) throw fail('Add between 1 and 100 order items.');
  return Promise.all(items.map(async (item) => {
    if (!item.product || !mongoose.isValidObjectId(item.product)) throw fail('Select a valid catalog product for every order line.');
    const product = await Product.findOne({ _id: item.product, status: 'active' }).select('name sku unit costPrice salePrice');
    if (!product) throw fail('An order product is inactive or does not exist.');
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (!Number.isInteger(quantity) || quantity < 1) throw fail('Order quantities must be positive whole numbers.');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) throw fail('Order item prices must be valid non-negative amounts.');
    return { product: product._id, productName: product.name, sku: product.sku, quantity, unitPrice };
  }));
};
const computeTotal = (items) => items.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
const paymentStatus = (total, paid) => paid === 0 ? 'unpaid' : paid >= total ? 'paid' : 'partial';

exports.getSummary = async (req, res) => {
  try {
    const prodScope = await applyTenantScope({ status: 'active' }, req.user);
    const supScope = await applyTenantScope({ status: 'active' }, req.user);
    const ordScope = await applyTenantScope({ status: { $in: ['placed', 'processing', 'shipped'] } }, req.user);
    const [products, suppliers, openOrders, sales, purchases, lowStockProducts, recentOrders] = await Promise.all([
      Product.countDocuments(prodScope),
      Supplier.countDocuments(supScope),
      Order.countDocuments(ordScope),
      Order.aggregate([{ $match: { type: 'sales', status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Order.aggregate([{ $match: { type: 'purchase', status: { $ne: 'cancelled' } } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      Product.countDocuments({ status: 'active', $expr: { $lte: ['$stockQuantity', '$reorderLevel'] } }),
      Order.find({ status: { $nin: ['delivered', 'cancelled'] } }).sort({ updatedAt: -1 }).limit(6).lean(),
    ]);
    res.json({
      success: true,
      data: {
        products, suppliers, openOrders, lowStockProducts,
        salesValue: sales[0]?.total || 0,
        purchaseValue: purchases[0]?.total || 0,
        recentOrders,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProducts = async (req, res) => {
  try {
    let query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [{ name: { $regex: term, $options: 'i' } }, { sku: { $regex: term, $options: 'i' } }, { category: { $regex: term, $options: 'i' } }];
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
    const mfgCompanyId = await getTenantCompanyId(req.user);
    const product = await Product.create({
      company: mfgCompanyId || null, ...req.body, name: name.trim(), sku: sku.trim().toUpperCase(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProduct = async (req, res) => {
  try {
    validId(req.params.id, 'product ID');
    const allowed = ['name', 'sku', 'category', 'description', 'unit', 'stockQuantity', 'reorderLevel', 'costPrice', 'salePrice', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    for (const field of ['name', 'sku']) {
      if (updates[field] !== undefined && (typeof updates[field] !== 'string' || !updates[field].trim())) throw fail(`${field === 'name' ? 'Product name' : 'SKU'} is required.`);
    }
    if (updates.name) updates.name = updates.name.trim();
    if (updates.sku) updates.sku = updates.sku.trim().toUpperCase();
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) throw fail('Product not found.', 404);
    res.json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};

exports.adjustStock = async (req, res) => {
  try {
    validId(req.params.id, 'product ID');
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) throw fail('Stock adjustment must be a positive whole number.');
    const direction = req.body.direction;
    if (!['in', 'out'].includes(direction)) throw fail('Stock adjustment direction must be in or out.');
    const filter = { _id: req.params.id, status: 'active' };
    if (direction === 'out') filter.stockQuantity = { $gte: quantity };
    const increment = direction === 'in' ? quantity : -quantity;
    const product = await Product.findOneAndUpdate(filter, { $inc: { stockQuantity: increment } }, { new: true, runValidators: true });
    if (!product) throw fail(direction === 'out' ? 'Insufficient stock or product is inactive.' : 'Product is inactive or does not exist.', direction === 'out' ? 409 : 404);
    res.json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    validId(req.params.id, 'product ID');
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!product) throw fail('Product not found.', 404);
    res.json({ success: true, data: product });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [{ name: { $regex: term, $options: 'i' } }, { company: { $regex: term, $options: 'i' } }, { phone: { $regex: term, $options: 'i' } }];
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Supplier.find(query).sort({ name: 1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) throw fail('Supplier contact name and phone are required.');
    const supCompanyId = await getTenantCompanyId(req.user);
    const supplier = await Supplier.create({
      company: supCompanyId || null, ...req.body, name: name.trim(), phone: phone.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    validId(req.params.id, 'supplier ID');
    const allowed = ['name', 'company', 'category', 'phone', 'email', 'address', 'notes', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim())) throw fail('Supplier contact name is required.');
    if (updates.phone !== undefined && (typeof updates.phone !== 'string' || !updates.phone.trim())) throw fail('Supplier phone is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!supplier) throw fail('Supplier not found.', 404);
    res.json({ success: true, data: supplier });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    validId(req.params.id, 'supplier ID');
    const used = await Order.exists({ type: 'purchase', supplier: req.params.id });
    if (used) throw fail('This supplier has purchase order history. Mark it inactive instead.', 409);
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) throw fail('Supplier not found.', 404);
    res.json({ success: true, message: 'Supplier deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const query = {};
    if (['sales', 'purchase'].includes(req.query.type)) query.type = req.query.type;
    if (['draft', 'placed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [{ orderNumber: { $regex: term, $options: 'i' } }, { partnerName: { $regex: term, $options: 'i' } }];
    res.json({ success: true, data: await Order.find(query).populate('supplier', 'name company phone').sort({ updatedAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { type, partnerName, partnerPhone, partnerEmail, supplier, status, expectedDate, items, amountPaid, notes, orderNumber } = req.body;
    if (!['sales', 'purchase'].includes(type)) throw fail('Order type must be sales or purchase.');
    if (typeof partnerName !== 'string' || !partnerName.trim()) throw fail('Customer or supplier name is required.');
    if (type === 'purchase') {
      validId(supplier, 'supplier ID');
      if (!await Supplier.exists({ _id: supplier, status: 'active' })) throw fail('Selected supplier is inactive or does not exist.');
    }
    const normalizedItems = await normalizeItems(items);
    const totalAmount = computeTotal(normalizedItems);
    const paid = Number(amountPaid) || 0;
    if (paid < 0 || paid > totalAmount) throw fail('Amount paid must be between zero and the order total.');
    const ordCompanyId = await getTenantCompanyId(req.user);
    const order = await Order.create({
      company: ordCompanyId || null,
      orderNumber: orderNumber?.trim() || undefined, type, partnerName: partnerName.trim(),
      partnerPhone, partnerEmail, supplier: type === 'purchase' ? supplier : null,
      status, expectedDate: dateOrNull(expectedDate, 'Expected delivery date'),
      items: normalizedItems, totalAmount, amountPaid: paid, paymentStatus: paymentStatus(totalAmount, paid),
      notes, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await Order.findById(order._id).populate('supplier', 'name company phone') });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    validId(req.params.id, 'order ID');
    const order = await Order.findById(req.params.id);
    if (!order) throw fail('Order not found.', 404);
    const allowed = ['orderNumber', 'type', 'partnerName', 'partnerPhone', 'partnerEmail', 'supplier', 'status', 'expectedDate', 'items', 'amountPaid', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.type && updates.type !== order.type) throw fail('Order type cannot be changed after creation.');
    if (updates.partnerName !== undefined && (typeof updates.partnerName !== 'string' || !updates.partnerName.trim())) throw fail('Customer or supplier name is required.');
    if (updates.partnerName) updates.partnerName = updates.partnerName.trim();
    const supplierId = updates.supplier || order.supplier;
    if (order.type === 'purchase' && (updates.supplier || updates.supplier === '')) {
      validId(supplierId, 'supplier ID');
      if (!await Supplier.exists({ _id: supplierId, status: 'active' })) throw fail('Selected supplier is inactive or does not exist.');
    }
    if (updates.items) {
      updates.items = await normalizeItems(updates.items);
      updates.totalAmount = computeTotal(updates.items);
    }
    if (updates.expectedDate !== undefined) updates.expectedDate = dateOrNull(updates.expectedDate, 'Expected delivery date');
    const total = updates.totalAmount !== undefined ? updates.totalAmount : order.totalAmount;
    const paid = updates.amountPaid !== undefined ? Number(updates.amountPaid) : order.amountPaid;
    if (!Number.isFinite(paid) || paid < 0 || paid > total) throw fail('Amount paid must be between zero and the order total.');
    updates.paymentStatus = paymentStatus(total, paid);
    updates.amountPaid = paid;
    if (updates.status === 'delivered') updates.deliveredAt = order.deliveredAt || new Date();
    const updated = await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('supplier', 'name company phone');
    res.json({ success: true, data: updated });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    validId(req.params.id, 'order ID');
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) throw fail('Order not found.', 404);
    res.json({ success: true, message: 'Order deleted.' });
  } catch (error) {
    sendError(res, error);
  }
};
