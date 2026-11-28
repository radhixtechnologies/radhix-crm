const Company = require('../models/Company');
const Lead = require('../models/Lead');
const Employee = require('../models/Employee');
const Notification = require('../models/Notification');
const { recordLeadRemarkAndFollowUp } = require('./followUpSync');

const normalizePhoneDigits10 = (rawPhone) => {
  const digits = String(rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const findExistingDuplicateLead = async ({ tenantCompany = null, phone = '', email = '', excludeId = null }) => {
  const orConditions = [];
  const digits10 = normalizePhoneDigits10(phone);
  if (digits10 && digits10.length >= 7) {
    orConditions.push({ phone: { $regex: `${digits10}$` } });
  }
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (cleanEmail) {
    orConditions.push({ email: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') });
  }
  if (orConditions.length === 0) return null;

  const query = {
    isDeleted: { $ne: true },
    $or: orConditions,
  };
  if (tenantCompany) {
    query.$and = [{ $or: [{ tenantCompany }, { tenantCompany: null }] }];
  }
  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Lead.findOne(query).sort({ updatedAt: -1 });
};

const pickRoundRobinSalesEmployee = async ({ companyId = null }) => {
  const companyFilter = companyId ? { $or: [{ tenantCompany: companyId }, { tenantCompany: null }] } : {};
  const salesPool = await Employee.find({
    status: 'active',
    deletedAt: null,
    department: { $regex: /sales/i },
    ...companyFilter,
  })
    .sort({ employeeId: 1, createdAt: 1 })
    .select('_id user employeeId department')
    .lean();

  if (!salesPool || salesPool.length === 0) return null;

  let slot = 0;
  if (companyId) {
    const updatedCompany = await Company.findByIdAndUpdate(
      companyId,
      { $inc: { 'leadRouting.lastAssignedIndex': 1 } },
      { new: true }
    ).lean();
    const rawIdx = updatedCompany?.leadRouting?.lastAssignedIndex ?? 0;
    slot = ((rawIdx % salesPool.length) + salesPool.length) % salesPool.length;
  }

  return salesPool[slot];
};

const handleDuplicateReInquiry = async ({ existingLead, sourceLabel = 'Inbound', summaryNote = '', actorUser = null }) => {
  existingLead.reInquiryCount = (existingLead.reInquiryCount || 0) + 1;
  existingLead.lastInquiryAt = new Date();
  existingLead.lastActivityDate = new Date();

  const remarkText = summaryNote
    ? `[Re-inquiry #${existingLead.reInquiryCount} via ${sourceLabel}] ${summaryNote}`
    : `Duplicate protection matched existing lead on new ${sourceLabel} inquiry (#${existingLead.reInquiryCount}).`;

  await recordLeadRemarkAndFollowUp({
    lead: existingLead,
    user: actorUser || { _id: existingLead.createdBy || existingLead._id, name: `Lead Router (${sourceLabel})` },
    content: remarkText,
    remarkType: 'remark',
    createFollowUpTask: false,
  });

  if (existingLead.assignedTo) {
    const emp = await Employee.findById(existingLead.assignedTo).select('user').lean();
    if (emp?.user) {
      Notification.create({
        user: emp.user,
        title: `🔁 Re-Inquiry from ${existingLead.name}`,
        message: `${existingLead.name} submitted again via ${sourceLabel}.`,
        type: 'info',
        actionUrl: `/sales/leads/${existingLead._id}`,
      }).catch(() => {});
    }
  }

  return existingLead;
};

const pickFirstNonEmpty = (...values) => {
  for (const val of values) {
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
  }
  return '';
};

const parseExternalLeadPayload = (provider = 'custom', rawBody = {}) => {
  const prov = String(provider || 'custom').toLowerCase();
  const body = rawBody?.RESPONSE && typeof rawBody.RESPONSE === 'object' ? rawBody.RESPONSE : rawBody || {};

  const firstLast = `${pickFirstNonEmpty(body.first_name, body.firstName)} ${pickFirstNonEmpty(body.last_name, body.lastName)}`.trim();
  const name = pickFirstNonEmpty(
    body.SENDER_NAME,
    body.sender_name,
    body.full_name,
    body.fullName,
    body.name,
    body['your-name'],
    firstLast
  );
  const phone = pickFirstNonEmpty(
    body.SENDER_MOBILE,
    body.SENDER_MOBILE_ALT,
    body.sender_mobile,
    body.phone,
    body.mobile,
    body.phone_number,
    body.tel,
    body['your-phone']
  );
  const email = pickFirstNonEmpty(
    body.SENDER_EMAIL,
    body.sender_email,
    body.email,
    body['your-email']
  ).toLowerCase();
  const company = pickFirstNonEmpty(
    body.SENDER_COMPANY,
    body.sender_co,
    body.company,
    body.company_name
  );
  const industry = pickFirstNonEmpty(body.category, body.industry, body.QUERY_MCAT_NAME);
  const city = pickFirstNonEmpty(body.SENDER_CITY, body.city, body.area);
  const productOrSubject = pickFirstNonEmpty(
    body.QUERY_PRODUCT_NAME,
    body.product_name,
    body.SUBJECT,
    body.subject,
    body.category
  );
  const message = pickFirstNonEmpty(
    body.QUERY_MESSAGE,
    body.message,
    body['your-message'],
    body.requirement,
    body.comments
  );

  const allowedSource = ['indiamart', 'justdial', 'tradeindia', 'website', 'meta', 'webhook'].includes(prov)
    ? prov
    : prov === 'wordpress' || prov === 'elementor'
      ? 'website'
      : 'webhook';

  const noteParts = [];
  if (productOrSubject) noteParts.push(`Inquiry For: ${productOrSubject}`);
  if (city) noteParts.push(`City/Area: ${city}`);
  if (message) noteParts.push(`Details: ${message}`);

  return {
    name: name || phone || email || `${prov.toUpperCase()} Lead`,
    phone,
    email,
    company,
    industry,
    source: allowedSource,
    externalId: pickFirstNonEmpty(body.UNIQUE_QUERY_ID, body.leadid, body.id),
    notesText: noteParts.join(' | '),
  };
};

const intakeLeadWithRouting = async ({
  leadFields,
  companyId = null,
  sourceLabel = 'CRM',
  actorUser = null,
  summaryNote = '',
  skipDuplicateGuard = false,
  skipRoundRobin = false,
}) => {
  const company = companyId
    ? await Company.findById(companyId)
    : await Company.findOne().sort({ createdAt: 1 });

  const effectiveCompanyId = leadFields.tenantCompany || company?._id || null;
  const routing = company?.leadRouting || {};

  if (!skipDuplicateGuard && routing.duplicateGuardEnabled !== false) {
    const existing = await findExistingDuplicateLead({
      tenantCompany: effectiveCompanyId,
      phone: leadFields.phone,
      email: leadFields.email,
    });
    if (existing) {
      await handleDuplicateReInquiry({
        existingLead: existing,
        sourceLabel,
        summaryNote,
        actorUser,
      });
      return { isDuplicate: true, lead: existing, roundRobinAssigned: false };
    }
  }

  let roundRobinAssigned = false;
  if (!leadFields.assignedTo && !skipRoundRobin && routing.roundRobinEnabled && effectiveCompanyId) {
    const picked = await pickRoundRobinSalesEmployee({ companyId: effectiveCompanyId });
    if (picked) {
      leadFields.assignedTo = picked._id;
      roundRobinAssigned = true;
    }
  }

  const created = await Lead.create({
    ...leadFields,
    tenantCompany: effectiveCompanyId,
    lastInquiryAt: new Date(),
  });

  if (roundRobinAssigned && created.assignedTo) {
    const emp = await Employee.findById(created.assignedTo).select('user').lean();
    if (emp?.user) {
      Notification.create({
        user: emp.user,
        title: `🎯 New ${sourceLabel} Lead Assigned`,
        message: `${created.name} (${created.phone || created.email || 'No contact'}) auto-assigned via Round-Robin.`,
        type: 'info',
        actionUrl: `/sales/leads/${created._id}`,
      }).catch(() => {});
    }
  }

  return { isDuplicate: false, lead: created, roundRobinAssigned };
};

module.exports = {
  normalizePhoneDigits10,
  findExistingDuplicateLead,
  pickRoundRobinSalesEmployee,
  handleDuplicateReInquiry,
  parseExternalLeadPayload,
  intakeLeadWithRouting,
};
