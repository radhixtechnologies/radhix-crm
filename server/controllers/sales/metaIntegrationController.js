const Lead = require('../../models/Lead');
const Company = require('../../models/Company');
const { executeWorkflowEngine } = require('../workflowController');

// @desc    Get Meta Webhook & Integration Configuration
// @route   GET /api/sales/meta-integration/config
// @access  Private
exports.getMetaConfig = async (req, res) => {
  try {
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:5000';
    const webhookUrl = `${protocol}://${host}/api/webhooks/meta`;
    const verifyToken = process.env.META_VERIFY_TOKEN || 'radhix_meta_token_2026';
    const hasSecret = Boolean(process.env.META_APP_SECRET);
    const hasToken = Boolean(process.env.META_PAGE_ACCESS_TOKEN);
    const pageId = process.env.META_PAGE_ID || null;

    res.json({
      success: true,
      data: {
        webhookUrl,
        verifyToken,
        hasSecret,
        hasToken,
        pageId,
        activeStatus: 'ready'
      }
    });
  } catch (error) {
    console.error('Error fetching Meta config:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send Simulated Test Meta Lead
// @route   POST /api/sales/meta-integration/test-lead
// @access  Private
exports.createMetaTestLead = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      industry,
      adName,
      campaignName,
      platform = 'fb',
      notes
    } = req.body;

    // Resolve tenant company
    let tenantCompany = req.user?.tenantCompany;
    if (!tenantCompany) {
      const firstCompany = await Company.findOne().sort({ createdAt: 1 });
      if (firstCompany) tenantCompany = firstCompany._id;
    }

    const testId = 'meta_test_' + Date.now();

    const newLead = await Lead.create({
      name: name || 'Aarav Sharma (Test Lead)',
      email: email || `meta_test_${Date.now()}@example.com`,
      phone: phone || '+91 98765 43210',
      company: company || 'Meta Ads Prospect Corp',
      industry: industry || 'Technology',
      source: 'meta',
      tenantCompany,
      assignedTo: req.user?._id,
      metaLeadId: testId,
      metaAttribution: {
        pageId: process.env.META_PAGE_ID || '104928392019482',
        formId: 'form_' + Math.floor(100000 + Math.random() * 900000),
        campaignId: 'camp_' + Math.floor(100000 + Math.random() * 900000),
        adId: 'ad_' + Math.floor(100000 + Math.random() * 900000),
        adName: adName || 'Luxury 3BHK Video Ad - Summer 2026',
        adsetName: campaignName || 'High Intent Home Buyers 25-45',
        platform: platform === 'ig' ? 'ig' : 'fb'
      },
      notes: [
        {
          content: notes || 'Simulated Meta Instant Form submission sent from CRM Meta Ads Sync Hub.',
          addedBy: req.user?._id,
          addedAt: new Date()
        }
      ]
    });

    // Run active automated workflows
    try {
      executeWorkflowEngine('lead_created', newLead).catch(err => {
        console.warn('Workflow execution warning for test meta lead:', err.message);
      });
    } catch (wfErr) {
      console.warn('Workflow engine warning:', wfErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Test Meta Lead successfully ingested and routed to CRM!',
      data: newLead
    });
  } catch (error) {
    console.error('Error creating test meta lead:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
