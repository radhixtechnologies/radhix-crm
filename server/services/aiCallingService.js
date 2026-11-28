const crypto = require('crypto');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const AiCallLog = require('../models/AiCallLog');
const Notification = require('../models/Notification');
const { getTenantCompanyId } = require('../utils/tenantHelper');
const { parseFollowUpDate, recordLeadRemarkAndFollowUp, getIstDayRange } = require('../utils/followUpSync');
const { sendMetaCloudMessage, fillTemplate } = require('./whatsappService');

const SUPPORTED_PROVIDERS = [
  {
    id: 'bolna',
    name: 'Bolna AI (Recommended for India / Hinglish)',
    requiresFromNumber: false,
    description: 'Native Hindi, Hinglish & Indian English voices with Plivo/Vobiz/Twilio +91 numbers.',
  },
  {
    id: 'retell',
    name: 'Retell AI',
    requiresFromNumber: true,
    description: 'Ultra-low latency voice agents with flat webhooks and built-in call analytics.',
  },
  {
    id: 'vapi',
    name: 'Vapi AI',
    requiresFromNumber: true,
    description: 'Modular assistant orchestration with Twilio/SIP phoneNumberId routing.',
  },
  {
    id: 'simulator',
    name: 'CRM Built-in Simulator (Instant Test Mode)',
    requiresFromNumber: false,
    description: 'Test the complete AI Calling -> Transcript -> Auto-Remark -> Follow-up loop without phone KYC.',
  },
];

const normalizePhoneNumber = (rawPhone) => {
  if (!rawPhone) return '';
  const trimmed = String(rawPhone).trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';
  if (trimmed.startsWith('+') && digits.length >= 10) return `+${digits}`;
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
};

const maskApiKey = (val) => {
  if (!val) return '';
  const str = String(val);
  if (str.length <= 8) return '••••••••';
  return `${str.slice(0, 4)}••••••••${str.slice(-4)}`;
};

const isMaskedValue = (val) => typeof val === 'string' && val.includes('••••');

const resolveCompanyRecord = async (user, explicitCompanyId = null) => {
  if (explicitCompanyId) {
    return Company.findById(explicitCompanyId);
  }
  if (user) {
    const tenantId = await getTenantCompanyId(user);
    if (tenantId) {
      const comp = await Company.findById(tenantId);
      if (comp) return comp;
    }
  }
  return Company.findOne().sort({ createdAt: 1 });
};

const getEffectiveAiConfig = async ({ user = null, companyId = null, companyDoc = null } = {}) => {
  const company = companyDoc || (await resolveCompanyRecord(user, companyId));
  const saved = company?.aiCalling || {};
  const provider = saved.provider || process.env.AI_CALL_PROVIDER || 'bolna';

  const envApiKeyMap = {
    bolna: process.env.BOLNA_API_KEY,
    retell: process.env.RETELL_API_KEY,
    vapi: process.env.VAPI_API_KEY,
  };
  const envAgentMap = {
    bolna: process.env.BOLNA_AGENT_ID,
    retell: process.env.RETELL_AGENT_ID,
    vapi: process.env.VAPI_ASSISTANT_ID,
  };
  const envFromMap = {
    bolna: process.env.BOLNA_FROM_NUMBER,
    retell: process.env.RETELL_FROM_NUMBER,
    vapi: process.env.VAPI_PHONE_NUMBER_ID,
  };

  return {
    company,
    tenantCompanyId: company?._id || null,
    companyName: company?.branding?.companyDisplayName || company?.name || process.env.COMPANY_NAME || 'Radhix Technologies',
    enabled: Boolean(saved.enabled),
    provider,
    apiKey: saved.apiKey || envApiKeyMap[provider] || '',
    agentId: saved.agentId || envAgentMap[provider] || '',
    fromNumber: saved.fromNumber || envFromMap[provider] || '',
    webhookSecret: saved.webhookSecret || process.env.AI_CALL_WEBHOOK_SECRET || '',
    autoCallNewLeads: Boolean(saved.autoCallNewLeads),
    defaultLanguage: saved.defaultLanguage || 'hi-IN',
    systemScript:
      saved.systemScript ||
      'Namaste {name} ji, main {company} ki taraf se baat kar raha hoon. Aapne hamari service me interest dikhaya tha. Kya abhi 2 minute baat karne ka sahi samay hai?',
    autoWhatsAppAfterCall: Boolean(saved.autoWhatsAppAfterCall),
    whatsappInterestedTemplate:
      saved.whatsappInterestedTemplate ||
      'Namaste {name} ji! {company} se baat karne ke liye dhanyavaad. Aapka callback {callback} par schedule ho gaya hai. Koi query ho toh yahin reply karein.',
    whatsappNoAnswerTemplate:
      saved.whatsappNoAnswerTemplate ||
      'Namaste {name} ji, humne {company} se aapko call try kiya tha par connect nahi ho paaya. Kripya batayein ki aapko kis time call karein?',
    autoRetryEnabled: Boolean(saved.autoRetryEnabled),
    maxRetryAttempts: Number(saved.maxRetryAttempts) || 2,
    retryDelayMinutes: Number(saved.retryDelayMinutes) || 60,
    dndStartHour: saved.dndStartHour !== undefined ? Number(saved.dndStartHour) : 21,
    dndEndHour: saved.dndEndHour !== undefined ? Number(saved.dndEndHour) : 9,
  };
};

