const Employee = require('../../models/Employee');
const Attendance = require('../../models/Attendance');
const Leave = require('../../models/Leave');
const JobPosting = require('../../models/JobPosting');
const JobApplication = require('../../models/JobApplication');
const PerformanceReview = require('../../models/PerformanceReview');
const ExitRequest = require('../../models/ExitRequest');
const mongoose = require('mongoose');

// @desc    Get headcount report
// @route   GET /api/hrm/reports/headcount
// @access  Private (Admin)
exports.getHeadcountReport = async (req, res) => {
  try {
    const { from, to, department } = req.query;
    
    let query = {};
    if (department) query.department = department;
    if (from && to) {
      query.joiningDate = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const employees = await Employee.find(query)
      .populate('user', 'name email')
      .populate('manager', 'employeeId user');

    // Group by department
    const byDepartment = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { total: 0, active: 0, onboarding: 0, terminated: 0 };
      }
      byDepartment[dept].total++;
      if (emp.status === 'active') byDepartment[dept].active++;
      else if (emp.status === 'onboarding') byDepartment[dept].onboarding++;
      else if (emp.status === 'terminated') byDepartment[dept].terminated++;
    });

    // Group by designation
    const byDesignation = {};
    employees.forEach(emp => {
      const desig = emp.designation || 'Other';
      if (!byDesignation[desig]) {
        byDesignation[desig] = 0;
      }
      byDesignation[desig]++;
    });

    res.status(200).json({
      success: true,
      data: {
        total: employees.length,
        active: employees.filter(e => e.status === 'active').length,
        onboarding: employees.filter(e => e.status === 'onboarding').length,
        terminated: employees.filter(e => e.status === 'terminated').length,
        byDepartment,
        byDesignation,
        employees,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get attrition report
// @route   GET /api/hrm/reports/attrition
// @access  Private (Admin)
exports.getAttritionReport = async (req, res) => {
  try {
    const { from, to, department } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date();

    let query = {
      status: { $in: ['terminated', 'resigned'] },
      'exitProcess.resignationDate': {
        $gte: fromDate,
        $lte: toDate,
      },
    };

    if (department) query.department = department;

    const exitedEmployees = await Employee.find(query)
      .populate('user', 'name email')
      .populate('manager', 'employeeId user');

    // Calculate attrition rate
    const totalEmployees = await Employee.countDocuments({
      status: 'active',
      joiningDate: { $lte: toDate },
    });

    const exitedCount = exitedEmployees.length;
    const averageEmployees = totalEmployees || 1; // Avoid division by zero
    const attritionRate = ((exitedCount / averageEmployees) * 100).toFixed(2);

    // Group by department
    const byDepartment = {};
    exitedEmployees.forEach(emp => {
      const dept = emp.department || 'Other';
      if (!byDepartment[dept]) {
        byDepartment[dept] = 0;
      }
      byDepartment[dept]++;
    });

    // Group by exit reason
    const byReason = {};
    exitedEmployees.forEach(emp => {
      const reason = emp.exitProcess?.exitReason || 'Not specified';
      if (!byReason[reason]) {
        byReason[reason] = 0;
      }
      byReason[reason]++;
    });

    res.status(200).json({
      success: true,
      data: {
        totalExited: exitedCount,
        totalActive: totalEmployees,
        attritionRate: parseFloat(attritionRate),
        byDepartment,
        byReason,
        employees: exitedEmployees,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get attendance summary report
// @route   GET /api/hrm/reports/attendance
// @access  Private (Admin)
exports.getAttendanceReport = async (req, res) => {
  try {
    const { from, to, department } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().setDate(1)); // Start of month
    const toDate = to ? new Date(to) : new Date();

    // Get employees
    let empQuery = {};
    if (department) empQuery.department = department;
    const employees = await Employee.find(empQuery).select('_id employeeId department');

    const employeeIds = employees.map(e => e._id);

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      employee: { $in: employeeIds },
      date: { $gte: fromDate, $lte: toDate },
    }).populate('employee', 'employeeId department');

    // Calculate statistics
    const stats = {
      totalDays: Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)),
      totalPresent: attendanceRecords.filter(a => a.status === 'present').length,
      totalAbsent: attendanceRecords.filter(a => a.status === 'absent').length,
      totalHalfDay: attendanceRecords.filter(a => a.status === 'half-day').length,
      totalLeave: attendanceRecords.filter(a => a.status === 'leave').length,
      averageHours: 0,
    };

    const totalHours = attendanceRecords
      .filter(a => a.hoursWorked)
      .reduce((sum, a) => sum + a.hoursWorked, 0);
    const recordsWithHours = attendanceRecords.filter(a => a.hoursWorked).length;
    stats.averageHours = recordsWithHours > 0 ? (totalHours / recordsWithHours).toFixed(2) : 0;

    // By department
    const byDepartment = {};
    attendanceRecords.forEach(record => {
      const dept = record.employee?.department || 'Other';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { present: 0, absent: 0, halfDay: 0, leave: 0 };
      }
      if (record.status === 'present') byDepartment[dept].present++;
      else if (record.status === 'absent') byDepartment[dept].absent++;
      else if (record.status === 'half-day') byDepartment[dept].halfDay++;
      else if (record.status === 'leave') byDepartment[dept].leave++;
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        byDepartment,
        records: attendanceRecords.slice(0, 100), // Limit to 100 records
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get leave summary report
// @route   GET /api/hrm/reports/leave
// @access  Private (Admin)
exports.getLeaveReport = async (req, res) => {
  try {
    const { from, to, department, type } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), 0, 1);
    const toDate = to ? new Date(to) : new Date(new Date().getFullYear(), 11, 31);

    let query = {
      startDate: { $gte: fromDate },
      endDate: { $lte: toDate },
    };

    if (type) query.type = type;

    // Get employees by department if specified
    let empQuery = {};
    if (department) empQuery.department = department;
    const employees = await Employee.find(empQuery).select('_id department');
    const employeeIds = employees.map(e => e._id);

    if (department) {
      query.employee = { $in: employeeIds };
    }

    const leaveRequests = await Leave.find(query)
      .populate('employee', 'employeeId department user')
      .populate('employee.user', 'name email')
      .populate('approvedBy', 'name email');

    // Statistics
    const stats = {
      totalRequests: leaveRequests.length,
      approved: leaveRequests.filter(l => l.status === 'approved').length,
      rejected: leaveRequests.filter(l => l.status === 'rejected').length,
      pending: leaveRequests.filter(l => l.status === 'pending').length,
      totalDays: leaveRequests.reduce((sum, l) => sum + l.days, 0),
    };

    // By type
    const byType = {};
    leaveRequests.forEach(leave => {
      const leaveType = leave.type;
      if (!byType[leaveType]) {
        byType[leaveType] = { count: 0, days: 0 };
      }
      byType[leaveType].count++;
      byType[leaveType].days += leave.days;
    });

    // By department
    const byDepartment = {};
    leaveRequests.forEach(leave => {
      const dept = leave.employee?.department || 'Other';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { count: 0, days: 0 };
      }
      byDepartment[dept].count++;
      byDepartment[dept].days += leave.days;
    });

    res.status(200).json({
      success: true,
      data: {
        ...stats,
        byType,
        byDepartment,
        requests: leaveRequests,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get hiring funnel analytics
// @route   GET /api/hrm/reports/hiring-funnel
// @access  Private (Admin)
exports.getHiringFunnelReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from) : new Date(new Date().setMonth(new Date().getMonth() - 6));
    const toDate = to ? new Date(to) : new Date();

    // Get all job postings
    const jobs = await JobPosting.find({
      postedDate: { $gte: fromDate, $lte: toDate },
    });

    // Get all applications
    const applications = await JobApplication.find({
      createdAt: { $gte: fromDate, $lte: toDate },
    }).populate('jobPosting', 'title department');

    // Calculate funnel
    const funnel = {
      totalJobs: jobs.length,
      openJobs: jobs.filter(j => j.status === 'open').length,
      totalApplications: applications.length,
      byStatus: {
        applied: applications.filter(a => a.status === 'applied').length,
        screening: applications.filter(a => a.status === 'screening').length,
        interview: applications.filter(a => a.status === 'interview').length,
        offer: applications.filter(a => a.status === 'offer').length,
        hired: applications.filter(a => a.status === 'hired').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
      },
      conversionRate: {
        appliedToInterview: 0,
        interviewToOffer: 0,
        offerToHired: 0,
        overall: 0,
      },
    };

    // Calculate conversion rates
    const interviewCount = funnel.byStatus.interview + funnel.byStatus.offer + funnel.byStatus.hired;
    const offerCount = funnel.byStatus.offer + funnel.byStatus.hired;
    const hiredCount = funnel.byStatus.hired;

    if (funnel.totalApplications > 0) {
      funnel.conversionRate.appliedToInterview = ((interviewCount / funnel.totalApplications) * 100).toFixed(2);
      funnel.conversionRate.overall = ((hiredCount / funnel.totalApplications) * 100).toFixed(2);
    }

    if (interviewCount > 0) {
      funnel.conversionRate.interviewToOffer = ((offerCount / interviewCount) * 100).toFixed(2);
    }

    if (offerCount > 0) {
      funnel.conversionRate.offerToHired = ((hiredCount / offerCount) * 100).toFixed(2);
    }

    // By department
    const byDepartment = {};
    jobs.forEach(job => {
      const dept = job.department;
      if (!byDepartment[dept]) {
        byDepartment[dept] = { jobs: 0, applications: 0, hired: 0 };
      }
      byDepartment[dept].jobs++;
    });

    applications.forEach(app => {
      const dept = app.jobPosting?.department || 'Other';
      if (!byDepartment[dept]) {
        byDepartment[dept] = { jobs: 0, applications: 0, hired: 0 };
      }
      byDepartment[dept].applications++;
      if (app.status === 'hired') {
        byDepartment[dept].hired++;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        ...funnel,
        byDepartment,
        jobs,
        applications: applications.slice(0, 100), // Limit to 100
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get comprehensive HR Analytics Dashboard
// @route   GET /api/hrm/analytics/dashboard
// @access  Private (Admin)
exports.getHRAnalyticsDashboard = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const now = new Date();
    let startDate, endDate = now;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const employees = await Employee.find({});
    const headcountTrend = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const count = await Employee.countDocuments({
        joiningDate: { $lte: date },
        status: { $in: ['active', 'onboarding'] },
      });
      headcountTrend.unshift({ 
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), 
        count 
      });
    }

    const departmentDistribution = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      departmentDistribution[dept] = (departmentDistribution[dept] || 0) + 1;
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentJobs = await JobPosting.find({ postedDate: { $gte: thirtyDaysAgo } });
    const recentApplications = await JobApplication.find({ createdAt: { $gte: thirtyDaysAgo } });
    
    const hiringFunnel = {
      jobsPosted: recentJobs.length,
      applicationsReceived: recentApplications.length,
      screening: recentApplications.filter(a => a.status === 'screening').length,
      interviews: recentApplications.filter(a => a.status === 'interview').length,
      offers: recentApplications.filter(a => a.status === 'offer').length,
      hired: recentApplications.filter(a => a.status === 'hired').length,
    };

    const reviews = await PerformanceReview.find({ createdAt: { $gte: startDate } });
    const performanceStats = {
      totalReviews: reviews.length,
      averageRating: 0,
      ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    };

    if (reviews.length > 0) {
      const ratings = reviews.filter(r => r.finalRating).map(r => r.finalRating);
      performanceStats.averageRating = ratings.length > 0 
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2)
        : 0;
      ratings.forEach(rating => {
        const rounded = Math.round(rating).toString();
        if (performanceStats.ratingDistribution[rounded] !== undefined) {
          performanceStats.ratingDistribution[rounded]++;
        }
      });
    }

    const exitRequests = await ExitRequest.find({ submittedAt: { $gte: startDate } });
    const exitStats = {
      total: exitRequests.length,
      approved: exitRequests.filter(e => e.status === 'approved').length,
      pending: exitRequests.filter(e => e.status === 'under_review').length,
      byReason: {},
    };
    exitRequests.forEach(req => {
      const reason = req.reason || 'other';
      exitStats.byReason[reason] = (exitStats.byReason[reason] || 0) + 1;
    });

    const attendanceRecords = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });
    const attendanceStats = {
      totalDays: attendanceRecords.length,
      present: attendanceRecords.filter(a => a.status === 'present').length,
      absent: attendanceRecords.filter(a => a.status === 'absent').length,
      leave: attendanceRecords.filter(a => a.status === 'leave').length,
      averageHours: 0,
    };
    const hoursRecords = attendanceRecords.filter(a => a.hoursWorked);
    if (hoursRecords.length > 0) {
      attendanceStats.averageHours = (hoursRecords.reduce((sum, a) => sum + a.hoursWorked, 0) / hoursRecords.length).toFixed(2);
    }

    res.status(200).json({
      success: true,
      data: {
        headcountTrend,
        departmentDistribution,
        hiringFunnel,
        performanceStats,
        exitStats,
        attendanceStats,
        summary: {
          totalEmployees: employees.filter(e => e.status === 'active').length,
          activeJobs: recentJobs.filter(j => j.status === 'open').length,
          pendingInterviews: recentApplications.filter(a => a.status === 'interview').length,
          onboardingEmployees: employees.filter(e => e.status === 'onboarding').length,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

