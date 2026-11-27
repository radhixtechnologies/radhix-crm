const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Client = require('../models/Client');
const Deal = require('../models/Deal');
const Company = require('../models/Company');
const logActivity = require('../utils/activityLogger');
const { parseInvoicePdfBuffer } = require('../utils/invoicePdfParser');
const { generateGstTaxInvoicePDF, generateInvoiceQrDataUrl, resolveSellerDetails } = require('../utils/gstTaxInvoicePdf');

const resolveSellerCompany = async (user) => {
  if (user?.company) {
    const byUserCompany = await Company.findById(user.company).lean();
    if (byUserCompany) return byUserCompany;
  }
  if (user?._id) {
    const owned = await Company.findOne({ owner: user._id }).lean();
    if (owned) return owned;
  }
  return (await Company.findOne().sort({ createdAt: 1 }).lean()) || {};
};

const computeInvoiceFinancials = (body = {}) => {
  const items = Array.isArray(body.items) ? body.items : [];
  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || (Number(item.quantity) || 0) * (Number(item.rate) || 0)), 0)
    || Number(body.subtotal) || 0;
  const discount = Number(body.discount) || 0;
  const shipping = Number(body.shipping) || 0;
  const additionalCharges = Number(body.additionalCharges) || 0;

  const gd = body.gstDetails || {};
  const splitTax = (Number(gd.cgstAmount) || 0) + (Number(gd.sgstAmount) || 0) + (Number(gd.igstAmount) || 0);
  const tax = splitTax > 0 ? Number(splitTax.toFixed(2)) : (Number(body.tax) || 0);
  const splitTaxRate = (Number(gd.cgstRate) || 0) + (Number(gd.sgstRate) || 0) + (Number(gd.igstRate) || 0);
  const taxRate = splitTaxRate > 0 ? splitTaxRate : (Number(body.taxRate) || 0);
  const roundOff = Number(gd.roundOff) || 0;

  const computedTotal = Number((subtotal - discount + shipping + additionalCharges + tax + roundOff).toFixed(2));
  const total = body.total !== undefined && Number(body.total) > 0 && splitTax === 0 && !body.tax ? Number(body.total) : computedTotal;
  const amountPaid = Number(body.amountPaid) || 0;
  const balanceDue = Math.max(0, Number((total - amountPaid).toFixed(2)));

  return { subtotal, discount, shipping, additionalCharges, tax, taxRate, total, amountPaid, balanceDue };
};

