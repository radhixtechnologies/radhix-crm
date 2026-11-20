const mongoose = require('mongoose');
const MenuItem = require('../models/RestaurantMenuItem');
const Table = require('../models/RestaurantTable');
const Customer = require('../models/RestaurantCustomer');
const Ingredient = require('../models/RestaurantIngredient');
const Reservation = require('../models/RestaurantReservation');
const Order = require('../models/RestaurantOrder');
const { applyTenantScope, getTenantCompanyId } = require('../utils/tenantHelper');

const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const sendError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0];
    const labels = { phone: 'A customer with this phone number already exists.', name: 'A table with this name already exists.', orderNumber: 'That order number is already in use.' };
    return res.status(409).json({ success: false, message: labels[field] || 'This record conflicts with an existing record.' });
  }
  if ((error.statusCode || 500) >= 500) console.error('[Restaurant] Request failed:', error);
  const status = error.statusCode || (error.name === 'ValidationError' ? 400 : 500);
  return res.status(status).json({ success: false, message: error.message || 'Restaurant request failed.' });
};
const validId = (id, label) => {
  if (!mongoose.isValidObjectId(id)) throw fail(`Invalid ${label}.`);
};
const safeSearch = (value) => typeof value === 'string' && value.trim()
  ? value.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  : '';
