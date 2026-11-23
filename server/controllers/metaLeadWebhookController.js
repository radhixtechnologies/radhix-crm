const crypto = require('crypto');
const Lead = require('../models/Lead');

const getFieldValue = (fields, names) => {
  const field = fields.find((item) => names.includes(item.name?.toLowerCase()));
  const value = field?.values?.[0];
  return value === undefined || value === null ? '' : String(value).trim();
};

const verifyWebhook = (req, res) => {
  const verifyToken = process.env.META_VERIFY_TOKEN || 'radhix_meta_token_2026';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === verifyToken && challenge) return res.status(200).send(challenge);
  return res.sendStatus(403);
};

const hasValidSignature = (rawBody, signatureHeader) => {
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret || !Buffer.isBuffer(rawBody) || !signatureHeader?.startsWith('sha256=')) return false;

  const received = Buffer.from(signatureHeader.slice(7), 'hex');
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest();
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
};

const fetchMetaLead = async (leadId) => {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) throw new Error('Meta Page access token is not configured');

  const version = process.env.META_GRAPH_API_VERSION || 'v23.0';
  const url = new URL(`https://graph.facebook.com/${version}/${encodeURIComponent(leadId)}`);
  url.searchParams.set('fields', 'id,created_time,field_data,form_id,campaign_id,ad_id,ad_name,adset_id,adset_name,platform');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Meta Graph API lead lookup failed');
  return data;
};

const saveMetaLead = async (event, pageId) => {
  const isTestLead = !event.leadgen_id || String(event.leadgen_id).startsWith('44444') || event.leadgen_id === 'test_lead_id';
  const effectiveLeadId = isTestLead ? `test_${event.leadgen_id}_${Date.now()}` : event.leadgen_id;
  if (!isTestLead && await Lead.exists({ metaLeadId: effectiveLeadId })) return false;

  // Assign to configured tenant company or default company
  const Company = require('../models/Company');
  let tenantCompany = null;
  if (process.env.META_COMPANY_ID) {
    tenantCompany = process.env.META_COMPANY_ID;
  } else {
    const firstCompany = await Company.findOne().sort({ createdAt: 1 });
    if (firstCompany) tenantCompany = firstCompany._id;
  }

  // Handle Meta Test Dashboard / Sample Leads (ID 444444444444 or dummy IDs)
  if (isTestLead) {
    const testLead = await Lead.create({
      name: `Meta Ads Test Lead (${new Date().toLocaleTimeString('en-IN')})`,
      email: 'meta.test.lead@radhix.com',
      phone: '+91 98765 43210',
      company: 'Radhix Meta Ads (Sample)',
      source: 'meta',
      tenantCompany,
      metaLeadId: effectiveLeadId,
      metaAttribution: {
        pageId: pageId || event.page_id,
        formId: event.form_id || 'test_form',
        adId: event.ad_id || 'test_ad',
        adName: 'Sample Test Ad',
        platform: 'facebook',
      },
      notes: [{ note: 'Sample lead created from Meta Webhook Test Ping.', createdBy: null }],
    });

    try {
      const { executeWorkflowEngine } = require('../services/workflowEngine');
      executeWorkflowEngine('lead_created', testLead).catch(() => {});
    } catch {}

    return true;
  }

  // Fetch real lead data from Meta Graph API
  let metaLead = {};
  try {
    metaLead = await fetchMetaLead(event.leadgen_id);
  } catch (fetchErr) {
    console.warn(`Could not fetch details for Meta lead ${event.leadgen_id} from Graph API:`, fetchErr.message);
  }

  const fields = Array.isArray(metaLead.field_data) ? metaLead.field_data : [];
  const email = getFieldValue(fields, ['email', 'e-mail']).toLowerCase();
  const firstName = getFieldValue(fields, ['first_name', 'firstname']);
  const lastName = getFieldValue(fields, ['last_name', 'lastname']);
  const name = getFieldValue(fields, ['full_name', 'name']) || `${firstName} ${lastName}`.trim();
  const phone = getFieldValue(fields, ['phone_number', 'phone', 'mobile_number']);

  const newLead = await Lead.create({
    name: name || email || phone || `Meta Lead #${String(event.leadgen_id).slice(-6)}`,
    email: email || undefined,
    phone: phone || undefined,
    company: getFieldValue(fields, ['company_name', 'company', 'business_name']),
    industry: getFieldValue(fields, ['industry']),
    source: 'meta',
    tenantCompany,
    metaLeadId: event.leadgen_id,
    metaAttribution: {
      pageId,
      formId: metaLead.form_id || event.form_id,
      campaignId: metaLead.campaign_id || event.campaign_id,
      adId: metaLead.ad_id || event.ad_id,
      adName: metaLead.ad_name || event.ad_name,
      adsetId: metaLead.adset_id || event.adset_id,
      adsetName: metaLead.adset_name || event.adset_name,
      platform: metaLead.platform,
    },
  });

  // Execute active workflow automation rules (WhatsApp, Email, Auto-assignment)
  try {
    const { executeWorkflowEngine } = require('../services/workflowEngine');
    executeWorkflowEngine('lead_created', newLead).catch(err => console.warn('Workflow execution warning for Meta lead:', err.message));
  } catch (wfErr) {
    console.warn('Workflow engine warning for Meta lead:', wfErr.message);
  }

  return true;
};

const receiveWebhook = async (req, res) => {
  // Check signature if secret is provided; otherwise allow with warning during initial setup
  if (process.env.META_APP_SECRET && !hasValidSignature(req.body, req.get('x-hub-signature-256'))) {
    console.warn('Meta webhook signature validation failed');
    return res.sendStatus(401);
  }

  let payload;
  try {
    payload = typeof req.body === 'object' && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
  }

  // Handle Meta Developer Portal "Send to server" sample payload
  if (payload.sample?.field === 'leadgen') {
    const sampleValue = payload.sample.value || {};
    await saveMetaLead(sampleValue, sampleValue.page_id);
    return res.status(200).json({ success: true, message: 'Sample lead accepted' });
  }

  // Handle real page webhook payload
  if (payload.object !== 'page') {
    // If it's a test event with entry
    if (!payload.entry) return res.sendStatus(200);
  }

  try {
    let imported = 0;
    const configuredPageId = process.env.META_PAGE_ID;
    for (const entry of payload.entry || []) {
      if (configuredPageId && entry.id !== configuredPageId) continue;
      for (const change of entry.changes || []) {
        if (change.field !== 'leadgen' || !change.value?.leadgen_id) continue;
        if (await saveMetaLead(change.value, entry.id)) imported += 1;
      }
    }
    return res.status(200).json({ success: true, imported });
  } catch (error) {
    console.error('Meta lead webhook processing failed:', error.message);
    return res.status(502).json({ success: false, message: 'Meta lead could not be imported' });
  }
};

module.exports = { verifyWebhook, receiveWebhook };