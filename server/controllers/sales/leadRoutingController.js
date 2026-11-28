const Company = require('../../models/Company');
const Employee = require('../../models/Employee');
const Lead = require('../../models/Lead');
const { resolveCompanyRecord, maskApiKey, isMaskedValue, getEffectiveAiConfig, initiateAiCallForLead } = require('../../services/aiCallingService');
const { parseExternalLeadPayload, intakeLeadWithRouting } = require('../../utils/leadIntake');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const getRoleSlug = (user) => (typeof user?.role === 'object' ? user.role?.slug : user?.role);
const canManageSalesTeam = (user) => {
  const role = getRoleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};

const buildExternalWebhookUrls = (req, secret = '') => {
  const base = (process.env.API_PUBLIC_URL || (req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000')).replace(/\/$/, '');
  const suffix = secret ? `?secret=${encodeURIComponent(secret)}` : '';
  return {
    indiamart: `${base}/api/webhooks/leads/indiamart${suffix}`,
    justdial: `${base}/api/webhooks/leads/justdial${suffix}`,
    tradeindia: `${base}/api/webhooks/leads/tradeindia${suffix}`,
    wordpress: `${base}/api/webhooks/leads/wordpress${suffix}`,
    custom: `${base}/api/webhooks/leads/custom${suffix}`,
  };
};

exports.getLeadRoutingConfig = async (req, res) => {
  try {
    const company = await resolveCompanyRecord(req.user);
    const routing = company?.leadRouting || {};
    const companyFilter = company?._id ? { $or: [{ tenantCompany: company._id }, { tenantCompany: null }] } : {};

    const salesReps = await Employee.find({
      status: 'active',
      deletedAt: null,
      department: { $regex: /sales/i },
      ...companyFilter,
    })
      .sort({ employeeId: 1, createdAt: 1 })
      .select('employeeId department designation user')
      .populate('user', 'name email')
      .lean();

    const repIds = salesReps.map((r) => r._id);
    const openCounts = repIds.length
      ? await Lead.aggregate([
          { $match: { assignedTo: { $in: repIds }, isDeleted: { $ne: true }, status: { $nin: ['converted', 'lost'] } } },
          { $group: { _id: '$assignedTo', openLeads: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map(openCounts.map((c) => [String(c._id), c.openLeads]));

    res.json({
      success: true,
      data: {
        roundRobinEnabled: Boolean(routing.roundRobinEnabled),
        duplicateGuardEnabled: routing.duplicateGuardEnabled !== false,
        autoCallExternalLeads: Boolean(routing.autoCallExternalLeads),
        hasWebhookSecret: Boolean(routing.externalWebhookSecret),
        webhookSecretMasked: routing.externalWebhookSecret ? maskApiKey(routing.externalWebhookSecret) : '',
        webhookUrls: buildExternalWebhookUrls(req, routing.externalWebhookSecret),
        salesPool: salesReps.map((rep) => ({
          _id: rep._id,
          employeeId: rep.employeeId,
          name: rep.user?.name || rep.employeeId || 'Sales Rep',
          email: rep.user?.email || '',
          designation: rep.designation || 'Sales',
          openLeads: countMap.get(String(rep._id)) || 0,
        })),
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateLeadRoutingConfig = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Admins or Sales Managers can update Lead Routing settings' });
  }
  try {
    const company = await resolveCompanyRecord(req.user);
    if (!company) return res.status(404).json({ success: false, message: 'Company record not found' });

    const existing = company.leadRouting || {};
    const {
      roundRobinEnabled,
      duplicateGuardEnabled,
      autoCallExternalLeads,
      externalWebhookSecret,
    } = req.body;

    company.leadRouting = {
      roundRobinEnabled: roundRobinEnabled !== undefined ? Boolean(roundRobinEnabled) : existing.roundRobinEnabled,
      lastAssignedIndex: existing.lastAssignedIndex ?? -1,
      duplicateGuardEnabled:
        duplicateGuardEnabled !== undefined ? Boolean(duplicateGuardEnabled) : existing.duplicateGuardEnabled !== false,
      autoCallExternalLeads:
        autoCallExternalLeads !== undefined ? Boolean(autoCallExternalLeads) : existing.autoCallExternalLeads,
      externalWebhookSecret:
        externalWebhookSecret !== undefined && !isMaskedValue(externalWebhookSecret)
          ? String(externalWebhookSecret).trim()
          : existing.externalWebhookSecret,
    };

    await company.save();

    res.json({
      success: true,
      message: 'Lead Routing & Protection settings saved!',
      data: {
        roundRobinEnabled: company.leadRouting.roundRobinEnabled,
        duplicateGuardEnabled: company.leadRouting.duplicateGuardEnabled,
        autoCallExternalLeads: company.leadRouting.autoCallExternalLeads,
        hasWebhookSecret: Boolean(company.leadRouting.externalWebhookSecret),
        webhookSecretMasked: company.leadRouting.externalWebhookSecret ? maskApiKey(company.leadRouting.externalWebhookSecret) : '',
        webhookUrls: buildExternalWebhookUrls(req, company.leadRouting.externalWebhookSecret),
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.simulateExternalLeadWebhook = async (req, res) => {
  try {
    const company = await resolveCompanyRecord(req.user);
    const provider = String(req.body.provider || 'indiamart').toLowerCase();
    const parsed = parseExternalLeadPayload(provider, req.body);

    const { isDuplicate, lead, roundRobinAssigned } = await intakeLeadWithRouting({
      leadFields: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email,
        company: parsed.company,
        industry: parsed.industry,
        source: parsed.source,
        createdBy: req.user._id,
        notes: parsed.notesText ? [{ content: `[${provider.toUpperCase()} Test Lead] ${parsed.notesText}`, addedBy: req.user._id }] : [],
      },
      companyId: company?._id || null,
      sourceLabel: `${provider.toUpperCase()} Portal`,
      actorUser: req.user,
      summaryNote: parsed.notesText || 'Simulated portal inquiry',
    });

    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      isDuplicate,
      roundRobinAssigned,
      leadId: lead._id,
      leadName: lead.name,
      message: isDuplicate
        ? `Duplicate Guard triggered! Matched existing lead "${lead.name}" and logged Re-inquiry remark.`
        : `New ${provider.toUpperCase()} lead "${lead.name}" created${roundRobinAssigned ? ' & auto-assigned via Round-Robin' : ''}!`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.receiveExternalLeadWebhook = async (req, res) => {
  try {
    const provider = String(req.params.provider || 'custom').toLowerCase();
    const company = req.query.companyId
      ? await Company.findById(req.query.companyId)
      : await Company.findOne().sort({ createdAt: 1 });

    const expectedSecret = company?.leadRouting?.externalWebhookSecret || '';
    if (expectedSecret) {
      const provided = req.query.secret || req.get('x-webhook-secret') || '';
      if (provided !== expectedSecret) {
        return res.status(401).json({ success: false, message: 'Invalid external lead webhook secret' });
      }
    }

    const parsed = parseExternalLeadPayload(provider, req.body);
    if (!parsed.phone && !parsed.email && !parsed.name) {
      return res.status(400).json({ success: false, message: 'Missing lead name/phone/email in webhook payload' });
    }

    const { isDuplicate, lead, roundRobinAssigned } = await intakeLeadWithRouting({
      leadFields: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email,
        company: parsed.company,
        industry: parsed.industry,
        source: parsed.source,
        notes: parsed.notesText ? [{ content: `[${provider.toUpperCase()} Webhook] ${parsed.notesText}`, addedBy: null }] : [],
      },
      companyId: company?._id || null,
      sourceLabel: provider.toUpperCase(),
      summaryNote: parsed.notesText,
    });

    if (!isDuplicate && lead.phone && (company?.leadRouting?.autoCallExternalLeads || company?.aiCalling?.autoCallNewLeads)) {
      getEffectiveAiConfig({ companyId: company?._id })
        .then((aiCfg) => {
          if (aiCfg?.enabled) {
            return initiateAiCallForLead({ lead, companyId: company._id });
          }
          return null;
        })
        .catch((err) => console.warn('External lead Auto AI Call skipped:', err.message));
    }

    res.status(isDuplicate ? 200 : 201).json({
      success: true,
      isDuplicate,
      roundRobinAssigned,
      leadId: lead._id,
    });
  } catch (error) {
    sendError(res, error);
  }
};
