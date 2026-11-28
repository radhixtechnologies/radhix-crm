const Lead = require('../../models/Lead');
const AiCallLog = require('../../models/AiCallLog');
const {
  SUPPORTED_PROVIDERS,
  maskApiKey,
  isMaskedValue,
  resolveCompanyRecord,
  getEffectiveAiConfig,
  buildWebhookUrl,
  initiateAiCallForLead,
  processAiCallWebhook,
  simulateCallCompletion,
} = require('../../services/aiCallingService');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });
const getRoleSlug = (user) => (typeof user?.role === 'object' ? user.role?.slug : user?.role);
const canManageSalesTeam = (user) => {
  const role = getRoleSlug(user) || '';
  return role === 'super_admin' || role === 'admin' || role.endsWith('_admin') || role.endsWith('_manager');
};

exports.getAiCallingConfig = async (req, res) => {
  try {
    const config = await getEffectiveAiConfig({ user: req.user });
    res.json({
      success: true,
      data: {
        enabled: config.enabled,
        provider: config.provider,
        apiKeyMasked: maskApiKey(config.apiKey),
        hasApiKey: Boolean(config.apiKey),
        agentId: config.agentId,
        fromNumber: config.fromNumber,
        webhookSecret: config.webhookSecret ? maskApiKey(config.webhookSecret) : '',
        hasWebhookSecret: Boolean(config.webhookSecret),
        autoCallNewLeads: config.autoCallNewLeads,
        defaultLanguage: config.defaultLanguage,
        systemScript: config.systemScript,
        autoWhatsAppAfterCall: config.autoWhatsAppAfterCall,
        whatsappInterestedTemplate: config.whatsappInterestedTemplate,
        whatsappNoAnswerTemplate: config.whatsappNoAnswerTemplate,
        autoRetryEnabled: config.autoRetryEnabled,
        maxRetryAttempts: config.maxRetryAttempts,
        retryDelayMinutes: config.retryDelayMinutes,
        dndStartHour: config.dndStartHour,
        dndEndHour: config.dndEndHour,
        webhookUrl: buildWebhookUrl(req, config.webhookSecret),
        providers: SUPPORTED_PROVIDERS,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.updateAiCallingConfig = async (req, res) => {
  if (!canManageSalesTeam(req.user)) {
    return res.status(403).json({ success: false, message: 'Only Admins or Sales Managers can update AI Calling settings' });
  }
  try {
    const company = await resolveCompanyRecord(req.user);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company workspace record not found' });
    }

    const existing = company.aiCalling || {};
    const {
      enabled,
      provider,
      apiKey,
      agentId,
      fromNumber,
      webhookSecret,
      autoCallNewLeads,
      defaultLanguage,
      systemScript,
      autoWhatsAppAfterCall,
      whatsappInterestedTemplate,
      whatsappNoAnswerTemplate,
      autoRetryEnabled,
      maxRetryAttempts,
      retryDelayMinutes,
      dndStartHour,
      dndEndHour,
    } = req.body;

    const updatedAi = {
      enabled: enabled !== undefined ? Boolean(enabled) : existing.enabled,
      provider: provider || existing.provider || 'bolna',
      apiKey: apiKey !== undefined && !isMaskedValue(apiKey) ? String(apiKey).trim() : existing.apiKey,
      agentId: agentId !== undefined ? String(agentId).trim() : existing.agentId,
      fromNumber: fromNumber !== undefined ? String(fromNumber).trim() : existing.fromNumber,
      webhookSecret:
        webhookSecret !== undefined && !isMaskedValue(webhookSecret)
          ? String(webhookSecret).trim()
          : existing.webhookSecret,
      autoCallNewLeads: autoCallNewLeads !== undefined ? Boolean(autoCallNewLeads) : existing.autoCallNewLeads,
      defaultLanguage: defaultLanguage !== undefined ? String(defaultLanguage).trim() : existing.defaultLanguage,
      systemScript: systemScript !== undefined ? String(systemScript).trim() : existing.systemScript,
      autoWhatsAppAfterCall:
        autoWhatsAppAfterCall !== undefined ? Boolean(autoWhatsAppAfterCall) : existing.autoWhatsAppAfterCall,
      whatsappInterestedTemplate:
        whatsappInterestedTemplate !== undefined
          ? String(whatsappInterestedTemplate).trim()
          : existing.whatsappInterestedTemplate,
      whatsappNoAnswerTemplate:
        whatsappNoAnswerTemplate !== undefined
          ? String(whatsappNoAnswerTemplate).trim()
          : existing.whatsappNoAnswerTemplate,
      autoRetryEnabled: autoRetryEnabled !== undefined ? Boolean(autoRetryEnabled) : existing.autoRetryEnabled,
      maxRetryAttempts:
        maxRetryAttempts !== undefined
          ? Math.min(5, Math.max(1, Number(maxRetryAttempts) || 2))
          : existing.maxRetryAttempts || 2,
      retryDelayMinutes:
        retryDelayMinutes !== undefined
          ? Math.min(1440, Math.max(10, Number(retryDelayMinutes) || 60))
          : existing.retryDelayMinutes || 60,
      dndStartHour: dndStartHour !== undefined ? Number(dndStartHour) : existing.dndStartHour ?? 21,
      dndEndHour: dndEndHour !== undefined ? Number(dndEndHour) : existing.dndEndHour ?? 9,
    };

    company.aiCalling = updatedAi;
    await company.save();

    res.json({
      success: true,
      message: 'AI Calling configuration saved successfully',
      data: {
        ...updatedAi,
        apiKey: undefined,
        webhookSecret: undefined,
        apiKeyMasked: maskApiKey(updatedAi.apiKey),
        hasApiKey: Boolean(updatedAi.apiKey),
        hasWebhookSecret: Boolean(updatedAi.webhookSecret),
        webhookUrl: buildWebhookUrl(req, updatedAi.webhookSecret),
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.testAiCallingConnection = async (req, res) => {
  try {
    const config = await getEffectiveAiConfig({ user: req.user });
    const provider = req.body.provider || config.provider;
    const apiKey = req.body.apiKey && !isMaskedValue(req.body.apiKey) ? req.body.apiKey.trim() : config.apiKey;
    const agentId = req.body.agentId ? req.body.agentId.trim() : config.agentId;

    if (provider === 'simulator') {
      return res.json({ success: true, message: 'CRM Built-in AI Call Simulator is active and ready for instant testing!' });
    }
    if (!apiKey || !agentId) {
      return res.status(400).json({ success: false, message: 'API Key and Agent ID are required to verify connection' });
    }

    let url = '';
    if (provider === 'bolna') url = `https://api.bolna.ai/agent/${encodeURIComponent(agentId)}`;
    else if (provider === 'retell') url = `https://api.retellai.com/get-agent/${encodeURIComponent(agentId)}`;
    else if (provider === 'vapi') url = `https://api.vapi.ai/assistant/${encodeURIComponent(agentId)}`;
    else return res.status(400).json({ success: false, message: 'Unknown provider' });

    const upstream = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok) {
      return res.status(502).json({
        success: false,
        message: data.message || data.detail || `${provider.toUpperCase()} verification failed (HTTP ${upstream.status})`,
      });
    }

    res.json({
      success: true,
      message: `Connected cleanly to ${provider.toUpperCase()} Agent (${data.agent_name || data.name || agentId})`,
      agent: data.agent_name || data.name || agentId,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.getAiCallLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, leadId, status, outcome, provider } = req.query;
    const query = {};
    if (leadId) query.lead = leadId;
    if (status) query.status = status;
    if (outcome) query.outcome = outcome;
    if (provider) query.provider = provider;

    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [calls, total, summaryAgg] = await Promise.all([
      AiCallLog.find(query)
        .populate('lead', 'name phone company status leadTemperature followUpDate followUpTime')
        .populate('initiatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),
      AiCallLog.countDocuments(query),
      AiCallLog.aggregate([
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            interested: { $sum: { $cond: [{ $in: ['$outcome', ['interested', 'callback_requested']] }, 1, 0] } },
            notInterested: { $sum: { $cond: [{ $eq: ['$outcome', 'not_interested'] }, 1, 0] } },
            noAnswerOrBusy: { $sum: { $cond: [{ $in: ['$outcome', ['no_answer', 'busy']] }, 1, 0] } },
            callbacksScheduled: { $sum: { $cond: [{ $ne: ['$nextFollowUpDate', null] }, 1, 0] } },
            whatsappSent: { $sum: { $cond: [{ $eq: ['$whatsappAutoSent', true] }, 1, 0] } },
            retriesScheduled: { $sum: { $cond: [{ $eq: ['$retryScheduled', true] }, 1, 0] } },
            totalDurationSeconds: { $sum: '$durationSeconds' },
            totalCost: { $sum: '$cost' },
          },
        },
      ]),
    ]);

    const s = summaryAgg[0] || {
      totalCalls: 0,
      completed: 0,
      interested: 0,
      notInterested: 0,
      noAnswerOrBusy: 0,
      callbacksScheduled: 0,
      whatsappSent: 0,
      retriesScheduled: 0,
      totalDurationSeconds: 0,
      totalCost: 0,
    };
    s.connectRate = s.totalCalls > 0 ? Math.round((s.completed / s.totalCalls) * 100) : 0;
    s.interestedRate = s.completed > 0 ? Math.round((s.interested / s.completed) * 100) : 0;
    s.avgDurationSeconds = s.completed > 0 ? Math.round(s.totalDurationSeconds / s.completed) : 0;

    res.json({
      success: true,
      data: calls,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
      summary: s,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.triggerLeadAiCall = async (req, res) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const callLog = await initiateAiCallForLead({
      lead,
      user: req.user,
      customScript: req.body.customScript || '',
      overrideProvider: req.body.simulate ? 'simulator' : (req.body.provider || ''),
      req,
    });

    const populated = await AiCallLog.findById(callLog._id)
      .populate('lead', 'name phone company status')
      .populate('initiatedBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
      message:
        callLog.provider === 'simulator'
          ? 'Simulated AI Call started — click "Complete Simulation" to preview webhook sync!'
          : `AI Call initiated via ${callLog.provider.toUpperCase()}`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.bulkTriggerAiCalls = async (req, res) => {
  try {
    const { leadIds, customScript = '', simulate = false } = req.body;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one lead' });
    }

    const leads = await Lead.find({
      _id: { $in: leadIds.slice(0, 25) },
      isDeleted: { $ne: true },
    });

    const results = [];
    const errors = [];
    for (const lead of leads) {
      try {
        const log = await initiateAiCallForLead({
          lead,
          user: req.user,
          customScript,
          overrideProvider: simulate ? 'simulator' : '',
          req,
        });
        results.push(log._id);
      } catch (err) {
        errors.push({ leadId: lead._id, name: lead.name, reason: err.message });
      }
    }

    res.json({
      success: results.length > 0,
      initiatedCount: results.length,
      failedCount: errors.length,
      errors,
      message: `Initiated AI calls for ${results.length} lead(s)${errors.length ? ` (${errors.length} skipped)` : ''}.`,
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.simulateCallWebhookResult = async (req, res) => {
  try {
    const callLog = await AiCallLog.findById(req.params.callId);
    if (!callLog) return res.status(404).json({ success: false, message: 'AI Call log not found' });

    const { scenario = 'interested_callback', callbackDate = '', callbackTime = '16:00', customSummary = '' } = req.body;
    const result = await simulateCallCompletion({
      callLog,
      scenario,
      callbackDate,
      callbackTime,
      customSummary,
    });

    const populated = await AiCallLog.findById(callLog._id)
      .populate('lead', 'name phone company status leadTemperature followUpDate followUpTime')
      .populate('initiatedBy', 'name email')
      .lean();

    res.json({
      success: true,
      data: populated,
      result,
      message: 'Simulated call completed and synced to Lead Remark Trail & Follow-ups!',
    });
  } catch (error) {
    sendError(res, error);
  }
};

exports.receiveAiCallWebhook = async (req, res) => {
  try {
    const result = await processAiCallWebhook({
      payload: req.body,
      querySecret: req.query.secret || '',
      headerSecret: req.get('x-ai-webhook-secret') || '',
    });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    sendError(res, error);
  }
};
