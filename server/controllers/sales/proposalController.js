const Proposal = require('../../models/Proposal');
const Invoice = require('../../models/Invoice');
const Deal = require('../../models/Deal');
const logActivity = require('../../utils/activityLogger');
const { generateInvoicePDF } = require('../../utils/pdfGenerator');
const { sendInvoiceEmail, sendProposalEmail } = require('../../utils/emailService');

// Helper function to generate proposal PDF (similar to invoice)
const generateProposalPDF = async (proposal, client) => {
  const PDFDocument = require('pdfkit');
  const fs = require('fs');
  const path = require('path');

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const fileName = `proposal_${proposal.proposalNumber || 'draft'}_${Date.now()}.pdf`;
      const uploadsDir = path.join(__dirname, '../../../uploads/proposals');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Safe date formatting helper
      const formatDate = (date) => {
        if (!date) return 'N/A';
        try {
          return new Date(date).toLocaleDateString();
        } catch (e) {
          return 'Invalid Date';
        }
      };

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('PROPOSAL', { align: 'right' }).moveDown();
      doc.fontSize(12).font('Helvetica')
        .text(`Proposal #: ${proposal.proposalNumber || 'N/A'}`, { align: 'right' })
        .text(`Issue Date: ${formatDate(proposal.issueDate)}`, { align: 'right' })
        .text(`Expiry Date: ${formatDate(proposal.expiryDate)}`, { align: 'right' })
        .moveDown(2);

      // Company info
      doc.fontSize(14).font('Helvetica-Bold').text('From:', 50, 120)
        .fontSize(10).font('Helvetica')
        .text('Zynextro Technology Consulting', 50, 145)
        .text('123 Business Street', 50, 160)
        .text('City, State 12345', 50, 175);

      // Client info (handle null client)
      const clientName = client?.name || 'N/A';
      const clientCompany = client?.company || '';

      doc.fontSize(14).font('Helvetica-Bold').text('To:', 350, 120)
        .fontSize(10).font('Helvetica')
        .text(clientName, 350, 145)
        .text(clientCompany, 350, 160);

      // Items table
      let yPos = 300;
      doc.fontSize(10).font('Helvetica-Bold')
        .text('Description', 50, yPos)
        .text('Qty', 350, yPos)
        .text('Rate', 400, yPos)
        .text('Amount', 500, yPos);

      yPos += 20;
      doc.moveTo(50, yPos).lineTo(550, yPos).stroke();
      yPos += 10;

      const items = Array.isArray(proposal.items) ? proposal.items : [];

      items.forEach((item) => {
        doc.fontSize(9).font('Helvetica')
          .text(item.description || '', 50, yPos, { width: 280 })
          .text((item.quantity || 0).toString(), 350, yPos)
          .text(`$${(item.rate || 0).toFixed(2)}`, 400, yPos)
          .text(`$${(item.amount || 0).toFixed(2)}`, 500, yPos);
        yPos += 25;
      });

      yPos += 10;
      doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
      yPos += 15;

      const subtotal = proposal.subtotal || 0;
      const tax = proposal.tax || 0;
      const discount = proposal.discount || 0;
      const total = proposal.total || 0;

      doc.font('Helvetica').text('Subtotal:', 400, yPos).text(`$${subtotal.toFixed(2)}`, 500, yPos);

      if (tax > 0) {
        yPos += 20;
        doc.text(`Tax (${proposal.taxRate || 0}%):`, 400, yPos).text(`$${tax.toFixed(2)}`, 500, yPos);
      }

      if (discount > 0) {
        yPos += 20;
        doc.text('Discount:', 400, yPos).text(`-$${discount.toFixed(2)}`, 500, yPos);
      }

      yPos += 20;
      doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
      yPos += 15;
      doc.fontSize(12).font('Helvetica-Bold').text('Total:', 400, yPos).text(`$${total.toFixed(2)}`, 500, yPos);

      doc.end();

      stream.on('finish', () => {
        resolve({ filePath, fileName, url: `/uploads/proposals/${fileName}` });
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
};

// @desc    Get all proposals
// @route   GET /api/sales/proposals
// @access  Private
exports.getProposals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { status, search, deal, client } = req.query;

    let query = {};

    if (status) query.status = status;
    if (deal) query.deal = deal;
    if (client) query.client = client;

    if (search) {
      query.$or = [
        { proposalNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ];
    }

    const proposals = await Proposal.find(query)
      .populate('client', 'name company email')
      .populate('contactPersons', 'firstName lastName email')
      .populate('deal', 'title value')
      .populate('proposalOwner', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Proposal.countDocuments(query);

    res.status(200).json({
      success: true,
      count: proposals.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: proposals,
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single proposal
// @route   GET /api/sales/proposals/:id
// @access  Private
exports.getProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('client')
      .populate('contactPersons')
      .populate('deal')
      .populate('proposalOwner', 'name email')
      .populate('createdBy', 'name email')
      .populate('lastModifiedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('convertedToQuotation');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
    }

    res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create proposal
// @route   POST /api/sales/proposals
// @access  Private
exports.createProposal = async (req, res) => {
  try {
    const {
      // Identification & Links
      title, proposalType, client, contactPersons, deal,
      // Dates & Validity
      proposalDate, validUntil, submissionDate,
      // Status & Workflow
      internalApprovalRequired,
      // Business Content
      clientRequirements, scopeOfWork, solutionOverview, deliverables,
      exclusions, assumptions, dependencies,
      // Commercial & Legal
      paymentTerms, executionTimeline, warrantyTerms, supportTerms,
      slaReference, confidentialityClause, terminationClause, governingLaw,
      // Metadata
      estimatedValue, currency, language, industry, tags, notes,
      // Old fields for backward compatibility
      issueDate, expiryDate, items, taxRate, tax, discount, terms
    } = req.body;

    // Debug logging
    console.log('📝 Creating proposal with data:', {
      client,
      title,
      proposalType,
      deal,
      hasContactPersons: !!contactPersons,
      hasDeliverables: !!deliverables
    });

    if (!client) {
      console.error('❌ Proposal creation failed: Client is required');
      return res.status(400).json({
        success: false,
        message: 'Client is required',
      });
    }

    // Validate Deal Stage if deal is provided
    let contactId = req.body.contact || null;
    let contactPersonsArray = contactPersons || [];

    if (deal) {
      const dealObj = await Deal.findById(deal).populate('contact');
      if (!dealObj) {
        console.error('❌ Deal not found:', deal);
        return res.status(404).json({ success: false, message: 'Deal not found' });
      }

      console.log('📊 Deal stage check:', {
        dealId: deal,
        currentStage: dealObj.stage,
        allowedStages: ['new-deal', 'contacted', 'qualified', 'proposal-sent', 'negotiation']
      });

      const allowedStages = ['new-deal', 'contacted', 'qualified', 'proposal-sent', 'negotiation'];
      if (!allowedStages.includes(dealObj.stage)) {
        console.error('❌ Proposal creation blocked - Invalid deal stage:', dealObj.stage);
        return res.status(400).json({
          success: false,
          message: `Proposals can only be created in stages: New Deal, Contacted, Qualified, Proposal Sent, Negotiation. Current stage: ${dealObj.stage}`
        });
      }

      // Auto-populate contact from deal if not provided
      if (dealObj.contact && !contactId && contactPersonsArray.length === 0) {
        contactId = dealObj.contact._id || dealObj.contact;
        contactPersonsArray = [contactId];
      }
    }

    // Calculate totals if items are provided (backward compatibility)
    let subtotal = 0;
    let taxAmount = 0;
    let total = estimatedValue || 0;
    let itemsWithAmounts = [];

    if (items && items.length > 0) {
      subtotal = items.reduce((sum, item) => {
        const amount = (item.quantity || 0) * (item.rate || 0);
        return sum + amount;
      }, 0);

      taxAmount = tax || (subtotal * (taxRate || 0) / 100);
      total = subtotal + taxAmount - (discount || 0);

      itemsWithAmounts = items.map((item) => ({
        ...item,
        amount: (item.quantity || 0) * (item.rate || 0),
      }));
    }

    const proposalCount = await Proposal.countDocuments();
    const proposalNumber = `PROP-${String(proposalCount + 1).padStart(6, '0')}`;

    const proposal = await Proposal.create({
      // Auto-generated
      proposalNumber,

      // Identification & Links
      title: title || proposalNumber,
      proposalType: proposalType || 'standard',
      client,
      contactPersons: contactPersonsArray,
      deal: deal || null,
      proposalOwner: req.user._id,

      // Dates & Validity
      proposalDate: proposalDate || issueDate || new Date(),
      validUntil: validUntil || expiryDate,
      submissionDate: submissionDate || null,

      // Status & Workflow
      status: 'draft',
      internalApprovalRequired: internalApprovalRequired || false,
      approvalStatus: internalApprovalRequired ? 'pending' : 'not-required',

      // Business Content
      clientRequirements: clientRequirements || '',
      scopeOfWork: scopeOfWork || '',
      solutionOverview: solutionOverview || '',
      deliverables: deliverables || [],
      exclusions: exclusions || '',
      assumptions: assumptions || '',
      dependencies: dependencies || '',

      // Commercial & Legal
      paymentTerms: paymentTerms || terms || '',
      executionTimeline: executionTimeline || '',
      warrantyTerms: warrantyTerms || '',
      supportTerms: supportTerms || '',
      slaReference: slaReference || '',
      confidentialityClause: confidentialityClause || '',
      terminationClause: terminationClause || '',
      governingLaw: governingLaw || '',

      // Pricing
      estimatedValue: estimatedValue || total || 0,
      currency: currency || 'INR',

      // Metadata
      language: language || 'English',
      industry: industry || '',
      tags: tags || [],
      notes: notes || '',

      // Backward compatibility - old fields
      ...(items && items.length > 0 && {
        items: itemsWithAmounts,
        subtotal,
        tax: taxAmount,
        taxRate: taxRate || 0,
        discount: discount || 0,
        total,
      }),

      // System fields
      createdBy: req.user._id,
    });

    await logActivity(req.user._id, 'create', 'sales', 'Proposal', proposal._id, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('❌ Error creating proposal:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update proposal
// @route   PUT /api/sales/proposals/:id
// @access  Private
exports.updateProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
    }

    // Check if associated deal is WON
    if (proposal.deal) {
      const dealObj = await Deal.findById(proposal.deal);
      if (dealObj && dealObj.stage === 'won') {
        return res.status(400).json({
          success: false,
          message: 'Cannot edit proposal because the deal is already WON.'
        });
      }
    }

    // Calculate totals if items are provided (backward compatibility)
    if (req.body.items && req.body.items.length > 0) {
      const subtotal = req.body.items.reduce((sum, item) => {
        const amount = (item.quantity || 0) * (item.rate || 0);
        return sum + amount;
      }, 0);

      req.body.subtotal = subtotal;
      const taxAmount = req.body.tax || (subtotal * (req.body.taxRate || proposal.taxRate) / 100);
      req.body.tax = taxAmount;
      req.body.total = subtotal + taxAmount - (req.body.discount || proposal.discount);

      req.body.items = req.body.items.map((item) => ({
        ...item,
        amount: (item.quantity || 0) * (item.rate || 0),
      }));
    }

    // Update lastModifiedBy
    req.body.lastModifiedBy = req.user._id;

    Object.assign(proposal, req.body);
    await proposal.save();

    await logActivity(req.user._id, 'update', 'sales', 'Proposal', proposal._id, req.body, req.ip);

    res.status(200).json({
      success: true,
      data: proposal,
    });
  } catch (error) {
    console.error('Error updating proposal:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate proposal PDF
// @route   POST /api/sales/proposals/:id/generate-pdf
// @access  Private
exports.downloadProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('client').populate('createdBy');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
    }

    const result = await generateProposalPDF(proposal, proposal.client);

    proposal.pdfUrl = result.url;
    await proposal.save();

    res.status(200).json({
      success: true,
      data: {
        pdfUrl: result.url,
        fileName: result.fileName,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Email proposal
// @route   POST /api/sales/proposals/:id/email
// @access  Private
exports.emailProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate('client')
      .populate('contactPersons')
      .populate('deal')
      .populate('createdBy');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
    }

    // CRITICAL: Validate contact exists with email
    // Filter out nulls (in case of deleted contacts)
    const validContactPersons = (proposal.contactPersons || []).filter(person => person !== null);

    if (validContactPersons.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select a primary contact person for this proposal before sending.',
      });
    }

    const recipient = validContactPersons[0];

    if (!recipient.email) {
      return res.status(400).json({
        success: false,
        message: 'Primary contact person does not have an email address. Please update the contact information.',
      });
    }

    let pdfPath = null;
    if (proposal.pdfUrl) {
      pdfPath = proposal.pdfUrl.replace('/uploads', require('path').join(__dirname, '../../../uploads'));
    } else {
      const pdfResult = await generateProposalPDF(proposal, proposal.client);
      proposal.pdfUrl = pdfResult.url;
      pdfPath = pdfResult.filePath;
    }

    // Send email to CONTACT using dedicated proposal email function
    try {
      await sendProposalEmail(proposal, recipient, pdfPath);
    } catch (emailError) {
      return res.status(502).json({
        success: false,
        message: `Failed to send email via SMTP provider. Error: ${emailError.message}`,
      });
    }

    proposal.emailSent = true;
    proposal.emailSentAt = new Date();
    proposal.status = proposal.status === 'draft' ? 'sent' : proposal.status;
    await proposal.save();

    // ═══════════════════════════════════════════════════════
    // AUTO-UPDATE DEAL WHEN PROPOSAL IS SENT
    // ═══════════════════════════════════════════════════════
    if (proposal.deal) {
      const dealId = proposal.deal._id || proposal.deal;
      const dealObj = await Deal.findById(dealId);

      if (dealObj) {
        // Define stage progression order based on Deal Schema
        const stageOrder = ['new-deal', 'proposal', 'quotation', 'negotiation', 'closed-won', 'closed-lost'];
        const currentStageIndex = stageOrder.indexOf(dealObj.stage);
        const targetStage = 'proposal';
        const targetStageIndex = stageOrder.indexOf(targetStage);

        // Only update if:
        // 1. Deal is not already won or lost (closed)
        // 2. Deal is before the proposal stage
        const canUpdate =
          dealObj.stage !== 'closed-won' &&
          dealObj.stage !== 'closed-lost' &&
          currentStageIndex < targetStageIndex;

        if (canUpdate) {
          const oldStage = dealObj.stage;
          const oldProbability = dealObj.probability;

          // Update Deal stage and probability
          dealObj.stage = targetStage;
          dealObj.probability = 40; // 40% for proposal stage (matching schema hook)

          await dealObj.save();

          // Log the deal update activity
          await logActivity(
            req.user._id,
            'update',
            'sales',
            'Deal',
            dealObj._id,
            {
              stage: { from: oldStage, to: targetStage },
              probability: { from: oldProbability, to: 40 },
              reason: 'Proposal sent'
            },
            req.ip
          );

          console.log(`✅ Deal ${dealObj._id} updated: ${oldStage} → ${targetStage}, probability: ${oldProbability}% → 40%`);
        }
      }
    }

    // Create Activity Log for Proposal Sent
    const Activity = require('../../models/Activity');

    // Get contact details safely
    const contactName = recipient ? `${recipient.firstName} ${recipient.lastName}` : 'Contact';
    const contactEmail = recipient ? recipient.email : '';

    try {
      await Activity.create({
        type: 'email',
        subject: `Proposal ${proposal.proposalNumber} sent`,
        description: `Proposal sent to ${contactName} (${contactEmail})`,
        relatedTo: {
          entityType: 'Deal',
          entityId: proposal.deal ? (proposal.deal._id || proposal.deal) : null,
          entityName: proposal.title
        },
        createdBy: req.user._id,
        status: 'completed',
        date: new Date()
      });
    } catch (activityError) {
      console.error('Failed to create activity log:', activityError);
      // Don't fail the request if activity logging fails
    }
    // ═══════════════════════════════════════════════════════
    // AUTO-SCHEDULE FOLLOW-UP (3 DAYS AFTER PROPOSAL SENT)
    // ═══════════════════════════════════════════════════════
    if (proposal.deal) {
      try {
        const FollowUp = require('../../models/FollowUp');
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 3); // 3 days from now

        const dealId = proposal.deal._id || proposal.deal;
        const dealForFollowUp = await Deal.findById(dealId).populate('assignedTo');

        await FollowUp.create({
          type: 'deal',
          relatedId: dealId,
          title: `Follow up on proposal ${proposal.proposalNumber}`,
          description: `Check client's response to proposal "${proposal.title}"`,
          scheduledDate: followUpDate,
          scheduledTime: '10:00',
          typeOfFollowUp: 'call',
          status: 'pending',
          assignedTo: dealForFollowUp?.assignedTo?._id || req.user._id,
          createdBy: req.user._id
        });

        console.log(`✅ Auto-scheduled follow-up for 3 days from now`);
      } catch (error) {
        console.error('⚠️ Error scheduling follow-up:', error.message);
        // Don't fail proposal send if follow-up creation fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Proposal email sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send email',
    });
  }
};

// @desc    Convert proposal to invoice
// @route   POST /api/sales/proposals/:id/convert-to-invoice
// @access  Private
exports.convertToInvoice = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id).populate('client');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found',
      });
    }

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      client: proposal.client._id,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      items: proposal.items,
      subtotal: proposal.subtotal,
      tax: proposal.tax,
      taxRate: proposal.taxRate,
      discount: proposal.discount,
      total: proposal.total,
      notes: `Converted from proposal ${proposal.proposalNumber}`,
      status: 'draft',
      createdBy: req.user._id,
    });

    proposal.convertedToInvoice = invoice._id;
    proposal.status = 'accepted';
    proposal.acceptedDate = new Date();
    await proposal.save();

    res.status(200).json({
      success: true,
      data: invoice,
      message: 'Proposal converted to invoice successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


















