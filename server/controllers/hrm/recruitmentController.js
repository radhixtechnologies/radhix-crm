const JobPosting = require('../../models/JobPosting');
const JobApplication = require('../../models/JobApplication');
const Interview = require('../../models/Interview');
const Employee = require('../../models/Employee');
const User = require('../../models/User');
const logActivity = require('../../utils/activityLogger');
const { asyncHandler } = require('../../utils/asyncHandler');
const AppError = require('../../utils/AppError');
const { sendEmail } = require('../../utils/emailService');

// @desc    Get all job postings
// @route   GET /api/hrm/jobs
// @access  Private
exports.getJobPostings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { status, department, type, search } = req.query;

  let query = {};

  if (status) query.status = status;
  if (department) query.department = department;
  if (type) query.type = type;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const jobs = await JobPosting.find(query)
    .populate('postedBy', 'name email')
    .sort({ postedDate: -1 })
    .skip(skip)
    .limit(limit);

  const total = await JobPosting.countDocuments(query);

  res.status(200).json({
    success: true,
    count: jobs.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: jobs,
  });
});

// @desc    Get public job postings (for applicants)
// @route   GET /api/hrm/jobs/public
// @access  Public
exports.getPublicJobPostings = asyncHandler(async (req, res) => {
  const jobs = await JobPosting.find({ status: 'open' })
    .select('title department location type description requirements postedDate closingDate')
    .sort({ postedDate: -1 });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs,
  });

});

// @desc    Get internal job postings (for employees)
// @route   GET /api/hrm/jobs/internal
// @access  Private (Employee)
exports.getInternalJobPostings = asyncHandler(async (req, res) => {
  const jobs = await JobPosting.find({
    status: 'published',
    visibility: { $in: ['internal', 'both'] }
  })
    .select('title department location type description requirements postedDate closingDate role visibility')
    .populate('postedBy', 'name email')
    .sort({ postedDate: -1 });

  res.status(200).json({
    success: true,
    count: jobs.length,
    data: jobs,
  });
});

// @desc    Get single job posting
// @route   GET /api/hrm/jobs/:id
// @access  Private
exports.getJobPosting = asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id)
    .populate('postedBy', 'name email')
    .populate({
      path: 'applications',
      populate: { path: 'reviewedBy', select: 'name email' },
    });

  if (!job) {
    throw new AppError('Job posting not found', 404);
  }

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Create job posting
// @route   POST /api/hrm/jobs
// @access  Private (Admin)
exports.createJobPosting = asyncHandler(async (req, res) => {
  const job = await JobPosting.create({
    ...req.body,
    postedBy: req.user._id,
  });

  await logActivity(req.user._id, 'create', 'hrm', 'JobPosting', job._id, req.body, req.ip).catch(console.error);

  res.status(201).json({
    success: true,
    data: job,
  });
});

// @desc    Update job posting
// @route   PUT /api/hrm/jobs/:id
// @access  Private (Admin)
exports.updateJobPosting = asyncHandler(async (req, res) => {
  const job = await JobPosting.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!job) {
    throw new AppError('Job posting not found', 404);
  }

  await logActivity(req.user._id, 'update', 'hrm', 'JobPosting', job._id, req.body, req.ip).catch(console.error);

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Publish job posting
// @route   PUT /api/hrm/jobs/:id/publish
// @access  Private (Admin)
exports.publishJobPosting = asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id);

  if (!job) {
    throw new AppError('Job posting not found', 404);
  }

  job.status = 'published';
  job.publishedAt = Date.now();
  await job.save();

  await logActivity(req.user._id, 'publish', 'hrm', 'JobPosting', job._id, {}, req.ip).catch(console.error);

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Archive job posting
// @route   PUT /api/hrm/jobs/:id/archive
// @access  Private (Admin)
exports.archiveJobPosting = asyncHandler(async (req, res) => {
  const job = await JobPosting.findById(req.params.id);

  if (!job) {
    throw new AppError('Job posting not found', 404);
  }

  job.status = 'archived';
  job.archivedAt = Date.now();
  await job.save();

  await logActivity(req.user._id, 'update', 'hrm', 'JobPosting', job._id, { status: 'archived' }, req.ip).catch(console.error);

  res.status(200).json({
    success: true,
    data: job,
  });
});

