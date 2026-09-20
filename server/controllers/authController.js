const authService = require('../services/authService');

const sendResult = (promise, res, next) => promise.then((result) => res.status(result.statusCode || 200).json(result)).catch(next);

exports.login = (req, res, next) => sendResult(authService.login(req.body.email, req.body.password, req.ip, req.get('user-agent')), res, next);
exports.logout = (req, res, next) => sendResult(authService.logout(req.headers.authorization?.replace('Bearer ', ''), req.body?.sessionId), res, next);
exports.logoutAll = (req, res, next) => sendResult(authService.logoutAll(req.user._id), res, next);
exports.getMe = (req, res, next) => sendResult(authService.getCurrentUser(req.user._id), res, next);
exports.getPermissions = (req, res) => res.json({ success: true, data: authService.getUserPermissions(req.user) });
exports.getSessions = (req, res, next) => sendResult(authService.getUserSessions(req.user._id), res, next);
exports.updateProfile = (req, res, next) => sendResult(authService.updateProfile(req.user._id, req.body), res, next);
exports.changePassword = (req, res, next) => sendResult(authService.changePassword(req.user._id, req.body.currentPassword, req.body.newPassword), res, next);
exports.forgotPassword = (req, res, next) => sendResult(authService.forgotPassword(req.body.email), res, next);
exports.resetPassword = (req, res, next) => sendResult(authService.resetPassword(req.params.resettoken, req.body.password), res, next);
exports.register = (req, res, next) => sendResult(authService.register(req.body, req.user), res, next);
exports.adminResetPassword = (req, res, next) => sendResult(authService.adminResetPassword(req.params.userId, req.body.newPassword, req.user), res, next);
exports.generateTemporaryPassword = (req, res, next) => sendResult(authService.generateTemporaryPassword(req.params.userId, req.user), res, next);