const computeNextAllowedRetryTime = (delayMinutes = 60, dndStartHour = 21, dndEndHour = 9, baseDate = new Date()) => {
  const candidate = new Date(baseDate.getTime() + Math.max(10, Number(delayMinutes) || 60) * 60000);
  const istOffsetMs = 5.5 * 3600000;
  const istDate = new Date(candidate.getTime() + istOffsetMs);
  const istHour = istDate.getUTCHours();

  const inDnd =
    dndStartHour > dndEndHour
      ? istHour >= dndStartHour || istHour < dndEndHour
      : dndStartHour < dndEndHour
        ? istHour >= dndStartHour && istHour < dndEndHour
        : false;

  if (!inDnd) return candidate;

  // Roll forward to dndEndHour:05 IST
  if (dndStartHour > dndEndHour && istHour >= dndStartHour) {
    istDate.setUTCDate(istDate.getUTCDate() + 1);
  }
  istDate.setUTCHours(dndEndHour, 5, 0, 0);
  return new Date(istDate.getTime() - istOffsetMs);
};

const buildWebhookUrl = (req, webhookSecret = '') => {
  const base =
    process.env.API_PUBLIC_URL ||
    (req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:5000');
  const cleanBase = base.replace(/\/$/, '');
  const secretSuffix = webhookSecret ? `?secret=${encodeURIComponent(webhookSecret)}` : '';
  return `${cleanBase}/api/webhooks/ai-call${secretSuffix}`;
};

const renderScript = (template, lead, companyName) => {
  const latestRemark = lead.lastRemark?.content || lead.notes?.slice(-1)?.[0]?.content || '';
  return String(template || '')
    .replace(/\{name\}/gi, lead.name || 'Customer')
    .replace(/\{company\}/gi, companyName || 'our team')
    .replace(/\{requirements\}/gi, lead.courseInterested || lead.company || lead.industry || 'your inquiry')
    .replace(/\{remark\}/gi, latestRemark);
};

const dispatchToProvider = async ({ config, lead, callLog, customScript = '', req = null }) => {
  const toNumber = normalizePhoneNumber(lead.phone);
  if (!toNumber) {
    const err = new Error('Lead phone number is missing or invalid');
    err.statusCode = 400;
    throw err;
  }

  const promptText = customScript?.trim() || renderScript(config.systemScript, lead, config.companyName);
  const webhookUrl = buildWebhookUrl(req, config.webhookSecret);

  if (config.provider === 'simulator') {
    return {
      externalCallId: `sim_${crypto.randomUUID().slice(0, 12)}`,
      status: 'in-progress',
      rawResponse: { simulated: true, toNumber, promptText },
    };
  }

  if (!config.apiKey || !config.agentId) {
    const err = new Error(`Please configure your ${config.provider.toUpperCase()} API Key and Agent ID in AI Calling Settings (or choose Simulator mode to test immediately).`);
    err.statusCode = 400;
    throw err;
  }

  if (config.provider === 'bolna') {
    const body = {
      agent_id: config.agentId,
      recipient_phone_number: toNumber,
      user_data: {
        lead_id: String(lead._id),
        call_log_id: String(callLog._id),
        customer_name: lead.name || '',
        company: lead.company || '',
        requirements: lead.courseInterested || lead.industry || '',
        script_context: promptText,
        webhook_url: webhookUrl,
      },
    };
    if (config.fromNumber) {
      body.from_phone_number = normalizePhoneNumber(config.fromNumber);
    }

    const res = await fetch('https://api.bolna.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || json.detail || `Bolna API returned HTTP ${res.status}`);
      err.statusCode = 502;
      throw err;
    }
    return {
      externalCallId: json.execution_id || json.id || `bolna_${Date.now()}`,
      status: json.status === 'queued' ? 'queued' : 'ringing',
      rawResponse: json,
    };
  }

  if (config.provider === 'retell') {
    if (!config.fromNumber) {
      const err = new Error('Retell AI requires a "From Number" (+E.164 format) in AI Calling Settings');
      err.statusCode = 400;
      throw err;
    }
    const body = {
      from_number: normalizePhoneNumber(config.fromNumber),
      to_number: toNumber,
      agent_id: config.agentId,
      retell_llm_dynamic_variables: {
        customer_name: lead.name || '',
        company: config.companyName,
        lead_company: lead.company || '',
        script_context: promptText,
      },
      metadata: {
        lead_id: String(lead._id),
        call_log_id: String(callLog._id),
      },
    };
    const res = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || json.error || `Retell API returned HTTP ${res.status}`);
      err.statusCode = 502;
      throw err;
    }
    return {
      externalCallId: json.call_id || `retell_${Date.now()}`,
      status: 'ringing',
      rawResponse: json,
    };
  }

  if (config.provider === 'vapi') {
    if (!config.fromNumber) {
      const err = new Error('Vapi AI requires a "Phone Number ID" in AI Calling Settings');
      err.statusCode = 400;
      throw err;
    }
    const body = {
      assistantId: config.agentId,
      phoneNumberId: config.fromNumber,
      customer: {
        number: toNumber,
        name: lead.name || 'Lead',
      },
      assistantOverrides: {
        variableValues: {
          lead_id: String(lead._id),
          call_log_id: String(callLog._id),
          customer_name: lead.name || '',
          company: config.companyName,
          script_context: promptText,
        },
      },
    };
    const res = await fetch('https://api.vapi.ai/call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(json.message || `Vapi API returned HTTP ${res.status}`);
      err.statusCode = 502;
      throw err;
    }
    return {
      externalCallId: json.id || `vapi_${Date.now()}`,
      status: 'queued',
      rawResponse: json,
    };
  }

  const err = new Error(`Unsupported AI call provider: ${config.provider}`);
  err.statusCode = 400;
  throw err;
};

