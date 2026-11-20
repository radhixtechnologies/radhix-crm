const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/brandingController');
const { protect, optionalAuth } = require('../middlewares/auth');

// Public route for public previews and unauthenticated views
router.get('/public', brandingController.getPublicBranding);

// Branding endpoint (safe for unauthenticated visitors and authenticated users)
router.get('/', optionalAuth, brandingController.getBranding);
router.put('/', protect, brandingController.updateBranding);
router.post('/reset', protect, brandingController.resetBranding);

module.exports = router;

