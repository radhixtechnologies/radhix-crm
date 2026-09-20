const { asyncHandler } = require('../utils/asyncHandler');

exports.getEmployeeDashboard = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      employee: req.user,
      stats: {},
      recentActivities: [],
    },
  });
});