const initiateAiCallForLead = async ({
  lead,
  user = null,
  companyId = null,
  customScript = '',
  overrideProvider = '',
  req = null,
  attemptNumber = 1,
  parentCallId = null,
}) => {
  const config = await getEffectiveAiConfig({
    user,
    companyId: companyId || lead.tenantCompany,
  });
  if (overrideProvider && ['bolna', 'retell', 'vapi', 'simulator'].includes(overrideProvider)) {
    config.provider = overrideProvider;
  }

  const toNumber = normalizePhoneNumber(lead.phone);
  if (!toNumber) {
    const err = new Error('Lead phone number is missing or invalid');
    err.statusCode = 400;
    throw err;
  }

  const callLog = await AiCallLog.create({
    tenantCompany: config.tenantCompanyId,
    lead: lead._id,
    initiatedBy: user?._id || null,
    assignedEmployee: lead.assignedTo?._id || lead.assignedTo || null,
    provider: config.provider,
    agentId: config.agentId,
    fromNumber: config.fromNumber,
    toNumber,
    status: 'queued',
    attemptNumber,
    parentCallId,
    startedAt: new Date(),
  });

  try {
    const dispatchResult = await dispatchToProvider({ config, lead, callLog, customScript, req });
    callLog.externalCallId = dispatchResult.externalCallId;
    callLog.status = dispatchResult.status;
    callLog.rawPayload = dispatchResult.rawResponse;
    await callLog.save();
    return callLog;
  } catch (err) {
    callLog.status = 'failed';
    callLog.errorMessage = err.message;
    callLog.endedAt = new Date();
    await callLog.save();
    throw err;
  }
};

