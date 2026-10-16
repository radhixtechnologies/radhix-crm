const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const approvalController = require('../controllers/approvalController');

router.use(protect);

router.get('/', approvalController.getPendingApprovals);
router.post('/:type/:id/action', approvalController.processApproval);

module.exports = router;

