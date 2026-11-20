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

        const currentYear = new Date().getFullYear();
        const firstDayCurrentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const firstDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const lastDayLastMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

        // Run all independent queries in parallel using Promise.all
        const [
            totalLeads,
            totalClients,
            totalDeals,
            wonDeals,
            lostDealsCount,
            convertedLeads,
            followUpsPending,
            pipelineByStage,
            monthlyRevenue,
            leadsBySource,
            recentLeads,
            recentDeals,
            upcomingActivities,
            currentMonthLeads,
            currentMonthRevenue,
            lastMonthLeads,
            lastMonthRevenue,
            closedDealsWithDates,
            topDeals,
            totalProposals,
            acceptedProposals,
            totalQuotations,
            acceptedQuotations,
        ] = await Promise.all([
            Lead.countDocuments({ isDeleted: { $ne: true } }),
            Client.countDocuments({ isDeleted: { $ne: true } }),
            Deal.countDocuments({ isDeleted: { $ne: true } }),
            Deal.find({ stage: 'closed-won', isDeleted: { $ne: true } }).select('value').lean(),
            Deal.countDocuments({ stage: 'closed-lost', isDeleted: { $ne: true } }),
            Lead.countDocuments({
                $or: [{ convertedToClient: { $ne: null } }, { convertedToContact: { $ne: null } }],
                isDeleted: { $ne: true }
            }),
            Activity.countDocuments({
                status: 'scheduled',
                isDeleted: { $ne: true }
            }),
            Deal.aggregate([
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
            ]),
            Deal.aggregate([
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
            ]),
            Lead.aggregate([
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
            ]),
            Lead.find({ isDeleted: { $ne: true } })
                .sort({ createdAt: -1 })
                .limit(10)
                .select('name status createdAt company email phone source temperature value currency')
                .lean(),
            Deal.find({ isDeleted: { $ne: true } })
                .sort({ updatedAt: -1 })
                .limit(10)
                .populate('client', 'name email')
                .populate('contact', 'name email')
                .select('title value stage updatedAt client contact probability currency')
                .lean(),
            Activity.find({
                status: 'scheduled',
                dueDate: { $gte: new Date() },
                isDeleted: { $ne: true }
            })
                .sort({ dueDate: 1 })
                .limit(10)
                .populate('assignedTo', 'name')
                .select('type subject dueDate status assignedTo relatedTo')
                .lean(),
            Lead.countDocuments({
                createdAt: { $gte: firstDayCurrentMonth },
                isDeleted: { $ne: true }
            }),
            Deal.aggregate([
                {
                    $match: {
                        stage: 'closed-won',
                        isDeleted: { $ne: true },
                        updatedAt: { $gte: firstDayCurrentMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]),
            Lead.countDocuments({
                createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth },
                isDeleted: { $ne: true }
            }),
            Deal.aggregate([
                {
                    $match: {
                        stage: 'closed-won',
                        isDeleted: { $ne: true },
                        updatedAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth }
                    }
                },
                { $group: { _id: null, total: { $sum: "$value" } } }
            ]),
            Deal.find({
                stage: { $in: ['closed-won', 'closed-lost'] },
                isDeleted: { $ne: true },
                createdAt: { $exists: true },
                updatedAt: { $exists: true }
            }).select('createdAt updatedAt').lean(),
            Deal.find({
                stage: 'closed-won',
                isDeleted: { $ne: true }
            })
                .sort({ value: -1 })
                .limit(5)
                .populate('client', 'name')
                .select('title value client updatedAt')
                .lean(),
            Proposal ? Proposal.countDocuments({ isDeleted: { $ne: true } }) : Promise.resolve(0),
            Proposal ? Proposal.countDocuments({ status: 'accepted', isDeleted: { $ne: true } }) : Promise.resolve(0),
            Quotation ? Quotation.countDocuments({ isDeleted: { $ne: true } }) : Promise.resolve(0),
            Quotation ? Quotation.countDocuments({ status: 'accepted', isDeleted: { $ne: true } }) : Promise.resolve(0),
        ]);

        const wonDealsCount = wonDeals.length;
        const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        const totalClosed = wonDealsCount + lostDealsCount;

        // Win Rate
        const winRate = totalClosed > 0 ? Math.round((wonDealsCount / totalClosed) * 100) : 0;

        // Average Deal Size
        const averageDealSize = wonDealsCount > 0 ? Math.round(totalRevenue / wonDealsCount) : 0;

        // Conversion Rate (Leads to Deals)
        const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

        const currentRevenue = currentMonthRevenue[0]?.total || 0;
        const lastRevenue = lastMonthRevenue[0]?.total || 0;

        // Calculate Changes
        const leadsChange = lastMonthLeads > 0
            ? Math.round(((currentMonthLeads - lastMonthLeads) / lastMonthLeads) * 100)
            : currentMonthLeads > 0 ? 100 : 0;

        const revenueChange = lastRevenue > 0
            ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100)
            : currentRevenue > 0 ? 100 : 0;

        // Deal Velocity
        let avgDaysToClose = 0;
        if (closedDealsWithDates.length > 0) {
            const totalDays = closedDealsWithDates.reduce((sum, deal) => {
                const days = Math.floor((new Date(deal.updatedAt) - new Date(deal.createdAt)) / (1000 * 60 * 60 * 24));
                return sum + days;
            }, 0);
            avgDaysToClose = Math.round(totalDays / closedDealsWithDates.length);
        }

        // ===== RESPONSE =====
        res.status(200).json({
            success: true,
            data: {
                kpis: {
                    totalLeads,
                    totalClients,
                    totalDeals,
                    wonDeals: wonDealsCount,
                    lostDeals: lostDealsCount,
                    totalRevenue,
                    winRate,
                    averageDealSize,
                    conversionRate,
                    followUpsPending,
                    currentMonthLeads,
                    leadsChange,
                    currentRevenue,
                    revenueChange,
                    avgDaysToClose,
                    totalProposals,
                    acceptedProposals,
                    proposalWinRate: totalProposals > 0 ? Math.round((acceptedProposals / totalProposals) * 100) : 0,
                    totalQuotations,
                    acceptedQuotations,
                    quotationWinRate: totalQuotations > 0 ? Math.round((acceptedQuotations / totalQuotations) * 100) : 0
                },
                pipeline: pipelineByStage,
                monthlyRevenue,
                leadsBySource,
                recentActivity: {
                    leads: recentLeads,
                    deals: recentDeals,
                    activities: upcomingActivities
                },
                topDeals
            }
        });
    } catch (error) {
        console.error('Error in getDashboardStats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics',
            error: error.message
        });
    }
};
