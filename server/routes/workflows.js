const express = require('express');
const router = express.Router();
const workflowController = require('../controllers/workflowController');
const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/', workflowController.getWorkflows);
router.post('/', workflowController.createWorkflow);
router.put('/:id/toggle', workflowController.toggleWorkflow);
router.delete('/:id', workflowController.deleteWorkflow);

module.exports = router;

