const mongoose = require('mongoose');
const DailyUpdate = require('../models/DailyUpdate');
const Employee = require('../models/Employee');
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');

const roleSlug = (user) => typeof user?.role === 'object' ? user.role?.slug : user?.role;
const isAdmin = (user) => {
  const role = roleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Daily update request failed',
});
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

const normalizeDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

const getEmployeeForUser = async (userId) => {
  return Employee.findOne({ user: userId, deletedAt: null }).select('_id user department designation employeeId');
};

// GET /api/daily-updates
exports.getDailyUpdates = async (req, res) => {
  try {
    const {
      date,
      startDate,
      endDate,
      employeeId,
      department,
      hasBlockers,
      search,
      page = 1,
      limit = 30,
    } = req.query;

    const query = {};

    // Date filtering
    if (date) {
      const targetDate = normalizeDate(date);
      if (targetDate) query.date = targetDate;
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = normalizeDate(startDate);
        if (start) query.date.$gte = start;
      }
      if (endDate) {
        const end = normalizeDate(endDate);
        if (end) query.date.$lte = end;
      }
    }

    // Role-based visibility
    const isUserAdmin = isAdmin(req.user);
    const currentEmployee = await getEmployeeForUser(req.user._id);

    if (!isUserAdmin) {
      // Normal employees only see their own updates by default unless querying specific team
      if (!currentEmployee) {
        return res.status(403).json({ success: false, message: 'Employee profile required' });
      }
      // If employee explicitly queries, force their own employee ID
      query.employee = currentEmployee._id;
    } else if (employeeId) {
      query.employee = employeeId;
    }

    if (hasBlockers === 'true') {
      query.hasBlockers = true;
    }

    // Filter by department if requested (requires employee lookup)
    if (department && isUserAdmin) {
      const deptEmployees = await Employee.find({ department, deletedAt: null }).select('_id');
      const deptEmpIds = deptEmployees.map((e) => e._id);
      if (query.employee) {
        if (!deptEmpIds.some((id) => String(id) === String(query.employee))) {
          return res.json({ success: true, data: [], total: 0, page: 1, pages: 0 });
        }
      } else {
        query.employee = { $in: deptEmpIds };
      }
    }

    // Text search
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { tasksDone: regex },
        { planForTomorrow: regex },
        { blockers: regex },
      ];
    }

    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [updates, total] = await Promise.all([
      DailyUpdate.find(query)
        .populate({
          path: 'employee',
          select: 'employeeId department designation user',
          populate: { path: 'user', select: 'name email avatar' },
        })
        .populate('project', 'name priority')
        .populate('projectTask', 'title priority status')
        .populate('managerFeedback.reviewedBy', 'name email')
        .sort({ date: -1, createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),
      DailyUpdate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: updates,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/daily-updates/tracker - Admin/Manager submission tracker
exports.getSubmissionTracker = async (req, res) => {
  try {
    const { date, department } = req.query;
    const targetDate = normalizeDate(date) || normalizeDate();

    // 1. Get all active employees
    const empQuery = { status: 'active', deletedAt: null };
    if (department) {
      empQuery.department = department;
    }
    const allActiveEmployees = await Employee.find(empQuery)
      .populate('user', 'name email avatar')
      .select('employeeId department designation user')
      .lean();

    // 2. Get updates submitted for this target date
    const submittedUpdates = await DailyUpdate.find({ date: targetDate })
      .populate({
        path: 'employee',
        select: 'employeeId department designation user',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .populate('project', 'name')
      .populate('projectTask', 'title')
      .lean();

    const submittedEmpIds = new Set(submittedUpdates.map((u) => String(u.employee?._id || u.employee)));

    const submitted = [];
    const pending = [];
    let blockersCount = 0;

    allActiveEmployees.forEach((emp) => {
      const update = submittedUpdates.find((u) => String(u.employee?._id || u.employee) === String(emp._id));
      if (update) {
        if (update.hasBlockers) blockersCount++;
        submitted.push({
          employee: emp,
          update,
        });
      } else {
        pending.push({
          employee: emp,
        });
      }
    });

    res.json({
      success: true,
      data: {
        date: targetDate,
        totalActiveEmployees: allActiveEmployees.length,
        submittedCount: submitted.length,
        pendingCount: pending.length,
        blockersCount,
        submissionRate: allActiveEmployees.length > 0 ? Math.round((submitted.length / allActiveEmployees.length) * 100) : 0,
        submitted,
        pending,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/daily-updates/today - Get current employee's update for today
exports.getTodayUpdate = async (req, res) => {
  try {
    const employee = await getEmployeeForUser(req.user._id);
    if (!employee) {
      return res.json({ success: true, data: null, hasSubmitted: false });
    }

    const today = normalizeDate();
    const update = await DailyUpdate.findOne({ employee: employee._id, date: today })
      .populate('project', 'name')
      .populate('projectTask', 'title')
      .populate('managerFeedback.reviewedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: update || null,
      hasSubmitted: !!update,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/daily-updates - Create or update daily work update
exports.saveDailyUpdate = async (req, res) => {
  try {
    const employee = await getEmployeeForUser(req.user._id);
    if (!employee && !isAdmin(req.user)) {
      throw fail('Employee profile required to submit daily work update', 400);
    }

    // Admin can specify employeeId, otherwise logged-in employee
    let targetEmployeeId = employee?._id;
    if (isAdmin(req.user) && req.body.employeeId) {
      targetEmployeeId = req.body.employeeId;
    }

    if (!targetEmployeeId) {
      throw fail('Valid employee reference required', 400);
    }

    const {
      date,
      tasksDone,
      planForTomorrow = '',
      blockers = '',
      hoursWorked = 8,
      project = null,
      projectTask = null,
    } = req.body;

    if (!tasksDone || !tasksDone.trim()) {
      throw fail('Please provide details of work completed today (tasksDone is required)', 400);
    }

    const targetDate = normalizeDate(date) || normalizeDate();
    const hasBlockers = Boolean(blockers && blockers.trim().length > 0);
    const parsedHours = Number(hoursWorked);
    const safeHours = Number.isFinite(parsedHours) && parsedHours >= 0 && parsedHours <= 24 ? parsedHours : 8;

    // Verify project/task references if supplied
    let validProject = null;
    let validTask = null;
    if (project && mongoose.isValidObjectId(project)) {
      const projDoc = await Project.findById(project).select('_id');
      if (projDoc) validProject = projDoc._id;
    }
    if (projectTask && mongoose.isValidObjectId(projectTask)) {
      const taskDoc = await ProjectTask.findById(projectTask).select('_id');
      if (taskDoc) validTask = taskDoc._id;
    }

    // Atomic findOneAndUpdate (upsert) for the employee and date
    const updated = await DailyUpdate.findOneAndUpdate(
      { employee: targetEmployeeId, date: targetDate },
      {
        employee: targetEmployeeId,
        user: req.user._id,
        date: targetDate,
        tasksDone: tasksDone.trim(),
        planForTomorrow: planForTomorrow.trim(),
        blockers: blockers.trim(),
        hasBlockers,
        hoursWorked: safeHours,
        project: validProject,
        projectTask: validTask,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const populated = await DailyUpdate.findById(updated._id)
      .populate({
        path: 'employee',
        select: 'employeeId department designation user',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .populate('project', 'name')
      .populate('projectTask', 'title')
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
      message: `Daily work update for ${targetDate.toISOString().slice(0, 10)} saved successfully`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/daily-updates/:id
exports.getDailyUpdate = async (req, res) => {
  try {
    const update = await DailyUpdate.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'employeeId department designation user',
        populate: { path: 'user', select: 'name email avatar' },
      })
      .populate('project', 'name')
      .populate('projectTask', 'title')
      .populate('managerFeedback.reviewedBy', 'name email')
      .lean();

    if (!update) throw fail('Daily work update not found', 404);

    // Permission check
    const isUserAdmin = isAdmin(req.user);
    if (!isUserAdmin) {
      const employee = await getEmployeeForUser(req.user._id);
      if (!employee || String(update.employee?._id || update.employee) !== String(employee._id)) {
        throw fail('Access denied to this update', 403);
      }
    }

    res.json({ success: true, data: update });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/daily-updates/:id/feedback - Manager adds feedback/comment
exports.submitFeedback = async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) {
      throw fail('Feedback comment is required', 400);
    }

    // Only admin or managers can submit feedback
    if (!isAdmin(req.user)) {
      throw fail('Only administrators or managers can provide feedback on work updates', 403);
    }

    const update = await DailyUpdate.findById(req.params.id);
    if (!update) throw fail('Daily work update not found', 404);

    update.managerFeedback = {
      comment: comment.trim(),
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };
    update.status = 'reviewed';
    await update.save();

    const populated = await DailyUpdate.findById(update._id)
      .populate({
        path: 'employee',
        select: 'employeeId department designation user',
        populate: { path: 'user', select: 'name email' },
      })
      .populate('managerFeedback.reviewedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: populated,
      message: 'Manager feedback submitted successfully',
    });
  } catch (error) {
    sendError(res, error);
  }
};

// DELETE /api/daily-updates/:id
exports.deleteDailyUpdate = async (req, res) => {
  try {
    const update = await DailyUpdate.findById(req.params.id);
    if (!update) throw fail('Daily work update not found', 404);

    const isUserAdmin = isAdmin(req.user);
    if (!isUserAdmin) {
      const employee = await getEmployeeForUser(req.user._id);
      if (!employee || String(update.employee) !== String(employee._id)) {
        throw fail('Only an admin or the owner can delete this update', 403);
      }
    }

    await DailyUpdate.findByIdAndDelete(update._id);
    res.json({ success: true, message: 'Daily work update deleted successfully' });
  } catch (error) {
    sendError(res, error);
  }
};
