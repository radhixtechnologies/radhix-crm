const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const Contact = require('../models/Contact');
const { cleanPhone, fillTemplate, DEFAULT_TEMPLATES, sendMetaCloudMessage } = require('../services/whatsappService');

/**
 * @desc Get all WhatsApp campaigns
 * @route GET /api/marketing/whatsapp/campaigns
 */
exports.getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    if (req.user?.company) {
      query.tenantCompany = req.user.company;
    }

    const [campaigns, total] = await Promise.all([
      WhatsAppCampaign.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'name email'),
      WhatsAppCampaign.countDocuments(query)
    ]);

    // Compute summary stats
    const allCampaigns = await WhatsAppCampaign.find(query).select('totalRecipients sentCount failedCount status');
    const summary = {
      totalCampaigns: allCampaigns.length,
      totalSent: allCampaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0),
      totalFailed: allCampaigns.reduce((acc, c) => acc + (c.failedCount || 0), 0),
      activeCampaigns: allCampaigns.filter(c => c.status === 'completed' || c.status === 'sending').length
    };

    return res.status(200).json({
      success: true,
      data: campaigns,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching WhatsApp campaigns:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch WhatsApp campaigns' });
  }
};

/**
 * @desc Get available templates
 * @route GET /api/marketing/whatsapp/templates
 */
exports.getTemplates = async (req, res) => {
  try {
    const query = {};
    if (req.user?.company) {
      query.$or = [{ isSystem: true }, { tenantCompany: req.user.company }];
    }

    const customTemplates = await WhatsAppTemplate.find(query).sort({ createdAt: -1 });

    // Merge system default templates with any custom templates
    const templates = [
      ...DEFAULT_TEMPLATES,
      ...customTemplates.map(t => ({
        id: t._id.toString(),
        name: t.name,
        category: t.category,
        language: t.language,
        body: t.body,
        variables: t.variables,
        isCustom: true
      }))
    ];

    return res.status(200).json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch templates' });
  }
};

/**
 * @desc Save a custom WhatsApp template
 * @route POST /api/marketing/whatsapp/templates
 */
exports.createTemplate = async (req, res) => {
  try {
    const { name, category, body, variables } = req.body;
    if (!name || !body) {
      return res.status(400).json({ success: false, message: 'Name and body are required' });
    }

    const template = await WhatsAppTemplate.create({
      name,
      category: category || 'Sales',
      body,
      variables: variables || [],
      tenantCompany: req.user?.company,
      createdBy: req.user?._id
    });

    return res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({ success: false, message: 'Failed to create template' });
  }
};

/**
 * @desc Send single WhatsApp message
 * @route POST /api/marketing/whatsapp/send-single
 */
