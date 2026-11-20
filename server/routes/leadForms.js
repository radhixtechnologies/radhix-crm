const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const leadFormController = require('../controllers/leadFormController');

// Public capture routes (no login required, used in website iframes)
router.get('/public/:id', leadFormController.getPublicForm);
router.post('/public/:id/submit', leadFormController.submitPublicForm);

// Protected routes for CRM users
router.get('/', protect, leadFormController.listForms);
router.post('/', protect, leadFormController.createForm);
router.delete('/:id', protect, leadFormController.deleteForm);

module.exports = router;

