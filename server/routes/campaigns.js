const express = require('express');
const router = express.Router();
const {
    getAllCampaigns,
    getCampaignById,
    createCampaign,
    updateCampaign,
    updateCampaignStatus,
    deleteCampaign,
    getCampaignMetrics,
    getCampaignAnalytics,
    duplicateCampaign,
} = require('../controllers/campaignController');
const { protect, authorize } = require('../middlewares/auth');

// Protect all routes
router.use(protect);

// Campaign routes
router.route('/')
    .get(getAllCampaigns)
    .post(createCampaign);

router.route('/:id')
    .get(getCampaignById)
    .put(updateCampaign)
    .delete(deleteCampaign);

router.patch('/:id/status', updateCampaignStatus);
router.get('/:id/metrics', getCampaignMetrics);
router.get('/:id/analytics', getCampaignAnalytics);
router.post('/:id/duplicate', duplicateCampaign);

module.exports = router;
