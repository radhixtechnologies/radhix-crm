const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(Number(req.query.limit) || 50);
    res.json({ success: true, data: notifications });
  } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.getUnreadCount = async (req, res) => {
  try { res.json({ success: true, count: await Notification.countDocuments({ user: req.user._id, isRead: false }) }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.markAsRead = async (req, res) => {
  try { const data = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true }); res.json({ success: true, data }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.markAllAsRead = async (req, res) => {
  try { await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.deleteNotification = async (req, res) => {
  try { await Notification.deleteOne({ _id: req.params.id, user: req.user._id }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};
exports.deleteAllNotifications = async (req, res) => {
  try { await Notification.deleteMany({ user: req.user._id }); res.json({ success: true }); }
  catch (error) { res.status(500).json({ success: false, message: error.message }); }
};