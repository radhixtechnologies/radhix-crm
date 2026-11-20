const FollowUp = require('../../models/FollowUp');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

const getUtcDayRange = (date = new Date()) => {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  const following = new Date(next);
  following.setUTCDate(following.getUTCDate() + 6);
  return { start, next, following };
};

const buildFollowUpQuery = ({ status, type, search, bucket }) => {
  const { start, next } = getUtcDayRange();
  const query = {};

  if (type) query.type = type;
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.title = { $regex: escapedSearch, $options: 'i' };
  }

  if (bucket === 'overdue' || status === 'overdue') {
    query.$or = [
      { status: 'overdue' },
      { status: 'pending', scheduledDate: { $lt: start } },
    ];
  } else if (bucket === 'today') {
    query.status = 'pending';
    query.scheduledDate = { $gte: start, $lt: next };
  } else if (bucket === 'upcoming') {
    query.status = 'pending';
    query.scheduledDate = { $gte: next };
  } else if (status === 'pending') {
    query.status = 'pending';
    query.scheduledDate = { $gte: start };
  } else if (status) {
    query.status = status;
  }

  return query;
};

const populateAssignee = (query) => query.populate({
  path: 'assignedTo',
  select: 'user employeeId department designation',
  populate: { path: 'user', select: 'name email' }
}).populate('createdBy', 'name email');

exports.getFollowUps = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search, bucket, relatedId } = req.query;
    const query = buildFollowUpQuery({ status, type, search, bucket });
    if (relatedId) query.relatedId = relatedId;
    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));
    const [results, total] = await Promise.all([
      populateAssignee(FollowUp.find(query).sort({ scheduledDate: 1 }).skip((currentPage - 1) * pageLimit).limit(pageLimit)).lean(),
      FollowUp.countDocuments(query),
    ]);
    const { start } = getUtcDayRange();
    const data = results.map((item) => (
      item.status === 'pending' && new Date(item.scheduledDate) < start
        ? { ...item, status: 'overdue' }
        : item
    ));

    res.json({ success: true, data, total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getFollowUpsSummary = async (req, res) => {
  try {
    const { start, next, following } = getUtcDayRange();
    const baseQuery = {};
    if (req.query.type) baseQuery.type = req.query.type;
    const pendingQuery = { ...baseQuery, status: 'pending' };

    const [total, pending, completed, overdue, dueToday, upcoming, owners] = await Promise.all([
      FollowUp.countDocuments(baseQuery),
      FollowUp.countDocuments({ ...pendingQuery, scheduledDate: { $gte: start } }),
      FollowUp.countDocuments({ ...baseQuery, status: 'completed' }),
      FollowUp.countDocuments({
        ...baseQuery,
        $or: [
          { status: 'overdue' },
          { status: 'pending', scheduledDate: { $lt: start } },
        ],
      }),
      FollowUp.countDocuments({ ...pendingQuery, scheduledDate: { $gte: start, $lt: next } }),
      FollowUp.countDocuments({ ...pendingQuery, scheduledDate: { $gte: next, $lt: following } }),
      FollowUp.distinct('assignedTo', { ...pendingQuery, scheduledDate: { $gte: start } }),
    ]);

    res.json({
      success: true,
      data: { total, pending, completed, overdue, dueToday, upcoming, owners: owners.length },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getFollowUp = async (req, res) => {
  try {
    const data = await populateAssignee(FollowUp.findById(req.params.id));
    if (!data) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.scheduleFollowUp = async (req, res) => {
  try {
    const data = await FollowUp.create({
      ...req.body,
      assignedTo: req.body.assignedTo || req.user._id,
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    const wasCompleted = followUp.status === 'completed';
    let nextFollowUpDate;
    if (!wasCompleted && req.body.status === 'completed' && req.body.nextFollowUp) {
      nextFollowUpDate = new Date(req.body.nextFollowUp);
      if (Number.isNaN(nextFollowUpDate.getTime())) {
        return res.status(400).json({ success: false, message: 'Next follow-up date is invalid' });
      }
    }

    const fields = ['title', 'description', 'scheduledDate', 'scheduledTime', 'typeOfFollowUp', 'assignedTo', 'status', 'outcome', 'nextFollowUp'];
    fields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) followUp[field] = req.body[field];
    });
    if (req.body.status === 'completed' && !wasCompleted) followUp.completedAt = new Date();
    if (req.body.status && req.body.status !== 'completed') followUp.completedAt = null;
    followUp.updatedAt = new Date();
    await followUp.save();

    if (!wasCompleted && req.body.status === 'completed' && req.body.nextFollowUp) {
      await FollowUp.create({
        type: followUp.type,
        relatedId: followUp.relatedId,
        title: `Follow-up: ${followUp.title}`,
        description: req.body.outcome ? `Next step after: ${req.body.outcome}` : followUp.description,
        scheduledDate: nextFollowUpDate,
        typeOfFollowUp: followUp.typeOfFollowUp,
        assignedTo: followUp.assignedTo,
        createdBy: req.user._id,
      });
    }

    res.json({ success: true, data: followUp });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteFollowUp = async (req, res) => {
  try {
    const data = await FollowUp.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    res.json({ success: true, message: 'Follow-up deleted' });
  } catch (error) {
    sendError(res, error);
  }
};
