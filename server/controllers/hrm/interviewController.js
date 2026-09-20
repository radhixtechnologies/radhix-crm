const Interview = require('../../models/Interview');
const JobApplication = require('../../models/JobApplication');
const logActivity = require('../../utils/activityLogger');

// @desc    Schedule an interview
// @route   POST /api/hrm/interviews
// @access  Private
exports.scheduleInterview = async (req, res) => {
  try {
    const {
      applicationId,
      type,
      scheduledDate,
      scheduledTime,
      location,
      meetingLink,
      interviewers,
    } = req.body;

    const application = await JobApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Job application not found',
      });
    }

    const interview = await Interview.create({
      application: applicationId,
      type,
      scheduledDate,
      scheduledTime,
      location,
      meetingLink,
      interviewers,
      scheduledBy: req.user._id,
    });

    // Update application status
    application.status = 'interview';
    application.atsStage = type === 'technical' ? 'technical_interview' :
      type === 'hr' ? 'hr_interview' :
        type === 'final' ? 'final_interview' : 'phone_screening';
    await application.save();

    // Add to interview history
    if (!application.interviewHistory) {
      application.interviewHistory = [];
    }
    application.interviewHistory.push({
      interviewId: interview._id,
      type,
      date: scheduledDate,
      status: 'scheduled',
    });
    await application.save();

    await logActivity(req.user._id, 'scheduled_interview', `Scheduled ${type} interview for ${application.applicantName}`);

    res.status(201).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all interviews
// @route   GET /api/hrm/interviews
// @access  Private
exports.getInterviews = async (req, res) => {
  try {
    const { status, applicationId, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (applicationId) query.application = applicationId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.scheduledDate = { $gte: startDate, $lt: endDate };
    }

    const interviews = await Interview.find(query)
      .populate('application', 'applicantName email phone')
      .populate('interviewers.user', 'name email')
      .populate('scheduledBy', 'name email')
      .populate('evaluatedBy', 'name email')
      .sort({ scheduledDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single interview
// @route   GET /api/hrm/interviews/:id
// @access  Private
exports.getInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('application')
      .populate('interviewers.user', 'name email')
      .populate('scheduledBy', 'name email')
      .populate('evaluatedBy', 'name email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update interview
// @route   PUT /api/hrm/interviews/:id
// @access  Private
exports.updateInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('application')
      .populate('interviewers.user', 'name email');

    await logActivity(req.user._id, 'updated_interview', `Updated interview ${interview._id}`);

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Submit interview evaluation
// @route   POST /api/hrm/interviews/:id/evaluate
// @access  Private
exports.evaluateInterview = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    interview.evaluation = req.body.evaluation;
    interview.status = 'completed';
    interview.evaluatedBy = req.user._id;
    interview.evaluatedAt = Date.now();

    await interview.save();

    // Update application evaluation
    const application = await JobApplication.findById(interview.application);
    if (application) {
      application.evaluation = {
        rating: req.body.evaluation.overallRating,
        strengths: req.body.evaluation.strengths,
        weaknesses: req.body.evaluation.areasForImprovement,
        fitScore: calculateFitScore(req.body.evaluation),
        recommendation: req.body.evaluation.recommendation,
      };

      // Update interview history
      const historyItem = application.interviewHistory.find(
        h => h.interviewId.toString() === interview._id.toString()
      );
      if (historyItem) {
        historyItem.status = 'completed';
        historyItem.rating = req.body.evaluation.overallRating;
      }

      await application.save();
    }

    await logActivity(req.user._id, 'evaluated_interview', `Evaluated interview ${interview._id}`);

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel/Reschedule interview
// @route   PUT /api/hrm/interviews/:id/reschedule
// @access  Private
exports.rescheduleInterview = async (req, res) => {
  try {
    const { scheduledDate, scheduledTime, reason } = req.body;

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found',
      });
    }

    interview.scheduledDate = scheduledDate;
    interview.scheduledTime = scheduledTime;
    interview.status = 'rescheduled';
    if (reason) interview.evaluation.notes = reason;

    await interview.save();

    await logActivity(req.user._id, 'rescheduled_interview', `Rescheduled interview ${interview._id}`);

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// Helper function
function calculateFitScore(evaluation) {
  const scores = [
    evaluation.technicalSkills || 0,
    evaluation.communication || 0,
    evaluation.problemSolving || 0,
    evaluation.culturalFit || 0,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round(avg * 2); // Scale 1-5 to 1-10
}

// @desc    Get my scheduled interviews (for employees)
// @route   GET /api/hrm/interviews/my-interviews
// @access  Private
exports.getMyInterviews = async (req, res) => {
  try {
    console.log('=== Get My Interviews Debug ===');
    console.log('User ID:', req.user._id);
    console.log('User Email:', req.user.email);

    const interviews = await Interview.find({
      'interviewers.user': req.user._id,
      status: { $in: ['scheduled', 'in_progress'] }
    })
      .populate({
        path: 'application',
        select: 'applicantName email phone jobPosting',
        populate: {
          path: 'jobPosting',
          select: 'title'
        }
      })
      .sort({ scheduledDate: 1 });

    console.log('Found interviews:', interviews.length);
    if (interviews.length > 0) {
      console.log('First interview interviewers:', JSON.stringify(interviews[0].interviewers, null, 2));
    }

    // Also check all interviews regardless of user
    const allInterviews = await Interview.find({
      status: { $in: ['scheduled', 'in_progress'] }
    });
    console.log('Total scheduled interviews in DB:', allInterviews.length);
    if (allInterviews.length > 0) {
      console.log('Sample interview interviewers:', JSON.stringify(allInterviews[0].interviewers, null, 2));
    }

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching my interviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interviews',
      error: error.message
    });
  }
};
