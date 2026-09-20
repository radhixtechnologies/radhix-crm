const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const { asyncHandler } = require('../utils/asyncHandler');

/**
 * @desc    Get employee statistics
 * @route   GET /api/employees/statistics
 * @access  Private (Admin, Super Admin)
 */
exports.getEmployeeStatistics = asyncHandler(async (req, res) => {
  const { year, department } = req.query;
  const currentYear = year ? parseInt(year) : new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

  // Build query
  const query = { deletedAt: null };
  if (department) {
    query.department = department;
  }

  // Filter out Super Admin data for Admin users
  const { addSuperAdminFilter } = require('../utils/roleFilter');
  await addSuperAdminFilter(query, req.user);

  // Total employees
  const totalEmployees = await Employee.countDocuments(query);

  // Active employees
  const activeEmployees = await Employee.countDocuments({ ...query, status: 'active' });

  // Employees by department
  const employeesByDepartment = await Employee.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$department',
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
  ]);

  // Employees by status
  const employeesByStatus = await Employee.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  // Employees by employment type
  const employeesByEmploymentType = await Employee.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$employmentType',
        count: { $sum: 1 },
      },
    },
  ]);

  // New hires this year
  const newHires = await Employee.countDocuments({
    ...query,
    joiningDate: { $gte: yearStart, $lte: yearEnd },
  });

  // Employees joined by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const employeesByMonth = await Employee.aggregate([
    {
      $match: {
        ...query,
        joiningDate: { $gte: twelveMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$joiningDate' },
          month: { $month: '$joiningDate' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Average tenure
  const employeesWithTenure = await Employee.find(query)
    .select('joiningDate')
    .lean();

  const currentDate = new Date();
  const totalTenureDays = employeesWithTenure.reduce((sum, emp) => {
    if (emp.joiningDate) {
      const tenureDays = Math.floor((currentDate - new Date(emp.joiningDate)) / (1000 * 60 * 60 * 24));
      return sum + Math.max(0, tenureDays);
    }
    return sum;
  }, 0);

  const averageTenureDays = totalEmployees > 0 ? totalTenureDays / totalEmployees : 0;
  const averageTenureMonths = Math.round(averageTenureDays / 30);
  const averageTenureYears = Math.round(averageTenureDays / 365);

  // Attendance statistics
  const attendanceStats = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: yearStart, $lte: yearEnd },
      },
    },
    {
      $group: {
        _id: '$employee',
        totalDays: { $sum: 1 },
        presentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'present'] }, 1, 0],
          },
        },
        absentDays: {
          $sum: {
            $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
          },
        },
        totalHours: { $sum: '$hoursWorked' },
      },
    },
  ]);

  const totalAttendanceDays = attendanceStats.reduce((sum, stat) => sum + stat.totalDays, 0);
  const totalPresentDays = attendanceStats.reduce((sum, stat) => sum + stat.presentDays, 0);
  const averageAttendanceRate = totalAttendanceDays > 0 ? (totalPresentDays / totalAttendanceDays) * 100 : 0;

  // Leave statistics
  const leaveStats = await Leave.aggregate([
    {
      $match: {
        startDate: { $gte: yearStart, $lte: yearEnd },
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDays: { $sum: '$days' },
      },
    },
  ]);

  // Response
  res.status(200).json({
    success: true,
    data: {
      overview: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
        newHires,
        averageTenureDays: Math.round(averageTenureDays),
        averageTenureMonths,
        averageTenureYears,
      },
      byDepartment: employeesByDepartment.map((item) => ({
        department: item._id,
        count: item.count,
      })),
      byStatus: employeesByStatus.map((item) => ({
        status: item._id,
        count: item.count,
      })),
      byEmploymentType: employeesByEmploymentType.map((item) => ({
        type: item._id,
        count: item.count,
      })),
      byMonth: employeesByMonth.map((item) => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        count: item.count,
      })),
      attendance: {
        totalDays: totalAttendanceDays,
        presentDays: totalPresentDays,
        averageRate: Math.round(averageAttendanceRate * 100) / 100,
      },
      leaves: leaveStats.map((item) => ({
        status: item._id,
        count: item.count,
        totalDays: item.totalDays,
      })),
    },
  });
});

