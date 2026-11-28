const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const FollowUp = require('../models/FollowUp');

/**
 * Get IST (+05:30) day boundaries expressed as normalized UTC day timestamps
 * matching how <input type="date"> values (YYYY-MM-DD -> 00:00:00.000Z) are stored.
 */
const getIstDayRange = (now = new Date()) => {
  const istNow = new Date(now.getTime() + 5.5 * 3600000);
  const start = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));
  const next = new Date(start);
  next.setUTCDate(next.getUTCDate() + 1);
  const following = new Date(next);
  following.setUTCDate(following.getUTCDate() + 6);
  const todayStr = start.toISOString().slice(0, 10);
  return { start, next, following, todayStr };
};

/**
 * Parse a YYYY-MM-DD or ISO date string strictly to normalized UTC midnight.
 * Returns null if falsy; throws 400 Error if invalid.
 */
const parseFollowUpDate = (input) => {
  if (input === null || input === undefined || input === '') return null;
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      const err = new Error('Next follow-up date is invalid');
      err.statusCode = 400;
      throw err;
    }
    return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
  }

  const raw = String(input).trim();
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const year = parseInt(ymd[1], 10);
    const month = parseInt(ymd[2], 10);
    const day = parseInt(ymd[3], 10);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    if (
      utcDate.getUTCFullYear() === year &&
      utcDate.getUTCMonth() === month - 1 &&
      utcDate.getUTCDate() === day
    ) {
      return utcDate;
    }
    const err = new Error('Next follow-up date is invalid');
    err.statusCode = 400;
    throw err;
  }

  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) {
    const err = new Error('Next follow-up date is invalid');
    err.statusCode = 400;
    throw err;
  }
  return new Date(Date.UTC(fallback.getUTCFullYear(), fallback.getUTCMonth(), fallback.getUTCDate()));
};

const findEmployeeRecord = async (preferredEmployeeId, userId) => {
  if (preferredEmployeeId) {
    const val = typeof preferredEmployeeId === 'object' ? preferredEmployeeId._id : preferredEmployeeId;
    if (mongoose.isValidObjectId(val)) {
      const emp = await Employee.findOne({ _id: val, deletedAt: null }).populate('user', 'name email');
      if (emp) return emp;
    }
    const byEmpId = await Employee.findOne({ employeeId: val, deletedAt: null }).populate('user', 'name email');
    if (byEmpId) return byEmpId;
  }
  if (userId) {
    return Employee.findOne({ user: userId, deletedAt: null }).populate('user', 'name email');
  }
  return null;
};

const mapFollowUpChannel = (remarkType) => {
  if (['call', 'email', 'meeting', 'task', 'other'].includes(remarkType)) return remarkType;
  if (remarkType === 'whatsapp') return 'call';
  return 'call';
};

/**
 * Append a structured remark to Lead and optionally schedule Next Follow-up task + sync Lead.followUpDate
 */
const recordLeadRemarkAndFollowUp = async ({
  lead,
  user,
  content,
  remarkType = 'remark',
  outcome = '',
  nextFollowUpDate = null,
  nextFollowUpTime = '',
  nextFollowUpTitle = '',
  assignedTo = null,
  leadStatus = '',
  leadTemperature = '',
  createFollowUpTask = true,
  completePreviousPending = false,
}) => {
  const cleanContent = String(content || '').trim();
  const parsedDate = parseFollowUpDate(nextFollowUpDate);
  const cleanTime = String(nextFollowUpTime || '').trim();
  const now = new Date();

  let statusChanged = false;
  if (leadStatus && ['new', 'contacted', 'qualified', 'converted', 'lost'].includes(leadStatus) && lead.status !== leadStatus) {
    lead.status = leadStatus;
    statusChanged = true;
  }
  if (leadTemperature && ['cold', 'warm', 'hot', 'qualified'].includes(leadTemperature)) {
    lead.leadTemperature = leadTemperature;
  }
  if (assignedTo && mongoose.isValidObjectId(assignedTo)) {
    lead.assignedTo = assignedTo;
  } else if (statusChanged && !lead.assignedTo) {
    const selfEmp = await findEmployeeRecord(null, user._id);
    if (selfEmp) lead.assignedTo = selfEmp._id;
  }

  const actorName = user?.name || user?.email || 'Team Member';
  const noteEntry = {
    content: cleanContent,
    remarkType,
    outcome: String(outcome || '').trim(),
    nextFollowUpDate: parsedDate,
    nextFollowUpTime: cleanTime,
    statusSnapshot: lead.status,
    temperatureSnapshot: lead.leadTemperature,
    addedBy: user._id,
    addedByEmployeeName: actorName,
    addedAt: now,
  };

  if (cleanContent) {
    lead.notes.push(noteEntry);
    lead.lastRemark = {
      content: cleanContent,
      remarkType,
      outcome: noteEntry.outcome,
      addedBy: user._id,
      addedByName: actorName,
      addedAt: now,
      nextFollowUpDate: parsedDate,
      nextFollowUpTime: cleanTime,
    };
  }

  lead.lastActivityDate = now;
  lead.updatedAt = now;

  if (parsedDate) {
    lead.followUpDate = parsedDate;
    lead.followUpTime = cleanTime;
  }

  await lead.save();

  let createdFollowUp = null;
  if (parsedDate && createFollowUpTask) {
    if (completePreviousPending) {
      await FollowUp.updateMany(
        { type: 'lead', relatedId: lead._id, status: { $in: ['pending', 'overdue'] } },
        {
          $set: {
            status: 'completed',
            completedAt: now,
            outcome: cleanContent || 'Rescheduled to next follow-up',
            updatedAt: now,
          },
        }
      );
    }

    const assignee = await findEmployeeRecord(assignedTo || lead.assignedTo, user._id);
    if (assignee) {
      createdFollowUp = await FollowUp.create({
        type: 'lead',
        relatedId: lead._id,
        title: String(nextFollowUpTitle || '').trim() || `Follow-up: ${lead.name}`,
        description: cleanContent || (outcome ? `Outcome: ${outcome}` : ''),
        scheduledDate: parsedDate,
        scheduledTime: cleanTime,
        typeOfFollowUp: mapFollowUpChannel(remarkType),
        assignedTo: assignee._id,
        createdBy: user._id,
      });
    }
  }

  return { lead, followUp: createdFollowUp };
};

module.exports = {
  getIstDayRange,
  parseFollowUpDate,
  findEmployeeRecord,
  recordLeadRemarkAndFollowUp,
};
