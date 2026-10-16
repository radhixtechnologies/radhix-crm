const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectTask = require('../models/ProjectTask');
const Employee = require('../models/Employee');

const roleSlug = (user) => typeof user?.role === 'object' ? user.role?.slug : user?.role;
const isAdmin = (user) => {
  const role = roleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};
const validId = (id) => mongoose.isValidObjectId(id);
const sendError = (res, error) => {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) console.error('[Projects] Request failed:', error);
  return res.status(statusCode).json({
    success: false,
    message: error.message || 'Project request failed',
  });
};
const fail = (message, statusCode = 400) => Object.assign(new Error(message), { statusCode });
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getEmployee = (userId) => Employee.findOne({ user: userId, deletedAt: null }).select('_id user');
const populateTask = (query) => query
  .populate({ path: 'assignedTo', select: 'employeeId department designation user', populate: { path: 'user', select: 'name email' } })
  .populate('workUpdates.createdBy', 'name email');
const populateProject = (query) => query
  .populate({ path: 'projectManager', select: 'employeeId department designation user', populate: { path: 'user', select: 'name email' } })
  .populate({ path: 'team', select: 'employeeId department designation user', populate: { path: 'user', select: 'name email' } })
  .populate('createdBy', 'name email');

const canManageProject = async (project, user) => {
  if (isAdmin(user) || String(project.createdBy) === String(user._id)) return true;
  const employee = await getEmployee(user._id);
  return !!employee && String(project.projectManager) === String(employee._id);
};

const canViewProject = async (project, user) => {
  if (await canManageProject(project, user)) return true;
  const employee = await getEmployee(user._id);
  return !!employee && project.team.some((id) => String(id) === String(employee._id));
};

const getProjectOrFail = async (id) => {
  if (!validId(id)) throw fail('Invalid project ID', 400);
  const project = await Project.findOne({ _id: id, isArchived: false });
  if (!project) throw fail('Project not found', 404);
  return project;
};

const assertProjectManager = async (project, user) => {
  if (!await canManageProject(project, user)) throw fail('Only the project manager or an administrator can perform this action', 403);
};

const validateEmployeeIds = async (ids) => {
  const uniqueIds = [...new Set((ids || []).map(String))];
  if (uniqueIds.some((id) => !validId(id))) throw fail('One or more team member IDs are invalid');
  if (!uniqueIds.length) return [];
  const employees = await Employee.find({ _id: { $in: uniqueIds }, deletedAt: null, status: 'active' }).select('_id');
  if (employees.length !== uniqueIds.length) throw fail('One or more team members are missing or inactive');
  return employees.map((employee) => employee._id);
};

const normalizeDate = (value, field) => {
  if (value === '' || value === null) return null;
  if (value === undefined) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw fail(`${field} must be a valid date`);
  return date;
};

const taskProgressFor = async (projectId) => {
  const [summary] = await ProjectTask.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId), isArchived: false } },
    { $group: { _id: null, count: { $sum: 1 }, progress: { $avg: '$progress' }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
  ]);
  return summary ? { count: summary.count, progress: Math.round(summary.progress), done: summary.done } : { count: 0, progress: 0, done: 0 };
};

