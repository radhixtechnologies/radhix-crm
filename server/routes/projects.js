const express = require('express');
const router = express.Router();
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/projectController');

router.use(protect, checkModuleAccess('employee'));

router.route('/')
  .get(controller.listProjects)
  .post(controller.createProject);

router.route('/:id')
  .get(controller.getProject)
  .put(controller.updateProject)
  .delete(controller.archiveProject);

router.post('/:id/tasks', controller.createProjectTask);
router.put('/:id/tasks/:taskId', controller.updateProjectTask);
router.delete('/:id/tasks/:taskId', controller.archiveProjectTask);
router.post('/:id/tasks/:taskId/updates', controller.addWorkUpdate);
router.post('/:id/milestones', controller.addMilestone);
router.put('/:id/milestones/:milestoneId', controller.updateMilestone);
router.delete('/:id/milestones/:milestoneId', controller.deleteMilestone);

module.exports = router;
