const crypto = require('crypto');
const Lead = require('../models/Lead');

const getFieldValue = (fields, names) => {
  const field = fields.find((item) => names.includes(item.name?.toLowerCase()));
  const value = field?.values?.[0];
  return value === undefined || value === null ? '' : String(value).trim();
};

const verifyWebhook = (req, res) => {
  const verifyToken = process.env.META_VERIFY_TOKEN;
  if (!verifyToken) return res.status(503).send('Meta webhook is not configured');

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
  if (await Lead.exists({ metaLeadId: event.leadgen_id })) return false;

  const metaLead = await fetchMetaLead(event.leadgen_id);
  const fields = Array.isArray(metaLead.field_data) ? metaLead.field_data : [];
  const email = getFieldValue(fields, ['email', 'e-mail']).toLowerCase();
  const firstName = getFieldValue(fields, ['first_name', 'firstname']);
  const lastName = getFieldValue(fields, ['last_name', 'lastname']);
  const name = getFieldValue(fields, ['full_name', 'name']) || `${firstName} ${lastName}`.trim();
  const phone = getFieldValue(fields, ['phone_number', 'phone', 'mobile_number']);

  await Lead.create({
    name: name || email || phone || `Meta Lead ${event.leadgen_id.slice(-6)}`,
    email,
    phone,
    company: getFieldValue(fields, ['company_name', 'company', 'business_name']),
    industry: getFieldValue(fields, ['industry']),
    source: 'meta',
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
  return true;
};

const receiveWebhook = async (req, res) => {
  if (!process.env.META_APP_SECRET || !process.env.META_PAGE_ACCESS_TOKEN) {
    return res.status(503).json({ success: false, message: 'Meta webhook is not configured' });
  }
  if (!hasValidSignature(req.body, req.get('x-hub-signature-256'))) return res.sendStatus(401);

  let payload;
  try {
    payload = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid webhook payload' });
  }
  if (payload.object !== 'page') return res.sendStatus(404);

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