const formatTranscriptTurns = (rawTranscript) => {
  if (Array.isArray(rawTranscript)) {
    const turns = rawTranscript
      .map((item) => ({
        role: item.role || 'agent',
        message: String(item.message || item.content || item.text || '').trim(),
      }))
      .filter((t) => t.message);
    const text = turns.map((t) => `${t.role === 'user' ? 'Client' : 'AI Agent'}: ${t.message}`).join('\n');
    return { turns, text };
  }
  if (typeof rawTranscript === 'string' && rawTranscript.trim()) {
    const lines = rawTranscript.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const turns = lines.map((line) => {
      const m = line.match(/^(agent|ai|assistant|bot|user|customer|client)\s*:\s*(.*)$/i);
      if (!m) return { role: 'agent', message: line };
      const r = /user|customer|client/i.test(m[1]) ? 'user' : 'agent';
      return { role: r, message: m[2].trim() };
    });
    return { turns, text: rawTranscript.trim() };
  }
  return { turns: [], text: '' };
};

const mapAiOutcomeAndTemperature = ({ terminationReason, rawStatus, extracted = {}, summary = '' }) => {
  const reason = String(terminationReason || '').toLowerCase();
  const statusLower = String(rawStatus || '').toLowerCase();
  const textBlob = `${summary} ${JSON.stringify(extracted)}`.toLowerCase();

  if (reason.includes('no-answer') || reason.includes('no_answer') || statusLower === 'no-answer') {
    return { callStatus: 'no-answer', outcome: 'no_answer', temperature: '' };
  }
  if (reason.includes('busy') || statusLower === 'busy') {
    return { callStatus: 'busy', outcome: 'busy', temperature: '' };
  }
  if (reason.includes('voicemail')) {
    return { callStatus: 'completed', outcome: 'voicemail', temperature: '' };
  }
  if (reason.includes('fail') || statusLower === 'failed' || statusLower === 'error') {
    return { callStatus: 'failed', outcome: 'other', temperature: '' };
  }

  if (extracted.interested === false || /\bnot interested\b|\bno thanks\b/i.test(textBlob)) {
    return { callStatus: 'completed', outcome: 'not_interested', temperature: 'cold' };
  }
  if (extracted.callback_date || extracted.nextFollowUpDate || extracted.next_follow_up_date || /\bcall back\b|\bcallback\b|\btomorrow\b/i.test(textBlob)) {
    return {
      callStatus: 'completed',
      outcome: 'callback_requested',
      temperature: extracted.interested ? 'hot' : 'warm',
    };
  }
  if (extracted.interested === true || /\binterested\b|\bpricing\b|\bquote\b|\bdemo\b|\bsite visit\b/i.test(textBlob)) {
    return { callStatus: 'completed', outcome: 'interested', temperature: 'hot' };
  }
  return { callStatus: 'completed', outcome: 'other', temperature: '' };
};

