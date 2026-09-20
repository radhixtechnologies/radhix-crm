const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess } = require('../middlewares/auth');
const { getDashboardStats } = require('../controllers/sales/dashboardController');

router.get('/stats', protect, checkModuleAccess('sales'), getDashboardStats);

module.exports = router;