const parseDate = (value, label, required = false) => {
  if (value === '' || value === null || value === undefined) {
    if (required) throw fail(`${label} is required.`);
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail(`${label} must be a valid date.`);
  return date;
};
const normalizeOrderItems = async (items) => {
  if (!Array.isArray(items) || items.length < 1 || items.length > 50) throw fail('Add between 1 and 50 menu items to the order.');
  const lines = await Promise.all(items.map(async (line) => {
    validId(line.menuItem, 'menu item ID');
    const menuItem = await MenuItem.findOne({ _id: line.menuItem, available: true }).select('name price');
    if (!menuItem) throw fail('A selected menu item is unavailable.');
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw fail('Order quantities must be between 1 and 1000.');
    return { menuItem: menuItem._id, name: menuItem.name, quantity, unitPrice: menuItem.price };
  }));
  return lines;
};
const orderTotal = (items) => items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
const populateOrder = (query) => query
  .populate('customer', 'name phone loyaltyPoints')
  .populate('table', 'name area capacity');
const populateReservation = (query) => query
  .populate('customer', 'name phone')
  .populate('table', 'name area capacity');
const tableWindow = (date) => ({
  $gte: new Date(date.getTime() - 90 * 60 * 1000),
  $lte: new Date(date.getTime() + 90 * 60 * 1000),
});

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const menuScope = await applyTenantScope({ available: true }, req.user);
    const resScope = await applyTenantScope({ reservationAt: { $gte: start, $lt: end }, status: { $in: ['booked', 'seated'] } }, req.user);
    const ordScope = await applyTenantScope({ status: { $in: ['placed', 'preparing', 'ready'] } }, req.user);
    const tblScope = await applyTenantScope({ status: 'available' }, req.user);
    const custScope = await applyTenantScope({}, req.user);
    const [menuItems, reservationsToday, activeOrders, availableTables, lowStock, customers, todayOrders, recentOrders] = await Promise.all([
      MenuItem.countDocuments(menuScope),
      Reservation.countDocuments(resScope),
      Order.countDocuments(ordScope),
      Table.countDocuments(tblScope),
      Ingredient.countDocuments({ status: 'active', $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
      Customer.countDocuments(custScope),
      Order.aggregate([{ $match: { createdAt: { $gte: start, $lt: end }, status: { $ne: 'cancelled' } } }, { $group: { _id: null, sales: { $sum: '$totalAmount' }, count: { $sum: 1 } } }]),
      populateOrder(Order.find({ status: { $in: ['placed', 'preparing', 'ready'] } }).sort({ createdAt: 1 }).limit(6)).lean(),
    ]);
    res.json({
      success: true,
      data: {
        menuItems, reservationsToday, activeOrders, availableTables, lowStock, customers,
        salesToday: todayOrders[0]?.sales || 0, orderCountToday: todayOrders[0]?.count || 0,
        recentOrders,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getMenu = async (req, res) => {
  try {
    let query = {};
    if (req.query.available === 'true') query.available = true;
    if (req.query.available === 'false') query.available = false;
    if (req.query.category) query.category = req.query.category;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [{ name: { $regex: term, $options: 'i' } }, { category: { $regex: term, $options: 'i' } }];
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await MenuItem.find(query).sort({ category: 1, name: 1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const { name, category, price } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof category !== 'string' || !category.trim()) throw fail('Menu item name and category are required.');
    const rstCompanyId = await getTenantCompanyId(req.user);
    const item = await MenuItem.create({
      company: rstCompanyId || null, ...req.body, name: name.trim(), category: category.trim(), price: Number(price), createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    validId(req.params.id, 'menu item ID');
    const allowed = ['name', 'category', 'description', 'price', 'preparationMinutes', 'dietary', 'available'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && !String(updates.name).trim()) throw fail('Menu item name is required.');
    if (updates.category !== undefined && !String(updates.category).trim()) throw fail('Menu category is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.category) updates.category = updates.category.trim();
    const item = await MenuItem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!item) throw fail('Menu item not found.', 404);
    res.json({ success: true, data: item });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    validId(req.params.id, 'menu item ID');
    const item = await MenuItem.findByIdAndUpdate(req.params.id, { available: false }, { new: true });
    if (!item) throw fail('Menu item not found.', 404);
    res.json({ success: true, data: item });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getTables = async (req, res) => {
  try {
    const query = {};
    if (['available', 'occupied', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Table.find(query).sort({ name: 1 }).limit(200).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createTable = async (req, res) => {
  try {
    const { name, capacity } = req.body;
    if (typeof name !== 'string' || !name.trim()) throw fail('Table name is required.');
    const tblCompanyId = await getTenantCompanyId(req.user);
    const table = await Table.create({
      company: tblCompanyId || null, ...req.body, name: name.trim(), capacity: Number(capacity), createdBy: req.user._id });
    res.status(201).json({ success: true, data: table });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateTable = async (req, res) => {
  try {
    validId(req.params.id, 'table ID');
    const updates = Object.fromEntries(['name', 'capacity', 'area', 'status']
      .filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    const table = await Table.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!table) throw fail('Table not found.', 404);
    res.json({ success: true, data: table });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const term = safeSearch(req.query.search);
    const query = term ? { $or: [{ name: { $regex: term, $options: 'i' } }, { phone: { $regex: term, $options: 'i' } }] } : {};
    query = await applyTenantScope(query, req.user);
    res.json({ success: true, data: await Customer.find(query).sort({ loyaltyPoints: -1, updatedAt: -1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof phone !== 'string' || !phone.trim()) throw fail('Customer name and phone number are required.');
    const cstCompanyId = await getTenantCompanyId(req.user);
    const customer = await Customer.create({
      company: cstCompanyId || null, ...req.body, name: name.trim(), phone: phone.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    validId(req.params.id, 'customer ID');
    const allowed = ['name', 'phone', 'email', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && !String(updates.name).trim()) throw fail('Customer name is required.');
    if (updates.phone !== undefined && !String(updates.phone).trim()) throw fail('Customer phone is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.phone) updates.phone = updates.phone.trim();
    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!customer) throw fail('Customer not found.', 404);
    res.json({ success: true, data: customer });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getReservations = async (req, res) => {
  try {
    const query = {};
    if (['booked', 'seated', 'completed', 'cancelled', 'no_show'].includes(req.query.status)) query.status = req.query.status;
    if (req.query.from || req.query.to) {
      query.reservationAt = {};
      if (req.query.from) query.reservationAt.$gte = parseDate(req.query.from, 'Start date', true);
      if (req.query.to) {
        const to = parseDate(req.query.to, 'End date', true);
        to.setHours(23, 59, 59, 999);
        query.reservationAt.$lte = to;
      }
    }
    query = await applyTenantScope(query, req.user);
    const reservations = await populateReservation(Reservation.find(query).sort({ reservationAt: 1 }).limit(500)).lean();
    res.json({ success: true, data: reservations });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createReservation = async (req, res) => {
  try {
    const { customer, guestName, phone, table, partySize, reservationAt, notes } = req.body;
    if (typeof guestName !== 'string' || !guestName.trim() || typeof phone !== 'string' || !phone.trim()) throw fail('Guest name and phone number are required.');
    const date = parseDate(reservationAt, 'Reservation time', true);
    const size = Number(partySize);
    if (!Number.isInteger(size) || size < 1 || size > 50) throw fail('Party size must be between 1 and 50.');
    if (date < new Date(Date.now() - 5 * 60 * 1000)) throw fail('Reservation time must be in the future.');
    if (customer) validId(customer, 'customer ID');
    if (table) {
      validId(table, 'table ID');
      const tableRecord = await Table.findOne({ _id: table, status: { $ne: 'inactive' } });
      if (!tableRecord) throw fail('Selected table is inactive or does not exist.');
      if (tableRecord.capacity < size) throw fail('Selected table capacity is smaller than the party size.');
      const conflict = await Reservation.exists({
        table, status: { $in: ['booked', 'seated'] }, reservationAt: tableWindow(date),
      });
      if (conflict) throw fail('This table already has a reservation near the selected time.', 409);
    }
    const rsvCompanyId = await getTenantCompanyId(req.user);
    const reservation = await Reservation.create({
      company: rsvCompanyId || null,
      customer: customer || null, guestName: guestName.trim(), phone: phone.trim(), table: table || null,
      partySize: size, reservationAt: date, notes, createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateReservation(Reservation.findById(reservation._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateReservation = async (req, res) => {
  try {
    validId(req.params.id, 'reservation ID');
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) throw fail('Reservation not found.', 404);
    const allowed = ['customer', 'guestName', 'phone', 'table', 'partySize', 'reservationAt', 'status', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.reservationAt !== undefined) updates.reservationAt = parseDate(updates.reservationAt, 'Reservation time', true);
    const tableId = updates.table || reservation.table;
    const date = updates.reservationAt || reservation.reservationAt;
    const size = updates.partySize !== undefined ? Number(updates.partySize) : reservation.partySize;
    if (updates.partySize !== undefined && (!Number.isInteger(size) || size < 1 || size > 50)) throw fail('Party size must be between 1 and 50.');
    if (updates.table || updates.reservationAt || updates.partySize !== undefined) {
      if (tableId) {
        const table = await Table.findOne({ _id: tableId, status: { $ne: 'inactive' } });
        if (!table) throw fail('Selected table is inactive or does not exist.');
        if (table.capacity < size) throw fail('Selected table capacity is smaller than the party size.');
        const conflict = await Reservation.exists({
          _id: { $ne: reservation._id }, table: tableId, status: { $in: ['booked', 'seated'] }, reservationAt: tableWindow(date),
        });
        if (conflict) throw fail('This table already has a reservation near the selected time.', 409);
      }
    }
    if (updates.customer) validId(updates.customer, 'customer ID');
    const updated = await Reservation.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (updated.table && updates.status === 'seated') {
      await Table.updateOne({ _id: updated.table, status: { $ne: 'inactive' } }, { status: 'occupied' });
    } else if (updated.table && ['completed', 'cancelled', 'no_show'].includes(updates.status)) {
      const [anotherSeatedReservation, anotherOpenOrder] = await Promise.all([
        Reservation.exists({ _id: { $ne: updated._id }, table: updated.table, status: 'seated' }),
        Order.exists({ table: updated.table, status: { $in: ['placed', 'preparing', 'ready', 'served'] } }),
      ]);
      if (!anotherSeatedReservation && !anotherOpenOrder) {
        await Table.updateOne({ _id: updated.table, status: 'occupied' }, { status: 'available' });
      }
    }
    res.json({ success: true, data: await populateReservation(Reservation.findById(updated._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getOrders = async (req, res) => {
  try {
    const query = {};
    if (['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'].includes(req.query.status)) query.status = req.query.status;
    if (['dine_in', 'takeaway', 'delivery'].includes(req.query.orderType)) query.orderType = req.query.orderType;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [{ orderNumber: { $regex: term, $options: 'i' } }, { guestName: { $regex: term, $options: 'i' } }];
    query = await applyTenantScope(query, req.user);
    const orders = await populateOrder(Order.find(query).sort({ createdAt: -1 }).limit(500)).lean();
    res.json({ success: true, data: orders });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { orderNumber, customer, guestName, orderType, table, items, notes } = req.body;
    if (!['dine_in', 'takeaway', 'delivery'].includes(orderType)) throw fail('Select dine-in, takeaway, or delivery.');
    if (orderType === 'dine_in' && !table) throw fail('Select a table for a dine-in order.');
    if (orderType !== 'dine_in' && table) throw fail('Tables can only be assigned to dine-in orders.');
    if (customer) validId(customer, 'customer ID');
    if (!customer && !String(guestName || '').trim()) throw fail('Enter a guest name or select a loyalty customer.');
    let tableRecord = null;
    if (table) {
      validId(table, 'table ID');
      tableRecord = await Table.findOne({ _id: table, status: 'available' });
      if (!tableRecord) throw fail('Selected table is unavailable.');
    }
    const lines = await normalizeOrderItems(items);
    const total = orderTotal(lines);
    const ordCompanyId = await getTenantCompanyId(req.user);
    const order = await Order.create({
      company: ordCompanyId || null,
      orderNumber: orderNumber?.trim() || undefined, customer: customer || null, guestName: String(guestName || '').trim(),
      orderType, table: table || null, items: lines, subtotal: total, totalAmount: total, notes, createdBy: req.user._id,
    });
    if (tableRecord) await Table.updateOne({ _id: tableRecord._id, status: 'available' }, { status: 'occupied' });
    res.status(201).json({ success: true, data: await populateOrder(Order.findById(order._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateOrder = async (req, res) => {
  try {
    validId(req.params.id, 'order ID');
    const order = await Order.findById(req.params.id);
    if (!order) throw fail('Order not found.', 404);
    const allowed = ['status', 'paymentStatus', 'notes'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.status === 'cancelled' && ['completed', 'cancelled'].includes(order.status)) throw fail('A completed or cancelled order cannot be cancelled again.');
    if (updates.status && order.status === 'completed' && updates.status !== 'completed') throw fail('Completed orders cannot be moved back to an earlier stage.');
    if (updates.status === 'completed' && order.customer && !order.loyaltyAwarded) {
      const claimedOrder = await Order.findOneAndUpdate(
        { _id: order._id, status: { $ne: 'completed' }, loyaltyAwarded: false },
        { $set: { status: 'completed', loyaltyAwarded: true } },
        { new: true },
      );
      if (claimedOrder) {
        try {
          const result = await Customer.updateOne(
            { _id: claimedOrder.customer },
            { $inc: { loyaltyPoints: Math.floor(claimedOrder.totalAmount / 100), lifetimeSpend: claimedOrder.totalAmount, visitCount: 1 } },
          );
          if (!result.matchedCount) throw fail('Linked loyalty customer no longer exists.', 409);
        } catch (error) {
          await Order.updateOne(
            { _id: claimedOrder._id, loyaltyAwarded: true },
            { $set: { status: order.status, loyaltyAwarded: false } },
          );
          throw error;
        }
      }
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (updated.table && ['completed', 'cancelled'].includes(updated.status)) {
      const [anotherOpenOrder, anotherSeatedReservation] = await Promise.all([
        Order.exists({
          _id: { $ne: updated._id }, table: updated.table,
          status: { $in: ['placed', 'preparing', 'ready', 'served'] },
        }),
        Reservation.exists({ table: updated.table, status: 'seated' }),
      ]);
      if (!anotherOpenOrder && !anotherSeatedReservation) {
        await Table.updateOne({ _id: updated.table, status: 'occupied' }, { status: 'available' });
      }
    }
    res.json({ success: true, data: await populateOrder(Order.findById(updated._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getIngredients = async (req, res) => {
  try {
    const query = {};
    if (['active', 'inactive'].includes(req.query.status)) query.status = req.query.status;
    const term = safeSearch(req.query.search);
    if (term) query.$or = [{ name: { $regex: term, $options: 'i' } }, { supplier: { $regex: term, $options: 'i' } }];
    if (req.query.lowStock === 'true') query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    res.json({ success: true, data: await Ingredient.find(query).sort({ name: 1 }).limit(500).lean() });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createIngredient = async (req, res) => {
  try {
    const { name, unit } = req.body;
    if (typeof name !== 'string' || !name.trim() || typeof unit !== 'string' || !unit.trim()) throw fail('Ingredient name and unit are required.');
    const ingredient = await Ingredient.create({ ...req.body, name: name.trim(), unit: unit.trim(), createdBy: req.user._id });
    res.status(201).json({ success: true, data: ingredient });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateIngredient = async (req, res) => {
  try {
    validId(req.params.id, 'ingredient ID');
    const allowed = ['name', 'unit', 'quantity', 'reorderLevel', 'unitCost', 'supplier', 'status'];
    const updates = Object.fromEntries(allowed.filter((key) => Object.hasOwn(req.body, key)).map((key) => [key, req.body[key]]));
    if (updates.name !== undefined && !String(updates.name).trim()) throw fail('Ingredient name is required.');
    if (updates.unit !== undefined && !String(updates.unit).trim()) throw fail('Ingredient unit is required.');
    if (updates.name) updates.name = updates.name.trim();
    if (updates.unit) updates.unit = updates.unit.trim();
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!ingredient) throw fail('Ingredient not found.', 404);
    res.json({ success: true, data: ingredient });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteIngredient = async (req, res) => {
  try {
    validId(req.params.id, 'ingredient ID');
    const ingredient = await Ingredient.findByIdAndUpdate(req.params.id, { status: 'inactive' }, { new: true });
    if (!ingredient) throw fail('Ingredient not found.', 404);
    res.json({ success: true, data: ingredient });
  } catch (error) {
    sendError(res, error);
  }
};
