const Employee = require('../models/Employee');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Payroll = require('../models/Payroll');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const JobPosting = require('../models/JobPosting');
const JobApplication = require('../models/JobApplication');
const OnboardingTask = require('../models/OnboardingTask');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc    Get super admin dashboard overview
// @route   GET /api/dashboard/superadmin/overview
// @access  Private (Super Admin)
exports.getSuperAdminOverview = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Employee stats
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const newHiresThisMonth = await Employee.countDocuments({
      joiningDate: { $gte: startOfMonth },
    });

    // Department-wise count
    const departmentCounts = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Headcount trend (last 6 months)
    const headcountTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = await Employee.countDocuments({
        joiningDate: { $lte: monthEnd },
        $or: [
          { leavingDate: { $exists: false } },
          { leavingDate: { $gt: monthEnd } },
        ],
      });
      headcountTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        count,
      });
    }

    // Attrition rate (last 6 months)
    const resignedLast6Months = await Employee.countDocuments({
      status: { $in: ['resigned', 'terminated'] },
      leavingDate: {
        $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1),
      },
    });
    const avgHeadcount = totalEmployees;
    const attritionRate = avgHeadcount > 0 ? ((resignedLast6Months / avgHeadcount) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          newHiresThisMonth,
          departmentCounts: departmentCounts.map(d => ({ department: d._id || 'Unassigned', count: d.count })),
          headcountTrend,
          attritionRate: parseFloat(attritionRate),
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

// @desc    Get HRM insights
// @route   GET /api/dashboard/superadmin/hrm
// @access  Private (Super Admin)
exports.getHRMInsights = async (req, res) => {
  try {
    const totalJobPosts = await JobPosting.countDocuments();
    const openJobPosts = await JobPosting.countDocuments({ status: 'open' });
    const totalApplicants = await JobApplication.countDocuments();

    // Upcoming interviews (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingInterviews = await JobApplication.countDocuments({
      'interviews.date': {
        $gte: new Date(),
        $lte: sevenDaysFromNow,
      },
    });

    // Pending onboarding tasks
    const pendingOnboarding = await OnboardingTask.countDocuments({
      status: 'pending',
    });

    // Pending leave approvals
    const pendingLeaves = await Leave.countDocuments({
      status: 'pending',
    });

    // Leave usage summary (last 6 months)
    const leaveSummary = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const leaves = await Leave.countDocuments({
        startDate: { $gte: monthStart, $lt: monthEnd },
        status: 'approved',
      });
      leaveSummary.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        count: leaves,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalJobPosts,
        openJobPosts,
        totalApplicants,
        upcomingInterviews,
        pendingOnboarding,
        pendingLeaves,
        leaveSummary,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get attendance overview
// @route   GET /api/dashboard/superadmin/attendance
// @access  Private (Super Admin)
exports.getAttendanceOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Today's attendance
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lte: todayEnd },
    });

    const present = todayAttendance.filter(a => a.status === 'present').length;
    const absent = todayAttendance.filter(a => a.status === 'absent').length;
    const late = todayAttendance.filter(a => a.status === 'late').length;

    // Live check-ins (currently working)
    const liveCheckIns = todayAttendance.filter(
      a => a.status === 'present' && a.checkIn && !a.checkOut
    ).length;

    // Attendance trend (last 7 days)
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dayAttendance = await Attendance.find({
        date: { $gte: date, $lte: dateEnd },
      });

      attendanceTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: dayAttendance.filter(a => a.status === 'present').length,
        absent: dayAttendance.filter(a => a.status === 'absent').length,
        late: dayAttendance.filter(a => a.status === 'late').length,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        today: {
          present,
          absent,
          late,
          total: present + absent + late,
        },
        liveCheckIns,
        attendanceTrend,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get sales dashboard summary
