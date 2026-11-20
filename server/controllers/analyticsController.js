const Employee = require('../models/Employee');
const Invoice = require('../models/Invoice');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Expense = require('../models/Expense');
const { applyTenantScope } = require('../utils/tenantHelper');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res) => {
  try {
    const user = req.user;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    // Build scoped queries in parallel (cached tenant IDs will make this near-instant)
    const [
      empQuery,
      leaveQuery,
      invBase,
      paidInvQuery,
      pendingInvQuery,
      overdueInvQuery,
      paidMatch,
      expenseMatch,
      leadBase,
      newLeadQuery,
      qualLeadQuery,
      wonLeadQuery,
      dealBase,
      wonDealQuery,
      attTodayQuery,
    ] = await Promise.all([
      applyTenantScope({ status: 'active', deletedAt: null }, user, 'employee'),
      applyTenantScope({
        status: 'approved',
        startDate: { $lte: now },
        endDate: { $gte: now },
      }, user, 'leave'),
      applyTenantScope({}, user, 'invoice'),
      applyTenantScope({ status: 'paid' }, user, 'invoice'),
      applyTenantScope({ status: 'sent' }, user, 'invoice'),
      applyTenantScope({
        status: { $in: ['sent', 'overdue'] },
        dueDate: { $lt: now },
      }, user, 'invoice'),
      applyTenantScope({ status: 'paid' }, user, 'invoice'),
      applyTenantScope({ status: 'approved' }, user, 'expense'),
      applyTenantScope({}, user, 'lead'),
      applyTenantScope({ status: 'new' }, user, 'lead'),
      applyTenantScope({ status: 'qualified' }, user, 'lead'),
      applyTenantScope({ status: 'won' }, user, 'lead'),
      applyTenantScope({}, user, 'deal'),
      applyTenantScope({ stage: 'closed-won' }, user, 'deal'),
      applyTenantScope({
        date: { $gte: today, $lt: tomorrow },
        status: 'present',
      }, user, 'attendance'),
    ]);

    // Run all database operations concurrently
    const [
      totalEmployees,
      employeesOnLeave,
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue,
      totalExpenses,
      totalLeads,
      newLeads,
      qualifiedLeads,
      wonLeads,
      totalDeals,
      closedWonDeals,
      dealValueAgg,
      presentToday,
      recentLeads,
      recentInvoices,
    ] = await Promise.all([
      Employee.countDocuments(empQuery),
      Leave.countDocuments(leaveQuery),
      Invoice.countDocuments(invBase),
      Invoice.countDocuments(paidInvQuery),
      Invoice.countDocuments(pendingInvQuery),
      Invoice.countDocuments(overdueInvQuery),
      Invoice.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      Expense.aggregate([
        { $match: expenseMatch },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Lead.countDocuments(leadBase),
      Lead.countDocuments(newLeadQuery),
      Lead.countDocuments(qualLeadQuery),
      Lead.countDocuments(wonLeadQuery),
      Deal.countDocuments(dealBase),
      Deal.countDocuments(wonDealQuery),
      Deal.aggregate([
        { $match: dealBase },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
      Attendance.countDocuments(attTodayQuery),
      Lead.find(leadBase).sort({ createdAt: -1 }).limit(5).lean(),
      Invoice.find(invBase).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;
    const expenses = totalExpenses.length > 0 ? totalExpenses[0].total : 0;
    const dealValue = dealValueAgg.length > 0 ? dealValueAgg[0].total : 0;

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          onLeave: employeesOnLeave,
          presentToday: presentToday,
        },
        finance: {
          totalInvoices,
          paidInvoices,
          pendingInvoices,
          overdueInvoices,
          revenue,
          expenses,
          profit: revenue - expenses,
        },
        sales: {
          totalLeads,
          newLeads,
          qualifiedLeads,
          wonLeads,
          totalDeals,
          closedWonDeals,
          dealValue,
          conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(2) : 0,
        },
        recent: {
          leads: recentLeads,
          invoices: recentInvoices,
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
