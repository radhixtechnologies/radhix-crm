const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const Deal = require('../models/Deal');

// Revenue Dashboard
exports.getRevenueDashboard = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Total Revenue (from paid invoices)
        const paidInvoices = await Invoice.find({
            status: 'paid',
            ...dateFilter
        });
        const totalRevenue = paidInvoices.reduce((sum, inv) => sum + inv.total, 0);

        // Outstanding Revenue (unpaid invoices)
        const unpaidInvoices = await Invoice.find({
            status: { $in: ['sent', 'pending', 'overdue'] }
        });
        const outstandingRevenue = unpaidInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

        // Total Expenses
        const expenses = await Expense.find({
            status: 'Paid',
            ...dateFilter
        });
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Profit
        const profit = totalRevenue - totalExpenses;

        // Revenue by Month (last 12 months)
        const revenueByMonth = await Invoice.aggregate([
            {
                $match: {
                    status: 'paid',
                    paymentDate: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 12))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$paymentDate' },
                        month: { $month: '$paymentDate' }
                    },
                    revenue: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 }
            }
        ]);

        // Invoice Status Breakdown
        const invoiceStats = await Invoice.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$total' }
                }
            }
        ]);

        res.json({
            totalRevenue,
            outstandingRevenue,
            totalExpenses,
            profit,
            profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0,
            revenueByMonth,
            invoiceStats,
            summary: {
                totalInvoices: paidInvoices.length + unpaidInvoices.length,
                paidInvoices: paidInvoices.length,
                unpaidInvoices: unpaidInvoices.length
            }
        });
    } catch (error) {
        console.error('Error fetching revenue dashboard:', error);
        res.status(500).json({ message: 'Error fetching revenue dashboard', error: error.message });
    }
};

// Outstanding Invoices Report
exports.getOutstandingReport = async (req, res) => {
    try {
        const outstandingInvoices = await Invoice.find({
            status: { $in: ['sent', 'pending', 'overdue'] },
            balanceDue: { $gt: 0 }
        })
            .populate('client', 'companyName email')
            .populate('createdBy', 'name')
            .sort({ dueDate: 1 });

        // Aging analysis
        const now = new Date();
        const aging = {
            current: [], // 0-30 days
            days30to60: [],
            days61to90: [],
            over90: []
        };

        outstandingInvoices.forEach(invoice => {
            const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));

            if (daysOverdue <= 30) {
                aging.current.push(invoice);
            } else if (daysOverdue <= 60) {
                aging.days30to60.push(invoice);
            } else if (daysOverdue <= 90) {
                aging.days61to90.push(invoice);
            } else {
                aging.over90.push(invoice);
            }
        });

        const agingSummary = {
            current: {
                count: aging.current.length,
                amount: aging.current.reduce((sum, inv) => sum + inv.balanceDue, 0)
            },
            days30to60: {
                count: aging.days30to60.length,
                amount: aging.days30to60.reduce((sum, inv) => sum + inv.balanceDue, 0)
            },
            days61to90: {
                count: aging.days61to90.length,
                amount: aging.days61to90.reduce((sum, inv) => sum + inv.balanceDue, 0)
            },
            over90: {
                count: aging.over90.length,
                amount: aging.over90.reduce((sum, inv) => sum + inv.balanceDue, 0)
            }
        };

        res.json({
            outstandingInvoices,
            aging,
            agingSummary,
            totalOutstanding: outstandingInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0)
        });
    } catch (error) {
        console.error('Error fetching outstanding report:', error);
        res.status(500).json({ message: 'Error fetching outstanding report', error: error.message });
    }
};

