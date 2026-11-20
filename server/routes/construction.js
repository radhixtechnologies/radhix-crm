const express = require('express');
const { protect, checkModuleAccess } = require('../middlewares/auth');
const controller = require('../controllers/constructionController');

const router = express.Router();
router.use(protect, checkModuleAccess('sales'));

router.get('/summary', controller.getSummary);
router.route('/projects')
  .get(controller.getProjects)
  .post(controller.createProject);
router.route('/projects/:id')
  .get(controller.getProject)
  .put(controller.updateProject)
  .delete(controller.deleteProject);
router.post('/projects/:id/estimate', controller.addBillItem);
router.put('/projects/:id/estimate/:itemId', controller.updateBillItem);
router.delete('/projects/:id/estimate/:itemId', controller.deleteBillItem);
router.route('/vendors')
  .get(controller.getVendors)
  .post(controller.createVendor);
router.route('/vendors/:id')
  .put(controller.updateVendor)
  .delete(controller.deleteVendor);

module.exports = router;
