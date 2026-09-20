const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const { ensureEmployeeForUser } = require('../utils/employeeHelper');

exports.getMyProfile = async (req, res) => {
  const employee = await ensureEmployeeForUser(req.user);
  const populatedEmployee = employee && await employee.populate([
    { path: 'user', select: 'name email avatar role' },
    { path: 'manager', select: 'employeeId user' },
  ]);

  if (!populatedEmployee) {
    return res.status(404).json({ success: false, message: 'Employee record not found' });
  }

  res.json({ success: true, data: populatedEmployee });
};

exports.getEmployeeProfile = async (req, res) => {
  const employeeId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return res.status(404).json({ success: false, message: 'Employee record not found' });
  }

  const employee = await Employee.findOne({ _id: employeeId, deletedAt: null })
    .populate('user', 'name email avatar role')
    .populate('manager', 'employeeId user');

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee record not found' });
  }

  res.json({ success: true, data: employee });
};
