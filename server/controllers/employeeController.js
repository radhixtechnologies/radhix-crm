const path = require('path');
const Employee = require('../models/Employee');
const employeeService = require('../services/employeeService');
const { asyncHandler } = require('../utils/asyncHandler');
const leaveController = require('./leaveController');
const taskController = require('./taskController');

const getUser = (req) => req.user;

exports.getEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployees(req.query, req.query, getUser(req));
  res.json(result);
});

exports.getEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.getEmployeeById(req.params.id, {}, getUser(req));
  res.json(result);
});

exports.createEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.createEmployee(req.body, getUser(req));
  res.status(201).json(result);
});

exports.updateEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.updateEmployee(req.params.id, req.body, getUser(req));
  res.json(result);
});

exports.deleteEmployee = asyncHandler(async (req, res) => {
  const result = await employeeService.deleteEmployee(req.params.id, getUser(req));
  res.json(result);
});

exports.addDocument = asyncHandler(async (req, res) => {
  const document = {
    ...req.body,
    url: req.file ? `/uploads/${req.file.filename}` : req.body.url,
  };
  const result = await employeeService.addDocument(req.params.id, document, getUser(req));
  res.json(result);
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  const result = await employeeService.removeDocument(req.params.id, req.params.docId, getUser(req));
  res.json(result);
});

exports.addSkill = asyncHandler(async (req, res) => {
  const result = await employeeService.addSkill(req.params.id, req.body, getUser(req));
  res.json(result);
});

exports.updateSkill = asyncHandler(async (req, res) => {
  const result = await employeeService.updateSkill(req.params.id, req.params.skillId, req.body, getUser(req));
  res.json(result);
});

exports.deleteSkill = asyncHandler(async (req, res) => {
  const result = await employeeService.removeSkill(req.params.id, req.params.skillId, getUser(req));
  res.json(result);
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Avatar file is required' });
  }

  const avatar = `/uploads/${path.basename(req.file.filename)}`;
  const employee = await Employee.findByIdAndUpdate(
    req.params.id,
    { avatar },
    { new: true }
  ).populate('user', 'name email avatar role');

  if (!employee) {
    return res.status(404).json({ success: false, message: 'Employee not found' });
  }

  res.json({ success: true, data: employee, message: 'Avatar uploaded successfully' });
});

exports.checkIn = asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Employee check-in is handled by the attendance module' });
});

exports.checkOut = asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Employee check-out is handled by the attendance module' });
});

exports.getAttendance = asyncHandler(async (req, res) => {
  res.status(501).json({ success: false, message: 'Employee attendance is handled by the attendance module' });
});

exports.createLeave = leaveController.createLeave;
exports.getLeaves = leaveController.getLeaves;
exports.getLeave = leaveController.getLeave;
exports.updateLeave = leaveController.updateLeave;
exports.getTasks = taskController.getTasks;
exports.getTask = taskController.getTask;
exports.createTask = taskController.createTask;
exports.updateTask = taskController.updateTask;
exports.submitTask = taskController.submitTask;
exports.approveTask = taskController.approveTask;
exports.rejectTask = taskController.rejectTask;
