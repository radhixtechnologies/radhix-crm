const Lead = require('../models/Lead');
const Deal = require('../models/Deal');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const getDateRange = (query) => {
  const range = {};
  if (query.startDate) range.$gte = new Date(query.startDate);
  if (query.endDate) {
    const endDate = new Date(query.endDate);
    endDate.setHours(23, 59, 59, 999);
    range.$lte = endDate;
  }
  return Object.keys(range).length ? range : null;
};

exports.getLeadConversionReport = async (req, res) => {
  try {
    const dateRange = getDateRange(req.query);
    const match = dateRange ? { createdAt: dateRange } : {};
    const grouped = await Lead.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $ifNull: ['$source', 'unknown'] },
          totalCount: { $sum: 1 },
          convertedCount: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        },
      },
      { $sort: { totalCount: -1 } },
    ]);
    const data = grouped.map((source) => ({
      ...source,
      conversionRate: source.totalCount ? (source.convertedCount / source.totalCount) * 100 : 0,
    }));
    const total = data.reduce((sum, source) => sum + source.totalCount, 0);
    const converted = data.reduce((sum, source) => sum + source.convertedCount, 0);

    res.json({
      success: true,
      data,
      summary: { total, converted, conversionRate: total ? (converted / total) * 100 : 0 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSalesPerformanceReport = async (req, res) => {
  try {
    const dateRange = getDateRange(req.query);
    const pipeline = [
      { $match: { status: 'won', isDeleted: { $ne: true } } },
      {
        $addFields: {
          reportDate: { $ifNull: ['$closedDate', { $ifNull: ['$wonDate', '$updatedAt'] }] },
        },
      },
    ];
    if (dateRange) pipeline.push({ $match: { reportDate: dateRange } });
    pipeline.push({
      $group: {
        _id: '$assignedTo',
        dealsWon: { $sum: 1 },
        revenue: { $sum: '$value' },
      },
    });

    const grouped = await Deal.aggregate(pipeline);
    const assignedUserIds = grouped.map((item) => item._id).filter(Boolean);
    const users = await User.find({ _id: { $in: assignedUserIds } }).select('name email').lean();
    const usersById = new Map(users.map((user) => [user._id.toString(), user]));
    const data = grouped.map((item) => ({
      name: usersById.get(item._id?.toString())?.name || 'Unassigned',
      dealsWon: item.dealsWon,
      revenue: item.revenue,
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMarketingROIReport = async (req, res) => {
  try {
    const dateRange = getDateRange(req.query);
    const query = dateRange ? { createdAt: dateRange } : {};
    const data = await Campaign.find(query, 'name budget actualSpend roi metrics').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};