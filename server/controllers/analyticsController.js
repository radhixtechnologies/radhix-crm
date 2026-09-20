const Employee = require('../models/Employee');
const Invoice = require('../models/Invoice');
const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Expense = require('../models/Expense');

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardAnalytics = async (req, res) => {
  try {
    // Employee stats
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const employeesOnLeave = await Leave.countDocuments({ 
      status: 'approved',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    // Finance stats
    const totalInvoices = await Invoice.countDocuments();
    const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
    const pendingInvoices = await Invoice.countDocuments({ status: 'sent' });
    const overdueInvoices = await Invoice.countDocuments({ 
      status: { $in: ['sent', 'overdue'] },
      dueDate: { $lt: new Date() },
    });

    const totalRevenue = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const revenue = totalRevenue.length > 0 ? totalRevenue[0].total : 0;

    const totalExpenses = await Expense.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const expenses = totalExpenses.length > 0 ? totalExpenses[0].total : 0;

    // Sales stats
    const totalLeads = await Lead.countDocuments();
    const newLeads = await Lead.countDocuments({ status: 'new' });
    const qualifiedLeads = await Lead.countDocuments({ status: 'qualified' });
    const wonLeads = await Lead.countDocuments({ status: 'won' });

    const totalDeals = await Deal.countDocuments();
    const closedWonDeals = await Deal.countDocuments({ stage: 'closed-won' });
    const totalDealValue = await Deal.aggregate([
      { $group: { _id: null, total: { $sum: '$value' } } },
    ]);
    const dealValue = totalDealValue.length > 0 ? totalDealValue[0].total : 0;

    // Attendance stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
      status: 'present',
    });

    // Recent activity (can be enhanced)
    const recentLeads = await Lead.find().sort({ createdAt: -1 }).limit(5);
    const recentInvoices = await Invoice.find().sort({ createdAt: -1 }).limit(5);

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

