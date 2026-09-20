const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const Client = require('../models/Client');
const Deal = require('../models/Deal');
const logActivity = require('../utils/activityLogger');

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
      .populate('createdBy', 'name email');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
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
    const { client, issueDate, dueDate, items, tax, discount, notes } = req.body;

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal + (tax || 0) - (discount || 0);

    // Generate invoice number
    const invoiceCount = await Invoice.countDocuments();
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;

    const invoice = await Invoice.create({
      invoiceNumber,
      client,
      issueDate,
      dueDate,
      items,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      notes,
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

    if (req.body.items) {
      req.body.subtotal = req.body.items.reduce((sum, item) => sum + item.amount, 0);
      req.body.total = req.body.subtotal + (req.body.tax || invoice.tax) - (req.body.discount || invoice.discount);
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
    const clients = await Client.find().select('name company email').sort({ name: 1 });
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

// @desc    Generate PDF for invoice
// @route   POST /api/finance/invoices/:id/generate-pdf
// @access  Private
exports.generatePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    // Placeholder for actual PDF generation logic
    res.status(200).json({
      success: true,
      message: 'PDF generation feature coming soon',
      data: { url: null }
    });
  } catch (error) {
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