const extractCallbackSchedule = (extracted = {}, summary = '', transcriptText = '') => {
  const rawDate =
    extracted.next_follow_up_date ||
    extracted.nextFollowUpDate ||
    extracted.callback_date ||
    extracted.callbackDate ||
    '';
  const rawTime =
    extracted.next_follow_up_time ||
    extracted.nextFollowUpTime ||
    extracted.callback_time ||
    extracted.callbackTime ||
    '';

  let parsedDate = null;
  if (rawDate) {
    try {
      parsedDate = parseFollowUpDate(rawDate);
    } catch {
      parsedDate = null;
    }
  }

  if (!parsedDate) {
    const combined = `${summary} ${transcriptText}`;
    if (/\btomorrow\b|\bkal\b/i.test(combined)) {
      const { next } = getIstDayRange();
      parsedDate = next;
    }
  }

  let normalizedTime = '';
  const timeMatch = String(rawTime || '').match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    normalizedTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  }

  return { parsedDate, normalizedTime };
};

const parseProviderWebhookPayload = (payload = {}) => {
  // Vapi envelope: { message: { type, call, recordingUrl, summary, transcript, structuredData, ... } }
  if (payload.message && typeof payload.message === 'object') {
    const msg = payload.message;
    const type = String(msg.type || '');
    const isTerminal = type === 'end-of-call-report' || type === 'status-update' && msg.status === 'ended';
    const { turns, text } = formatTranscriptTurns(msg.transcript || msg.artifact?.transcript);
    const extracted = msg.structuredData || msg.analysis?.structuredData || {};
    return {
      provider: 'vapi',
      externalCallId: msg.call?.id || '',
      leadIdFromMeta: msg.call?.assistantOverrides?.variableValues?.lead_id || '',
      callLogIdFromMeta: msg.call?.assistantOverrides?.variableValues?.call_log_id || '',
      isTerminal,
      rawStatus: isTerminal ? 'completed' : (msg.status || 'in-progress'),
      terminationReason: msg.endedReason || '',
      durationSeconds: Number(msg.durationSeconds || msg.call?.duration || 0),
      cost: Number(msg.cost || 0),
      recordingUrl: msg.recordingUrl || msg.artifact?.recordingUrl || '',
      summary: msg.summary || msg.analysis?.summary || '',
      turns,
      transcriptText: text,
      extracted,
    };
  }

  // Retell format: { event: 'call_ended'|'call_analyzed', call: { call_id, ... } }
  if (payload.event && payload.call && typeof payload.call === 'object') {
    const call = payload.call;
    const isTerminal = ['call_ended', 'call_analyzed'].includes(payload.event) || call.call_status === 'ended';
    const { turns, text } = formatTranscriptTurns(call.transcript || call.transcript_object);
    const extracted = call.call_analysis?.custom_analysis_data || {};
    const durationSec =
      call.end_timestamp && call.start_timestamp
        ? Math.max(0, Math.round((call.end_timestamp - call.start_timestamp) / 1000))
        : Number(call.duration_ms ? Math.round(call.duration_ms / 1000) : 0);

    return {
      provider: 'retell',
      externalCallId: call.call_id || '',
      leadIdFromMeta: call.metadata?.lead_id || call.retell_llm_dynamic_variables?.lead_id || '',
      callLogIdFromMeta: call.metadata?.call_log_id || '',
      isTerminal,
      rawStatus: isTerminal ? 'completed' : (call.call_status || 'in-progress'),
      terminationReason: call.disconnection_reason || '',
      durationSeconds: durationSec,
      cost: Number(call.call_cost?.combined_cost ? call.call_cost.combined_cost / 100 : 0),
      recordingUrl: call.recording_url || '',
      summary: call.call_analysis?.call_summary || '',
      turns,
      transcriptText: text,
      extracted,
    };
  }

  // Bolna / Generic / Simulator format
  const statusStr = String(payload.status || '').toLowerCase();
  const isTerminal = ['completed', 'call-disconnected', 'no-answer', 'busy', 'failed', 'error', 'stopped'].includes(statusStr);
  const { turns, text } = formatTranscriptTurns(payload.transcript);
  const extracted = payload.extracted_data || payload.extractedData || {};

  return {
    provider: payload.provider || 'bolna',
    externalCallId: payload.id || payload.execution_id || payload.call_id || '',
    leadIdFromMeta: payload.user_data?.lead_id || '',
    callLogIdFromMeta: payload.user_data?.call_log_id || '',
    isTerminal,
    rawStatus: statusStr || 'in-progress',
    terminationReason: payload.termination_reason || payload.terminationReason || '',
    durationSeconds: Number(payload.conversation_duration || payload.duration_seconds || 0),
    cost: Number(payload.total_cost || payload.cost || 0),
    recordingUrl: payload.telephony_data?.recording_url || payload.recording_url || '',
    summary: payload.summary || '',
    turns,
    transcriptText: text,
    extracted,
  };
};

