const Lead = require('../../models/Lead');
const Deal = require('../../models/Deal');
const Client = require('../../models/Client');
const Activity = require('../../models/Activity');
const mongoose = require('mongoose');

let Quotation;
let Proposal;
try {
    Quotation = require('../../models/Quotation');
    Proposal = require('../../models/Proposal');
} catch (error) {
    console.warn('Quotation/Proposal models unavailable; dashboard document metrics will be zero.');
}

exports.getDashboardStats = async (req, res) => {
    try {
        const { startDate, endDate, period = '30' } = req.query;

        // Calculate date range
        const now = new Date();
        const daysAgo = parseInt(period) || 30;
        const dateFilter = startDate && endDate ? {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        } : {
            $gte: new Date(now.setDate(now.getDate() - daysAgo))
        };

        // ===== 1. CORE KPIs =====
        const totalLeads = await Lead.countDocuments({ isDeleted: { $ne: true } });
        const totalClients = await Client.countDocuments({ isDeleted: { $ne: true } });
        const totalDeals = await Deal.countDocuments({ isDeleted: { $ne: true } });

        // Revenue calculations
        const wonDeals = await Deal.find({ stage: 'closed-won', isDeleted: { $ne: true } });
        const wonDealsCount = wonDeals.length;
        const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);

        const lostDealsCount = await Deal.countDocuments({ stage: 'closed-lost', isDeleted: { $ne: true } });
        const totalClosed = wonDealsCount + lostDealsCount;

        // Win Rate
        const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 0;

        // Average Deal Size
        const averageDealSize = wonDealsCount > 0 ? Math.round(totalRevenue / wonDealsCount) : 0;

        // Conversion Rate (Leads to Deals)
        const convertedLeads = await Lead.countDocuments({
            $or: [{ convertedToClient: { $ne: null } }, { convertedToContact: { $ne: null } }],
            isDeleted: { $ne: true }
        });
        const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

        // Pending Activities
        const followUpsPending = await Activity.countDocuments({
            status: 'scheduled',
            isDeleted: { $ne: true }
        });

        // ===== 2. PIPELINE ANALYSIS =====
        const pipelineByStage = await Deal.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: "$stage",
                    count: { $sum: 1 },
                    totalValue: { $sum: "$value" },
                    avgValue: { $avg: "$value" }
                }
            },
            { $sort: { totalValue: -1 } }
        ]);

        // ===== 3. REVENUE TRENDS =====
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = await Deal.aggregate([
            {
                $match: {
                    stage: 'closed-won',
                    isDeleted: { $ne: true },
                    updatedAt: {
                        $gte: new Date(`${currentYear}-01-01`),
                        $lte: new Date(`${currentYear}-12-31`)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$updatedAt" },
                        year: { $year: "$updatedAt" }
                    },
                    revenue: { $sum: "$value" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // ===== 4. LEAD SOURCE ANALYSIS =====
        const leadsBySource = await Lead.aggregate([
            { $match: { isDeleted: { $ne: true } } },
            {
                $group: {
                    _id: "$source",
                    count: { $sum: 1 },
                    converted: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $ne: ["$convertedToClient", null] },
                                        { $ne: ["$convertedToContact", null] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // ===== 5. RECENT ACTIVITY =====
        const recentLeads = await Lead.find({ isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name status createdAt company email phone source temperature value currency')
            .lean();

        const recentDeals = await Deal.find({ isDeleted: { $ne: true } })
            .sort({ updatedAt: -1 })
            .limit(10)
            .populate('client', 'name email')
            .populate('contact', 'name email')
            .select('title value stage updatedAt client contact probability currency')
            .lean();

        const upcomingActivities = await Activity.find({
            status: 'scheduled',
            dueDate: { $gte: new Date() },
            isDeleted: { $ne: true }
        })
            .sort({ dueDate: 1 })
            .limit(10)
            .populate('assignedTo', 'name')
            .select('type subject dueDate status assignedTo relatedTo')
            .lean();

        // ===== 6. MONTH-OVER-MONTH COMPARISON =====
        const firstDayCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const firstDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const lastDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

        // Current Month Stats
        const currentMonthLeads = await Lead.countDocuments({
            createdAt: { $gte: firstDayCurrentMonth },
            isDeleted: { $ne: true }
        });

        const currentMonthRevenue = await Deal.aggregate([
            {
                $match: {
                    stage: 'closed-won',
                    isDeleted: { $ne: true },
                    updatedAt: { $gte: firstDayCurrentMonth }
                }
            },
            { $group: { _id: null, total: { $sum: "$value" } } }
        ]);
        const currentRevenue = currentMonthRevenue[0]?.total || 0;

        // Last Month Stats
        const lastMonthLeads = await Lead.countDocuments({
            createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
            isDeleted: { $ne: true }
        });

        const lastMonthRevenue = await Deal.aggregate([
            {
                $match: {
                    stage: 'closed-won',
                    isDeleted: { $ne: true },
                    updatedAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth }
                }
            },
            { $group: { _id: null, total: { $sum: "$value" } } }
        ]);
        const lastRevenue = lastMonthRevenue[0]?.total || 0;

        // Calculate Changes
        const leadsChange = lastMonthLeads > 0
            ? Math.round(((currentMonthLeads - lastMonthLeads) / lastMonthLeads) * 100)
            : currentMonthLeads > 0 ? 100 : 0;

        const revenueChange = lastRevenue > 0
            ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
            : currentRevenue > 0 ? 100 : 0;

        // ===== 7. DEAL VELOCITY (Average days to close) =====
        const closedDealsWithDates = await Deal.find({
            stage: { $in: ['closed-won', 'closed-lost'] },
            isDeleted: { $ne: true },
            createdAt: { $exists: true },
            updatedAt: { $exists: true }
        }).select('createdAt updatedAt').lean();

        let avgDaysToClose = 0;
        if (closedDealsWithDates.length > 0) {
            const totalDays = closedDealsWithDates.reduce((sum, deal) => {
                const days = Math.floor((new Date(deal.updatedAt) - new Date(deal.createdAt)) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgDaysToClose = Math.round(totalDays / closedDealsWithDates.length);
        }

        // ===== 8. TOP PERFORMERS =====
        const topDeals = await Deal.find({
            stage: 'closed-won',
            isDeleted: { $ne: true }
        })
            .sort({ value: -1 })
            .limit(5)
            .populate('client', 'name')
            .select('title value client updatedAt')
            .lean();

        // ===== 9. PROPOSAL & QUOTATION STATS =====
        const totalProposals = Proposal ? await Proposal.countDocuments({ isDeleted: { $ne: true } }) : 0;
        const acceptedProposals = Proposal ? await Proposal.countDocuments({ status: 'accepted', isDeleted: { $ne: true } }) : 0;
        const totalQuotations = Quotation ? await Quotation.countDocuments({ isDeleted: { $ne: true } }) : 0;
        const acceptedQuotations = Quotation ? await Quotation.countDocuments({ status: 'accepted', isDeleted: { $ne: true } }) : 0;

        // ===== RESPONSE =====
        res.status(200).json({
            success: true,
            data: {
                kpis: {
                    totalLeads,
                    totalClients,
                    totalDeals,
                    totalRevenue,
                    wonDeals: wonDealsCount,
                    lostDeals: lostDealsCount,
                    conversionRate,
                    convertedLeads,
                    followUpsPending,
                    winRate,
                    averageDealSize,
                    avgDaysToClose,
                    totalProposals,
                    acceptedProposals,
                    totalQuotations,
                    acceptedQuotations,
                    // Trends
                    leadsChange,
                    revenueChange,
                    currentMonthLeads,
                    currentMonthRevenue: currentRevenue
                },
                pipeline: pipelineByStage,
                monthlyRevenue,
                leadsBySource,
                recentActivity: {
                    leads: recentLeads,
                    deals: recentDeals,
                    upcoming: upcomingActivities
                },
                topDeals
            }
        });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server Error fetching dashboard stats',
            error: error.message
        });
    }
};
