const express = require('express');
const router = express.Router();
const {
  getUsers,
  getRoles,
  getUser,
  createAdmin,
  updateAdminModules,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);

router.get('/', authorize('super_admin', 'admin'), getUsers);
router.get('/roles', authorize('super_admin', 'admin'), getRoles);
router.get('/:id', getUser);
router.post('/admin', authorize('super_admin'), createAdmin);
router.put('/:id/modules', authorize('super_admin'), updateAdminModules);
router.put('/:id', authorize('super_admin', 'admin'), updateUser);
router.delete('/:id', authorize('super_admin', 'admin'), deleteUser);

module.exports = router;

