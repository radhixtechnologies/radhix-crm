const FollowUp = require('../../models/FollowUp');
const Lead = require('../../models/Lead');
const Client = require('../../models/Client');
const Deal = require('../../models/Deal');
const Employee = require('../../models/Employee');
const Notification = require('../../models/Notification');
const {
  getIstDayRange,
  parseFollowUpDate,
  findEmployeeRecord,
  recordLeadRemarkAndFollowUp,
} = require('../../utils/followUpSync');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const getRoleSlug = (user) => (typeof user?.role === 'object' ? user.role?.slug : user?.role);
const canManageSalesTeam = (user) => {
  const role = getRoleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};

const getOwnEmployeeScope = async (user) => {
  const emp = await Employee.findOne({ user: user._id, deletedAt: null }).select('_id');
  return emp ? [emp._id, user._id] : [user._id];
};

const escapeRegex = (val) => String(val || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const populateAssignee = (query) => query.populate({
  path: 'assignedTo',
  select: 'user employeeId department designation',
  populate: { path: 'user', select: 'name email avatar' },
}).populate('createdBy', 'name email');

const hydrateFollowUps = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return items;

  const leadIds = [];
  const clientIds = [];
  const dealIds = [];

  for (const item of items) {
    const relId = item?.relatedId?._id || item?.relatedId;
    if (!relId) continue;
    if (item.type === 'lead') leadIds.push(relId);
    else if (item.type === 'client') clientIds.push(relId);
    else if (item.type === 'deal') dealIds.push(relId);
  }

  const [leads, clients, deals] = await Promise.all([
    leadIds.length > 0
      ? Lead.find({ _id: { $in: leadIds } })
          .select('name phone email company status leadTemperature followUpDate followUpTime assignedTo lastRemark notes')
          .populate({
            path: 'assignedTo',
            select: 'user employeeId department',
            populate: { path: 'user', select: 'name email' },
          })
          .lean()
      : [],
    clientIds.length > 0
      ? Client.find({ _id: { $in: clientIds } })
          .select('name phone email company status')
          .lean()
      : [],
    dealIds.length > 0
      ? Deal.find({ _id: { $in: dealIds } })
          .select('title name company value stage assignedTo')
          .lean()
      : [],
  ]);

  const leadMap = new Map(
    leads.map((l) => {
      const notesCount = Array.isArray(l.notes) ? l.notes.length : 0;
      const latestNote = notesCount > 0 ? l.notes[notesCount - 1] : null;
      const hydrated = {
        ...l,
        notesCount,
        lastRemark: l.lastRemark?.content
          ? l.lastRemark
          : latestNote
            ? {
                content: latestNote.content,
                remarkType: latestNote.remarkType || 'remark',
                outcome: latestNote.outcome || '',
                addedByName: latestNote.addedByEmployeeName || '',
                addedAt: latestNote.addedAt,
              }
            : null,
      };
      delete hydrated.notes;
      return [String(l._id), hydrated];
    })
  );
  const clientMap = new Map(clients.map((c) => [String(c._id), c]));
  const dealMap = new Map(deals.map((d) => [String(d._id), d]));

  return items.map((item) => {
    const rawId = String(item?.relatedId?._id || item?.relatedId || '');
    let relatedEntity = null;
    if (item.type === 'lead') relatedEntity = leadMap.get(rawId) || null;
    else if (item.type === 'client') relatedEntity = clientMap.get(rawId) || null;
    else if (item.type === 'deal') relatedEntity = dealMap.get(rawId) || null;

    return {
      ...item,
      relatedId: relatedEntity || item.relatedId,
    };
  });
};

const syncLeadNextFollowUpDate = async (leadId) => {
  if (!leadId) return;
  const nextPending = await FollowUp.findOne({
    type: 'lead',
    relatedId: leadId,
    status: { $in: ['pending', 'overdue'] },
  })
    .sort({ scheduledDate: 1 })
    .select('scheduledDate scheduledTime');

  await Lead.findByIdAndUpdate(leadId, {
    followUpDate: nextPending?.scheduledDate || null,
    followUpTime: nextPending?.scheduledTime || '',
    updatedAt: new Date(),
  });
};

