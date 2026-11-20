const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const subscriptionController = require('../controllers/subscriptionController');

// Public or logged-in plans catalog
router.get('/plans', subscriptionController.getPlans);

// Tenant routes (Company Admin)
router.get('/my-subscription', protect, subscriptionController.getMySubscription);
router.put('/company-settings', protect, subscriptionController.updateCompanySettings);
router.post('/change-plan', protect, subscriptionController.changePlan);

// SuperAdmin SaaS Management
router.get('/tenants', protect, authorize('super_admin'), subscriptionController.getAllTenants);
router.post('/tenants', protect, authorize('super_admin'), subscriptionController.createTenantCompany);
router.put('/tenants/:id', protect, authorize('super_admin'), subscriptionController.updateTenantSubscription);
router.get('/tenants/:id/details', protect, authorize('super_admin'), subscriptionController.getTenantDetails);
router.post('/tenants/:id/impersonate', protect, authorize('super_admin'), subscriptionController.impersonateTenant);
router.post('/tenants/:id/reset-password', protect, authorize('super_admin'), subscriptionController.resetTenantPassword);
router.put('/tenants/:id/profile', protect, authorize('super_admin'), subscriptionController.updateTenantCompanyProfile);

module.exports = router;