exports.listProjects = async (req, res) => {
  try {
    const { search = '', status = '' } = req.query;
    if (status && !['planned', 'active', 'on_hold', 'completed', 'cancelled'].includes(status)) {
      throw fail('Invalid project status');
    }
    const query = { isArchived: false };
    if (status) query.status = status;
    if (typeof search === 'string' && search.trim()) {
      query.name = { $regex: escapeRegex(search.trim().slice(0, 100)), $options: 'i' };
    }

    if (!isAdmin(req.user)) {
      const employee = await getEmployee(req.user._id);
      if (!employee) return res.status(403).json({ success: false, message: 'Your employee profile is required to access projects' });
      query.$or = [{ team: employee._id }, { projectManager: employee._id }, { createdBy: req.user._id }];
    }

    const projects = await populateProject(Project.find(query).sort({ updatedAt: -1 })).lean();
    const projectIds = projects.map((project) => project._id);
    const progressRows = projectIds.length ? await ProjectTask.aggregate([
      { $match: { project: { $in: projectIds }, isArchived: false } },
      { $group: { _id: '$project', count: { $sum: 1 }, progress: { $avg: '$progress' }, done: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } } } },
    ]) : [];
    const progressById = new Map(progressRows.map((row) => [String(row._id), {
      count: row.count,
      progress: Math.round(row.progress),
      done: row.done,
    }]));
    res.json({
      success: true,
      data: projects.map((project) => ({
        ...project,
        taskSummary: progressById.get(String(project._id)) || { count: 0, progress: 0, done: 0 },
      })),
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createProject = async (req, res) => {
  try {
    if (!isAdmin(req.user)) throw fail('Only an administrator can create a project', 403);
    const {
      name, description = '', priority = 'medium', startDate, dueDate,
      projectManager, team = [],
    } = req.body;
    if (typeof name !== 'string' || !name.trim()) throw fail('Project name is required');
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) throw fail('Invalid project priority');
    const teamIds = await validateEmployeeIds(team);
    let managerId = null;
    if (projectManager) {
      const [manager] = await validateEmployeeIds([projectManager]);
      managerId = manager;
      if (!teamIds.some((id) => String(id) === String(managerId))) teamIds.push(managerId);
    }
    const start = normalizeDate(startDate, 'Start date');
    const due = normalizeDate(dueDate, 'Due date');
    if (start && due && due < start) throw fail('Due date cannot be before the start date');
    const project = await Project.create({
      name: name.trim(),
      description,
      priority,
      startDate: start,
      dueDate: due,
      projectManager: managerId,
      team: teamIds,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateProject(Project.findById(project._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    if (!await canViewProject(project, req.user)) throw fail('You do not have access to this project', 403);
    const [data, tasks, taskSummary] = await Promise.all([
      populateProject(Project.findById(project._id)),
      populateTask(ProjectTask.find({ project: project._id, isArchived: false }).sort({ dueDate: 1, createdAt: -1 })),
      taskProgressFor(project._id),
    ]);
    res.json({ success: true, data: { ...data.toObject(), tasks, taskSummary } });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    const updates = {};
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || !req.body.name.trim()) throw fail('Project name is required');
      updates.name = req.body.name.trim();
    }
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(req.body.priority)) throw fail('Invalid project priority');
      updates.priority = req.body.priority;
    }
    if (req.body.status !== undefined) {
      if (!['planned', 'active', 'on_hold', 'completed', 'cancelled'].includes(req.body.status)) throw fail('Invalid project status');
      updates.status = req.body.status;
    }
    if (req.body.startDate !== undefined) updates.startDate = normalizeDate(req.body.startDate, 'Start date');
    if (req.body.dueDate !== undefined) updates.dueDate = normalizeDate(req.body.dueDate, 'Due date');
    if (req.body.team !== undefined) updates.team = await validateEmployeeIds(req.body.team);
    if (req.body.projectManager !== undefined) {
      if (req.body.projectManager) {
        const [managerId] = await validateEmployeeIds([req.body.projectManager]);
        updates.projectManager = managerId;
        if (updates.team && !updates.team.some((id) => String(id) === String(managerId))) updates.team.push(managerId);
      } else {
        updates.projectManager = null;
      }
    }
    if (updates.team) {
      const managerId = updates.projectManager === undefined ? project.projectManager : updates.projectManager;
      if (managerId && !updates.team.some((id) => String(id) === String(managerId))) updates.team.push(managerId);
      const assignedTask = await ProjectTask.exists({
        project: project._id,
        isArchived: false,
        assignedTo: { $ne: null, $nin: updates.team },
      });
      if (assignedTask) throw fail('Reassign or unassign project tasks before removing their assignees from the team');
    }
    const start = updates.startDate === undefined ? project.startDate : updates.startDate;
    const due = updates.dueDate === undefined ? project.dueDate : updates.dueDate;
    if (start && due && due < start) throw fail('Due date cannot be before the start date');
    Object.assign(project, updates, { updatedBy: req.user._id });
    await project.save();
    res.json({ success: true, data: await populateProject(Project.findById(project._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.archiveProject = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    project.isArchived = true;
    project.updatedBy = req.user._id;
    await project.save();
    res.json({ success: true, message: 'Project archived' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.createProjectTask = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    const { title, description = '', assignedTo, priority = 'medium', dueDate } = req.body;
    if (typeof title !== 'string' || !title.trim()) throw fail('Task title is required');
    if (!['low', 'medium', 'high', 'urgent'].includes(priority)) throw fail('Invalid task priority');
    let assignee = null;
    if (assignedTo) {
      [assignee] = await validateEmployeeIds([assignedTo]);
      if (!project.team.some((id) => String(id) === String(assignee))) throw fail('Task assignee must belong to the project team');
    }
    const task = await ProjectTask.create({
      project: project._id,
      title: title.trim(),
      description,
      assignedTo: assignee,
      priority,
      dueDate: normalizeDate(dueDate, 'Due date'),
      createdBy: req.user._id,
    });
    res.status(201).json({ success: true, data: await populateTask(ProjectTask.findById(task._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateProjectTask = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    if (!await canViewProject(project, req.user)) throw fail('You do not have access to this project', 403);
    const task = await ProjectTask.findOne({ _id: req.params.taskId, project: project._id, isArchived: false });
    if (!task) throw fail('Project task not found', 404);
    const manager = await canManageProject(project, req.user);
    const employee = await getEmployee(req.user._id);
    const isAssignee = !!employee && String(task.assignedTo) === String(employee._id);
    if (!manager && !isAssignee) throw fail('Only the project manager or assigned employee can update this task', 403);

    if (manager && req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) throw fail('Task title is required');
      task.title = req.body.title.trim();
    }
    if (manager && req.body.description !== undefined) task.description = req.body.description;
    if (manager && req.body.priority !== undefined) {
      if (!['low', 'medium', 'high', 'urgent'].includes(req.body.priority)) throw fail('Invalid task priority');
      task.priority = req.body.priority;
    }
    if (manager && req.body.dueDate !== undefined) task.dueDate = normalizeDate(req.body.dueDate, 'Due date');
    if (manager && req.body.assignedTo !== undefined) {
      if (req.body.assignedTo) {
        const [assignee] = await validateEmployeeIds([req.body.assignedTo]);
        if (!project.team.some((id) => String(id) === String(assignee))) throw fail('Task assignee must belong to the project team');
        task.assignedTo = assignee;
      } else {
        task.assignedTo = null;
      }
    }
    if (req.body.status !== undefined) {
      if (!['todo', 'in_progress', 'blocked', 'done'].includes(req.body.status)) throw fail('Invalid task status');
      task.status = req.body.status;
      if (req.body.status === 'done') task.progress = 100;
      else if (task.progress === 100) task.progress = 0;
    }
    if (req.body.progress !== undefined) {
      const progress = Number(req.body.progress);
      if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw fail('Progress must be between 0 and 100');
      task.progress = progress;
      if (progress === 100) task.status = 'done';
      else if (progress > 0 && task.status === 'todo') task.status = 'in_progress';
      else if (task.status === 'done') task.status = 'in_progress';
    }
    await task.save();
    res.json({ success: true, data: await populateTask(ProjectTask.findById(task._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.archiveProjectTask = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    const task = await ProjectTask.findOneAndUpdate(
      { _id: req.params.taskId, project: project._id, isArchived: false },
      { isArchived: true },
      { new: true },
    );
    if (!task) throw fail('Project task not found', 404);
    res.json({ success: true, message: 'Project task archived' });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addWorkUpdate = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    if (!await canViewProject(project, req.user)) throw fail('You do not have access to this project', 403);
    const task = await ProjectTask.findOne({ _id: req.params.taskId, project: project._id, isArchived: false });
    if (!task) throw fail('Project task not found', 404);
    const employee = await getEmployee(req.user._id);
    const manager = await canManageProject(project, req.user);
    if (!manager && (!employee || String(task.assignedTo) !== String(employee._id))) {
      throw fail('Only the project manager or assigned employee can post a work update', 403);
    }
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    const progress = Number(req.body.progress);
    if (!message) throw fail('Work update is required');
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw fail('Progress must be between 0 and 100');
    task.workUpdates.push({ message, progress, createdBy: req.user._id });
    task.progress = progress;
    if (progress === 100) task.status = 'done';
    else if (progress > 0 && task.status === 'todo') task.status = 'in_progress';
    else if (task.status === 'done') task.status = 'in_progress';
    await task.save();
    res.status(201).json({ success: true, data: await populateTask(ProjectTask.findById(task._id)) });
  } catch (error) {
    sendError(res, error);
  }
};

exports.addMilestone = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    const { title, description = '', dueDate } = req.body;
    if (typeof title !== 'string' || !title.trim()) throw fail('Milestone title is required');
    project.milestones.push({ title: title.trim(), description, dueDate: normalizeDate(dueDate, 'Due date') });
    project.updatedBy = req.user._id;
    await project.save();
    res.status(201).json({ success: true, data: project.milestones[project.milestones.length - 1] });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateMilestone = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) throw fail('Milestone not found', 404);
    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string' || !req.body.title.trim()) throw fail('Milestone title is required');
      milestone.title = req.body.title.trim();
    }
    if (req.body.description !== undefined) milestone.description = req.body.description;
    if (req.body.dueDate !== undefined) milestone.dueDate = normalizeDate(req.body.dueDate, 'Due date');
    if (req.body.status !== undefined) {
      if (!['pending', 'in_progress', 'completed'].includes(req.body.status)) throw fail('Invalid milestone status');
      milestone.status = req.body.status;
      milestone.completedAt = req.body.status === 'completed' ? new Date() : null;
    }
    project.updatedBy = req.user._id;
    await project.save();
    res.json({ success: true, data: milestone });
  } catch (error) {
    sendError(res, error);
  }
};

exports.deleteMilestone = async (req, res) => {
  try {
    const project = await getProjectOrFail(req.params.id);
    await assertProjectManager(project, req.user);
    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) throw fail('Milestone not found', 404);
    milestone.deleteOne();
    await project.save();
    res.json({ success: true, message: 'Milestone deleted' });
  } catch (error) {
    sendError(res, error);
  }
};