// @desc    Delete job posting
// @route   DELETE /api/hrm/jobs/:id
// @access  Private (Admin)
exports.deleteJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    await job.deleteOne();

    await logActivity(req.user._id, 'delete', 'hrm', 'JobPosting', job._id, null, req.ip);

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

// @desc    Apply for job (public)
// @route   POST /api/hrm/jobs/:id/apply
// @access  Public
exports.applyForJob = async (req, res) => {
  try {
    const { name, email, phone, coverLetter, resumeUrl } = req.body;
    const jobId = req.params.id;

    const job = await JobPosting.findById(jobId);
    if (!job || job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Job posting is not open for applications',
      });
    }

    // Check if already applied
    const existingApplication = await JobApplication.findOne({
      jobPosting: jobId,
      email: email,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position',
      });
    }

    const application = await JobApplication.create({
      jobPosting: jobId,
      applicantName: name,
      email,
      phone,
      coverLetter: coverLetter || '',
      resume: { url: resumeUrl },
      status: 'applied',
    });

    await JobPosting.findByIdAndUpdate(jobId, {
      $push: { applications: application._id },
    });

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Apply for job (internal employee)
// @route   POST /api/hrm/jobs/:id/apply-internal
// @access  Private (Employee)
exports.applyInternal = async (req, res) => {
  try {
    const { coverLetter } = req.body;
    let resumeUrl = req.body.resumeUrl;

    // Handle file upload
    if (req.file) {
      resumeUrl = `/uploads/resumes/${req.file.filename}`;
    }
    const jobId = req.params.id;

    // 1. Verify user is an employee
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(403).json({
        success: false,
        message: 'Only confirmed employees can apply internally',
      });
    }

    const job = await JobPosting.findById(jobId);
    if (!job || (job.status !== 'published' && job.status !== 'open')) { // Published or open
      return res.status(400).json({
        success: false,
        message: 'Job posting is not open for applications',
      });
    }

    // 2. Check internal duplicate (by Employee ID)
    const existingApplication = await JobApplication.findOne({
      jobPosting: jobId,
      employeeId: employee._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this position',
      });
    }

    // 3. Create Application
    const application = await JobApplication.create({
      jobPosting: jobId,
      applicantName: req.user.name,
      email: req.user.email,
      phone: employee.phone || req.user.phone || 'N/A', // Fallback
      coverLetter: coverLetter || 'Internal Application',
      resume: resumeUrl ? { url: resumeUrl } : undefined, // Optional resume
      status: 'applied',
      atsStage: 'applied',
      applicantType: 'internal',
      employeeId: employee._id,
      source: 'internal',
      applicantProfile: {
        currentPosition: employee.designation,
        currentCompany: 'Internal', // Or Company Name
        // We could copy skills etc from employee profile if available
      }
    });

    await JobPosting.findByIdAndUpdate(jobId, {
      $push: { applications: application._id },
    });

    await logActivity(req.user._id, 'create', 'hrm', 'JobApplication', application._id, { action: 'internal_application' }, req.ip);

    res.status(201).json({
      success: true,
      data: application,
      message: 'Internal application submitted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all applicants
// @route   GET /api/hrm/applicants
// @access  Private
exports.getApplicants = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const { jobId, status, search, applicantType } = req.query;

    let query = {};

    if (jobId) query.jobPosting = jobId;
    if (status) query.status = status;
    if (applicantType) query.applicantType = applicantType;

    if (search) {
      query.$or = [
        { applicantName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const applicants = await JobApplication.find(query)
      .populate('jobPosting', 'title department')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      count: applicants.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: applicants,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single applicant
// @route   GET /api/hrm/applicants/:id
// @access  Private
exports.getApplicant = async (req, res) => {
  try {
    const applicant = await JobApplication.findById(req.params.id)
      .populate('jobPosting')
      .populate('reviewedBy', 'name email');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update applicant status and ATS stage
// @route   PUT /api/hrm/applicants/:id/status
// @access  Private (Admin)
exports.updateApplicantStatus = async (req, res) => {
  try {
    const { status, atsStage, notes } = req.body;
    const applicant = await JobApplication.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    if (status) applicant.status = status;
    if (atsStage) applicant.atsStage = atsStage;
    if (notes) applicant.notes = notes;
    applicant.reviewedBy = req.user._id;

    await applicant.save();

    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', applicant._id, { status, atsStage }, req.ip);

    // Send email notification if status changed
    if (status && status !== applicant.status) {
      try {
        const emailSubject = `Application Status Update: ${applicant.jobPosting?.title || 'Job Application'}`;
        let emailBody = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Application Status Update</h2>
            <p>Dear ${applicant.applicantName},</p>
            <p>Your application for the position of <strong>${applicant.jobPosting?.title || 'Unknown Position'}</strong> has been updated.</p>
            <p><strong>New Status: ${status.toUpperCase()}</strong></p>
            <p>We will be in touch with more details shortly.</p>
            <p>Best regards,<br>Recruitment Team</p>
          </div>
        `;

        // Custom messages for specific statuses
        if (status === 'offer') {
          emailBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Congratulations! Offer Extended</h2>
              <p>Dear ${applicant.applicantName},</p>
              <p>We are pleased to inform you that we have extended an offer for the <strong>${applicant.jobPosting?.title}</strong> position.</p>
              <p>Please check your email for the formal offer letter and details on how to accept.</p>
              <p>Best regards,<br>Recruitment Team</p>
            </div>
          `;
        } else if (status === 'interview') {
          emailBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Interview Invitation</h2>
              <p>Dear ${applicant.applicantName},</p>
              <p>We would like to invite you for an interview for the <strong>${applicant.jobPosting?.title}</strong> position.</p>
              <p>You will receive a separate calendar invitation with the schedule and meeting link.</p>
              <p>Best regards,<br>Recruitment Team</p>
            </div>
          `;
        } else if (status === 'rejected') {
          emailBody = `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Application Update</h2>
              <p>Dear ${applicant.applicantName},</p>
              <p>Thank you for giving us the opportunity to consider your application for the <strong>${applicant.jobPosting?.title}</strong> position.</p>
              <p>After careful consideration, we have decided to move forward with other candidates who better match our current requirements.</p>
              <p>We appreciate your interest and wish you the best in your job search.</p>
              <p>Best regards,<br>Recruitment Team</p>
            </div>
          `;
        }

        await sendEmail({
          to: applicant.email,
          subject: emailSubject,
          html: emailBody
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Schedule interview
// @route   POST /api/hrm/applicants/:id/schedule-interview
// @access  Private (Admin)
exports.scheduleInterview = async (req, res) => {
  try {
    const { type, scheduledDate, scheduledTime, location, meetingLink, interviewers } = req.body;
    const applicant = await JobApplication.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    // Populate user IDs for interviewers based on their emails
    const User = require('../../models/User');
    const enrichedInterviewers = await Promise.all(
      (interviewers || []).map(async (interviewer) => {
        if (interviewer.email) {
          const user = await User.findOne({ email: interviewer.email });
          return {
            ...interviewer,
            user: user ? user._id : null
          };
        }
        return interviewer;
      })
    );

    // Create Interview document
    const interview = await Interview.create({
      application: applicant._id,
      type: type || 'in-person',
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      location,
      meetingLink,
      interviewers: enrichedInterviewers,
      scheduledBy: req.user._id,
    });

    // Update application status and ATS stage
    applicant.status = 'interview';
    if (type === 'technical_round') {
      applicant.atsStage = 'technical_round';
    } else if (type === 'hr_round') {
      applicant.atsStage = 'hr_round';
    } else {
      applicant.atsStage = 'interview';
    }

    // Add to interview history
    // FIX: Handle legacy data where interviewHistory might be a string
    // Use direct assignment to bypass Mongoose schema validation issues
    const newInterviewEntry = {
      interviewId: interview._id,
      type: interview.type,
      date: interview.scheduledDate,
      status: interview.status,
    };

    // Get current interview history, ensuring it's an array
    let currentHistory = applicant.interviewHistory;
    if (!Array.isArray(currentHistory)) {
      currentHistory = [];
    }

    // Add new entry
    currentHistory.push(newInterviewEntry);

    // Use $set to directly update the field, bypassing schema validation
    applicant.set('interviewHistory', currentHistory, { strict: false });

    // Explicitly mark modified
    applicant.markModified('interviewHistory');

    await applicant.save({ validateBeforeSave: false });

    await logActivity(req.user._id, 'create', 'hrm', 'Interview', interview._id, { application: applicant._id }, req.ip);

    // Send Interview Invitation Email
    try {
      const interviewDate = new Date(scheduledDate).toLocaleDateString();
      const emailSubject = `Interview Scheduled: ${applicant.jobPosting?.title || 'Position'} - ${interviewDate}`;

      const emailBody = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2>Interview Confirmation</h2>
          <p>Dear ${applicant.applicantName},</p>
          <p>We are pleased to invite you to an interview for the position of <strong>${applicant.jobPosting?.title}</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Date:</strong> ${interviewDate}</p>
            <p><strong>Time:</strong> ${scheduledTime}</p>
            <p><strong>Type:</strong> ${type.replace('_', ' ').toUpperCase()}</p>
            ${location ? `<p><strong>Location:</strong> ${location}</p>` : ''}
            ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
          </div>

          <p>Please make sure to be available 5 minutes before the scheduled time.</p>
          <p>If you need to reschedule, please contact us immediately.</p>
          
          <p>Good luck!</p>
          <p>Best regards,<br>Recruitment Team</p>
        </div>
      `;

      await sendEmail({
        to: applicant.email,
        subject: emailSubject,
        html: emailBody
      });
      console.log(`Interview email sent to ${applicant.email}`);
    } catch (emailError) {
      console.error('Failed to send interview email:', emailError);
    }

    res.status(200).json({
      success: true,
      data: {
        interview,
        applicant,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Generate offer letter (PDF)
// @route   POST /api/hrm/applicants/:id/generate-offer
// @access  Private (Admin)
exports.generateOffer = async (req, res) => {
  try {
    const { position, salary, startDate, reportingManager, offerDetails } = req.body;
    const applicant = await JobApplication.findById(req.params.id)
      .populate('jobPosting');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    // Update applicant status
    applicant.status = 'offer';
    await applicant.save();

    // Generate PDF using PDF service
    const { generateOfferLetterPDF } = require('../../utils/pdfGenerator');
    let pdfResult = null;

    try {
      pdfResult = await generateOfferLetterPDF({
        applicant,
        position,
        salary,
        startDate,
        reportingManager,
        offerDetails,
      });
    } catch (pdfError) {
      console.error('Error generating offer letter PDF:', pdfError);
      // Continue without PDF if generation fails
    }

    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', applicant._id, { action: 'offer_generated' }, req.ip);

    res.status(200).json({
      success: true,
      data: {
        applicant,
        message: 'Offer letter generated successfully',
        pdfUrl: pdfResult?.url || null,
        pdfPath: pdfResult?.filePath || null,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Hire applicant (create employee record)
// @route   POST /api/hrm/applicants/:id/hire
// @access  Private (Admin)
exports.hireApplicant = async (req, res) => {
  try {
    const applicant = await JobApplication.findById(req.params.id)
      .populate('jobPosting');

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    // Check if there is an accepted offer
    const OfferLetter = require('../../models/OfferLetter');
    const acceptedOffer = await OfferLetter.findOne({
      application: applicant._id,
      status: 'accepted'
    });

    if (!acceptedOffer) {
      // Optional: you can enforce that they MUST have an offer
      // return res.status(400).json({ success: false, message: 'No accepted offer found for this applicant' });
    }

    // Check if user already exists
    let user = await User.findOne({ email: applicant.email });

    if (!user) {
      // Create user account
      const password = require('crypto').randomBytes(8).toString('hex');
      user = await User.create({
        name: applicant.applicantName,
        email: applicant.email,
        password,
        role: 'employee',
        isActive: true,
      });
    } else {
      // If user exists (e.g. was a candidate), update role to employee
      // Only if not already an employee (internal applicants)
      if (user.role !== 'employee') {
        user.role = 'employee';
        await user.save();
      }
    }

    // Generate employee ID
    const employeeCount = await Employee.countDocuments();
    const employeeId = `EMP${String(employeeCount + 1).padStart(5, '0')}`;

    // Create employee record
    const employee = await Employee.create({
      user: user._id,
      employeeId,
      department: applicant.jobPosting.department,
      designation: applicant.jobPosting.title,
      status: 'onboarding',
      joiningDate: acceptedOffer ? acceptedOffer.joiningDate : (req.body.joiningDate || new Date()),
    });

    // Create Salary Structure if offer exists
    if (acceptedOffer && acceptedOffer.salaryDetails) {
      const SalaryStructure = require('../../models/SalaryStructure');
      await SalaryStructure.create({
        employee: employee._id,
        basicSalary: acceptedOffer.salaryDetails.basic,
        hra: acceptedOffer.salaryDetails.hra,
        totalAllowances: acceptedOffer.salaryDetails.allowances,
        isActive: true,
        effectiveDate: acceptedOffer.joiningDate
        // Add other fields as necessary from salaryDetails
      });
    }

    // Trigger Onboarding (Create checklist)
    const { createOnboardingTask } = require('./onboardingController');
    // Assuming a helper or controller function exists, or we invoke the logic here.
    // For now, we'll assume the onboarding module listens to 'create' activity or we can explicitly call it.
    // Let's explicitly create a default onboarding checklist.
    const OnboardingTask = require('../../models/OnboardingTask');
    const defaultTasks = [
      { title: 'Submit ID Proof', category: 'Documentation' },
      { title: 'Fill Personal Details', category: 'Documentation' },
      { title: 'Read Employee Handbook', category: 'Policy' }
    ];

    await OnboardingTask.insertMany(defaultTasks.map(t => ({
      employee: employee._id,
      title: t.title,
      category: t.category,
      description: t.title,
      status: 'pending',
      assignedTo: employee._id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    })));

    // Update applicant status
    applicant.status = 'hired';
    applicant.reviewedBy = req.user._id;
    await applicant.save();

    await logActivity(req.user._id, 'create', 'hrm', 'Employee', employee._id, { fromApplicant: applicant._id }, req.ip);

    res.status(201).json({
      success: true,
      data: {
        employee,
        applicant,
        message: 'Employee record created successfully',
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update applicant notes
// @route   PUT /api/hrm/applicants/:id/notes
// @access  Private (Admin)
exports.updateApplicantNotes = async (req, res) => {
  try {
    const { notes, internalNotes } = req.body;
    const applicant = await JobApplication.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    if (notes !== undefined) applicant.notes = notes;
    if (internalNotes !== undefined) applicant.internalNotes = internalNotes;

    await applicant.save();

    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', applicant._id, { action: 'notes_updated' }, req.ip);

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload document for applicant
// @route   POST /api/hrm/applicants/:id/documents
// @access  Private (Admin)
exports.uploadApplicantDocument = async (req, res) => {
  try {
    const { name, type, url } = req.body;
    const applicant = await JobApplication.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    if (!applicant.documents) {
      applicant.documents = [];
    }

    applicant.documents.push({
      name,
      type,
      url,
      uploadedAt: Date.now(),
    });

    await applicant.save();

    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', applicant._id, { action: 'document_uploaded' }, req.ip);

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update applicant evaluation
// @route   PUT /api/hrm/applicants/:id/evaluation
// @access  Private (Admin)
exports.updateApplicantEvaluation = async (req, res) => {
  try {
    const { evaluation } = req.body;
    const applicant = await JobApplication.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not found',
      });
    }

    applicant.evaluation = { ...applicant.evaluation, ...evaluation };
    applicant.reviewedBy = req.user._id;

    await applicant.save();

    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', applicant._id, { action: 'evaluation_updated' }, req.ip);

    res.status(200).json({
      success: true,
      data: applicant,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get candidate's own applications
// @route   GET /api/hrm/candidate/my-applications
// @access  Private (Candidate)
exports.getCandidateApplications = async (req, res) => {
  try {
    // Find applications by candidate email
    const applications = await JobApplication.find({ email: req.user.email })
      .populate('jobPosting', 'title department location status postedDate')
      .populate({
        path: 'interviewHistory.interviewId',
        select: 'scheduledDate scheduledTime type status meetingLink'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications.map(app => ({
        _id: app._id,
        jobId: app.jobPosting?._id, // Added jobID for frontend checking
        jobTitle: app.jobPosting?.title || 'Unknown Job',
        department: app.jobPosting?.department || 'N/A',
        status: app.status,
        appliedDate: app.createdAt,
        interviews: app.interviewHistory
      }))
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Withdraw application
// @route   POST /api/hrm/applications/:id/withdraw
// @access  Private (Candidate)
exports.withdrawApplication = async (req, res) => {
  try {
    const applicant = await JobApplication.findById(req.params.id);

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if the application belongs to the logged-in user
    if (applicant.email !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to withdraw this application',
      });
    }

    // Check if duplicate withdrawal
    if (applicant.status === 'withdrawn') {
      return res.status(400).json({
        success: false,
        message: 'Application is already withdrawn',
      });
    }

    applicant.status = 'withdrawn';
    applicant.atsStage = 'withdrawn';
    await applicant.save();

    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', applicant._id, { action: 'application_withdrawn' }, req.ip);

    res.status(200).json({
      success: true,
      message: 'Application withdrawn successfully',
      data: applicant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