// @desc    Get all invoices
// @route   GET /api/finance/invoices
// @access  Private
exports.getInvoices = async (req, res) => {
  try {
    const { status, search, startDate, endDate } = req.query;
    let query = {};

    if (status) query.status = status;
    if (startDate && endDate) {
      query.issueDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const invoices = await Invoice.find(query)
      .populate('client', 'name company email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single invoice
// @route   GET /api/finance/invoices/:id
// @access  Private
exports.getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client')
      .populate('createdBy', 'name email company');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    const company = await resolveSellerCompany(invoice.createdBy || req.user);
    const sellerDetails = resolveSellerDetails(company);
    const qrDataUrl = await generateInvoiceQrDataUrl(invoice, company);

    res.status(200).json({
      success: true,
      data: invoice,
      sellerDetails,
      qrDataUrl,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create invoice
// @route   POST /api/finance/invoices
// @access  Private
exports.createInvoice = async (req, res) => {
  try {
    const financials = computeInvoiceFinancials(req.body);

    let invoiceNumber = (req.body.invoiceNumber || '').trim();
    if (!invoiceNumber || await Invoice.exists({ invoiceNumber })) {
      const invoiceCount = await Invoice.countDocuments();
      invoiceNumber = invoiceNumber
        ? `${invoiceNumber}-${Date.now().toString().slice(-4)}`
        : `INV-${String(invoiceCount + 1).padStart(6, '0')}`;
    }

    const invoice = await Invoice.create({
      ...req.body,
      invoiceNumber,
      ...financials,
      createdBy: req.user._id,
    });

    // Log activity
    await logActivity(req.user._id, 'create', 'finance', 'Invoice', invoice._id, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create invoice from deal
// @route   POST /api/finance/invoices/from-deal/:dealId
// @access  Private
exports.createInvoiceFromDeal = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.dealId).populate('client');

    if (!deal) {
      return res.status(404).json({ success: false, message: 'Deal not found' });
    }

    // STRICT BUSINESS RULE: Invoice can only be generated from WON deals
    if (deal.stage !== 'won') {
      return res.status(403).json({
        success: false,
        message: 'Invoice can only be generated after the deal is marked as WON.',
        currentStage: deal.stage,
        requiredStage: 'won'
      });
    }

    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    // Helper to format currency if needed, but here we keep raw numbers
    // Assuming deal.value is the total amount.
    // Create one line item for the deal.
    const items = [{
      name: deal.title,
      description: deal.description || `Services for ${deal.title}`,
      quantity: 1,
      rate: deal.value,
      amount: deal.value
    }];

    const invoiceData = {
      invoiceNumber,
      client: deal.client._id,
      relatedDeal: deal._id,
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)), // Default 30 days
      items: items,
      subtotal: deal.value,
      total: deal.value,
      status: 'draft',
      notes: `Generated automatically from Deal: ${deal.title}`,
      createdBy: req.user._id
    };

    const invoice = await Invoice.create(invoiceData);

    // Log activity
    await logActivity(req.user._id, 'create', 'finance', 'Invoice', invoice._id, { source: 'deal', dealId: deal._id }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });

  } catch (error) {
    console.error('Error generating invoice from deal:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/finance/invoices/:id
// @access  Private
exports.updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    if (req.body.items || req.body.gstDetails) {
      const financials = computeInvoiceFinancials({
        items: req.body.items || invoice.items,
        subtotal: req.body.subtotal ?? invoice.subtotal,
        discount: req.body.discount ?? invoice.discount,
        shipping: req.body.shipping ?? invoice.shipping,
        additionalCharges: req.body.additionalCharges ?? invoice.additionalCharges,
        tax: req.body.tax ?? invoice.tax,
        taxRate: req.body.taxRate ?? invoice.taxRate,
        amountPaid: req.body.amountPaid ?? invoice.amountPaid,
        gstDetails: req.body.gstDetails || invoice.gstDetails,
      });
      Object.assign(req.body, financials);
    }

    if (req.body.status === 'paid') {
      req.body.paymentDate = new Date();
    }

    Object.assign(invoice, req.body);
    await invoice.save();

    // Log activity
    await logActivity(req.user._id, 'update', 'finance', 'Invoice', invoice._id, req.body, req.ip);

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete invoice
// @route   DELETE /api/finance/invoices/:id
// @access  Private
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    await invoice.deleteOne();

    // Log activity
    await logActivity(req.user._id, 'delete', 'finance', 'Invoice', invoice._id, null, req.ip);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all expenses
// @route   GET /api/finance/expenses
// @access  Private
exports.getExpenses = async (req, res) => {
  try {
    const { category, status, startDate, endDate } = req.query;
    let query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const expenses = await Expense.find(query)
      .populate('paidBy', 'employeeId')
      .populate('approvedBy', 'name email')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create expense
// @route   POST /api/finance/expenses
// @access  Private
exports.createExpense = async (req, res) => {
  try {
    const expense = await Expense.create({
      ...req.body,
      paidBy: req.body.paidBy || null,
    });

    // Log activity
    await logActivity(req.user._id, 'create', 'finance', 'Expense', expense._id, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update expense
// @route   PUT /api/finance/expenses/:id
// @access  Private
exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    if (req.body.status === 'approved' && !expense.approvedBy) {
      expense.approvedBy = req.user._id;
      await expense.save();
    }

    // Log activity
    await logActivity(req.user._id, 'update', 'finance', 'Expense', expense._id, req.body, req.ip);

    res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete expense
// @route   DELETE /api/finance/expenses/:id
// @access  Private
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found',
      });
    }

    await expense.deleteOne();

    // Log activity
    await logActivity(req.user._id, 'delete', 'finance', 'Expense', expense._id, null, req.ip);

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all clients for dropdown
// @route   GET /api/finance/clients
// @access  Private
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find().select('name company email gstin pan stateCode address').sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: clients.length,
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Parse uploaded PDF invoice and extract structured GST invoice preview
// @route   POST /api/finance/invoices/parse-pdf
// @access  Private
exports.parseInvoicePDF = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'Please upload a valid PDF invoice file' });
    }

    const parsed = await parseInvoicePdfBuffer(req.file.buffer, req.file.originalname);
    const company = await resolveSellerCompany(req.user);
    const sellerPreview = resolveSellerDetails(company);

    // Try matching existing client by GSTIN or Company/Name
    let matchedClient = null;
    if (parsed.billedTo?.gstin) {
      matchedClient = await Client.findOne({ gstin: new RegExp(`^${parsed.billedTo.gstin}$`, 'i') }).select('name company email gstin').lean();
    }
    if (!matchedClient && parsed.billedTo?.name) {
      const escaped = parsed.billedTo.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchedClient = await Client.findOne({
        $or: [
          { company: new RegExp(`^${escaped}$`, 'i') },
          { name: new RegExp(`^${escaped}$`, 'i') },
        ],
      }).select('name company email gstin').lean();
    }

    res.status(200).json({
      success: true,
      data: {
        parsed,
        matchedClient: matchedClient || null,
        sellerPreview,
      },
    });
  } catch (error) {
    console.error('Error parsing PDF invoice:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Could not parse the uploaded PDF file',
    });
  }
};

// @desc    Import parsed PDF invoice into CRM and generate GST Tax Invoice PDF
// @route   POST /api/finance/invoices/import-pdf
// @access  Private
exports.importInvoicePDF = async (req, res) => {
  try {
    let payload = req.body;
    // Allow direct single-step file upload too if client submits multipart without pre-parse
    if (req.file && req.file.buffer && (!payload.items || !payload.billedTo)) {
      const parsed = await parseInvoicePdfBuffer(req.file.buffer, req.file.originalname);
      payload = { ...parsed, ...payload };
    }

    const billedTo = payload.billedTo || {};
    const shippedTo = payload.shippedTo || {};
    const buyerName = (billedTo.name || payload.clientName || 'Imported Client').trim();

    // Resolve or auto-create CRM Client
    let clientDoc = null;
    if (payload.client) {
      clientDoc = await Client.findById(payload.client);
    }
    if (!clientDoc && billedTo.gstin) {
      clientDoc = await Client.findOne({ gstin: new RegExp(`^${billedTo.gstin}$`, 'i') });
    }
    if (!clientDoc && buyerName) {
      const escaped = buyerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      clientDoc = await Client.findOne({
        $or: [{ company: new RegExp(`^${escaped}$`, 'i') }, { name: new RegExp(`^${escaped}$`, 'i') }],
      });
    }
    if (!clientDoc) {
      clientDoc = await Client.create({
        name: buyerName,
        company: buyerName,
        email: payload.clientEmail || '',
        gstin: billedTo.gstin || '',
        pan: billedTo.pan || '',
        stateCode: billedTo.stateCode || '',
        address: {
          street: billedTo.address || '',
          state: billedTo.state || '',
          country: 'India',
        },
        status: 'active',
      });
    }

    const financials = computeInvoiceFinancials(payload);
    let invoiceNumber = (payload.invoiceNumber || '').trim();
    if (!invoiceNumber) {
      const count = await Invoice.countDocuments();
      invoiceNumber = `INV-${String(count + 1).padStart(6, '0')}`;
    } else if (await Invoice.exists({ invoiceNumber })) {
      invoiceNumber = `${invoiceNumber}-IMP-${Date.now().toString().slice(-4)}`;
    }

    const invoice = await Invoice.create({
      invoiceNumber,
      client: clientDoc._id,
      issueDate: payload.issueDate ? new Date(payload.issueDate) : new Date(),
      dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      items: Array.isArray(payload.items) ? payload.items : [],
      poNumber: payload.poNumber || '',
      poDate: payload.poDate ? new Date(payload.poDate) : null,
      vendorCode: payload.vendorCode || '',
      project: payload.project || '',
      billedTo: {
        name: billedTo.name || buyerName,
        address: billedTo.address || '',
        state: billedTo.state || '',
        stateCode: billedTo.stateCode || '',
        gstin: billedTo.gstin || '',
        pan: billedTo.pan || '',
      },
      shippedTo: {
        name: shippedTo.name || billedTo.name || buyerName,
        address: shippedTo.address || billedTo.address || '',
        state: shippedTo.state || billedTo.state || '',
        stateCode: shippedTo.stateCode || billedTo.stateCode || '',
        gstin: shippedTo.gstin || billedTo.gstin || '',
      },
      gstDetails: payload.gstDetails || {},
      terms: payload.terms || '',
      notes: payload.notes || '',
      status: payload.status || 'draft',
      importedFromPdf: {
        originalFilename: payload.originalFilename || req.file?.originalname || 'imported.pdf',
        importedAt: new Date(),
      },
      ...financials,
      createdBy: req.user._id,
    });

    const company = await resolveSellerCompany(req.user);
    const pdfResult = await generateGstTaxInvoicePDF(invoice, clientDoc, company);
    invoice.pdfUrl = pdfResult.url;
    await invoice.save();

    await invoice.populate('client');
    await logActivity(req.user._id, 'create', 'finance', 'Invoice', invoice._id, { source: 'pdf_import', originalFilename: invoice.importedFromPdf?.originalFilename }, req.ip);

    res.status(201).json({
      success: true,
      message: 'Invoice imported and converted to GST Tax Invoice PDF successfully',
      data: invoice,
      pdfUrl: pdfResult.url,
    });
  } catch (error) {
    console.error('Error importing PDF invoice:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to import invoice',
    });
  }
};

// @desc    Generate GST Tax Invoice PDF for invoice
// @route   POST /api/finance/invoices/:id/generate-pdf
// @access  Private
exports.generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('client')
      .populate('createdBy', 'name email company');

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const company = await resolveSellerCompany(invoice.createdBy || req.user);
    const pdfResult = await generateGstTaxInvoicePDF(invoice, invoice.client || {}, company);

    invoice.pdfUrl = pdfResult.url;
    invoice.updatedAt = new Date();
    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'GST Tax Invoice PDF generated successfully',
      data: {
        pdfUrl: pdfResult.url,
        url: pdfResult.url,
        fileName: pdfResult.fileName,
      },
    });
  } catch (error) {
    console.error('Error generating Tax Invoice PDF:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send invoice via email
// @route   POST /api/finance/invoices/:id/send-email
// @access  Private
exports.sendEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // Placeholder for email logic
    res.status(200).json({
      success: true,
      message: 'Email sent successfully (simulation)'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/finance/invoices/:id/status
// @access  Private
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await logActivity(req.user._id, 'update', 'finance', 'Invoice Status', invoice._id, { status }, req.ip);

    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
