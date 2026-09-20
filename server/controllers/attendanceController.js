const attendanceService = require('../services/attendanceService');
const AppError = require('../utils/AppError');
const { ensureEmployeeForUser } = require('../utils/employeeHelper');

const getCurrentEmployee = async (user) => {
  const employee = await ensureEmployeeForUser(user);
  if (!employee) throw new AppError('Employee record not found', 404);
  return employee;
};

exports.checkInSelf = async (req, res, next) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    res.json(await attendanceService.checkIn(employee._id, req.body, req.user));
  } catch (error) { next(error); }
};

exports.checkOutSelf = async (req, res, next) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    res.json(await attendanceService.checkOut(employee._id, req.body, req.user));
  } catch (error) { next(error); }
};

exports.getAttendanceSelf = async (req, res, next) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    res.json(await attendanceService.getAttendance(employee._id, req.query, req.user));
  } catch (error) { next(error); }
};

exports.getTodayStatusSelf = async (req, res, next) => {
  try {
    const employee = await getCurrentEmployee(req.user);
    const result = await attendanceService.getAttendance(employee._id, {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
    }, req.user);
    res.json({ success: true, data: result.data[0] || null });
  } catch (error) { next(error); }
};

exports.getAttendance = async (req, res, next) => {
  try { res.json(await attendanceService.getAttendance(req.params.id, req.query, req.user)); } catch (error) { next(error); }
};

exports.checkIn = async (req, res, next) => {
  try { res.json(await attendanceService.checkIn(req.params.id, req.body, req.user)); } catch (error) { next(error); }
};

exports.checkOut = async (req, res, next) => {
  try { res.json(await attendanceService.checkOut(req.params.id, req.body, req.user)); } catch (error) { next(error); }
};

exports.getAllAttendance = async (req, res, next) => {
  try { res.json(await attendanceService.getAllAttendance(req.query, req.user)); } catch (error) { next(error); }
};
