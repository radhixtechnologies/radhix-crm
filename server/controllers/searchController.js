const Lead = require('../models/Lead');
const Contact = require('../models/Contact');
const Deal = require('../models/Deal');
const Employee = require('../models/Employee');
const Project = require('../models/Project');

exports.globalSearch = async (req, res) => {
  try {
    const search = String(req.query.q || req.query.search || req.query.query || '').trim();
    if (!search) return res.json({ success: true, data: { leads: [], contacts: [], deals: [], employees: [], projects: [] } });
    const regex = { $regex: search, $options: 'i' };
    const [leads, contacts, deals, employees, projects] = await Promise.all([
      Lead.find({ $or: [{ name: regex }, { email: regex }, { company: regex }] }).select('name email company status').limit(8).lean(),
      Contact.find({ $or: [{ firstName: regex }, { lastName: regex }, { email: regex }, { company: regex }] }).select('firstName lastName email company').limit(8).lean(),
      Deal.find({ $or: [{ name: regex }, { title: regex }, { company: regex }] }).select('name title value stage').limit(8).lean(),
      Employee.find({ $or: [{ firstName: regex }, { lastName: regex }, { employeeId: regex }, { department: regex }, { designation: regex }] })
        .populate('user', 'name email')
        .select('firstName lastName employeeId department designation user')
        .limit(8)
        .lean(),
      Project.find({ $or: [{ name: regex }, { code: regex }] }).select('name code status priority').limit(8).lean(),
    ]);
    res.json({ success: true, data: { leads, contacts, deals, employees, projects } });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
};