// Profit & Loss Report
exports.getProfitLossReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Revenue
        const revenue = await Invoice.aggregate([
            {
                $match: {
                    status: 'paid',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$total' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Expenses by Category
        const expensesByCategory = await Expense.aggregate([
            {
                $match: {
                    status: 'Paid',
                    ...dateFilter
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { totalAmount: -1 }
            }
        ]);

        const totalRevenue = revenue[0]?.totalRevenue || 0;
        const totalExpenses = expensesByCategory.reduce((sum, cat) => sum + cat.totalAmount, 0);
        const grossProfit = totalRevenue;
        const netProfit = totalRevenue - totalExpenses;

        res.json({
            revenue: {
                total: totalRevenue,
                invoiceCount: revenue[0]?.count || 0
            },
            expenses: {
                total: totalExpenses,
                byCategory: expensesByCategory
            },
            grossProfit,
            netProfit,
            profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0
        });
    } catch (error) {
        console.error('Error fetching P&L report:', error);
        res.status(500).json({ message: 'Error fetching P&L report', error: error.message });
    }
};

// Revenue by Sales Rep
exports.getRevenueBySalesRep = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Get deals with paid invoices
        const paidInvoices = await Invoice.find({
            status: 'paid',
            ...dateFilter
        }).populate('relatedDeal');

        // Group by sales rep
        const revenueByRep = {};

        for (const invoice of paidInvoices) {
            if (invoice.relatedDeal && invoice.relatedDeal.assignedTo) {
                const repId = invoice.relatedDeal.assignedTo.toString();

                if (!revenueByRep[repId]) {
                    revenueByRep[repId] = {
                        salesRep: invoice.relatedDeal.assignedTo,
                        revenue: 0,
                        deals: 0,
                        invoices: 0
                    };
                }

                revenueByRep[repId].revenue += invoice.total;
                revenueByRep[repId].invoices += 1;
            }
        }

        const result = Object.values(revenueByRep);

        // Populate sales rep details
        const Deal = require('../models/Deal');
        for (const rep of result) {
            const deal = await Deal.findOne({ assignedTo: rep.salesRep }).populate('assignedTo', 'name email');
            if (deal && deal.assignedTo) {
                rep.salesRepName = deal.assignedTo.name;
                rep.salesRepEmail = deal.assignedTo.email;
            }
        }

        res.json(result.sort((a, b) => b.revenue - a.revenue));
    } catch (error) {
        console.error('Error fetching revenue by sales rep:', error);
        res.status(500).json({ message: 'Error fetching revenue by sales rep', error: error.message });
    }
};

// Revenue by Product/Service
exports.getRevenueByProduct = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const invoices = await Invoice.find({
            status: 'paid',
            ...dateFilter
        });

        const productRevenue = {};

        invoices.forEach(invoice => {
            invoice.items.forEach(item => {
                if (!productRevenue[item.name]) {
                    productRevenue[item.name] = {
                        productName: item.name,
                        revenue: 0,
                        quantity: 0,
                        invoices: 0
                    };
                }

                productRevenue[item.name].revenue += item.amount;
                productRevenue[item.name].quantity += item.quantity;
                productRevenue[item.name].invoices += 1;
            });
        });

        const result = Object.values(productRevenue).sort((a, b) => b.revenue - a.revenue);

        res.json(result);
    } catch (error) {
        console.error('Error fetching revenue by product:', error);
        res.status(500).json({ message: 'Error fetching revenue by product', error: error.message });
    }
};

// Cash Flow Forecast
exports.getCashFlowForecast = async (req, res) => {
    try {
        const { months = 3 } = req.query;

        const today = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + parseInt(months));

        // Expected incoming payments (unpaid invoices due in next X months)
        const upcomingInvoices = await Invoice.find({
            status: { $in: ['sent', 'pending'] },
            dueDate: {
                $gte: today,
                $lte: futureDate
            }
        }).sort({ dueDate: 1 });

        const expectedIncome = upcomingInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

        // Expected expenses (approved but unpaid)
        const upcomingExpenses = await Expense.find({
            status: 'Approved',
            expenseDate: {
                $gte: today,
                $lte: futureDate
            }
        });

        const expectedExpenses = upcomingExpenses.reduce((sum, exp) => sum + exp.amount, 0);

        // Current cash position (total paid - total expenses paid)
        const totalPaid = await Invoice.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, total: { $sum: '$total' } } }
        ]);

        const totalExpensesPaid = await Expense.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const currentCash = (totalPaid[0]?.total || 0) - (totalExpensesPaid[0]?.total || 0);
        const projectedCash = currentCash + expectedIncome - expectedExpenses;

        res.json({
            currentCash,
            expectedIncome,
            expectedExpenses,
            projectedCash,
            upcomingInvoices: upcomingInvoices.map(inv => ({
                invoiceNumber: inv.invoiceNumber,
                amount: inv.balanceDue,
                dueDate: inv.dueDate,
                client: inv.client
            })),
            upcomingExpenses: upcomingExpenses.map(exp => ({
                expenseNumber: exp.expenseNumber,
                amount: exp.amount,
                category: exp.category,
                expenseDate: exp.expenseDate
            }))
        });
    } catch (error) {
        console.error('Error fetching cash flow forecast:', error);
        res.status(500).json({ message: 'Error fetching cash flow forecast', error: error.message });
    }
};