const processAiCallWebhook = async ({ payload, querySecret = '', headerSecret = '' }) => {
  const parsed = parseProviderWebhookPayload(payload);

  let callLog = null;
  if (parsed.callLogIdFromMeta) {
    callLog = await AiCallLog.findById(parsed.callLogIdFromMeta);
  }
  if (!callLog && parsed.externalCallId) {
    callLog = await AiCallLog.findOne({ externalCallId: parsed.externalCallId });
  }
  if (!callLog && parsed.leadIdFromMeta) {
    callLog = await AiCallLog.findOne({ lead: parsed.leadIdFromMeta }).sort({ createdAt: -1 });
  }

  // Verify webhook secret against matching company or global env
  const config = await getEffectiveAiConfig({ companyId: callLog?.tenantCompany || null });
  if (config.webhookSecret) {
    const providedSecret = querySecret || headerSecret || '';
    if (providedSecret !== config.webhookSecret) {
      const err = new Error('Invalid AI call webhook secret');
      err.statusCode = 401;
      throw err;
    }
  }

  if (!callLog && !parsed.leadIdFromMeta) {
    return { processed: false, reason: 'No matching callLog or lead_id in payload' };
  }

  if (!callLog && parsed.leadIdFromMeta) {
    const lead = await Lead.findById(parsed.leadIdFromMeta).lean();
    if (!lead) return { processed: false, reason: 'Referenced lead not found' };
    callLog = await AiCallLog.create({
      tenantCompany: lead.tenantCompany || null,
      lead: lead._id,
      assignedEmployee: lead.assignedTo || null,
      provider: parsed.provider,
      externalCallId: parsed.externalCallId,
      toNumber: lead.phone || 'unknown',
      status: 'in-progress',
    });
  }

  const mapped = mapAiOutcomeAndTemperature({
    terminationReason: parsed.terminationReason,
    rawStatus: parsed.rawStatus,
    extracted: parsed.extracted,
    summary: parsed.summary,
  });

  if (parsed.recordingUrl) callLog.recordingUrl = parsed.recordingUrl;
  if (parsed.summary) callLog.summary = parsed.summary;
  if (parsed.transcriptText) callLog.transcriptText = parsed.transcriptText;
  if (parsed.turns.length > 0) callLog.transcriptTurns = parsed.turns;
  if (parsed.durationSeconds) callLog.durationSeconds = parsed.durationSeconds;
  if (parsed.cost) callLog.cost = parsed.cost;
  if (parsed.terminationReason) callLog.terminationReason = parsed.terminationReason;
  if (parsed.extracted && Object.keys(parsed.extracted).length > 0) callLog.extractedData = parsed.extracted;
  callLog.rawPayload = payload;

  if (!parsed.isTerminal) {
    if (['ringing', 'in-progress', 'queued'].includes(parsed.rawStatus)) {
      callLog.status = parsed.rawStatus;
    }
    await callLog.save();
    return { processed: true, terminal: false, callLog };
  }

  callLog.status = mapped.callStatus;
  callLog.outcome = mapped.outcome;
  callLog.recommendedTemperature = mapped.temperature;
  callLog.endedAt = new Date();

  const { parsedDate: cbDate, normalizedTime: cbTime } = extractCallbackSchedule(
    parsed.extracted,
    parsed.summary,
    parsed.transcriptText
  );
  if (cbDate) {
    callLog.nextFollowUpDate = cbDate;
    callLog.nextFollowUpTime = cbTime;
  }

  if (!callLog.syncedToLead && callLog.lead) {
    const lead = await Lead.findById(callLog.lead);
    if (lead) {
      const durationLabel = callLog.durationSeconds ? `${callLog.durationSeconds}s` : 'AI Call';
      const remarkSummary =
        callLog.summary ||
        (callLog.outcome === 'no_answer'
          ? 'AI Call attempted — No answer from client.'
          : callLog.outcome === 'busy'
            ? 'AI Call attempted — Client line busy.'
            : `AI Call completed (${callLog.terminationReason || callLog.status}).`);

      const systemActor = {
        _id: callLog.initiatedBy || lead.createdBy || lead._id,
        name: `AI Voice Agent (${callLog.provider.toUpperCase()})`,
      };

      await recordLeadRemarkAndFollowUp({
        lead,
        user: systemActor,
        content: `[AI Call • ${durationLabel}] ${remarkSummary}`,
        remarkType: 'call',
        outcome: callLog.outcome,
        nextFollowUpDate: cbDate,
        nextFollowUpTime: cbTime,
        nextFollowUpTitle: cbDate ? `Follow-up after AI Call: ${lead.name}` : '',
        leadStatus: lead.status === 'new' && callLog.status === 'completed' ? 'contacted' : '',
        leadTemperature: mapped.temperature || '',
        createFollowUpTask: Boolean(cbDate),
      });

      callLog.syncedToLead = true;

      // Post-call Auto-WhatsApp follow-up
      if (config.autoWhatsAppAfterCall && !callLog.whatsappAutoSent && lead.phone) {
        let waTemplate = '';
        if (['interested', 'callback_requested'].includes(callLog.outcome)) {
          waTemplate = config.whatsappInterestedTemplate;
        } else if (['no_answer', 'busy'].includes(callLog.outcome)) {
          waTemplate = config.whatsappNoAnswerTemplate;
        }
        if (waTemplate) {
          const cbLabel = cbDate
            ? `${cbDate.toLocaleDateString('en-IN')}${cbTime ? ` (${cbTime})` : ''}`
            : 'jald hi';
          const waMessage = fillTemplate(waTemplate, {
            name: lead.name || 'ji',
            company: config.companyName || 'our team',
            callback: cbLabel,
          });
          try {
            const waRes = await sendMetaCloudMessage(lead.phone, waMessage);
            callLog.whatsappAutoSent = Boolean(waRes?.success);
            callLog.whatsappAutoStatus = waRes?.simulated
              ? 'simulated'
              : waRes?.success
                ? 'sent'
                : 'failed';
            if (waRes?.success) {
              await recordLeadRemarkAndFollowUp({
                lead,
                user: systemActor,
                content: `[Auto-WhatsApp after AI Call] ${waMessage}`,
                remarkType: 'whatsapp',
                createFollowUpTask: false,
              });
            }
          } catch (waErr) {
            callLog.whatsappAutoStatus = 'failed';
            console.warn('Auto WhatsApp after AI Call failed:', waErr.message);
          }
        }
      }

      // Auto-retry scheduling for No-Answer / Busy calls (respects DND hours)
      if (
        config.autoRetryEnabled &&
        ['no_answer', 'busy'].includes(callLog.outcome) &&
        (callLog.attemptNumber || 1) < (config.maxRetryAttempts || 2) &&
        !callLog.retryScheduled
      ) {
        callLog.retryScheduled = true;
        callLog.nextRetryAt = computeNextAllowedRetryTime(
          config.retryDelayMinutes,
          config.dndStartHour,
          config.dndEndHour
        );
      }

      if (lead.assignedTo && ['interested', 'callback_requested'].includes(callLog.outcome)) {
        const Employee = require('../models/Employee');
        const emp = await Employee.findById(lead.assignedTo).select('user').lean();
        if (emp?.user) {
          Notification.create({
            user: emp.user,
            title: callLog.outcome === 'interested' ? '🤖 Hot Lead from AI Call!' : '📞 AI Call Scheduled Callback',
            message: `${lead.name}: ${remarkSummary}`,
            type: 'reminder',
            actionUrl: `/sales/leads/${lead._id}`,
          }).catch(() => {});
        }
      }
    }
  }

  await callLog.save();
  return { processed: true, terminal: true, callLog };
};

