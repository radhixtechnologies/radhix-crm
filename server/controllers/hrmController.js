const JobPosting = require('../models/JobPosting');
const JobApplication = require('../models/JobApplication');
const Performance = require('../models/Performance');
const Employee = require('../models/Employee');
const logActivity = require('../utils/activityLogger');

// @desc    Get all job postings
// @route   GET /api/hrm/jobs
// @access  Private
exports.getJobPostings = async (req, res) => {
  try {
    const { status, department, type } = req.query;
    let query = {};

    if (status) query.status = status;
    if (department) query.department = department;
    if (type) query.type = type;

    const jobs = await JobPosting.find(query)
      .populate('postedBy', 'name email')
      .sort({ postedDate: -1 });

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single job posting
// @route   GET /api/hrm/jobs/:id
// @access  Private
exports.getJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('applications');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create job posting
// @route   POST /api/hrm/jobs
// @access  Private
exports.createJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.create({
      ...req.body,
      postedBy: req.user._id,
    });

    // Log activity
    await logActivity(req.user._id, 'create', 'hrm', 'JobPosting', job._id, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update job posting
// @route   PUT /api/hrm/jobs/:id
// @access  Private
exports.updateJobPosting = async (req, res) => {
  try {
    const job = await JobPosting.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job posting not found',
      });
    }

    // Log activity
    await logActivity(req.user._id, 'update', 'hrm', 'JobPosting', job._id, req.body, req.ip);

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete job posting
// @route   DELETE /api/hrm/jobs/:id
// @access  Private
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

    // Log activity
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

// @desc    Get all job applications
// @route   GET /api/hrm/applications
// @access  Private
exports.getJobApplications = async (req, res) => {
  try {
    const { jobPosting, status } = req.query;
    let query = {};

    if (jobPosting) query.jobPosting = jobPosting;
    if (status) query.status = status;

    const applications = await JobApplication.find(query)
      .populate('jobPosting', 'title department')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single job application
// @route   GET /api/hrm/applications/:id
// @access  Private
exports.getJobApplication = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id)
      .populate('jobPosting')
      .populate('reviewedBy', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create job application
// @route   POST /api/hrm/applications
// @access  Private
exports.createJobApplication = async (req, res) => {
  try {
    const application = await JobApplication.create(req.body);

    // Add application to job posting
    await JobPosting.findByIdAndUpdate(req.body.jobPosting, {
      $push: { applications: application._id },
    });

    res.status(201).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update job application (status, notes)
// @route   PUT /api/hrm/applications/:id
// @access  Private
exports.updateJobApplication = async (req, res) => {
  try {
    const application = await JobApplication.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found',
      });
    }

    if (req.body.status && !application.reviewedBy) {
      application.reviewedBy = req.user._id;
      await application.save();
    }

    // If application is hired, create employee profile
    if (req.body.status === 'hired') {
      // Create employee onboarding process
      // This can be enhanced to create actual employee record
    }

    // Log activity
    await logActivity(req.user._id, 'update', 'hrm', 'JobApplication', application._id, req.body, req.ip);

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all performance reviews
// @route   GET /api/hrm/performance
// @access  Private
exports.getPerformanceReviews = async (req, res) => {
  try {
    let query = {};

    // Employees can only see their own reviews
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.employee = employee._id;
      }
    } else if (req.query.employee) {
      query.employee = req.query.employee;
    }

    const reviews = await Performance.find(query)
      .populate('employee', 'employeeId')
      .populate('reviewedBy', 'name email')
      .sort({ reviewDate: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single performance review
// @route   GET /api/hrm/performance/:id
// @access  Private
exports.getPerformanceReview = async (req, res) => {
  try {
    const review = await Performance.findById(req.params.id)
      .populate('employee', 'employeeId')
      .populate('reviewedBy', 'name email');

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found',
      });
    }

    // Check access
    if (req.user.role === 'employee') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (review.employee._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create performance review
// @route   POST /api/hrm/performance
// @access  Private (Admin, Super Admin)
exports.createPerformanceReview = async (req, res) => {
  try {
    const review = await Performance.create({
      ...req.body,
      reviewedBy: req.user._id,
    });

    // Log activity
    await logActivity(req.user._id, 'create', 'hrm', 'Performance', review._id, req.body, req.ip);

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update performance review
// @route   PUT /api/hrm/performance/:id
// @access  Private (Admin, Super Admin)
exports.updatePerformanceReview = async (req, res) => {
  try {
    const review = await Performance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Performance review not found',
      });
    }

    // Log activity
    await logActivity(req.user._id, 'update', 'hrm', 'Performance', review._id, req.body, req.ip);

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

