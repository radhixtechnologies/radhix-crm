const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Employee = require('../models/Employee');

exports.globalSearch = async (req, res) => {
  try {
    const search = String(req.query.q || req.query.search || '').trim();
    if (!search) return res.json({ success: true, data: { leads: [], contacts: [], deals: [], employees: [] } });
    const regex = { $regex: search, $options: 'i' };
    const [leads, contacts, deals, employees] = await Promise.all([
      Lead.find({ $or: [{ name: regex }, { email: regex }, { company: regex }] }).limit(10),
      Contact.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { company: regex }] }).limit(10),
      Deal.find({ $or: [{ name: regex }, { title: regex }, { company: regex }] }).limit(10),
      Employee.find({ $or: [{ firstName: regex }, { lastName: regex }, { employeeId: regex }] }).limit(10),
    ]);
    res.json({ success: true, data: { leads, contacts, deals, employees } });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};