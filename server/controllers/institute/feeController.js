const InstituteFee = require('../../models/InstituteFee');
const Student = require('../../models/Student');
const Course = require('../../models/Course');
const Batch = require('../../models/Batch');

const sendError = (res, error) => res.status(error.statusCode || 500).json({ success: false, message: error.message });

// GET /api/institute/fees
exports.getFees = async (req, res) => {
  try {
    const { status, course, batch, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (course) query.course = course;
    if (batch) query.batch = batch;

    let studentIds = null;
    if (search) {
      const matchedStudents = await Student.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      studentIds = matchedStudents.map((s) => s._id);
      query.student = { $in: studentIds };
    }

    const currentPage = Math.max(1, Number(page));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [fees, total] = await Promise.all([
      InstituteFee.find(query)
        .populate('student', 'studentId name phone email status')
        .populate('course', 'name code baseFee')
        .populate('batch', 'name startDate endDate')
        .sort({ updatedAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),
      InstituteFee.countDocuments(query),
    ]);

    // Calculate aggregated totals
    const allFees = await InstituteFee.find(query).select('totalFee discount finalPayable paidAmount dueAmount status').lean();
    const stats = {
      totalPayable: allFees.reduce((acc, f) => acc + (f.finalPayable || 0), 0),
      totalCollected: allFees.reduce((acc, f) => acc + (f.paidAmount || 0), 0),
      totalOutstanding: allFees.reduce((acc, f) => acc + (f.dueAmount || 0), 0),
      paidCount: allFees.filter((f) => f.status === 'paid').length,
      partialCount: allFees.filter((f) => f.status === 'partial').length,
      unpaidCount: allFees.filter((f) => f.status === 'unpaid').length,
      overdueCount: allFees.filter((f) => f.status === 'overdue').length,
    };

    res.json({
      success: true,
      data: fees,
      total,
      page: currentPage,
      pages: Math.ceil(total / pageLimit),
      stats,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/institute/fees/:id
exports.getFee = async (req, res) => {
  try {
    const fee = await InstituteFee.findById(req.params.id)
      .populate('student', 'studentId name phone email address guardianName guardianPhone status')
      .populate('course', 'name code baseFee duration')
      .populate('batch', 'name startDate endDate schedule')
      .populate('receipts.recordedBy', 'name email')
      .lean();

    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    res.json({ success: true, data: fee });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/institute/fees/:id/payments
exports.recordPayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionReference, notes } = req.body;

    const paymentAmount = Number(amount);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Payment amount must be greater than 0' });
    }

    const fee = await InstituteFee.findById(req.params.id);
    if (!fee) {
      return res.status(404).json({ success: false, message: 'Fee record not found' });
    }

    if (fee.dueAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Fee is already fully paid. No outstanding balance.' });
    }

    if (paymentAmount > fee.dueAmount) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (${paymentAmount}) cannot exceed outstanding due amount (${fee.dueAmount}).`,
      });
    }

    // Generate unique receipt number
    const count = fee.receipts.length + 1;
    const receiptNumber = `RCP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}-${count}`;

    const receipt = {
      receiptNumber,
      amount: paymentAmount,
      paymentMethod: paymentMethod || 'upi',
      transactionReference: transactionReference ? transactionReference.trim() : '',
      paidAt: new Date(),
      notes: notes ? notes.trim() : '',
      recordedBy: req.user?._id,
    };

    fee.receipts.push(receipt);
    fee.paidAmount += paymentAmount;
    fee.dueAmount = Math.max(0, fee.finalPayable - fee.paidAmount);

    if (fee.dueAmount === 0) {
      fee.status = 'paid';
    } else {
      fee.status = 'partial';
    }

    // Allocate payment amount across installments (FIFO)
    let remaining = paymentAmount;
    for (const inst of fee.installments) {
      if (remaining <= 0) break;
      const needed = inst.amount - inst.paidAmount;
      if (needed > 0) {
        const allocate = Math.min(remaining, needed);
        inst.paidAmount += allocate;
        remaining -= allocate;
        if (inst.paidAmount >= inst.amount) {
          inst.status = 'paid';
        } else {
          inst.status = 'partial';
        }
      }
    }

    await fee.save();

    const populated = await InstituteFee.findById(fee._id)
      .populate('student', 'studentId name phone email status')
      .populate('course', 'name code baseFee')
      .populate('batch', 'name startDate endDate')
      .populate('receipts.recordedBy', 'name email')
      .lean();

    res.status(201).json({
      success: true,
      data: populated,
      receipt,
      message: `Payment of ₹${paymentAmount} recorded successfully. Receipt #${receiptNumber}`,
    });
  } catch (error) {
    sendError(res, error);
  }
};
