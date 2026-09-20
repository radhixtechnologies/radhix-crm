const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const emailController = require('../controllers/emailController');
const segmentController = require('../controllers/segmentController');
const automationController = require('../controllers/automationController');
const marketingReportsController = require('../controllers/marketingReportsController');

// Email Routes
router.get('/emails', protect, emailController.getAllEmails);
router.get('/emails/:id', protect, emailController.getEmailById);
router.post('/emails', protect, emailController.createEmail);
router.put('/emails/:id', protect, emailController.updateEmail);
router.delete('/emails/:id', protect, emailController.deleteEmail);
router.post('/emails/:id/schedule', protect, emailController.scheduleEmail);
router.post('/emails/:id/send', protect, emailController.sendEmail);
router.post('/emails/:id/test', protect, emailController.sendTestEmail);
router.get('/emails/:id/analytics', protect, emailController.getEmailAnalytics);

// Segment Routes
router.get('/segments', protect, segmentController.getAllSegments);
router.get('/segments/:id', protect, segmentController.getSegmentById);
router.get('/segments/:id/resolve', protect, segmentController.resolveSegmentMembers);
router.post('/segments/:id/refresh', protect, segmentController.refreshSegment);
router.post('/segments', protect, segmentController.createSegment);
router.put('/segments/:id', protect, segmentController.updateSegment);
router.delete('/segments/:id', protect, segmentController.deleteSegment);

// Automation Routes
router.get('/automations', protect, automationController.getAllAutomations);
router.get('/automations/:id', protect, automationController.getAutomationById);
router.post('/automations', protect, automationController.createAutomation);
router.put('/automations/:id', protect, automationController.updateAutomation);
router.delete('/automations/:id', protect, automationController.deleteAutomation);
router.patch('/automations/:id/status', protect, automationController.toggleAutomationStatus);
router.get('/automations/:id/history', protect, automationController.getAutomationHistory);
router.post('/automations/:id/test', protect, automationController.testAutomation);
router.post('/automations/:id/trigger', protect, automationController.triggerAutomation);
router.get('/automations/:id/stats', protect, automationController.getAutomationStats);

// Marketing Reports Routes
router.get('/reports/overview', protect, marketingReportsController.getMarketingOverview);
router.get('/reports/campaigns', protect, marketingReportsController.getCampaignPerformanceReport);
router.get('/reports/emails', protect, marketingReportsController.getEmailAnalyticsReport);
router.get('/reports/lead-sources', protect, marketingReportsController.getLeadSourceAnalysis);
router.get('/reports/funnel', protect, marketingReportsController.getConversionFunnel);
router.post('/reports/export', protect, marketingReportsController.exportMarketingReport);

module.exports = router;