const buildFollowUpQuery = async ({ status, type, search, bucket, assignedTo, relatedId }, user) => {
  const { start, next } = getIstDayRange();
  const query = {};
  const andConditions = [];

  if (type) query.type = type;
  if (relatedId) query.relatedId = relatedId;

  if (user && !canManageSalesTeam(user)) {
    query.assignedTo = { $in: await getOwnEmployeeScope(user) };
  } else if (assignedTo && assignedTo !== 'all') {
    query.assignedTo = assignedTo;
  }

  if (search && String(search).trim()) {
    const rx = new RegExp(escapeRegex(String(search).trim()), 'i');
    const [matchedLeads, matchedClients, matchedDeals] = await Promise.all([
      Lead.find({
        isDeleted: { $ne: true },
        $or: [{ name: rx }, { phone: rx }, { email: rx }, { company: rx }],
      }).select('_id').limit(100).lean(),
      Client.find({
        $or: [{ name: rx }, { phone: rx }, { email: rx }, { company: rx }],
      }).select('_id').limit(100).lean(),
      Deal.find({
        $or: [{ title: rx }, { name: rx }, { company: rx }],
      }).select('_id').limit(100).lean(),
    ]);

    const matchedIds = [
      ...matchedLeads.map((d) => d._id),
      ...matchedClients.map((d) => d._id),
      ...matchedDeals.map((d) => d._id),
    ];

    const searchOr = [{ title: rx }, { description: rx }, { outcome: rx }];
    if (matchedIds.length > 0) searchOr.push({ relatedId: { $in: matchedIds } });
    andConditions.push({ $or: searchOr });
  }

  if (bucket === 'overdue' || status === 'overdue') {
    andConditions.push({
      $or: [
        { status: 'overdue' },
        { status: 'pending', scheduledDate: { $lt: start } },
      ],
    });
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

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

  return query;
};

exports.getFollowUps = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type, search, bucket, relatedId, assignedTo } = req.query;
    const query = await buildFollowUpQuery(
      { status, type, search, bucket, assignedTo, relatedId },
      req.user
    );
    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));
    const [results, total] = await Promise.all([
      populateAssignee(
        FollowUp.find(query)
          .sort({ scheduledDate: 1, createdAt: -1 })
          .skip((currentPage - 1) * pageLimit)
          .limit(pageLimit)
      ).lean(),
      FollowUp.countDocuments(query),
    ]);

    const { start } = getIstDayRange();
    const withOverdueStatus = results.map((item) => (
      item.status === 'pending' && new Date(item.scheduledDate) < start
        ? { ...item, status: 'overdue' }
        : item
    ));

    const data = await hydrateFollowUps(withOverdueStatus);

    res.json({ success: true, data, total, page: currentPage, limit: pageLimit, pages: Math.ceil(total / pageLimit) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getFollowUpsSummary = async (req, res) => {
  try {
    const { start, next, following } = getIstDayRange();
    const baseQuery = {};
    if (req.query.type) baseQuery.type = req.query.type;

    if (req.user && !canManageSalesTeam(req.user)) {
      baseQuery.assignedTo = { $in: await getOwnEmployeeScope(req.user) };
    } else if (req.query.assignedTo && req.query.assignedTo !== 'all') {
      baseQuery.assignedTo = req.query.assignedTo;
    }

    const pendingQuery = { ...baseQuery, status: 'pending' };

    const [total, pending, completed, overdue, dueToday, upcoming, owners, byEmployeeAgg] = await Promise.all([
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
      FollowUp.distinct('assignedTo', {
        ...baseQuery,
        status: { $in: ['pending', 'overdue'] },
      }),
      FollowUp.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$assignedTo',
            total: { $sum: 1 },
            pending: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$status', 'pending'] }, { $gte: ['$scheduledDate', start] }] },
                  1,
                  0,
                ],
              },
            },
            dueToday: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$status', 'pending'] },
                      { $gte: ['$scheduledDate', start] },
                      { $lt: ['$scheduledDate', next] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$status', 'overdue'] },
                      { $and: [{ $eq: ['$status', 'pending'] }, { $lt: ['$scheduledDate', start] }] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
            },
          },
        },
        { $sort: { overdue: -1, dueToday: -1, pending: -1, total: -1 } },
      ]),
    ]);

    const empIds = byEmployeeAgg.map((row) => row._id).filter(Boolean);
    const employees = empIds.length > 0
      ? await Employee.find({ _id: { $in: empIds } })
          .select('user employeeId department designation')
          .populate('user', 'name email')
          .lean()
      : [];
    const empMap = new Map(employees.map((e) => [String(e._id), e]));

    const byEmployee = byEmployeeAgg
      .filter((row) => row._id)
      .map((row) => {
        const emp = empMap.get(String(row._id));
        return {
          employeeId: String(row._id),
          name: emp?.user?.name || emp?.employeeId || 'Team Member',
          code: emp?.employeeId || '',
          department: emp?.department || '',
          total: row.total,
          pending: row.pending,
          dueToday: row.dueToday,
          overdue: row.overdue,
          completed: row.completed,
        };
      });

    res.json({
      success: true,
      data: { total, pending, completed, overdue, dueToday, upcoming, owners: owners.length, byEmployee },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getFollowUp = async (req, res) => {
  try {
    const raw = await populateAssignee(FollowUp.findById(req.params.id)).lean();
    if (!raw) return res.status(404).json({ success: false, message: 'Follow-up not found' });
    const [hydrated] = await hydrateFollowUps([raw]);
    res.json({ success: true, data: hydrated });
  } catch (error) {
    sendError(res, error);
  }
};

exports.scheduleFollowUp = async (req, res) => {
  try {
    const { type, relatedId, title, description, scheduledDate, scheduledTime, typeOfFollowUp, assignedTo } = req.body;
    const parsedDate = parseFollowUpDate(scheduledDate);
    if (!parsedDate) {
      return res.status(400).json({ success: false, message: 'Scheduled date is required' });
    }

    let fallbackEmployeeId = assignedTo || null;
    let linkedLead = null;
    if (type === 'lead' && relatedId) {
      linkedLead = await Lead.findById(relatedId);
      if (!fallbackEmployeeId && linkedLead?.assignedTo) {
        fallbackEmployeeId = linkedLead.assignedTo;
      }
    }

    const assignee = await findEmployeeRecord(fallbackEmployeeId, req.user._id);
    if (!assignee) {
      return res.status(400).json({ success: false, message: 'Assigned employee record not found' });
    }

    const created = await FollowUp.create({
      type,
      relatedId,
      title: String(title || '').trim() || `Follow-up${linkedLead ? `: ${linkedLead.name}` : ''}`,
      description: String(description || '').trim(),
      scheduledDate: parsedDate,
      scheduledTime: String(scheduledTime || '').trim(),
      typeOfFollowUp: typeOfFollowUp || 'call',
      assignedTo: assignee._id,
      createdBy: req.user._id,
    });

    if (linkedLead) {
      linkedLead.followUpDate = parsedDate;
      linkedLead.followUpTime = String(scheduledTime || '').trim();
      linkedLead.lastActivityDate = new Date();
      linkedLead.updatedAt = new Date();
      await linkedLead.save();
    }

    if (assignee.user?._id && String(assignee.user._id) !== String(req.user._id)) {
      Notification.create({
        user: assignee.user._id,
        title: '📅 New Follow-up Assigned',
        message: `${created.title} scheduled for ${parsedDate.toISOString().slice(0, 10)}${created.scheduledTime ? ` at ${created.scheduledTime}` : ''}.`,
        type: 'reminder',
        actionUrl: '/sales/followups',
      }).catch(() => {});
    }

    const populated = await populateAssignee(FollowUp.findById(created._id)).lean();
    const [hydrated] = await hydrateFollowUps([populated]);
    res.status(201).json({ success: true, data: hydrated });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    if (!canManageSalesTeam(req.user)) {
      const ownIds = (await getOwnEmployeeScope(req.user)).map((id) => String(id));
      if (!ownIds.includes(String(followUp.assignedTo))) {
        return res.status(403).json({ success: false, message: 'Not authorized to update this follow-up' });
      }
    }

    const wasCompleted = followUp.status === 'completed';
    const nextDate = req.body.nextFollowUp ? parseFollowUpDate(req.body.nextFollowUp) : null;
    const nextTime = String(req.body.nextFollowUpTime || '').trim();

    if (Object.prototype.hasOwnProperty.call(req.body, 'scheduledDate') && req.body.scheduledDate) {
      followUp.scheduledDate = parseFollowUpDate(req.body.scheduledDate);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'assignedTo') && req.body.assignedTo) {
      const assignee = await findEmployeeRecord(req.body.assignedTo, req.user._id);
      if (!assignee) {
        return res.status(400).json({ success: false, message: 'Assigned employee not found' });
      }
      followUp.assignedTo = assignee._id;
    }

    const directFields = ['title', 'description', 'scheduledTime', 'typeOfFollowUp', 'status', 'outcome'];
    directFields.forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) followUp[field] = req.body[field];
    });
    if (nextDate) {
      followUp.nextFollowUp = nextDate;
      followUp.nextFollowUpTime = nextTime;
    }

    if (req.body.status === 'completed' && !wasCompleted) followUp.completedAt = new Date();
    if (req.body.status && req.body.status !== 'completed') followUp.completedAt = null;
    followUp.updatedAt = new Date();
    await followUp.save();

    let nextTask = null;
    if (!wasCompleted && req.body.status === 'completed' && nextDate) {
      nextTask = await FollowUp.create({
        type: followUp.type,
        relatedId: followUp.relatedId,
        title: String(req.body.nextFollowUpTitle || '').trim() || `Follow-up: ${followUp.title.replace(/^Follow-up:\s*/i, '')}`,
        description: req.body.outcome ? `Next step after: ${req.body.outcome}` : followUp.description,
        scheduledDate: nextDate,
        scheduledTime: nextTime,
        typeOfFollowUp: req.body.nextTypeOfFollowUp || followUp.typeOfFollowUp,
        assignedTo: followUp.assignedTo,
        createdBy: req.user._id,
      });
    }

    if (followUp.type === 'lead' && followUp.relatedId) {
      const lead = await Lead.findById(followUp.relatedId);
      if (lead) {
        if (!wasCompleted && req.body.status === 'completed' && (req.body.outcome?.trim() || nextDate || req.body.leadStatus || req.body.leadTemperature)) {
          await recordLeadRemarkAndFollowUp({
            lead,
            user: req.user,
            content: req.body.outcome?.trim() || `Completed follow-up: ${followUp.title}`,
            remarkType: 'followup',
            outcome: 'completed',
            nextFollowUpDate: nextDate,
            nextFollowUpTime: nextTime,
            leadStatus: req.body.leadStatus || '',
            leadTemperature: req.body.leadTemperature || '',
            createFollowUpTask: false, // nextTask already created above if nextDate
          });
        }
        if (!nextDate) {
          await syncLeadNextFollowUpDate(lead._id);
        }
      }
    }

    const populated = await populateAssignee(FollowUp.findById(followUp._id)).lean();
    const [hydrated] = await hydrateFollowUps([populated]);
    res.json({ success: true, data: hydrated, nextFollowUp: nextTask });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteFollowUp = async (req, res) => {
  try {
    const existing = await FollowUp.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Follow-up not found' });

    if (!canManageSalesTeam(req.user)) {
      const ownIds = (await getOwnEmployeeScope(req.user)).map((id) => String(id));
      if (!ownIds.includes(String(existing.assignedTo))) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this follow-up' });
      }
    }

    await existing.deleteOne();
    if (existing.type === 'lead' && existing.relatedId) {
      await syncLeadNextFollowUpDate(existing.relatedId);
    }

    res.json({ success: true, message: 'Follow-up deleted' });
  } catch (error) {
    sendError(res, error);
  }
};

