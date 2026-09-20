const express = require('express');
const router = express.Router();
const pipelineStageController = require('../controllers/pipelineStageController');
const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Pipeline stage routes
router.get('/', pipelineStageController.getStages);
router.post('/', pipelineStageController.createStage);
router.put('/:id', pipelineStageController.updateStage);
router.delete('/:id', pipelineStageController.deleteStage);
router.patch('/reorder', pipelineStageController.reorderStages);

module.exports = router;
