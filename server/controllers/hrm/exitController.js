const ExitRequest = require('../../models/ExitRequest');
const ExitTask = require('../../models/ExitTask');
const ExitInterview = require('../../models/ExitInterview');
const AssetRecovery = require('../../models/AssetRecovery');
const FnFSettlement = require('../../models/FnFSettlement');
const ExitDocument = require('../../models/ExitDocument');
const FinalSettlement = require('../../models/FinalSettlement');
const Employee = require('../../models/Employee');
const LeaveBalance = require('../../models/LeaveBalance');
const Payroll = require('../../models/Payroll');
const logActivity = require('../../utils/activityLogger');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { sendExitDocumentsEmail } = require('../../utils/emailService');
const { generateExitDocumentPDF } = require('../../utils/exitDocumentGenerator');

// @desc    Submit exit request
// @route   POST /api/hrm/exit
// @access  Private
exports.submitExitRequest = async (req, res) => {
  try {
    const { resignationDate, lastWorkingDate, reason, reasonDetails, type, employeeId } = req.body;

    let employee;
    const isIdsPending = (req.user.role === 'super_admin' || req.user.role === 'admin') && employeeId;

    if (isIdsPending) {
      employee = await Employee.findById(employeeId);
    } else {
      employee = await Employee.findOne({ user: req.user._id });
    }

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    // Check if exit request already exists
    const existing = await ExitRequest.findOne({
      employee: employee._id,
      status: { $in: ['submitted', 'under_review', 'approved'] },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Active exit request already exists for this employee',
      });
    }

    const exitType = type || 'resignation';
    let initialStatus = 'submitted';

    // If Admin initiates Termination, it can be auto-approved or set to specific status.
    // For now, let's keep it 'approved' if it is a Termination by Admin, or just 'submitted' and let them approve it.
    // The requirements say "Initiate Exit -> Select Employee -> Set Exit Type".
    // If it is Termination, it usually doesn't need approval flow from manager in the same way, but let's keep it consistent.
    if (exitType === 'termination' && (req.user.role === 'super_admin' || req.user.role === 'admin')) {
      initialStatus = 'approved'; // Terminations initiated by admin are effectively approved
    }

    const exitRequest = await ExitRequest.create({
      employee: employee._id,
      resignationDate: resignationDate || new Date(), // For termination, this might be effective date
      lastWorkingDate,
      reason,
      reasonDetails,
      type: exitType,
      status: initialStatus,
      submittedBy: req.user._id,
      initiatedBy: req.user._id
    });

    // Update employee status if Termination (immediate effect usually, but depends on lastWorkingDate)
    // If future date, maybe wait? For now, we update status to 'notice_period' or 'resigned' or 'terminated'?
    // The original code set it to 'resigned'. Let's adhere to that or introduce 'notice_period'.
    // Sticking to 'resigned' (or 'terminated' if added to enum) for now as per original code.
    // Original code: employee.status = 'resigned';
    if (exitType === 'termination') {
      employee.status = 'terminated';
    } else {
      employee.status = 'resigned';
    }
    await employee.save();

    await logActivity(req.user._id, 'submitted_exit_request', `Submitted exit request (${exitType}) for ${employee.employeeId}`);

    res.status(201).json({
      success: true,
      data: exitRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get exit requests
// @route   GET /api/hrm/exit
// @access  Private
exports.getExitRequests = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const query = {};

    if (status) query.status = status;
    if (employeeId) {
      query.employee = employeeId;
    } else if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      // Employees can only see their own exit requests
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.employee = employee._id;
      }
    }

    const exitRequests = await ExitRequest.find(query)
      .populate('employee', 'employeeId user')
      .populate('employee.user', 'name email')
      .populate('approvalFlow.directManager.approvedBy', 'name email')
      .populate('approvalFlow.hrManager.approvedBy', 'name email')
      .populate('exitInterview.conductedBy', 'name email')
      .populate('submittedBy', 'name email')
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: exitRequests.length,
      data: exitRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single exit request
// @route   GET /api/hrm/exit/:id
// @access  Private
exports.getExitRequest = async (req, res) => {
  try {
    const exitRequest = await ExitRequest.findById(req.params.id)
      .populate('employee', 'employeeId user department designation')
      .populate('employee.user', 'name email')
      .populate('approvalFlow.directManager.approvedBy', 'name email')
      .populate('approvalFlow.hrManager.approvedBy', 'name email')
      .populate('exitInterview.conductedBy', 'name email')
      .populate('submittedBy', 'name email');

    if (!exitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exit request not found',
      });
    }

    res.status(200).json({
      success: true,
      data: exitRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve/Reject exit request
// @route   PUT /api/hrm/exit/:id/approve
// @access  Private (Manager/Admin)
exports.approveExitRequest = async (req, res) => {
  try {
    const { status, comments, approverType } = req.body; // approverType: 'directManager' or 'hrManager'

    const exitRequest = await ExitRequest.findById(req.params.id);
    if (!exitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exit request not found',
      });
    }

    if (approverType === 'directManager') {
      exitRequest.approvalFlow.directManager.status = status;
      exitRequest.approvalFlow.directManager.approvedBy = req.user._id;
      exitRequest.approvalFlow.directManager.approvedAt = Date.now();
      exitRequest.approvalFlow.directManager.comments = comments;

      if (status === 'rejected') {
        exitRequest.status = 'rejected';
      }
    } else if (approverType === 'hrManager') {
      exitRequest.approvalFlow.hrManager.status = status;
      exitRequest.approvalFlow.hrManager.approvedBy = req.user._id;
      exitRequest.approvalFlow.hrManager.approvedAt = Date.now();
      exitRequest.approvalFlow.hrManager.comments = comments;

      if (status === 'approved') {
        exitRequest.status = 'approved';
        exitRequest.status = 'under_review'; // Move to exit process
      } else if (status === 'rejected') {
        exitRequest.status = 'rejected';
      }
    }

    await exitRequest.save();

    await logActivity(req.user._id, 'approved_exit_request', `Updated exit request status`);

    res.status(200).json({
      success: true,
      data: exitRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Conduct exit interview
// @route   POST /api/hrm/exit/:id/interview
// @access  Private (HR/Admin)
exports.conductExitInterview = async (req, res) => {
  try {
    const exitRequest = await ExitRequest.findById(req.params.id);
    if (!exitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exit request not found',
      });
    }

    exitRequest.exitInterview.conducted = true;
    exitRequest.exitInterview.conductedBy = req.user._id;
    exitRequest.exitInterview.conductedAt = Date.now();
    exitRequest.exitInterview.feedback = req.body.feedback;

    await exitRequest.save();

    await logActivity(req.user._id, 'conducted_exit_interview', `Conducted exit interview`);

    res.status(200).json({
      success: true,
      data: exitRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update exit checklist
// @route   PUT /api/hrm/exit/:id/checklist
// @access  Private
exports.updateExitChecklist = async (req, res) => {
  try {
    const { checklist } = req.body;

    const exitRequest = await ExitRequest.findById(req.params.id);
    if (!exitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exit request not found',
      });
    }

    exitRequest.exitChecklist = checklist;

    await exitRequest.save();

    await logActivity(req.user._id, 'updated_exit_checklist', `Updated exit checklist`);

    res.status(200).json({
      success: true,
      data: exitRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Calculate final settlement
// @route   POST /api/hrm/exit/:id/settlement
// @access  Private (HR/Admin)
exports.calculateFinalSettlement = async (req, res) => {
  try {
    const exitRequest = await ExitRequest.findById(req.params.id);
    if (!exitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exit request not found',
      });
    }

    const employee = await Employee.findById(exitRequest.employee);

    // Check if settlement already exists
    let settlement = await FinalSettlement.findOne({ exitRequest: exitRequest._id });

    if (settlement) {
      return res.status(400).json({
        success: false,
        message: 'Settlement already calculated',
      });
    }

    // Get leave balance
    const currentYear = new Date().getFullYear();
    const leaveBalance = await LeaveBalance.findOne({
      employee: employee._id,
      year: currentYear,
    });

    // Get latest payroll
    const latestPayroll = await Payroll.findOne({ employee: employee._id })
      .sort({ createdAt: -1 });

    const basicSalary = latestPayroll?.basicSalary || 0;
    const dailyRate = basicSalary / 30;

    // Calculate leave encashment
    const leaveEncashment = {
      eligibleDays: 0,
      ratePerDay: dailyRate,
      totalAmount: 0,
    };

    if (leaveBalance) {
      // Calculate eligible leave days
      const casualAvailable = (leaveBalance.casual || 0) - (leaveBalance.used?.casual || 0);
      const annualAvailable = (leaveBalance.annual || 0) - (leaveBalance.used?.annual || 0);
      leaveEncashment.eligibleDays = casualAvailable + annualAvailable;
      leaveEncashment.totalAmount = leaveEncashment.eligibleDays * dailyRate;
    }

    // Calculate gratuity (if eligible - typically after 5 years)
    const joiningDate = new Date(employee.joiningDate);
    const lastWorkingDate = new Date(exitRequest.lastWorkingDate);
    const yearsOfService = (lastWorkingDate - joiningDate) / (1000 * 60 * 60 * 24 * 365);
    const gratuity = {
      eligible: yearsOfService >= 5,
      yearsOfService: yearsOfService,
      amount: 0,
    };

    if (gratuity.eligible) {
      gratuity.amount = (basicSalary * yearsOfService * 15) / 26; // Standard gratuity formula
    }

    // Create settlement
    settlement = await FinalSettlement.create({
      exitRequest: exitRequest._id,
      employee: employee._id,
      settlementDate: exitRequest.lastWorkingDate,
      earnings: {
        basicSalary: basicSalary,
        allowances: latestPayroll?.allowances || 0,
        overtime: 0,
        bonus: 0,
        commission: 0,
        otherEarnings: 0,
      },
      deductions: {
        unpaidLeaves: 0,
        noticePeriod: 0,
        loanRecovery: 0,
        advanceRecovery: 0,
        taxDeduction: 0,
        otherDeductions: 0,
      },
      leaveEncashment,
      gratuity,
      calculatedBy: req.user._id,
      status: 'calculated',
    });

    await logActivity(req.user._id, 'calculated_settlement', `Calculated final settlement`);

    res.status(201).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get final settlement
// @route   GET /api/hrm/exit/:id/settlement
// @access  Private
exports.getFinalSettlement = async (req, res) => {
  try {
    const exitRequestId = req.params.id;

    const settlement = await FinalSettlement.findOne({ exitRequest: exitRequestId })
      .populate('employee', 'employeeId user')
      .populate('employee.user', 'name email')
      .populate('calculatedBy', 'name email')
      .populate('approvedBy', 'name email')
      .populate('processedBy', 'name email');

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found',
      });
    }

    res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Approve settlement
// @route   PUT /api/hrm/settlement/:id/approve
// @access  Private (Admin)
exports.approveSettlement = async (req, res) => {
  try {
    const settlement = await FinalSettlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found',
      });
    }

    settlement.status = 'approved';
    settlement.approvedBy = req.user._id;

    await settlement.save();

    await logActivity(req.user._id, 'approved_settlement', `Approved final settlement`);

    res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Process settlement payment
// @route   PUT /api/hrm/settlement/:id/process
// @access  Private (Admin)
exports.processSettlement = async (req, res) => {
  try {
    const { paymentDetails } = req.body;

    const settlement = await FinalSettlement.findById(req.params.id);

    if (!settlement) {
      return res.status(404).json({
        success: false,
        message: 'Settlement not found',
      });
    }

    if (settlement.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Settlement must be approved before processing',
      });
    }

    settlement.status = 'processed';
    settlement.paymentDetails = paymentDetails;
    settlement.processedBy = req.user._id;

    await settlement.save();

    await logActivity(req.user._id, 'processed_settlement', `Processed final settlement payment`);

    res.status(200).json({
      success: true,
      data: settlement,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper to generate and send documents
const generateAndSendExitDocuments = async (exitRequestId, userId) => {
  const exitRequest = await ExitRequest.findById(exitRequestId)
    .populate({
      path: 'employee',
      populate: { path: 'user' }
    });

  if (!exitRequest) {
    throw new Error('Exit request not found');
  }

  const employee = exitRequest.employee;
  const employeeName = employee?.user?.name || 'Employee';
  const employeeId = employee?.employeeId || 'ID';
  const department = employee?.department || 'N/A';
  const designation = employee?.designation || 'N/A';
  const joiningDate = employee?.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-GB') : 'N/A';
  const lastWorkingDate = new Date(exitRequest.lastWorkingDate).toLocaleDateString('en-GB');
  const exitType = exitRequest.type || 'resignation';
  const companyName = process.env.COMPANY_NAME || 'Zynextro CRM';

  // Get Signatory (HR Manager who approved, or fallback)
  // We don't have direct access to HR name easily unless we populate approvalFlow deep or use a generic one.
  // The route usually populates approvalFlow.hrManager.approvedBy. Let's assume we might not have it here unless we fetch.
  // We can fetch user if needed, or use generic.
  // Let's reload exitRequest with full population if we want exact details to be safe, but we already have it partly.
  // We'll use a generic "Head of Human Resources" if not found.
  const signatoryName = 'Human Resources';
  const signatoryDesignation = 'Manager, HR';

  const commonData = {
    employeeName,
    employeeId,
    department,
    designation,
    joiningDate,
    lastWorkingDate,
    companyName,
    signatoryName,
    signatoryDesignation
  };

  const docsDir = path.resolve(__dirname, '..', '..', '..', 'uploads', 'exit-documents');

  const attachments = [];
  const documentsGenerated = {
    generatedAt: Date.now()
  };

  // 1. Termination Letter (if applicable)
  if (exitType === 'termination') {
    const terminationContent = [
      `This letter serves as formal notification that your employment with ${companyName} is terminated effective ${lastWorkingDate}.`,
      `The termination has been processed in accordance with company policies. All exit formalities have been completed, and your final settlement has been processed.`,
      `We wish you success in your future endeavors.`
    ];

    const terminationResult = await generateExitDocumentPDF({
      ...commonData,
      docTitle: 'Termination Letter',
      contentBody: terminationContent
    }, 'termination');

    attachments.push({
      filename: terminationResult.filename,
      path: terminationResult.path
    });
    documentsGenerated.terminationLetter = true;
    documentsGenerated.terminationLetterPath = terminationResult.url;
  }

  // 2. Experience Letter
  const experienceContent = [
    `This is to certify that ${employeeName} (Employee ID: ${employeeId}) was employed with ${companyName} from ${joiningDate} to ${lastWorkingDate}.`,
    `During their tenure with us, they fulfilled their responsibilities as ${designation} in the ${department} department with dedication and professionalism.`,
    `We verify that there are no pending dues or obligations against them.`,
    `We wish them all the best in their future endeavors.`
  ];

  const experienceResult = await generateExitDocumentPDF({
    ...commonData,
    docTitle: 'Experience Certificate',
    contentBody: experienceContent
  }, 'experience');

  attachments.push({
    filename: experienceResult.filename,
    path: experienceResult.path
  });
  documentsGenerated.experienceLetter = true;
  documentsGenerated.experienceLetterPath = experienceResult.url;

  // 3. Relieving Letter
  const relievingContent = [
    `This is to certify that ${employeeName} has been relieved from their duties at ${companyName} effectively from the closing working hours of ${lastWorkingDate}.`,
    `They have completed all necessary exit formalities, including the handover of assets and responsibilities.`,
    `We acknowledge their contributions to the organization and wish them success in their future career path.`
  ];

  const relievingResult = await generateExitDocumentPDF({
    ...commonData,
    docTitle: 'Relieving Letter',
    contentBody: relievingContent
  }, 'relieving');

  attachments.push({
    filename: relievingResult.filename,
    path: relievingResult.path
  });
  documentsGenerated.relievingLetter = true;
  documentsGenerated.relievingLetterPath = relievingResult.url;

  // Update Database
  exitRequest.documentsGenerated = documentsGenerated;
  await exitRequest.save();

  // Send Email
  try {
    await sendExitDocumentsEmail(exitRequest.employee, exitRequest, attachments);
  } catch (emailError) {
    console.error('Failed to send exit documents email:', emailError);
  }

  await logActivity(userId, 'create', 'hrm', 'ExitRequest', exitRequestId, `Generated and sent exit documents for ${employeeId}`);

  return { exitRequest, attachments };
};

// @desc    Generate exit documents
// @route   POST /api/hrm/exit/:id/documents
// @access  Private (Admin)
exports.generateExitDocuments = async (req, res) => {
  try {
    const { exitRequest, attachments } = await generateAndSendExitDocuments(req.params.id, req.user._id);

    res.status(200).json({
      success: true,
      data: exitRequest,
      message: `Exit documents generated and sent successfully (${attachments.length} documents)`
    });
  } catch (error) {
    console.error('Generate Exit Docs Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Process system exit (Deactivate user)
// @route   POST /api/hrm/exit/:id/system-exit
// @access  Private (Admin)
exports.processSystemExit = async (req, res) => {
  try {
    const exitRequest = await ExitRequest.findById(req.params.id)
      .populate('employee', 'user employeeId');

    if (!exitRequest) {
      return res.status(404).json({
        success: false,
        message: 'Exit request not found',
      });
    }

    const { employee } = exitRequest;

    if (employee) {
      employee.status = 'inactive'; // Set to inactive instead of 'exited'
      await employee.save();
    }

    exitRequest.closureStatus = {
      accountDeactivated: true,
      accessRevoked: true,
      finalSettlementPaid: exitRequest.closureStatus?.finalSettlementPaid || false,
      completedAt: Date.now()
    };

    exitRequest.status = 'exited'; // Final status
    await exitRequest.save();

    await logActivity(req.user._id, 'processed_system_exit', `Processed system exit for ${employee ? employee.employeeId : 'Unknown'}`);

    // Auto-generate documents after system exit
    try {
      await generateAndSendExitDocuments(exitRequest._id, req.user._id);
    } catch (docError) {
      console.error('Auto-generation of exit documents failed during system exit:', docError);
      // We don't fail the main request, as the exit itself is processed
    }

    res.status(200).json({
      success: true,
      data: exitRequest,
      message: 'System exit processed. User accounts deactivated and exit documents generated.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