const escapeCsvCell = (val) => {
  let str = String(val ?? '').replace(/\r?\n/g, ' ').trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

exports.exportFollowUpsCsv = async (req, res) => {
  try {
    const { status, type, search, bucket, relatedId, assignedTo } = req.query;
    const query = await buildFollowUpQuery(
      { status, type, search, bucket, assignedTo, relatedId },
      req.user
    );

    const results = await populateAssignee(
      FollowUp.find(query).sort({ scheduledDate: 1, createdAt: -1 }).limit(1000)
    ).lean();

    const { start } = getIstDayRange();
    const withOverdueStatus = results.map((item) => (
      item.status === 'pending' && new Date(item.scheduledDate) < start
        ? { ...item, status: 'overdue' }
        : item
    ));
    const hydrated = await hydrateFollowUps(withOverdueStatus);

    const headers = [
      'Client / Lead',
      'Phone',
      'Email',
      'Company',
      'Entity Type',
      'Lead Stage',
      'Follow-up Title',
      'Mode',
      'Scheduled Date',
      'Scheduled Time',
      'Status',
      'Assigned Employee',
      'Department',
      'Latest Client Remark',
      'Follow-up Outcome',
    ];

    const rows = hydrated.map((item) => {
      const rel = item.relatedId && typeof item.relatedId === 'object' ? item.relatedId : null;
      const clientName = rel?.name || rel?.title || 'Unlinked';
      const ownerName = item.assignedTo?.user?.name || item.assignedTo?.employeeId || 'Unassigned';
      const latestRemark = rel?.lastRemark?.content || item.description || '';
      return [
        clientName,
        rel?.phone || '',
        rel?.email || '',
        rel?.company || '',
        item.type || '',
        rel?.status || rel?.stage || '',
        item.title || '',
        item.typeOfFollowUp || '',
        item.scheduledDate ? new Date(item.scheduledDate).toISOString().slice(0, 10) : '',
        item.scheduledTime || '',
        item.status || '',
        ownerName,
        item.assignedTo?.department || '',
        latestRemark,
        item.outcome || '',
      ].map(escapeCsvCell).join(',');
    });

    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\r\n');
    const filename = `Followups_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    sendError(res, error);
  }
};
