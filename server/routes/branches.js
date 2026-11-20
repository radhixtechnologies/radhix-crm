const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const branchController = require('../controllers/branchController');

router.use(protect);

router.get('/', branchController.getBranches);
router.post('/', branchController.createBranch);
router.put('/:id', branchController.updateBranch);
router.delete('/:id', branchController.deleteBranch);

module.exports = router;

