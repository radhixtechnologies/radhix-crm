const express = require('express');
const router = express.Router();
const dealController = require('../controllers/dealController');
const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Deal CRUD routes
router.get('/', dealController.getDeals);
router.get('/:id', dealController.getDealById);
router.post('/', dealController.createDeal);
router.put('/:id', dealController.updateDeal);
router.delete('/:id', dealController.deleteDeal);

// Deal stage and status management
router.patch('/:id/stage', dealController.changeDealStage);
router.patch('/:id/status', dealController.changeDealStatus);

module.exports = router;
