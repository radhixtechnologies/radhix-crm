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

    // Prepare headcount trend date ranges
    const monthRanges = [];
    for (let i = 5; i >= 0; i--) {
      monthRanges.push({
        monthStart: new Date(now.getFullYear(), now.getMonth() - i, 1),
        monthEnd: new Date(now.getFullYear(), now.getMonth() - i + 1, 0),
      });
    }

    // Run all queries in parallel
    const [
      totalEmployees,
      activeEmployees,
      newHiresThisMonth,
      departmentCounts,
      resignedLast6Months,
      trendCounts,
    ] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Employee.countDocuments({ joiningDate: { $gte: startOfMonth } }),
      Employee.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Employee.countDocuments({
        status: { $in: ['resigned', 'terminated'] },
        leavingDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) },
      }),
      Promise.all(
        monthRanges.map((r) =>
          Employee.countDocuments({
            joiningDate: { $lte: r.monthEnd },
            $or: [
              { leavingDate: { $exists: false } },
              { leavingDate: { $gt: r.monthEnd } },
            ],
          })
        )
      ),
    ]);

    const headcountTrend = monthRanges.map((r, idx) => ({
      month: r.monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: trendCounts[idx],
    }));

    const avgHeadcount = totalEmployees;
    const attritionRate = avgHeadcount > 0 ? ((resignedLast6Months / avgHeadcount) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          newHiresThisMonth,
          departmentCounts: departmentCounts.map((d) => ({ department: d._id || 'Unassigned', count: d.count })),
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
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Prepare 6-month ranges for leave summary
    const monthRanges = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthRanges.push({ monthStart, monthEnd });
    }

    const [
      totalJobPosts,
      openJobPosts,
      totalApplicants,
      upcomingInterviews,
      pendingOnboarding,
      pendingLeaves,
      leaveCounts,
    ] = await Promise.all([
      JobPosting.countDocuments(),
      JobPosting.countDocuments({ status: 'open' }),
      JobApplication.countDocuments(),
      JobApplication.countDocuments({
        'interviews.date': {
          $gte: new Date(),
          $lte: sevenDaysFromNow,
        },
      }),
      OnboardingTask.countDocuments({ status: 'pending' }),
      Leave.countDocuments({ status: 'pending' }),
      Promise.all(
        monthRanges.map((r) =>
          Leave.countDocuments({
            startDate: { $gte: r.monthStart, $lt: r.monthEnd },
            status: 'approved',
          })
        )
      ),
    ]);

    const leaveSummary = monthRanges.map((r, idx) => ({
      month: r.monthStart.toLocaleDateString('en-US', { month: 'short' }),
      count: leaveCounts[idx],
    }));

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

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // Fetch past 7 days attendance in a single lean query instead of 7 queries!
    const allAttendance = await Attendance.find({
      date: { $gte: sevenDaysAgo, $lte: todayEnd },
    }).select('date status checkIn checkOut').lean();

    const todayAttendance = allAttendance.filter((a) => {
      const d = new Date(a.date);
      return d >= today && d <= todayEnd;
    });

    const present = todayAttendance.filter((a) => a.status === 'present').length;
    const absent = todayAttendance.filter((a) => a.status === 'absent').length;
    const late = todayAttendance.filter((a) => a.status === 'late').length;

    // Live check-ins (currently working)
    const liveCheckIns = todayAttendance.filter(
      (a) => a.status === 'present' && a.checkIn && !a.checkOut
    ).length;

    // Attendance trend (last 7 days) computed in memory
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);

      const dayAttendance = allAttendance.filter((a) => {
        const d = new Date(a.date);
        return d >= date && d <= dateEnd;
      });

      attendanceTrend.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        present: dayAttendance.filter((a) => a.status === 'present').length,
        absent: dayAttendance.filter((a) => a.status === 'absent').length,
        late: dayAttendance.filter((a) => a.status === 'late').length,
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
    const now = new Date();
    const threeMonthsAhead = new Date(now.getFullYear(), now.getMonth() + 3, 1);

    // Prepare 12 months for lead trend
    const monthRanges = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      monthRanges.push({ monthStart, monthEnd });
    }

    // Run parallel queries
    const [
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      closedLeads,
      dealsByStage,
      topPerformers,
      proposalDealsCount,
      negotiationDealsCount,
      totalOrders,
      productsSoldAgg,
      topProducts,
      upcomingDeals,
      leadTrendData,
    ] = await Promise.all([
      Lead.countDocuments(),
      Lead.countDocuments({ status: 'new' }),
      Lead.countDocuments({ status: 'contacted' }),
      Lead.countDocuments({ status: 'qualified' }),
      Lead.countDocuments({ status: 'won' }),
      Deal.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } },
      ]),
      Deal.aggregate([
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
      ]),
      Deal.countDocuments({ stage: 'proposal-sent' }),
      Deal.countDocuments({ stage: 'negotiation' }),
      Invoice.countDocuments({ status: { $in: ['paid', 'pending', 'sent'] } }),
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $unwind: '$items' },
        { $group: { _id: null, total: { $sum: '$items.quantity' } } },
      ]),
      Invoice.aggregate([
        { $match: { status: 'paid' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            sales: { $sum: '$items.quantity' },
            value: { $sum: '$items.amount' },
          },
        },
        { $sort: { sales: -1 } },
        { $limit: 5 },
      ]),
      Deal.find({
        expectedCloseDate: { $gte: new Date(now.getFullYear(), now.getMonth(), 1), $lt: threeMonthsAhead },
        status: 'open',
      }).select('expectedCloseDate value probability').lean(),
      Promise.all(
        monthRanges.map(async (r) => {
          const [nLeads, wLeads, lLeads] = await Promise.all([
            Lead.countDocuments({ createdAt: { $gte: r.monthStart, $lt: r.monthEnd } }),
            Lead.countDocuments({ status: 'won', updatedAt: { $gte: r.monthStart, $lt: r.monthEnd } }),
            Lead.countDocuments({ status: 'lost', updatedAt: { $gte: r.monthStart, $lt: r.monthEnd } }),
          ]);
          return {
            month: r.monthStart.toLocaleDateString('en-US', { month: 'short' }),
            new: nLeads,
            loyal: wLeads,
            lost: lLeads,
          };
        })
      ),
    ]);

    // Monthly revenue forecast from upcomingDeals in memory
    const revenueForecast = [];
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);

      const matchingDeals = upcomingDeals.filter((d) => {
        if (!d.expectedCloseDate) return false;
        const dt = new Date(d.expectedCloseDate);
        return dt >= monthStart && dt < monthEnd;
      });

      const estimatedRevenue = matchingDeals.reduce((sum, deal) => {
        const prob = deal.probability || 0;
        return sum + ((deal.value || 0) * (prob / 100));
      }, 0);

      revenueForecast.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        forecast: Math.round(estimatedRevenue),
      });
    }

    const funnelData = [
      { stage: 'Leads', value: totalLeads },
      { stage: 'Qualified', value: qualifiedLeads },
      { stage: 'Proposal', value: proposalDealsCount },
      { stage: 'Negotiation', value: negotiationDealsCount },
      { stage: 'Won', value: closedLeads },
    ];

    const productsSold = productsSoldAgg[0]?.total || 0;

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
        dealsByStage: dealsByStage.map((s) => ({
          stage: s._id,
          count: s.count,
          totalValue: s.totalValue || 0,
        })),
        revenueForecast,
        topPerformers: topPerformers.map((p) => ({
          userId: p._id,
          name: p.user[0]?.name || 'Unknown',
          totalValue: p.totalValue || 0,
          dealCount: p.dealCount,
        })),
        funnelData,
        totalOrders,
        productsSold,
        topProducts: topProducts.map((p) => ({
          name: p._id,
          sales: p.sales,
          value: p.value,
        })),
        leadTrend: leadTrendData,
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
    const now = new Date();

    // Prepare 6-month ranges for income vs expense trend
    const monthRanges = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      monthRanges.push({ monthStart, monthEnd });
    }

    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      expenseBreakdown,
      processedPayroll,
      pendingPayroll,
      totalRevenueAgg,
      totalExpensesAgg,
      trendData,
    ] = await Promise.all([
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'paid' }),
      Invoice.countDocuments({ status: 'sent' }),
      Invoice.countDocuments({
        status: { $in: ['sent', 'overdue'] },
        dueDate: { $lt: now },
      }),
      Expense.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
      ]),
      Payroll.countDocuments({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'processed',
      }),
      Payroll.countDocuments({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        status: 'pending',
      }),
      Invoice.aggregate([
        { $match: { status: { $in: ['paid', 'Paid'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Expense.aggregate([
        { $match: { status: { $in: ['approved', 'Approved'] } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Promise.all(
        monthRanges.map(async (r) => {
          const [income, expense] = await Promise.all([
            Invoice.aggregate([
              { $match: { status: 'paid', paidDate: { $gte: r.monthStart, $lt: r.monthEnd } } },
              { $group: { _id: null, total: { $sum: '$total' } } },
            ]),
            Expense.aggregate([
              { $match: { status: 'approved', date: { $gte: r.monthStart, $lt: r.monthEnd } } },
              { $group: { _id: null, total: { $sum: '$amount' } } },
            ]),
          ]);
          return {
            month: r.monthStart.toLocaleDateString('en-US', { month: 'short' }),
            income: income[0]?.total || 0,
            expense: expense[0]?.total || 0,
          };
        })
      ),
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
        incomeExpenseTrend: trendData,
        expenseBreakdown: expenseBreakdown.map((e) => ({
          category: e._id || 'Uncategorized',
          total: e.total,
        })),
        payroll: {
          processed: processedPayroll,
          pending: pendingPayroll,
        },
        totalRevenue: totalRevenueAgg[0]?.total || 0,
        totalExpenses: totalExpensesAgg[0]?.total || 0,
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
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const now = new Date();

    const [
      notifications,
      pendingLeaves,
      newApplicants,
      overdueInvoices,
      unprocessedPayroll,
    ] = await Promise.all([
      Notification.find({
        recipient: req.user._id,
        read: false,
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('sender', 'name email')
        .lean(),
      Leave.countDocuments({ status: 'pending' }),
      JobApplication.countDocuments({
        status: 'applied',
        createdAt: { $gte: yesterday },
      }),
      Invoice.countDocuments({
        status: { $in: ['sent', 'overdue'] },
        dueDate: { $lt: now },
      }),
      Payroll.countDocuments({
        status: 'pending',
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications: notifications.map((n) => ({
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

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email role')
        .lean(),
      ActivityLog.estimatedDocumentCount ? ActivityLog.estimatedDocumentCount() : ActivityLog.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs: logs.map((log) => ({
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