exports.sendSingle = async (req, res) => {
  try {
    const { phone, message, name, leadId } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone number and message are required' });
    }

    const result = await sendMetaCloudMessage(phone, message);

    // If related to a lead, log activity
    if (leadId) {
      try {
        const Activity = require('../models/Activity');
        await Activity.create({
          type: 'whatsapp',
          subject: 'WhatsApp Message Sent',
          description: message,
          relatedTo: { model: 'Lead', item: leadId },
          tenantCompany: req.user?.company,
          status: 'completed',
          date: new Date()
        });
      } catch {}
    }

    return res.status(200).json({
      success: result.success,
      data: result,
      message: result.success ? 'Message sent successfully' : result.error
    });
  } catch (error) {
    console.error('Error sending single WhatsApp message:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

/**
 * @desc Send WhatsApp Broadcast Campaign to selected leads / contacts / clients
 * @route POST /api/marketing/whatsapp/broadcast
 */
exports.sendBroadcast = async (req, res) => {
  try {
    const {
      name,
      messageBody,
      category = 'Marketing',
      targetType = 'selected_leads',
      leadIds = [],
      clientIds = [],
      contactIds = [],
      customRecipients = []
    } = req.body;

    if (!messageBody || !messageBody.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const companyName = process.env.APP_NAME || 'Radhix Technologies';
    const senderName = req.user?.name || 'Sales Team';

    const recipientsToProcess = [];

    // 1. Resolve Lead recipients
    if (leadIds && leadIds.length > 0) {
      const leads = await Lead.find({ _id: { $in: leadIds } }).select('name phone company');
      leads.forEach(l => {
        if (l.phone) {
          recipientsToProcess.push({
            recipientId: l._id,
            recipientType: 'Lead',
            name: l.name || 'Valued Lead',
            phone: cleanPhone(l.phone),
            company: l.company || companyName
          });
        }
      });
    }

    // 2. Resolve Client recipients
    if (clientIds && clientIds.length > 0) {
      const clients = await Client.find({ _id: { $in: clientIds } }).select('name phone company');
      clients.forEach(c => {
        if (c.phone) {
          recipientsToProcess.push({
            recipientId: c._id,
            recipientType: 'Client',
            name: c.name || 'Valued Client',
            phone: cleanPhone(c.phone),
            company: c.company || companyName
          });
        }
      });
    }

    // 3. Resolve Contact recipients
    if (contactIds && contactIds.length > 0) {
      const contacts = await Contact.find({ _id: { $in: contactIds } }).select('firstName lastName phone company');
      contacts.forEach(c => {
        if (c.phone) {
          recipientsToProcess.push({
            recipientId: c._id,
            recipientType: 'Contact',
            name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Contact',
            phone: cleanPhone(c.phone),
            company: c.company || companyName
          });
        }
      });
    }

    // 4. Custom phone numbers
    if (customRecipients && customRecipients.length > 0) {
      customRecipients.forEach(r => {
        if (r.phone) {
          recipientsToProcess.push({
            name: r.name || 'Customer',
            phone: cleanPhone(r.phone),
            company: companyName
          });
        }
      });
    }

    if (recipientsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No recipients with valid phone numbers were found'
      });
    }

    // Create the Campaign record in DB
    const campaign = new WhatsAppCampaign({
      name: name || `WhatsApp Broadcast ${new Date().toLocaleDateString('en-IN')}`,
      messageBody,
      category,
      targetType,
      status: 'sending',
      totalRecipients: recipientsToProcess.length,
      tenantCompany: req.user?.company,
      createdBy: req.user?._id
    });

    let sentSuccess = 0;
    let sentFailed = 0;
    const finalRecipients = [];

    // Dispatch messages sequentially or in parallel batches
    for (const item of recipientsToProcess) {
      const personalizedMessage = fillTemplate(messageBody, {
        name: item.name,
        phone: item.phone,
        company: item.company || companyName,
        senderName
      });

      const sendRes = await sendMetaCloudMessage(item.phone, personalizedMessage);

      if (sendRes.success) {
        sentSuccess++;
        finalRecipients.push({
          recipientId: item.recipientId,
          recipientType: item.recipientType || 'Lead',
          name: item.name,
          phone: item.phone,
          message: personalizedMessage,
          status: 'sent',
          sentAt: new Date(),
          waMessageId: sendRes.messageId
        });
      } else {
        sentFailed++;
        finalRecipients.push({
          recipientId: item.recipientId,
          recipientType: item.recipientType || 'Lead',
          name: item.name,
          phone: item.phone,
          message: personalizedMessage,
          status: 'failed',
          error: sendRes.error
        });
      }
    }

    campaign.status = sentFailed === recipientsToProcess.length ? 'failed' : 'completed';
    campaign.sentAt = new Date();
    campaign.sentCount = sentSuccess;
    campaign.failedCount = sentFailed;
    campaign.recipients = finalRecipients;

    await campaign.save();

    return res.status(200).json({
      success: true,
      message: `WhatsApp Broadcast completed: ${sentSuccess} sent, ${sentFailed} failed.`,
      data: {
        campaignId: campaign._id,
        name: campaign.name,
        total: recipientsToProcess.length,
        sent: sentSuccess,
        failed: sentFailed,
        recipients: finalRecipients
      }
    });
  } catch (error) {
    console.error('Error in WhatsApp broadcast:', error);
    return res.status(500).json({ success: false, message: 'Failed to process WhatsApp broadcast' });
  }
};

/**
 * @desc Get configuration & connection status
 * @route GET /api/marketing/whatsapp/status
 */
exports.getStatus = async (req, res) => {
  const hasToken = Boolean(process.env.WHATSAPP_TOKEN || process.env.META_PAGE_ACCESS_TOKEN);
  const hasPhoneId = Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID);

  return res.status(200).json({
    success: true,
    data: {
      connected: hasToken && hasPhoneId,
      mode: (hasToken && hasPhoneId) ? 'live_meta_cloud_api' : 'simulated_and_click_to_chat',
      webhookUrl: 'https://api.radhix.com/api/webhooks/meta',
      hasToken,
      hasPhoneId,
      graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v23.0'
    }
  });
};
