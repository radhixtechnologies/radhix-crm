const Reminder = require('../../models/Reminder');
const fail = (res, e) => res.status(500).json({ success: false, message: e.message });
exports.getReminders = async (req, res) => { try { res.json({ success: true, data: await Reminder.find({ createdBy: req.user._id }).sort({ dueDate: 1 }) }); } catch (e) { fail(res, e); } };
exports.createReminder = async (req, res) => { try { res.status(201).json({ success: true, data: await Reminder.create({ ...req.body, createdBy: req.user._id }) }); } catch (e) { fail(res, e); } };
exports.sendReminder = async (req, res) => res.json({ success: true, message: 'Reminder queued' });
exports.deleteReminder = async (req, res) => { try { await Reminder.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id }); res.json({ success: true }); } catch (e) { fail(res, e); } };