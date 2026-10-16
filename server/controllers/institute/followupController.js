const FollowUp = require('../../models/FollowUp');
const Lead = require('../../models/Lead');
const Employee = require('../../models/Employee');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

// GET /api/institute/followups
exports.getFollowUps = async (req, res) => {
  try {
    const { status, timeframe, search, page = 1, limit = 50 } = req.query;

    // Get all inquiry IDs
    const inquiryQuery = { isInstituteInquiry: true, isDeleted: { $ne: true } };
    if (search) {
      inquiryQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const instituteInquiries = await Lead.find(inquiryQuery).select('_id name phone email courseInterested preferredBatch status').lean();
    const inquiryMap = new Map(instituteInquiries.map(i => [String(i._id), i]));
    const inquiryIds = Array.from(inquiryMap.keys());

    const followUpQuery = {
      type: 'lead',
      relatedId: { $in: inquiryIds },
    };

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (status === 'overdue') {
      followUpQuery.status = 'pending';
      followUpQuery.scheduledDate = { $lt: startOfToday };
    } else if (status === 'due_today') {
      followUpQuery.status = 'pending';
      followUpQuery.scheduledDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (status === 'upcoming') {
      followUpQuery.status = 'pending';
      followUpQuery.scheduledDate = { $gt: endOfToday };
    } else if (status === 'completed') {
      followUpQuery.status = 'completed';
    } else if (status === 'pending') {
      followUpQuery.status = 'pending';
    }

    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [allInstituteFollowUps, total] = await Promise.all([
      FollowUp.find(followUpQuery)
        .populate('assignedTo', 'user employeeId department')
        .populate('createdBy', 'name email')
        .sort({ scheduledDate: 1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),
      FollowUp.countDocuments(followUpQuery),
    ]);

    // Enhance follow-ups with inquiry info and overdue flag
    const data = allInstituteFollowUps.map(item => {
      const inquiry = inquiryMap.get(String(item.relatedId));
      const scheduled = new Date(item.scheduledDate);
      const isOverdue = item.status === 'pending' && scheduled < startOfToday;
      const isDueToday = item.status === 'pending' && scheduled >= startOfToday && scheduled <= endOfToday;

      return {
        ...item,
        inquiry: inquiry || null,
        isOverdue,
        isDueToday,
      };
    });

    // Summary counts for institute
    const allPending = await FollowUp.find({
      type: 'lead',
      relatedId: { $in: inquiryIds },
      status: 'pending',
    }).select('scheduledDate').lean();

    const overdueCount = allPending.filter(f => new Date(f.scheduledDate) < startOfToday).length;
    const dueTodayCount = allPending.filter(f => {
      const d = new Date(f.scheduledDate);
      return d >= startOfToday && d <= endOfToday;
    }).length;
    const upcomingCount = allPending.filter(f => new Date(f.scheduledDate) > endOfToday).length;
    const completedCount = await FollowUp.countDocuments({
      type: 'lead',
      relatedId: { $in: inquiryIds },
      status: 'completed',
    });

    res.json({
      success: true,
      data,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
      stats: {
        total: inquiryIds.length ? await FollowUp.countDocuments({ type: 'lead', relatedId: { $in: inquiryIds } }) : 0,
        pending: allPending.length,
        dueToday: dueTodayCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        completed: completedCount,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/institute/followups
exports.scheduleFollowUp = async (req, res) => {
  try {
    const { inquiryId, title, scheduledDate, scheduledTime, typeOfFollowUp, description, assignedTo } = req.body;

    if (!inquiryId) {
      return res.status(400).json({ success: false, message: 'Inquiry ID is required' });
    }
    if (!scheduledDate) {
      return res.status(400).json({ success: false, message: 'Scheduled date is required' });
    }

    const inquiry = await Lead.findOne({ _id: inquiryId, isDeleted: { $ne: true } });
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }

    // Determine assigned employee
    let assignee = assignedTo;
    if (!assignee) {
      const emp = await Employee.findOne({ user: req.user._id, deletedAt: null });
      assignee = emp?._id || inquiry.assignedTo || req.user._id;
    }

    const followUp = await FollowUp.create({
      type: 'lead',
      relatedId: inquiry._id,
      title: title?.trim() || `Follow-up with ${inquiry.name}`,
      description: description ? description.trim() : '',
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || '',
      typeOfFollowUp: typeOfFollowUp || 'call',
      status: 'pending',
      assignedTo: assignee,
      createdBy: req.user._id,
    });

    // Update followUpDate on inquiry
    inquiry.followUpDate = new Date(scheduledDate);
    inquiry.lastActivityDate = new Date();
    await inquiry.save();

    res.status(201).json({ success: true, data: followUp, message: 'Follow-up scheduled successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// PUT /api/institute/followups/:id
exports.updateFollowUp = async (req, res) => {
  try {
    const { status, scheduledDate, scheduledTime, outcome, description, typeOfFollowUp } = req.body;

    const followUp = await FollowUp.findById(req.params.id);
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    if (status) {
      followUp.status = status;
      if (status === 'completed') {
        followUp.completedAt = new Date();
      } else if (status === 'pending') {
        followUp.completedAt = null;
      }
    }

    if (scheduledDate) {
      followUp.scheduledDate = new Date(scheduledDate);
      // Also update inquiry followUpDate if still pending
      if (followUp.type === 'lead') {
        await Lead.findByIdAndUpdate(followUp.relatedId, { followUpDate: new Date(scheduledDate) });
      }
    }

    if (scheduledTime !== undefined) followUp.scheduledTime = scheduledTime;
    if (outcome !== undefined) followUp.outcome = outcome;
    if (description !== undefined) followUp.description = description;
    if (typeOfFollowUp) followUp.typeOfFollowUp = typeOfFollowUp;

    followUp.updatedAt = new Date();
    await followUp.save();

    res.json({ success: true, data: followUp, message: 'Follow-up updated successfully' });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/institute/followups/:id
exports.deleteFollowUp = async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndDelete(req.params.id);
    if (!followUp) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }
    res.json({ success: true, message: 'Follow-up deleted successfully' });
  } catch (error) {
    sendError(res, error);
  }
};
