const Leave = require('../models/Leave');
const Expense = require('../models/Expense');
const ExitRequest = require('../models/ExitRequest');
const DailyUpdate = require('../models/DailyUpdate');
const Employee = require('../models/Employee');

const roleSlug = (user) => typeof user?.role === 'object' ? user.role?.slug : user?.role;
const isManagerOrAdmin = (user) => {
  const role = roleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role === 'manager' || role.endsWith('_manager');
};

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Approvals action failed',
});
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });

// GET /api/approvals - List pending items across all streams
exports.getPendingApprovals = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      throw fail('Access restricted to managers and administrators', 403);
    }

    const { type = 'all', page = 1, limit = 50 } = req.query;

    const [pendingLeaves, pendingExpenses, pendingExits, unreviewedUpdates] = await Promise.all([
      Leave.find({ status: 'pending' })
        .populate({
          path: 'employee',
          select: 'employeeId department designation user',
          populate: { path: 'user', select: 'name email avatar' },
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),

      Expense.find({ status: 'pending' })
        .populate({
          path: 'paidBy',
          select: 'employeeId department designation user',
          populate: { path: 'user', select: 'name email' },
        })
        .populate('createdBy', 'name email')
        .sort({ date: -1 })
        .limit(50)
        .lean(),

      ExitRequest.find({ status: { $in: ['submitted', 'under_review'] } })
        .populate({
          path: 'employee',
          select: 'employeeId department designation user',
          populate: { path: 'user', select: 'name email' },
        })
        .sort({ resignationDate: -1 })
        .limit(50)
        .lean(),

      DailyUpdate.find({ status: 'submitted' })
        .populate({
          path: 'employee',
          select: 'employeeId department designation user',
          populate: { path: 'user', select: 'name email' },
        })
        .populate('project', 'name')
        .sort({ date: -1 })
        .limit(50)
        .lean(),
    ]);

    const items = [];

    // Transform Leaves
    if (type === 'all' || type === 'leave') {
      pendingLeaves.forEach((l) => {
        const empName = l.employee?.user?.name || l.employee?.employeeId || 'Employee';
        items.push({
          id: l._id,
          type: 'leave',
          categoryLabel: 'Leave Application',
          title: `${l.type?.toUpperCase()} Leave (${l.days} ${l.days === 1 ? 'day' : 'days'})`,
          applicantName: empName,
          applicantEmail: l.employee?.user?.email || '',
          applicantDepartment: l.employee?.department || 'General',
          applicantDesignation: l.employee?.designation || '',
          employeeId: l.employee?.employeeId,
          date: l.startDate,
          dateRange: `${new Date(l.startDate).toISOString().slice(0, 10)} to ${new Date(l.endDate).toISOString().slice(0, 10)}`,
          reason: l.reason,
          amount: null,
          status: l.status,
          priority: l.days > 3 ? 'high' : 'normal',
          createdAt: l.createdAt,
          raw: l,
        });
      });
    }

    // Transform Expenses
    if (type === 'all' || type === 'expense') {
      pendingExpenses.forEach((exp) => {
        const applicant = exp.paidBy?.user?.name || exp.createdBy?.name || 'Staff';
        items.push({
          id: exp._id,
          type: 'expense',
          categoryLabel: 'Expense Claim',
          title: exp.title,
          applicantName: applicant,
          applicantEmail: exp.paidBy?.user?.email || exp.createdBy?.email || '',
          applicantDepartment: exp.paidBy?.department || 'Finance',
          applicantDesignation: exp.paidBy?.designation || '',
          employeeId: exp.paidBy?.employeeId,
          date: exp.date,
          dateRange: new Date(exp.date).toISOString().slice(0, 10),
          reason: `${exp.category?.toUpperCase()} • Vendor: ${exp.vendor} • ${exp.description || ''}`,
          amount: exp.amount,
          status: exp.status,
          priority: exp.amount > 10000 ? 'high' : 'normal',
          createdAt: exp.createdAt,
          raw: exp,
        });
      });
    }

    // Transform Exits
    if (type === 'all' || type === 'exit') {
      pendingExits.forEach((ex) => {
        const empName = ex.employee?.user?.name || ex.employee?.employeeId || 'Employee';
        items.push({
          id: ex._id,
          type: 'exit',
          categoryLabel: 'Resignation / Exit',
          title: `Resignation Notice (${ex.reason?.replace('_', ' ')?.toUpperCase()})`,
          applicantName: empName,
          applicantEmail: ex.employee?.user?.email || '',
          applicantDepartment: ex.employee?.department || 'General',
          applicantDesignation: ex.employee?.designation || '',
          employeeId: ex.employee?.employeeId,
          date: ex.resignationDate,
          dateRange: `Last working: ${new Date(ex.lastWorkingDate).toISOString().slice(0, 10)}`,
          reason: ex.reasonDetails || ex.reason,
          amount: null,
          status: ex.status,
          priority: 'urgent',
          createdAt: ex.createdAt,
          raw: ex,
        });
      });
    }

    // Transform Unreviewed Daily Standups
    if (type === 'all' || type === 'standup') {
      unreviewedUpdates.forEach((up) => {
        const empName = up.employee?.user?.name || up.employee?.employeeId || 'Employee';
        items.push({
          id: up._id,
          type: 'standup',
          categoryLabel: 'Daily Work Update',
          title: `Daily Update • ${up.hoursWorked || 8} hrs ${up.project?.name ? `(${up.project.name})` : ''}`,
          applicantName: empName,
          applicantEmail: up.employee?.user?.email || '',
          applicantDepartment: up.employee?.department || 'General',
          applicantDesignation: up.employee?.designation || '',
          employeeId: up.employee?.employeeId,
          date: up.date,
          dateRange: new Date(up.date).toISOString().slice(0, 10),
          reason: up.tasksDone,
          blockers: up.blockers,
          hasBlockers: up.hasBlockers,
          amount: null,
          status: up.status,
          priority: up.hasBlockers ? 'urgent' : 'normal',
          createdAt: up.createdAt,
          raw: up,
        });
      });
    }

    // Sort all by createdAt desc
    items.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));

    res.json({
      success: true,
      data: {
        items,
        counts: {
          total: pendingLeaves.length + pendingExpenses.length + pendingExits.length + unreviewedUpdates.length,
          leave: pendingLeaves.length,
          expense: pendingExpenses.length,
          exit: pendingExits.length,
          standup: unreviewedUpdates.length,
        },
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/approvals/:type/:id/action - Perform approve or reject
exports.processApproval = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      throw fail('Only managers or administrators can approve or reject requests', 403);
    }

    const { type, id } = req.params;
    const { action, remarks = '' } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      throw fail('Action must be either "approve" or "reject"', 400);
    }

    let updatedRecord = null;
    let successMessage = '';

    if (type === 'leave') {
      const leave = await Leave.findById(id);
      if (!leave) throw fail('Leave request not found', 404);

      leave.status = action === 'approve' ? 'approved' : 'rejected';
      leave.approvedBy = req.user._id;
      leave.approvedAt = new Date();
      if (action === 'reject') {
        leave.rejectionReason = remarks || 'Rejected by manager';
      }
      await leave.save();
      updatedRecord = leave;
      successMessage = `Leave application ${action === 'approve' ? 'approved' : 'rejected'} successfully`;
    } else if (type === 'expense') {
      const expense = await Expense.findById(id);
      if (!expense) throw fail('Expense claim not found', 404);

      expense.status = action === 'approve' ? 'approved' : 'rejected';
      expense.approvedBy = req.user._id;
      await expense.save();
      updatedRecord = expense;
      successMessage = `Expense claim ${action === 'approve' ? 'approved' : 'rejected'} successfully`;
    } else if (type === 'exit') {
      const exitReq = await ExitRequest.findById(id);
      if (!exitReq) throw fail('Exit request not found', 404);

      exitReq.status = action === 'approve' ? 'approved' : 'rejected';
      if (exitReq.approvalFlow?.directManager) {
        exitReq.approvalFlow.directManager.status = action === 'approve' ? 'approved' : 'rejected';
        exitReq.approvalFlow.directManager.approvedBy = req.user._id;
        exitReq.approvalFlow.directManager.approvedAt = new Date();
        exitReq.approvalFlow.directManager.comments = remarks;
      }
      await exitReq.save();
      updatedRecord = exitReq;
      successMessage = `Exit request ${action === 'approve' ? 'approved' : 'rejected'} successfully`;
    } else if (type === 'standup') {
      const update = await DailyUpdate.findById(id);
      if (!update) throw fail('Daily work update not found', 404);

      update.status = 'reviewed';
      update.managerFeedback = {
        comment: remarks || (action === 'approve' ? 'Reviewed and approved' : 'Needs revision'),
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };
      await update.save();
      updatedRecord = update;
      successMessage = `Daily work update reviewed successfully`;
    } else {
      throw fail(`Unknown approval stream type: ${type}`, 400);
    }

    res.json({
      success: true,
      message: successMessage,
      data: updatedRecord,
    });
  } catch (error) {
    sendError(res, error);
  }
};