// @route   GET /api/dashboard/superadmin/sales
// @access  Private (Super Admin)
exports.getSalesSummary = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const contactedLeads = await Lead.countDocuments({ status: 'contacted' });
    const qualifiedLeads = await Lead.countDocuments({ status: 'qualified' });
    const closedLeads = await Lead.countDocuments({ status: 'won' });

    // Deal pipeline
    const dealsByStage = await Deal.aggregate([
      { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
    ]);

    // Monthly revenue forecast (next 3 months)
    // Monthly revenue forecast (next 3 months)
    const revenueForecast = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() + i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      // Estimate revenue from deals likely to close
      // Logic: Sum of (Value * Probability) for deals with expectedCloseDate in this month
      const deals = await Deal.find({
        expectedCloseDate: { $gte: monthStart, $lt: monthEnd },
        status: 'open'
      });

      const estimatedRevenue = deals.reduce((sum, deal) => {
        const prob = deal.probability || 0;
        return sum + (deal.value * (prob / 100));
      }, 0);

      revenueForecast.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        forecast: Math.round(estimatedRevenue),
      });
    }

    // Top sales performers (by deal value)
    const topPerformers = await Deal.aggregate([
      { $match: { stage: 'closed-won' } },
      {
        $group: {
          _id: '$assignedTo',
          totalValue: { $sum: '$value' },
          dealCount: { $sum: 1 },
        },
      },
      { $sort: { totalValue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
    ]);

    // Sales funnel data
    const funnelData = [
      { stage: 'Leads', value: totalLeads },
      { stage: 'Qualified', value: qualifiedLeads },
      { stage: 'Proposal', value: await Deal.countDocuments({ stage: 'proposal-sent' }) },
      { stage: 'Negotiation', value: await Deal.countDocuments({ stage: 'negotiation' }) },
      { stage: 'Won', value: closedLeads },
    ];

    // Total Orders (Paid & Pending Invoices as Orders)
    const totalOrders = await Invoice.countDocuments({ status: { $in: ['paid', 'pending', 'sent'] } });

    // Products Sold (Sum of quantities in paid invoices)
    const productsSoldAgg = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      { $group: { _id: null, total: { $sum: '$items.quantity' } } }
    ]);
    const productsSold = productsSoldAgg[0]?.total || 0;

    // Top Selling Products (Sales Analytics)
    const topProducts = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          sales: { $sum: '$items.quantity' },
          value: { $sum: '$items.amount' }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 5 }
    ]);

    // Lead Acquisition Trend (Visitor Insights replacement)
    // 12 months trend
    const leadTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const newLeads = await Lead.countDocuments({
        createdAt: { $gte: monthStart, $lt: monthEnd }
      });
      const wonLeads = await Lead.countDocuments({
        status: 'won',
        updatedAt: { $gte: monthStart, $lt: monthEnd }
      });
      const lostLeads = await Lead.countDocuments({
        status: 'lost',
        updatedAt: { $gte: monthStart, $lt: monthEnd }
      });

      leadTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        new: newLeads,
        loyal: wonLeads, // Mapping 'Won' to 'Loyal'
        lost: lostLeads
      });
    }

    res.status(200).json({
      success: true,
      data: {
        leads: {
          total: totalLeads,
          new: newLeads,
          contacted: contactedLeads,
          qualified: qualifiedLeads,
          closed: closedLeads,
        },
        dealsByStage: dealsByStage.map(s => ({
          stage: s._id,
          count: s.count,
          totalValue: s.totalValue || 0,
        })),
        revenueForecast,
        topPerformers: topPerformers.map(p => ({
          userId: p._id,
          name: p.user[0]?.name || 'Unknown',
          totalValue: p.totalValue || 0,
          dealCount: p.dealCount,
        })),
        funnelData,
        // Added for Dashboard
        totalOrders,
        productsSold,
        topProducts: topProducts.map(p => ({
          name: p._id,
          sales: p.sales,
          value: p.value
        })),
        leadTrend
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get finance summary
// @route   GET /api/dashboard/superadmin/finance
// @access  Private (Super Admin)
exports.getFinanceSummary = async (req, res) => {
  try {
    // Invoice stats
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'sent' });
    const overdueInvoices = await Invoice.countDocuments({
      status: { $in: ['sent', 'overdue'] },
      dueDate: { $lt: new Date() },
    });

    // Income vs expense (last 6 months)
    const incomeExpenseTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);

      const income = await Invoice.aggregate([
        { $match: { status: 'paid', paidDate: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]);

      const expense = await Expense.aggregate([
        { $match: { status: 'approved', date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      incomeExpenseTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        income: income[0]?.total || 0,
        expense: expense[0]?.total || 0,
      });
    }

    // Expense breakdown by category
    const expenseBreakdown = await Expense.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    // Payroll summary
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const processedPayroll = await Payroll.countDocuments({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'processed',
    });
    const pendingPayroll = await Payroll.countDocuments({
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      status: 'pending',
    });

    // Total revenue
    const totalRevenue = await Invoice.aggregate([
      { $match: { status: { $regex: /^paid$/i } } }, // Case insensitive match
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Total expenses
    const totalExpenses = await Expense.aggregate([
      { $match: { status: { $regex: /^approved$/i } } }, // Case insensitive
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        invoices: {
          total: totalInvoices,
          paid: paidInvoices,
          pending: pendingInvoices,
          overdue: overdueInvoices,
        },
        incomeExpenseTrend,
        expenseBreakdown: expenseBreakdown.map(e => ({
          category: e._id || 'Uncategorized',
          total: e.total,
        })),
        payroll: {
          processed: processedPayroll,
          pending: pendingPayroll,
        },
        totalRevenue: totalRevenue[0]?.total || 0,
        totalExpenses: totalExpenses[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get notifications
// @route   GET /api/dashboard/superadmin/notifications
// @access  Private (Super Admin)
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.user._id,
      read: false,
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'name email');

    // System notifications
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });
    const newApplicants = await JobApplication.countDocuments({
      status: 'applied',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });
    const overdueInvoices = await Invoice.countDocuments({
      status: { $in: ['sent', 'overdue'] },
      dueDate: { $lt: new Date() },
    });
    const unprocessedPayroll = await Payroll.countDocuments({
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map(n => ({
          id: n._id,
          type: n.type,
          title: n.title,
          message: n.message,
          sender: n.sender,
          createdAt: n.createdAt,
        })),
        systemAlerts: {
          pendingLeaves,
          newApplicants,
          overdueInvoices,
          unprocessedPayroll,
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

// @desc    Get activity log
// @route   GET /api/dashboard/superadmin/activity
// @access  Private (Super Admin)
exports.getActivityLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email role');

    const total = await ActivityLog.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        logs: logs.map(log => ({
          id: log._id,
          user: log.user,
          action: log.action,
          module: log.module,
          entity: log.entity,
          details: log.details,
          createdAt: log.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
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

