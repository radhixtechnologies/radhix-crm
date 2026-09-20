const Leave = require('../models/Leave');
const LeaveBalance = require('../models/LeaveBalance');
const Employee = require('../models/Employee');
const { asyncHandler } = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * @desc    Get overall leave summary
 * @route   GET /api/reports/leaves/summary
 * @access  Private (Admin, Super Admin)
 */
exports.getLeaveSummary = asyncHandler(async (req, res) => {
  const { year, startDate, endDate, status, type, employeeId, department } = req.query;
  
  // Build date filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (year) {
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
    dateFilter.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Build employee filter
  if (employeeId) {
    const employee = await Employee.findById(employeeId);
    if (employee) {
      dateFilter.employee = employee._id;
    }
  } else if (department) {
    const employees = await Employee.find({ department }).select('_id');
    dateFilter.employee = { $in: employees.map(e => e._id) };
  }

  // Build status filter
  if (status) {
    dateFilter.status = status;
  }

  // Build type filter
  if (type) {
    dateFilter.type = type;
  }

  // Get all leaves
  const leaves = await Leave.find(dateFilter)
    .populate('employee', 'employeeId user department')
    .populate('employee.user', 'name email')
    .populate('approvedBy', 'name');

  // Calculate summary
  const summary = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length,
    totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
    byType: {
      casual: {
        total: leaves.filter(l => l.type === 'casual').length,
        approved: leaves.filter(l => l.type === 'casual' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'casual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      sick: {
        total: leaves.filter(l => l.type === 'sick').length,
        approved: leaves.filter(l => l.type === 'sick' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'sick' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      annual: {
        total: leaves.filter(l => l.type === 'annual').length,
        approved: leaves.filter(l => l.type === 'annual' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'annual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      maternity: {
        total: leaves.filter(l => l.type === 'maternity').length,
        approved: leaves.filter(l => l.type === 'maternity' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'maternity' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      paternity: {
        total: leaves.filter(l => l.type === 'paternity').length,
        approved: leaves.filter(l => l.type === 'paternity' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'paternity' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      unpaid: {
        total: leaves.filter(l => l.type === 'unpaid').length,
        approved: leaves.filter(l => l.type === 'unpaid' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'unpaid' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
    },
  };

  res.status(200).json({
    success: true,
    data: summary,
  });
});

/**
 * @desc    Get all leaves with comprehensive filters
 * @route   GET /api/reports/leaves/all
 * @access  Private (Admin, Super Admin)
 */
exports.getAllLeaves = asyncHandler(async (req, res) => {
  const { year, startDate, endDate, status, type, employeeId, department } = req.query;
  
  // Build date filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (year) {
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
    dateFilter.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Build employee filter
  if (employeeId) {
    const employee = await Employee.findById(employeeId);
    if (employee) {
      dateFilter.employee = employee._id;
    }
  } else if (department) {
    const employees = await Employee.find({ department }).select('_id');
    dateFilter.employee = { $in: employees.map(e => e._id) };
  }

  // Build status filter
  if (status) {
    dateFilter.status = status;
  }

  // Build type filter
  if (type) {
    dateFilter.type = type;
  }

  // Get all leaves with full details
  const leaves = await Leave.find(dateFilter)
    .populate('employee', 'employeeId user department designation')
    .populate('employee.user', 'name email')
    .populate('approvedBy', 'name email')
    .populate('rejectedBy', 'name email')
    .sort({ startDate: -1 });

  res.status(200).json({
    success: true,
    count: leaves.length,
    data: leaves,
  });
});

/**
 * @desc    Get monthly leave usage
 * @route   GET /api/reports/leaves/monthly
 * @access  Private (Admin, Super Admin)
 */
exports.getMonthlyLeaveReport = asyncHandler(async (req, res) => {
  const { year, startDate, endDate, department } = req.query;
  const reportYear = year ? parseInt(year) : new Date().getFullYear();

  // Build date filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else {
    const yearStart = new Date(reportYear, 0, 1);
    const yearEnd = new Date(reportYear, 11, 31, 23, 59, 59);
    dateFilter.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Build employee filter for department
  if (department) {
    const employees = await Employee.find({ department }).select('_id');
    dateFilter.employee = { $in: employees.map(e => e._id) };
  }

  // Get all leaves
  const leaves = await Leave.find(dateFilter)
    .populate('employee', 'employeeId user department')
    .populate('employee.user', 'name email');

  // Monthly breakdown
  const monthlyData = {};
  for (let month = 0; month < 12; month++) {
    monthlyData[month + 1] = {
      month: month + 1,
      monthName: new Date(reportYear, month, 1).toLocaleString('default', { month: 'short' }),
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalDays: 0,
    };
  }

  leaves.forEach(leave => {
    const month = new Date(leave.startDate).getMonth() + 1;
    if (monthlyData[month]) {
      monthlyData[month].total++;
      monthlyData[month][leave.status]++;
      if (leave.status === 'approved') {
        monthlyData[month].totalDays += leave.days;
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      year: reportYear,
      monthly: Object.values(monthlyData),
    },
  });
});

/**
 * @desc    Get department-wise leave report
 * @route   GET /api/reports/leaves/department
 * @access  Private (Admin, Super Admin)
 */
exports.getDepartmentLeaveReport = asyncHandler(async (req, res) => {
  const { year, startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (year) {
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
    dateFilter.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Get all leaves
  const leaves = await Leave.find(dateFilter)
    .populate('employee', 'employeeId user department')
    .populate('employee.user', 'name email');

  // Group by department
  const departmentData = {};

  leaves.forEach(leave => {
    const dept = leave.employee?.department || 'Unassigned';
    if (!departmentData[dept]) {
      departmentData[dept] = {
        department: dept,
        total: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalDays: 0,
        totalEmployees: new Set(),
        byType: {
          casual: { count: 0, days: 0 },
          sick: { count: 0, days: 0 },
          annual: { count: 0, days: 0 },
          maternity: { count: 0, days: 0 },
          paternity: { count: 0, days: 0 },
          unpaid: { count: 0, days: 0 },
        },
      };
    }

    departmentData[dept].total++;
    departmentData[dept][leave.status]++;
    if (leave.status === 'approved') {
      departmentData[dept].totalDays += leave.days;
      departmentData[dept].byType[leave.type].count++;
      departmentData[dept].byType[leave.type].days += leave.days;
    }
    departmentData[dept].totalEmployees.add(leave.employee?._id?.toString());
  });

  // Convert Sets to counts
  Object.keys(departmentData).forEach(dept => {
    departmentData[dept].totalEmployees = departmentData[dept].totalEmployees.size;
  });

  res.status(200).json({
    success: true,
    data: {
      departments: Object.values(departmentData),
    },
  });
});

/**
 * @desc    Get employee-wise leave report
 * @route   GET /api/reports/leaves/employee
 * @access  Private (Admin, Super Admin)
 */
exports.getEmployeeLeaveReport = asyncHandler(async (req, res) => {
  const { year, department, startDate, endDate } = req.query;

  // Build employee filter
  const employeeFilter = {};
  if (department) {
    employeeFilter.department = department;
  }

  // Get employees
  const employees = await Employee.find(employeeFilter)
    .populate('user', 'name email');

  // Build date filter
  const dateFilter = {};
  if (startDate && endDate) {
    dateFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (year) {
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
    dateFilter.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Get all leaves
  const leaves = await Leave.find(dateFilter)
    .populate('employee', 'employeeId user department')
    .populate('employee.user', 'name email');

  // Group by employee
  const employeeData = {};

  employees.forEach(emp => {
    employeeData[emp._id.toString()] = {
      employeeId: emp.employeeId,
      name: emp.user?.name || 'N/A',
      email: emp.user?.email || 'N/A',
      department: emp.department,
      total: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      cancelled: 0,
      totalDays: 0,
      byType: {
        casual: { count: 0, days: 0 },
        sick: { count: 0, days: 0 },
        annual: { count: 0, days: 0 },
        maternity: { count: 0, days: 0 },
        paternity: { count: 0, days: 0 },
        unpaid: { count: 0, days: 0 },
      },
    };
  });

  leaves.forEach(leave => {
    const empId = leave.employee?._id?.toString();
    if (empId && employeeData[empId]) {
      employeeData[empId].total++;
      employeeData[empId][leave.status]++;
      if (leave.status === 'approved') {
        employeeData[empId].totalDays += leave.days;
        employeeData[empId].byType[leave.type].count++;
        employeeData[empId].byType[leave.type].days += leave.days;
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      employees: Object.values(employeeData).filter(emp => emp.total > 0),
    },
  });
});

/**
 * @desc    Get personal leave report for employee
 * @route   GET /api/reports/leaves/:employeeId
 * @access  Private
 */
exports.getPersonalLeaveReport = asyncHandler(async (req, res) => {
  const { employeeId } = req.params;
  const { year, startDate, endDate } = req.query;

  // Check authorization
  if (req.user.role === 'employee') {
    const currentEmployee = await Employee.findOne({ user: req.user._id });
    if (!currentEmployee || currentEmployee._id.toString() !== employeeId) {
      throw new AppError('Not authorized to view this report', 403);
    }
  }

  // Build date filter
  const dateFilter = { employee: employeeId };
  if (startDate && endDate) {
    dateFilter.startDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (year) {
    const yearStart = new Date(parseInt(year), 0, 1);
    const yearEnd = new Date(parseInt(year), 11, 31, 23, 59, 59);
    dateFilter.startDate = { $gte: yearStart, $lte: yearEnd };
  }

  // Get leaves
  const leaves = await Leave.find(dateFilter)
    .populate('employee', 'employeeId user department')
    .populate('employee.user', 'name email')
    .populate('approvedBy', 'name')
    .sort({ startDate: -1 });

  // Get employee info
  const employee = await Employee.findById(employeeId).populate('user', 'name email');

  // Calculate summary
  const summary = {
    total: leaves.length,
    approved: leaves.filter(l => l.status === 'approved').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    rejected: leaves.filter(l => l.status === 'rejected').length,
    cancelled: leaves.filter(l => l.status === 'cancelled').length,
    totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
    byType: {
      casual: {
        total: leaves.filter(l => l.type === 'casual').length,
        approved: leaves.filter(l => l.type === 'casual' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'casual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      sick: {
        total: leaves.filter(l => l.type === 'sick').length,
        approved: leaves.filter(l => l.type === 'sick' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'sick' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      annual: {
        total: leaves.filter(l => l.type === 'annual').length,
        approved: leaves.filter(l => l.type === 'annual' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'annual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      maternity: {
        total: leaves.filter(l => l.type === 'maternity').length,
        approved: leaves.filter(l => l.type === 'maternity' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'maternity' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      paternity: {
        total: leaves.filter(l => l.type === 'paternity').length,
        approved: leaves.filter(l => l.type === 'paternity' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'paternity' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
      unpaid: {
        total: leaves.filter(l => l.type === 'unpaid').length,
        approved: leaves.filter(l => l.type === 'unpaid' && l.status === 'approved').length,
        days: leaves.filter(l => l.type === 'unpaid' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
    },
  };

  // Monthly breakdown
  const monthlyData = {};
  for (let month = 0; month < 12; month++) {
    monthlyData[month + 1] = {
      month: month + 1,
      monthName: new Date(parseInt(year || new Date().getFullYear()), month, 1).toLocaleString('default', { month: 'short' }),
      total: 0,
      approved: 0,
      totalDays: 0,
    };
  }

  leaves.forEach(leave => {
    const month = new Date(leave.startDate).getMonth() + 1;
    if (monthlyData[month]) {
      monthlyData[month].total++;
      if (leave.status === 'approved') {
        monthlyData[month].approved++;
        monthlyData[month].totalDays += leave.days;
      }
    }
  });

  res.status(200).json({
    success: true,
    data: {
      employee: {
        employeeId: employee?.employeeId,
        name: employee?.user?.name,
        email: employee?.user?.email,
        department: employee?.department,
      },
      summary,
      monthly: Object.values(monthlyData),
      leaves: leaves.map(l => ({
        _id: l._id,
        type: l.type,
        startDate: l.startDate,
        endDate: l.endDate,
        days: l.days,
        status: l.status,
        reason: l.reason,
        approvedBy: l.approvedBy?.name || null,
        approvedAt: l.approvedAt,
        rejectedBy: l.rejectedBy?.name || null,
        rejectedAt: l.rejectedAt,
        rejectionReason: l.rejectionReason,
        comments: l.comments,
        createdAt: l.createdAt,
      })),
    },
  });
});

/**
 * @desc    Get yearly leave trend
 * @route   GET /api/reports/leaves/yearly-trend
 * @access  Private (Admin, Super Admin)
 */
exports.getYearlyTrend = asyncHandler(async (req, res) => {
  const { startYear, endYear, department } = req.query;
  const start = startYear ? parseInt(startYear) : new Date().getFullYear() - 4;
  const end = endYear ? parseInt(endYear) : new Date().getFullYear();

  // Build employee filter for department
  let employeeFilter = {};
  if (department) {
    employeeFilter.department = department;
  }

  const employees = await Employee.find(employeeFilter).select('_id');
  const employeeIds = employees.map(e => e._id);

  const yearlyData = [];

  for (let year = start; year <= end; year++) {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const leaves = await Leave.find({
      startDate: { $gte: yearStart, $lte: yearEnd },
      employee: { $in: employeeIds },
    });

    yearlyData.push({
      year,
      total: leaves.length,
      approved: leaves.filter(l => l.status === 'approved').length,
      totalDays: leaves.filter(l => l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      byType: {
        casual: leaves.filter(l => l.type === 'casual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        sick: leaves.filter(l => l.type === 'sick' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
        annual: leaves.filter(l => l.type === 'annual' && l.status === 'approved').reduce((sum, l) => sum + l.days, 0),
      },
    });
  }

  res.status(200).json({
    success: true,
    data: yearlyData,
  });
});
