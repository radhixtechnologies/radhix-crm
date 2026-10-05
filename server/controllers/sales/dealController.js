const Deal = require('../../models/Deal');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const roleSlug = (user) => typeof user?.role === 'object' ? user.role?.slug : user?.role;
const canManageSalesTeam = (user) => {
  const role = roleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};

const dealAccessQuery = (req, id) => {
  const query = { _id: id, isDeleted: { $ne: true } };
  if (!canManageSalesTeam(req.user)) {
    query.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
  }
  return query;
};

const buildQuery = (req) => {
  const { page = 1, limit = 50, search, stage, owner } = req.query;
  const query = { isDeleted: { $ne: true } };
  if (search) query.$or = [
    { title: { $regex: search, $options: 'i' } },
    { name: { $regex: search, $options: 'i' } },
    { company: { $regex: search, $options: 'i' } },
  ];
  if (stage) query.stage = stage;
  if (!canManageSalesTeam(req.user)) {
    query.$or = [{ assignedTo: req.user._id }, { createdBy: req.user._id }];
    if (search) {
      query.$and = [{ $or: query.$or }, { $or: [
        { title: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
      ] }];
      delete query.$or;
    }
  } else if (owner && owner !== 'all' && canManageSalesTeam(req.user)) {
    query.assignedTo = owner;
  }
  return {
    query,
    page: Math.max(1, Number(page) || 1),
    limit: Math.min(100, Math.max(1, Number(limit) || 50)),
  };
};

exports.getDeals = async (req, res) => {
  try {
    const { query, page, limit } = buildQuery(req);
    const [data, total] = await Promise.all([
      Deal.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('client', 'name company').populate('contact', 'firstName lastName email')
        .populate('assignedTo', 'name email').lean(),
      Deal.countDocuments(query),
    ]);
    res.json({ success: true, data, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getDeal = async (req, res) => {
  try {
    const data = await Deal.findOne(dealAccessQuery(req, req.params.id))
      .populate('client').populate('contact').populate('assignedTo', 'name email');
    if (!data) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createDeal = async (req, res) => {
  try {
    const dealData = { ...req.body, createdBy: req.user._id };
    if (!canManageSalesTeam(req.user)) dealData.assignedTo = req.user._id;
    const data = await Deal.create(dealData);
    res.status(201).json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateDeal = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (!canManageSalesTeam(req.user)) delete updates.assignedTo;
    const data = await Deal.findOneAndUpdate(dealAccessQuery(req, req.params.id), updates, {
      new: true,
      runValidators: true,
    }).populate('client').populate('contact').populate('assignedTo', 'name email');
    if (!data) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteDeal = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Sales managers can delete deals' });
  }
  try {
    const data = await Deal.findOneAndUpdate(
      { _id: req.params.id, isDeleted: { $ne: true } },
      { isDeleted: true },
      { new: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, message: 'Deal deleted' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.changeStage = async (req, res) => {
  try {
    const stage = req.body.stage;
    const data = await Deal.findOneAndUpdate(
      dealAccessQuery(req, req.params.id),
      {
        stage,
        ...(stage === 'closed-won' ? { wonDate: new Date() } : {}),
        ...(stage === 'closed-lost' ? { lostDate: new Date() } : {}),
      },
      { new: true, runValidators: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addNote = async (req, res) => {
  try {
    const data = await Deal.findOneAndUpdate(
      dealAccessQuery(req, req.params.id),
      { $push: { notes: { content: req.body.content, addedBy: req.user._id } } },
      { new: true },
    );
    if (!data) return res.status(404).json({ success: false, message: 'Deal not found' });
    res.json({ success: true, data });
  } catch (error) {
    sendError(res, error);
  }
};