const simulateCallCompletion = async ({ callLog, scenario = 'interested_callback', callbackDate = '', callbackTime = '16:00', customSummary = '' }) => {
  const lead = await Lead.findById(callLog.lead).lean();
  const leadName = lead?.name || 'Customer';
  const nextDay = callbackDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  let payload;
  if (scenario === 'no_answer') {
    payload = {
      id: callLog.externalCallId,
      provider: callLog.provider,
      status: 'no-answer',
      termination_reason: 'no-answer',
      conversation_duration: 0,
      summary: `AI Agent dialed ${leadName} (${callLog.toNumber}), phone rang without answer.`,
      transcript: [],
      extracted_data: { interested: null },
      user_data: { lead_id: String(callLog.lead), call_log_id: String(callLog._id) },
    };
  } else if (scenario === 'not_interested') {
    payload = {
      id: callLog.externalCallId,
      provider: callLog.provider,
      status: 'completed',
      termination_reason: 'customer_ended_call',
      conversation_duration: 42,
      summary: customSummary || `${leadName} politely declined — already finalized with another vendor.`,
      transcript: [
        { role: 'agent', message: `Namaste ${leadName} ji, main Radhix Technologies se baat kar raha hoon. Aapki inquiry ke regarding call kiya tha.` },
        { role: 'user', message: 'Thanks, abhi requirement close ho chuki hai, hume abhi zaroorat nahi hai.' },
        { role: 'agent', message: 'Bilkul samajh gaya, aapke samay ke liye dhanyavaad!' },
      ],
      extracted_data: { interested: false },
      user_data: { lead_id: String(callLog.lead), call_log_id: String(callLog._id) },
    };
  } else {
    payload = {
      id: callLog.externalCallId,
      provider: callLog.provider,
      status: 'completed',
      termination_reason: 'stop_talk',
      conversation_duration: 94,
      summary: customSummary || `${leadName} showed strong interest and requested a detailed callback at ${nextDay} (${callbackTime || '16:00'}) to finalize pricing.`,
      transcript: [
        { role: 'agent', message: `Namaste ${leadName} ji, main Radhix Technologies ki taraf se call kar raha hoon aapki recent inquiry ke liye.` },
        { role: 'user', message: 'Haanji bataiye, mujhe pricing aur demo details chahiye thi.' },
        { role: 'agent', message: 'Bilkul ji! Hamare senior advisor aapko detailed walkthrough denge. Aap kis time par call lena pasand karenge?' },
        { role: 'user', message: `Kal ${callbackTime || '4 baje'} ke aas-paas call kar lijiye.` },
        { role: 'agent', message: 'Done ji, maine aapka callback schedule kar diya hai. Dhanyavaad!' },
      ],
      extracted_data: {
        interested: true,
        next_follow_up_date: nextDay,
        next_follow_up_time: callbackTime || '16:00',
      },
      user_data: { lead_id: String(callLog.lead), call_log_id: String(callLog._id) },
    };
  }

  return processAiCallWebhook({
    payload,
    querySecret: (await getEffectiveAiConfig({ companyId: callLog.tenantCompany })).webhookSecret,
  });
};

module.exports = {
  SUPPORTED_PROVIDERS,
  normalizePhoneNumber,
  maskApiKey,
  isMaskedValue,
  resolveCompanyRecord,
  getEffectiveAiConfig,
  buildWebhookUrl,
  computeNextAllowedRetryTime,
  initiateAiCallForLead,
  parseProviderWebhookPayload,
  processAiCallWebhook,
  simulateCallCompletion,
};
