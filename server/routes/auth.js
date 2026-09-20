const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  logoutAll,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getSessions,
  getPermissions,
  adminResetPassword,
  generateTemporaryPassword,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/auth');
const checkDatabaseConnection = require('../middlewares/dbCheck');

// Public routes
router.post('/login', checkDatabaseConnection, login);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Protected routes
router.post('/register', protect, register);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.get('/me', protect, getMe);
router.get('/permissions', protect, getPermissions);
router.get('/sessions', protect, getSessions);
router.put('/updateprofile', protect, updateProfile);
router.put('/changepassword', protect, changePassword);

// Admin routes for password reset
router.post('/admin/reset-password/:userId', protect, authorize('super_admin', 'admin'), adminResetPassword);
router.post('/admin/generate-temp-password/:userId', protect, authorize('super_admin', 'admin'), generateTemporaryPassword);

module.exports = router;
